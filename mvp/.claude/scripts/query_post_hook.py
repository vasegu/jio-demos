#!/usr/bin/env python3
"""Combined PostToolUse hook: log query + post-response guard in one pass.

Replaces the two separate query_logger.py and query_guard.py --mode post hooks
so the log entry and the guard decision are written atomically into a single
JSONL entry with a populated guard_outcome field when the response is withheld.

Usage (settings.json PostToolUse hook):
    echo '<PostToolUse JSON>' | python ".claude/scripts/query_post_hook.py"
"""

from __future__ import annotations

import json
import sys

try:
    from query_logger import log_query, _parse_mcp_rows
    from query_guard import check_response
    _AVAILABLE = True
except ImportError:
    _AVAILABLE = False


def main() -> None:
    raw = sys.stdin.read().strip()
    if not raw:
        sys.exit(0)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        sys.exit(0)

    sql = payload.get("tool_input", {}).get("query", "")
    tool_response = payload.get("tool_response", {})

    if not sql or not _AVAILABLE:
        sys.exit(0)

    rows, err = _parse_mcp_rows(tool_response)
    should_block, reason = check_response(sql, rows)
    guard_outcome = {"stage": "post_response", "reason": reason} if should_block else None

    log_query(sql, rows, error=err, source="mcp_hook", guard_outcome=guard_outcome)

    if should_block:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "updatedMCPToolOutput": f"[query_guard] {reason}",
            }
        }))

    sys.exit(0)


if __name__ == "__main__":
    main()
