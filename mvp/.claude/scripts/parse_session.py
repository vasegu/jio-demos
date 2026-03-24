#!/usr/bin/env python3
"""
parse_session.py — Extract efficiency metrics from a Claude Code session JSONL file.

Usage:
  python3 .claude/scripts/parse_session.py <path/to/session.jsonl>
  python3 .claude/scripts/parse_session.py <path/to/session.jsonl> --phases

Output: JSON to stdout — ready to be consumed by the log_session skill.

Pricing constants (update if rates change):
  INPUT_RATE      = $3.00 / 1M tokens
  OUTPUT_RATE     = $15.00 / 1M tokens
  CACHE_READ_RATE = $0.30 / 1M tokens
  CACHE_CREATE_RATE = $3.75 / 1M tokens
"""

import json
import sys
import argparse
from collections import defaultdict
from datetime import datetime, timezone


# ── Pricing ($ per million tokens) ─────────────────────────────────────────
INPUT_RATE        = 3.00
OUTPUT_RATE       = 15.00
CACHE_READ_RATE   = 0.30
CACHE_CREATE_RATE = 3.75

# ── Phase detection: skill invocations that mark phase boundaries ────────────
PHASE_MARKERS = {
    "basecamp":             "Basecamp",
    "go_hunt":              "Go Hunt",
    "hypothesis_to_notebook": "Marimo Notebook",
}
# Any Write/Agent burst after go_hunt and before notebook is "Skill Scaffolding"
SCAFFOLDING_LABEL = "Skill Scaffolding"


