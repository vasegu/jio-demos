#!/usr/bin/env python3
"""Query logger for privacy/trust analysis of LLM database access.

Logs every SQL query and its full result set to a JSONL file, with
automated privacy-risk classification. Used to demonstrate to clients
what data the LLM actually sees and how granular that access is.

Usage (imported by query.py):
    from query_logger import log_query
    log_query(sql, rows)          # rows is list[dict] from execute_sql

Usage (as CLI hook for future MCP PostToolUse):
    echo '{"tool_input": {"query": "SELECT ..."}, "tool_response": {"rows": [...]}}' | python scripts/query_logger.py

Session / log file control:
    Set env var QUERY_LOG_SESSION to name the session.
    Default: date-based (YYYYMMDD) — all queries that day share one file.
    Examples:
        set QUERY_LOG_SESSION=basecamp-20260304
        set QUERY_LOG_SESSION=run_20260304_143000
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ── Project root & log dir ───────────────────────────────────────────────────
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_LOG_DIR = _PROJECT_ROOT / "reports" / "query_logs"

# Module-level singleton: resolved once per process, reused for all calls.
_log_file: Optional[Path] = None


def _resolve_log_file() -> Path:
    global _log_file
    if _log_file is None:
        session = os.environ.get("QUERY_LOG_SESSION", "").strip()
        if not session:
            session = datetime.now().strftime("%Y%m%d")
        _LOG_DIR.mkdir(parents=True, exist_ok=True)
        _log_file = _LOG_DIR / f"{session}.jsonl"
    return _log_file


# ── SQL parsing helpers ──────────────────────────────────────────────────────

# Aggregate function names (common PostgreSQL + ANSI)
_AGG_PATTERN = re.compile(
    r'\b(COUNT|SUM|AVG|MIN|MAX|PERCENTILE_CONT|PERCENTILE_DISC|STDDEV|VARIANCE|STRING_AGG|ARRAY_AGG|BOOL_AND|BOOL_OR)\s*\(',
    re.IGNORECASE,
)

# Table names from FROM / JOIN clauses (handles schema-qualified names)
_TABLE_PATTERN = re.compile(
    r'\b(?:FROM|JOIN)\s+([\w.]+)',
    re.IGNORECASE,
)

# Columns in the outermost SELECT (very best-effort: comma-split + extract last word/alias)
# This is intentionally simple — precise AST parsing is overkill for classification
_SELECT_COL_PATTERN = re.compile(
    r'(?i)^\s*SELECT\s+(.*?)\s+FROM\b',
    re.IGNORECASE | re.DOTALL,
)


def _parse_tables(sql: str) -> list[str]:
    """Extract unique table names (schema-stripped) from FROM/JOIN clauses."""
    matches = _TABLE_PATTERN.findall(sql)
    tables = []
    seen: set[str] = set()
    for m in matches:
        # Strip schema prefix (e.g. mockup_v3.ft_ticket_master → ft_ticket_master)
        name = m.split(".")[-1].strip()
        # Skip SQL keywords that follow FROM/JOIN by accident
        if name.upper() in ("SELECT", "WHERE", "ON", "SET", "VALUES", "INTO"):
            continue
        if name not in seen:
            seen.add(name)
            tables.append(name)
    return tables


def _parse_select_columns(sql: str) -> list[str]:
    """Best-effort extraction of column/expression names from SELECT clause."""
    match = _SELECT_COL_PATTERN.search(sql)
    if not match:
        return []
    select_clause = match.group(1)
    # Remove subqueries / nested parens to avoid false splits
    depth = 0
    cleaned = []
    for ch in select_clause:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif depth == 0:
            cleaned.append(ch)
    parts = "".join(cleaned).split(",")
    cols = []
    for part in parts:
        part = part.strip()
        # Take alias if present (last word after AS, or last word overall)
        as_match = re.search(r'\bAS\s+(\w+)\s*$', part, re.IGNORECASE)
        if as_match:
            cols.append(as_match.group(1).strip())
        else:
            # Take last identifier token
            tokens = re.findall(r'\w+', part)
            if tokens:
                cols.append(tokens[-1])
    return [c for c in cols if c]


def _has_aggregate(sql: str) -> bool:
    return bool(_AGG_PATTERN.search(sql))


def _has_group_by(sql: str) -> bool:
    return bool(re.search(r'\bGROUP\s+BY\b', sql, re.IGNORECASE))


# ── Sensitive column config ──────────────────────────────────────────────────
# Loaded once at import from .claude/guard_config.json (sensitive_columns field).
# Falls back to an empty set if the file is absent — no false positives on unknown schemas.

def _load_sensitive_columns() -> set[str]:
    config_path = _PROJECT_ROOT / ".claude" / "guard_config.json"
    if not config_path.exists():
        return set()
    try:
        with config_path.open(encoding="utf-8") as f:
            config = json.load(f)
        return {c.lower() for c in config.get("sensitive_columns", [])}
    except Exception:
        return set()


_SENSITIVE_COLUMNS: set[str] = _load_sensitive_columns()


def _detect_identifier_cols(result_column_names: list[str]) -> list[str]:
    return [c for c in result_column_names if c.lower() in _SENSITIVE_COLUMNS]


# ── Risk classification ──────────────────────────────────────────────────────

def _classify(
    sql: str,
    result_cols: list[str],
    row_count: int,
    has_agg: bool,
    has_gb: bool,
) -> dict:
    """Derive granularity and privacy risk level from query structure + results."""
    id_cols = _detect_identifier_cols(result_cols)

    # Granularity
    if re.search(r'\binformation_schema\b', sql, re.IGNORECASE):
        granularity = "schema_introspection"
    elif has_agg:
        granularity = "aggregate"
    elif not has_gb and not has_agg:
        granularity = "raw"
    else:
        granularity = "individual"

    # Risk level
    if granularity == "raw" or (id_cols and row_count > 200):
        risk = "HIGH"
    elif id_cols or (granularity == "aggregate" and row_count > 50) or granularity == "individual":
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "granularity": granularity,
        "identifier_columns_in_results": id_cols,
        "privacy_risk_level": risk,
    }


# ── Public API ───────────────────────────────────────────────────────────────

def log_query(
    sql: str,
    rows: list[dict],
    error: Optional[str] = None,
    source: str = "query.py",
    guard_outcome: Optional[dict] = None,
) -> None:
    """Append one log entry to the session JSONL file.

    Args:
        sql:           The SQL query string that was executed (or attempted).
        rows:          Result rows as list of dicts (column → value). Empty list on
                       error or when the query was blocked before execution.
        error:         Error message string if the query failed, else None.
        source:        Execution path identifier — "query.py" or "mcp_hook".
        guard_outcome: None for allowed queries. Dict with keys "stage" and "reason"
                       when the guard blocked the attempt:
                           {"stage": "pre_query",     "reason": "..."}  — blocked before execution
                           {"stage": "post_response", "reason": "..."}  — response withheld
    """
    try:
        log_file = _resolve_log_file()

        has_agg = _has_aggregate(sql)
        has_gb = _has_group_by(sql)
        tables = _parse_tables(sql)
        select_cols = _parse_select_columns(sql)

        # Use actual result column names if available, else fall back to parsed ones
        result_col_names = list(rows[0].keys()) if rows else select_cols
        row_count = len(rows)

        classification = _classify(sql, result_col_names, row_count, has_agg, has_gb)

        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
            "session": _resolve_log_file().stem,
            "source": source,
            "query_sql": sql.strip(),
            "tables_accessed": tables,
            "columns_selected": result_col_names,
            "has_aggregate_functions": has_agg,
            "has_group_by": has_gb,
            "result_row_count": row_count,
            "result_rows": rows,
            "classification": classification,
            "error": error,
            "guard_outcome": guard_outcome,
        }

        with log_file.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, default=str) + "\n")

    except Exception as exc:
        # Logging must never crash the caller — silently swallow all errors.
        # Print to stderr so it's visible in dev without breaking production.
        print(f"[query_logger] Failed to log query: {exc}", file=sys.stderr)


# ── Hook entrypoint (MCP PostToolUse hook) ───────────────────────────────────

_UNTRUSTED_DATA_RE = re.compile(r'<untrusted-data-[^>]+>\s*(\[.*?\]|\{.*?\})\s*</untrusted-data-[^>]+>', re.DOTALL)


def _parse_mcp_rows(tool_response) -> tuple[list[dict], Optional[str]]:
    """Extract rows and error from a Supabase MCP execute_sql tool_response.

    Claude Code PostToolUse passes tool_response as a list of content blocks:
        [{"type": "text", "text": "{\"result\": \"...<untrusted-data-uuid>[...]</untrusted-data-uuid>...\"}"}]

    Older/direct shapes may be a plain dict:
        {"result": "...preamble...<untrusted-data-{uuid}>[{...}]</untrusted-data-{uuid}>..."}

    Rows are JSON-stringified inside the untrusted-data tags.
    Falls back to empty list if parsing fails.
    """
    # Normalise list-of-content-blocks → result string
    if isinstance(tool_response, list):
        parts = []
        for block in tool_response:
            if isinstance(block, dict) and block.get("type") == "text":
                text = block.get("text", "")
                # The text field may itself be a JSON-encoded dict
                try:
                    parsed = json.loads(text)
                    if isinstance(parsed, dict):
                        text = parsed.get("result", text)
                except (json.JSONDecodeError, TypeError):
                    pass
                parts.append(text)
        result_str = "\n".join(parts)
        error = None
    elif isinstance(tool_response, dict):
        result_str = tool_response.get("result", "")
        error = tool_response.get("error") or tool_response.get("message") or None
    else:
        return [], None

    if not result_str:
        return [], error

    match = _UNTRUSTED_DATA_RE.search(result_str)
    if not match:
        return [], None

    try:
        data = json.loads(match.group(1))
        # MCP may return a list of rows directly, or {"rows": [...]}
        if isinstance(data, list):
            return data, None
        if isinstance(data, dict):
            return data.get("rows", [data]), None
    except (json.JSONDecodeError, TypeError):
        pass

    return [], None


def _cli_main() -> None:
    """Read a PostToolUse hook payload from stdin and log it.

    Expected stdin JSON shape (Claude Code PostToolUse hook format):
        {
          "tool_name": "mcp__supabase__execute_sql",
          "tool_input": {"query": "SELECT ..."},
          "tool_response": {"result": "...<untrusted-data-uuid>[...]</untrusted-data-uuid>..."}
        }
    """
    raw = sys.stdin.read().strip()
    if not raw:
        return

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        print("[query_logger] Could not parse stdin JSON", file=sys.stderr)
        return

    tool_input = payload.get("tool_input", {})
    tool_response = payload.get("tool_response", {})

    sql = tool_input.get("query", tool_input.get("sql", ""))
    rows, error = _parse_mcp_rows(tool_response)

    if sql:
        log_query(sql, rows, error=error, source="mcp_hook")


if __name__ == "__main__":
    _cli_main()
