---
name: log_session
description: After a skill-chain run, parse the session JSONL, generate a dated efficiency report, and update the benchmarks tracker.
---

# Log Session (Interactive SOP)

## Purpose

After completing a skill chain run (Basecamp → Go Hunt → Hypothesis Skills → Notebook), run this skill to:

1. Parse the session JSONL file to extract all efficiency metrics automatically.
2. Generate a dated efficiency report: `reports/session-efficiency/efficiency-report-YYYY-MM-DD.md`.
3. Add the run as a new column in `reports/session-efficiency/efficiency-benchmarks.md`.

The benchmarks file becomes the longitudinal tracker for improvement across runs — tracking cost, context inflation, waste, and output efficiency over time.

## When to Use

- At the end of any analytical skill-chain session.
- After implementing a change to the skill SOPs (e.g., enabling MCP, adding sub-agents) and wanting to measure its effect.
- When you want to compare this run's cost/efficiency to previous runs.

## Artifacts Produced

| Artifact | Path |
|----------|------|
| Session efficiency report | `reports/session-efficiency/efficiency-report-YYYY-MM-DD.md` |
| Updated benchmarks tracker | `reports/session-efficiency/efficiency-benchmarks.md` |

---

## SOP Phases

### Phase 0 — Intake

Confirm the following before doing anything:

1. **Session picker** — immediately run this command (no user input needed first):
   ```bash
   python3 .claude/scripts/list_sessions.py
   ```
   This lists the 5 most recent sessions with date, time, and the first meaningful message from each:
   ```
   Recent sessions — pick one:

     1. 2026-03-09 16:27  d45bf60d…  [opened] efficiency-report-2026-03-06.md
     2. 2026-03-09 16:25  294281c2…  /basecamp
     3. 2026-03-09 14:48  d14b1e09…  review this project and tell me what it does
     4. 2026-03-06 18:58  78ce8511…  /basecamp use the query sql python script instead of mcp
     5. 2026-03-06 18:36  c3e16c98…  Tool loaded.

     [1–5 / paste full path]
   ```
   Use `--n 10` to show more: `python3 .claude/scripts/list_sessions.py --n 10`

   Default: option 1 (most recent). After the user picks, resolve the full path from the session ID:
   ```
   ~/.claude/projects/c--Users-tatiana-sosnovskikh-github-stuff-Data-Exploration-skills-repair-journey-mockup/<session-id>.jsonl
   ```
2. **Session ID** — extract from the chosen filename (strip `.jsonl`).
3. **Model used** — default `claude-sonnet-4-6`. Override?
4. **Engagement name** — short label for the report header (e.g., "S&C Full").
5. **Skills executed** — list of skill chain steps run in this session (e.g., basecamp, go_hunt, hypothesis_to_notebook). Confirm or let the parser detect from Skill tool calls.
6. **Phase boundaries (optional)** — if the user wants per-phase breakdown and the JSONL contains Skill tool call events, the parser can detect these automatically. Otherwise, ask for approximate timestamps or turn ranges for each phase.

Present as a confirmation block:

```
Session file: <path>
Session ID: <id>
Model: claude-sonnet-4-6
Engagement: <name>
Skills: <list>
Phase detection: automatic from JSONL / manual (user will provide)
→ Proceed? [yes / adjust]
```

Do not proceed until confirmed.

---

### Phase 1 — Parse Session

Run the parser script against the session file:

```bash
python3 .claude/scripts/parse_session.py "<session_file_path>" --phases
```

The script outputs JSON with these sections:
- `session` — date, start/end times, duration
- `turns` — assistant turn count, tool call counts per tool, skills executed
- `tokens` — input, output, cache_read, cache_creation totals
- `cost` — cost per token type and total
- `cache` — session avg hit rate, min/max hit rates, compaction events
- `context` — start, peak, end, average context; turns above 100k and 150k
- `phases` — per-phase breakdown (if Skill invocations found in JSONL)