def parse(path: str, show_phases: bool) -> dict:
    turns = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                turns.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    # ── Filter to assistant turns with usage ────────────────────────────────
    assistant_turns = [
        t for t in turns
        if t.get("type") == "assistant" and "usage" in t
    ]
    if not assistant_turns:
        # Some exporters nest differently — try message.role
        assistant_turns = [
            t for t in turns
            if t.get("message", {}).get("role") == "assistant"
            and "usage" in t.get("message", {})
        ]
        if assistant_turns:
            assistant_turns = [
                {**t, "usage": t["message"]["usage"],
                 "content": t["message"].get("content", [])}
                for t in assistant_turns
            ]

    total_turns = len(assistant_turns)

    # ── Aggregate token totals ───────────────────────────────────────────────
    tok_input        = sum(t["usage"].get("input_tokens", 0) for t in assistant_turns)
    tok_output       = sum(t["usage"].get("output_tokens", 0) for t in assistant_turns)
    tok_cache_read   = sum(t["usage"].get("cache_read_input_tokens", 0) for t in assistant_turns)
    tok_cache_create = sum(t["usage"].get("cache_creation_input_tokens", 0) for t in assistant_turns)
    tok_total        = tok_input + tok_output + tok_cache_read + tok_cache_create

    # ── Cost ────────────────────────────────────────────────────────────────
    cost_input        = tok_input        / 1_000_000 * INPUT_RATE
    cost_output       = tok_output       / 1_000_000 * OUTPUT_RATE
    cost_cache_read   = tok_cache_read   / 1_000_000 * CACHE_READ_RATE
    cost_cache_create = tok_cache_create / 1_000_000 * CACHE_CREATE_RATE
    cost_total        = cost_input + cost_output + cost_cache_read + cost_cache_create

    # ── Cache hit rate ───────────────────────────────────────────────────────
    total_input_side = tok_input + tok_cache_read + tok_cache_create
    cache_hit_rate = (tok_cache_read / total_input_side * 100) if total_input_side else 0
    # raw input-vs-cached hit rate
    input_cache_hit = (tok_cache_read / (tok_input + tok_cache_read) * 100) if (tok_input + tok_cache_read) else 0

    # ── Context window per turn ──────────────────────────────────────────────
    context_per_turn = []
    for t in assistant_turns:
        u = t["usage"]
        ctx = (u.get("input_tokens", 0)
               + u.get("cache_read_input_tokens", 0)
               + u.get("cache_creation_input_tokens", 0))
        context_per_turn.append(ctx)

    peak_context  = max(context_per_turn) if context_per_turn else 0
    avg_context   = int(sum(context_per_turn) / len(context_per_turn)) if context_per_turn else 0
    start_context = context_per_turn[0] if context_per_turn else 0
    end_context   = context_per_turn[-1] if context_per_turn else 0

    turns_above_100k = sum(1 for c in context_per_turn if c > 100_000)
    turns_above_150k = sum(1 for c in context_per_turn if c > 150_000)

    # ── Per-turn cache hit rates ─────────────────────────────────────────────
    cache_hit_rates = []
    for t in assistant_turns:
        u = t["usage"]
        inp_side = u.get("input_tokens", 0) + u.get("cache_read_input_tokens", 0)
        r = (u.get("cache_read_input_tokens", 0) / inp_side * 100) if inp_side else 0
        cache_hit_rates.append(r)

    max_cache_hit = max(cache_hit_rates) if cache_hit_rates else 0
    min_cache_hit = min(cache_hit_rates) if cache_hit_rates else 0
    min_cache_hit_turn = cache_hit_rates.index(min_cache_hit) + 1 if cache_hit_rates else None
    max_cache_hit_turn = cache_hit_rates.index(max_cache_hit) + 1 if cache_hit_rates else None

    # ── Compaction events: large drop in context ─────────────────────────────
    compaction_events = 0
    compaction_turns = []
    for i in range(1, len(context_per_turn)):
        drop = context_per_turn[i - 1] - context_per_turn[i]
        if drop > 20_000:
            compaction_events += 1
            compaction_turns.append(i + 1)  # 1-indexed

    # ── Tool call counts ─────────────────────────────────────────────────────
    tool_counts = defaultdict(int)
    total_tool_calls = 0
    for t in assistant_turns:
        content = t.get("content", [])
        if isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "tool_use":
                    name = block.get("name", "Unknown")
                    tool_counts[name] += 1
                    total_tool_calls += 1

    # ── Timestamps ───────────────────────────────────────────────────────────
    timestamps = []
    for t in turns:
        ts = t.get("timestamp") or t.get("created_at")
        if ts:
            try:
                timestamps.append(datetime.fromisoformat(ts.replace("Z", "+00:00")))
            except (ValueError, AttributeError):
                pass

    start_time = min(timestamps).isoformat() if timestamps else None
    end_time   = max(timestamps).isoformat() if timestamps else None
    duration_s = int((max(timestamps) - min(timestamps)).total_seconds()) if len(timestamps) >= 2 else None
    duration_str = None
    if duration_s is not None:
        h, rem = divmod(duration_s, 3600)
        m, s   = divmod(rem, 60)
        duration_str = f"{h}h {m}m {s}s" if h else f"{m}m {s}s"

    # ── Session date ─────────────────────────────────────────────────────────
    session_date = min(timestamps).strftime("%Y-%m-%d") if timestamps else "unknown"

    # ── Skills executed ──────────────────────────────────────────────────────
    skills_executed = []
    for t in assistant_turns:
        content = t.get("content", [])
        if isinstance(content, list):
            for block in content:
                if (isinstance(block, dict)
                        and block.get("type") == "tool_use"
                        and block.get("name") == "Skill"):
                    skill_name = (block.get("input", {}) or {}).get("skill", "")
                    if skill_name and skill_name not in skills_executed:
                        skills_executed.append(skill_name)

    # ── Phase breakdown (if --phases) ────────────────────────────────────────
    phase_stats = None
    if show_phases:
        phase_stats = _compute_phases(assistant_turns, context_per_turn)

    # ── Build output ─────────────────────────────────────────────────────────
    result = {
        "session": {
            "date": session_date,
            "start_time": start_time,
            "end_time": end_time,
            "duration": duration_str,
            "duration_seconds": duration_s,
        },
        "turns": {
            "total_assistant_turns": total_turns,
            "total_tool_calls": total_tool_calls,
            "tool_breakdown": dict(sorted(tool_counts.items(), key=lambda x: -x[1])),
            "skills_executed": skills_executed,
        },
        "tokens": {
            "input":         tok_input,
            "output":        tok_output,
            "cache_read":    tok_cache_read,
            "cache_creation": tok_cache_create,
            "total":         tok_total,
        },
        "cost": {
            "input":         round(cost_input, 4),
            "output":        round(cost_output, 4),
            "cache_read":    round(cost_cache_read, 4),
            "cache_creation": round(cost_cache_create, 4),
            "total":         round(cost_total, 4),
        },
        "cache": {
            "session_avg_hit_rate_pct": round(cache_hit_rate, 1),
            "input_vs_cached_hit_rate_pct": round(input_cache_hit, 3),
            "max_hit_rate_pct": round(max_cache_hit, 1),
            "max_hit_rate_turn": max_cache_hit_turn,
            "min_hit_rate_pct": round(min_cache_hit, 1),
            "min_hit_rate_turn": min_cache_hit_turn,
            "compaction_events": compaction_events,
            "compaction_at_turns": compaction_turns,
        },
        "context": {
            "start": start_context,
            "peak": peak_context,
            "end": end_context,
            "average": avg_context,
            "turns_above_100k": turns_above_100k,
            "turns_above_150k": turns_above_150k,
        },
        "phases": phase_stats,
    }

    return result


