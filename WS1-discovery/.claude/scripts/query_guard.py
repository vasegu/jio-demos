#!/usr/bin/env python3
"""Query guard — blocks queries and responses that violate the privacy policy.

Enforces guard_config.json rules at two checkpoints:
  1. Pre-query  (PreToolUse hook / before execute_sql runs): block risky SQL
  2. Post-response (PostToolUse hook / after execute_sql returns): block risky results

CLI usage (MCP hooks via settings.json):
    echo '<PreToolUse JSON>'  | python ".claude/scripts/query_guard.py" --mode pre
    echo '<PostToolUse JSON>' | python ".claude/scripts/query_guard.py" --mode post

Importable usage (query.py):
    from query_guard import check_query, check_response
    should_block, reason = check_query(sql)
    should_block, reason = check_response(sql, rows)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# ── Import helpers from query_logger (same directory) ────────────────────────
# These are all read-only parsing/classification utilities — no side effects.
try:
    from query_logger import (
        _SENSITIVE_COLUMNS,
        _classify,
        _has_aggregate,
        _has_group_by,
        _parse_select_columns,
        _parse_mcp_rows,
        log_query,
    )
    _LOGGER_AVAILABLE = True
except ImportError:
    _LOGGER_AVAILABLE = False


# ── Config ───────────────────────────────────────────────────────────────────
# Loaded once at import time (same pattern as _SENSITIVE_COLUMNS in query_logger).

def _load_config() -> dict:
    config_path = _PROJECT_ROOT / ".claude" / "guard_config.json"
    if not config_path.exists():
        raise FileNotFoundError(
            f"guard_config.json not found at {config_path}. "
            "Create it at rx-skills/.claude/guard_config.json before running queries."
        )
    with config_path.open(encoding="utf-8") as f:
        return json.load(f)


_GUARD_CONFIG: dict = _load_config()


# ── Public API (importable by query.py) ──────────────────────────────────────

def check_query(sql: str) -> tuple[bool, str]:
    """Check whether a query should be blocked before execution.

    Returns (should_block, reason). Returns (False, "") if the guard is
    disabled, unconfigured, or query_logger helpers are unavailable.
    """
    if not _LOGGER_AVAILABLE or not _GUARD_CONFIG.get("enabled", False):
        return False, ""

    pre = _GUARD_CONFIG.get("pre_query", {})

    # Block SELECT * if configured (off by default)
    if pre.get("block_select_star", False):
        import re
        if re.search(r'\bSELECT\s+\*', sql, re.IGNORECASE):
            return True, (
                "Query uses SELECT * which may expose sensitive columns. "
                "Select only the columns you need."
            )

    # Block if SELECT clause explicitly names a sensitive column without aggregation
    if pre.get("block_identifier_columns_in_select", True) and _SENSITIVE_COLUMNS:
        if not _has_aggregate(sql):
            selected = {c.lower() for c in _parse_select_columns(sql)}
            flagged = selected & _SENSITIVE_COLUMNS
            if flagged:
                col_list = ", ".join(sorted(flagged))
                return True, (
                    f"Query selects sensitive column(s) [{col_list}] without aggregation. "
                    "Use COUNT/GROUP BY or exclude these columns and retry."
                )

    return False, ""


def check_response(sql: str, rows: list[dict]) -> tuple[bool, str]:
    """Check whether a response should be withheld from the LLM.

    Returns (should_block, reason). Returns (False, "") if the guard is
    disabled, unconfigured, or query_logger helpers are unavailable.
    """
    if not _LOGGER_AVAILABLE or not _GUARD_CONFIG.get("enabled", False):
        return False, ""

    post = _GUARD_CONFIG.get("post_response", {})
    block_levels = set(post.get("block_on_risk_levels", ["HIGH"]))

    if not block_levels:
        return False, ""

    result_cols = list(rows[0].keys()) if rows else []
    row_count = len(rows)
    has_agg = _has_aggregate(sql)
    has_gb = _has_group_by(sql)

    classification = _classify(sql, result_cols, row_count, has_agg, has_gb)
    risk = classification.get("privacy_risk_level", "LOW")

    if risk in block_levels:
        id_cols = classification.get("identifier_columns_in_results", [])
        granularity = classification.get("granularity", "")
        parts = [
            f"Response blocked: privacy_risk_level={risk}, granularity={granularity}",
            f"row_count={row_count}",
        ]
        if id_cols:
            parts.append(f"sensitive columns present: {', '.join(id_cols)}")
        parts.append("Aggregate the data or exclude sensitive columns and retry.")
        return True, ". ".join(parts)

    return False, ""


# ── Hook entrypoints (invoked by settings.json hooks) ─────────────────────────

def _pre_mode() -> None:
    """PreToolUse hook: check query before execution."""
    raw = sys.stdin.read().strip()
    if not raw:
        sys.exit(0)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        sys.exit(0)

    sql = payload.get("tool_input", {}).get("query", "")
    if not sql:
        sys.exit(0)

    should_block, reason = check_query(sql)
    if should_block:
        if _LOGGER_AVAILABLE:
            log_query(
                sql,
                [],
                source="mcp_hook",
                guard_outcome={"stage": "pre_query", "reason": reason},
            )
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": f"[query_guard] {reason}",
            }
        }))

    sys.exit(0)


def _post_mode() -> None:
    """PostToolUse hook: replace response before LLM sees it if blocked."""
    raw = sys.stdin.read().strip()
    if not raw:
        sys.exit(0)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        sys.exit(0)

    sql = payload.get("tool_input", {}).get("query", "")
    tool_response = payload.get("tool_response", {})

    if not sql or not _LOGGER_AVAILABLE:
        sys.exit(0)

    rows, _ = _parse_mcp_rows(tool_response)
    should_block, reason = check_response(sql, rows)

    if should_block:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "updatedMCPToolOutput": f"[query_guard] {reason}",
            }
        }))

    sys.exit(0)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Query guard hook runner")
    parser.add_argument("--mode", choices=["pre", "post"], required=True)
    args = parser.parse_args()

    if args.mode == "pre":
        _pre_mode()
    else:
        _post_mode()