**If the JSONL is unavailable or the parser returns empty results**, fall back to manual intake:
- Ask the user to paste the token summary from the Claude Code session output (it's shown at the end of each session).
- Gather phase durations, tool call counts, and peak context from the user's observations or memory.
- Record data source as "manual" in the report.

**Sanity checks after parsing:**
- Total tokens should be > 1M for a full skill chain run. If not, the file may be truncated.
- Cache hit rate should be > 80% for a normal long session. If < 50%, note it — may indicate a fresh context (no cache warmup) or a very short session.
- If zero Skill tool calls detected, phase breakdown will be absent — note it and ask user to supply phase timestamps manually.

---

### Phase 2 — Generate Efficiency Report

Write `reports/session-efficiency/efficiency-report-YYYY-MM-DD.md` using the template at `.claude/skills/log_session/templates/report-template.md`.

Populate every section with values from the parser JSON. Do not leave placeholder cells — if a value is unavailable, mark it `N/A (manual fill)`.

**Phase breakdown section:** If `--phases` data exists in parser output, generate the context growth ASCII diagrams. If not, generate a simplified table and note "Phase context data unavailable — provide manually if needed."

**Bottleneck assessment:** Based on the run's data, assess each known inefficiency category:
- DB connection errors → did Bash calls include failed `query.py` invocations? (look for high Bash count relative to turns)
- Wrong column errors → look for repeated Bash calls on the same table in quick succession
- MCP vs script → if tool breakdown shows Bash > 50% of calls, flag as structural bottleneck
- Context inflation → compare peak context to baseline (166,600 tokens); flag if higher

**Time-to-value:** Populate only if the user confirms which deliverables were produced and their approximate durations.

**Inefficiencies table:** For each known bottleneck from the benchmarks tracker, assess whether it was present in this run. Mark ✓ (fixed) or ✗ (still present) based on the parsed data and user confirmation.

---

### Phase 3 — Update Benchmarks

Read `reports/session-efficiency/efficiency-benchmarks.md`.

Add a new column for this run (headed with the date `YYYY-MM-DD`) to every table in the benchmarks file:

1. **Section 1 — Session-Level KPIs** — populate all rows from parser JSON.
2. **Section 2 — Token & Cost KPIs** — populate from `tokens` and `cost` in parser output.
3. **Section 3 — Per-Phase Cost & Context** — populate from `phases` in parser output, or mark N/A.
4. **Section 4 — Context Window KPIs** — populate from `context` and `cache` in parser output.
5. **Section 5 — Efficiency KPIs** — populate productivity rate and waste if known; mark N/A if not.
6. **Section 6 — Tracked Inefficiencies** — mark each row ✓ or ✗ based on Phase 2 assessment.
7. **Section 7 — Time-to-Value** — populate if user confirmed deliverables.

Also update the `Report link` row in Section 1 to link to the new report file.

**Checkpoint before writing:** Present a summary of the new benchmarks column values to the user for review:

```
New run column preview — YYYY-MM-DD:
  Duration: Xh Ym
  Total cost: $X.XX
  Cache hit rate: X%
  Peak context: Xk tokens
  Total waste: ~X min (estimated)
→ Write to benchmarks? [yes / adjust]
```

Do not write until confirmed.

---

### Phase 4 — Summary

After both files are written, present:

1. **Delta vs baseline** — for the key metrics that have improved or regressed:
   - Cost: $X.XX vs $9.30 baseline (Δ $X.XX / X%)
   - Duration: Xh Ym vs 1h 45m baseline (Δ Xm / X%)
   - Peak context: Xk vs 166.6k baseline (Δ Xk / X%)
   - Cache hit rate: X% vs 93.7% baseline
   - Effective productivity rate: X% vs 69% baseline

2. **Top improvement** — what changed most vs the previous run.

3. **Remaining bottlenecks** — which tracked inefficiencies are still unresolved.

4. **Links** to the two files written.

---

## Parser Script Reference

```bash
# Full parse with phase detection
python3 .claude/scripts/parse_session.py "<path/to/session.jsonl>" --phases

# Basic parse (no phase breakdown)
python3 .claude/scripts/parse_session.py "<path/to/session.jsonl>"
```

Parser outputs JSON to stdout. Key fields:

| JSON path | Report use |
|-----------|-----------|
| `session.date` | Report filename date, benchmarks column header |
| `session.duration` | Duration row |
| `turns.total_assistant_turns` | Total API turns row |
| `turns.total_tool_calls` | Total tool calls row |
| `turns.tool_breakdown` | Tool call distribution table |
| `turns.skills_executed` | Skills executed row |
| `tokens.*` | Token & cost tables |
| `cost.total` | Total cost row |
| `cache.session_avg_hit_rate_pct` | Cache hit rate (session avg) |
| `cache.input_vs_cached_hit_rate_pct` | Cache hit rate on input |
| `cache.compaction_events` | Context compaction events row |
| `context.peak` | Peak context row |
| `context.average` | Average context row |
| `context.turns_above_100k` | Turns above 100k row |
| `phases[].cost` | Per-phase cost |
| `phases[].context.peak` | Per-phase peak context |
| `phases[].output_per_turn` | Per-phase output/turn |

---

## What This Skill Does NOT Do

- Does not access the database — no SQL queries.
- Does not modify any skill files.
- Does not push reports to any external system.
- Does not retroactively modify past efficiency reports — each run gets its own dated file.