def _compute_phases(assistant_turns: list, context_per_turn: list) -> list:
    """
    Attempt to identify phase boundaries from Skill tool calls and context inflection.
    Returns a list of phase dicts with turn ranges and aggregated metrics.
    """
    # Find Skill invocation turns
    skill_turns = {}
    for i, t in enumerate(assistant_turns):
        content = t.get("content", [])
        if isinstance(content, list):
            for block in content:
                if (isinstance(block, dict)
                        and block.get("type") == "tool_use"
                        and block.get("name") == "Skill"):
                    name = (block.get("input", {}) or {}).get("skill", "")
                    if name:
                        skill_turns[name] = i  # 0-indexed turn

    # Find Write-burst turns (proxy for scaffolding phase)
    write_counts = []
    window = 10
    for i in range(len(assistant_turns)):
        start = max(0, i - window)
        end   = min(len(assistant_turns), i + window)
        w = 0
        for t in assistant_turns[start:end]:
            content = t.get("content", [])
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "tool_use" and block.get("name") == "Write":
                        w += 1
        write_counts.append(w)

    # Build boundary list
    boundaries = {}
    for skill_name, turn_idx in skill_turns.items():
        label = PHASE_MARKERS.get(skill_name)
        if label:
            boundaries[turn_idx] = label

    # Sort boundaries by turn
    sorted_bounds = sorted(boundaries.items())

    phases = []
    n = len(assistant_turns)

    for idx, (start_turn, label) in enumerate(sorted_bounds):
        end_turn = sorted_bounds[idx + 1][0] if idx + 1 < len(sorted_bounds) else n

        # Slice
        slice_turns   = assistant_turns[start_turn:end_turn]
        slice_context = context_per_turn[start_turn:end_turn]

        tok_out     = sum(t["usage"].get("output_tokens", 0) for t in slice_turns)
        tok_cr      = sum(t["usage"].get("cache_read_input_tokens", 0) for t in slice_turns)
        tok_cc      = sum(t["usage"].get("cache_creation_input_tokens", 0) for t in slice_turns)
        tok_in      = sum(t["usage"].get("input_tokens", 0) for t in slice_turns)

        cost = (tok_in / 1e6 * INPUT_RATE
                + tok_out / 1e6 * OUTPUT_RATE
                + tok_cr  / 1e6 * CACHE_READ_RATE
                + tok_cc  / 1e6 * CACHE_CREATE_RATE)

        out_per_turn = round(tok_out / len(slice_turns), 0) if slice_turns else 0
        peak_ctx     = max(slice_context) if slice_context else 0
        avg_ctx      = int(sum(slice_context) / len(slice_context)) if slice_context else 0

        # Tool counts for this phase
        tool_counts = defaultdict(int)
        for t in slice_turns:
            content = t.get("content", [])
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "tool_use":
                        tool_counts[block.get("name", "Unknown")] += 1

        phases.append({
            "label": label,
            "turn_range": [start_turn + 1, end_turn],
            "turn_count": len(slice_turns),
            "tokens": {
                "input": tok_in,
                "output": tok_out,
                "cache_read": tok_cr,
                "cache_creation": tok_cc,
            },
            "cost": round(cost, 4),
            "context": {"peak": peak_ctx, "average": avg_ctx},
            "output_per_turn": int(out_per_turn),
            "tool_counts": dict(tool_counts),
        })

    return phases


def main():
    parser = argparse.ArgumentParser(description="Parse a Claude Code session JSONL for efficiency metrics.")
    parser.add_argument("session_file", help="Path to the .jsonl session file")
    parser.add_argument("--phases", action="store_true", help="Include per-phase breakdown (requires Skill invocations in the JSONL)")
    args = parser.parse_args()

    result = parse(args.session_file, args.phases)
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
