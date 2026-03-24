#!/usr/bin/env python3
"""Backup SQL query runner for when Supabase MCP is unavailable.

Usage (CLI):
    python scripts/query.py "SELECT count(*) FROM public.tickets"

Usage (imported by another script):
    from query import execute_sql
    rows, columns = execute_sql("SELECT 1")

Reads DATABASE_URL from .env in the project root.
Read-only: rejects anything that isn't a SELECT or WITH (CTE).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

try:
    from query_logger import log_query as _log_query
except ImportError:
    _log_query = None  # logger not available — queries still run normally

try:
    from query_guard import check_query as _check_query, check_response as _check_response
except ImportError:
    _check_query = None  # guard not available — queries still run normally
    _check_response = None

# ── Load env ────────────────────────────────────────────────────────────────
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# .env.schema is committed (branch-specific, non-secret config — e.g. SUPABASE_SCHEMA)
# .env holds secrets and takes precedence over everything
load_dotenv(_PROJECT_ROOT / ".env.schema")
_env_file = _PROJECT_ROOT / ".env"
if _env_file.exists():
    load_dotenv(_env_file, override=True)

_DB_URL = os.environ.get("DATABASE_URL", "")

# ── Engine (pg8000 driver for ARM Mac SSL compatibility) ────────────────────
_engine = None
if _DB_URL:
    _engine = create_engine(
        _DB_URL.replace("postgresql://", "postgresql+pg8000://"),
        connect_args={"ssl_context": True},
        pool_pre_ping=True,
    )


# ── Read-only guard ─────────────────────────────────────────────────────────
_ALLOWED_PREFIXES = ("select", "with", "explain")

def _is_read_only(sql: str) -> bool:
    stripped = sql.strip().lower()
    return any(stripped.startswith(p) for p in _ALLOWED_PREFIXES)


# ── Public API ──────────────────────────────────────────────────────────────
def execute_sql(query: str, params: Optional[dict] = None) -> tuple:
    """Run a read-only SQL query and return (rows_as_dicts, column_names).

    Raises ValueError on write attempts or missing DATABASE_URL.
    """
    if _engine is None:
        raise ValueError("DATABASE_URL not set. Check .env")

    schema = os.environ.get("SUPABASE_SCHEMA", "").strip()
    if not schema or schema.upper() == "TODO":
        raise ValueError(
            "SUPABASE_SCHEMA is not configured. "
            "Open .env.schema and replace TODO with the actual schema name for this engagement."
        )
    if "{SCHEMA}" not in query:
        raise ValueError(
            "Query must reference {SCHEMA} to ensure it is scoped to the engagement schema. "
            "Use {SCHEMA}.table_name for table references or WHERE table_schema = '{SCHEMA}' "
            "for information_schema queries."
        )
    query = query.replace("{SCHEMA}", schema)

    if not _is_read_only(query):
        raise ValueError(f"Read-only access: query must start with {_ALLOWED_PREFIXES}")

    if _check_query is not None:
        should_block, reason = _check_query(query)
        if should_block:
            if _log_query is not None:
                _log_query(
                    query, [],
                    guard_outcome={"stage": "pre_query", "reason": reason},
                )
            raise PermissionError(f"[query_guard] {reason}")

    with _engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        columns = list(result.keys())
        rows = [dict(zip(columns, row)) for row in result.fetchall()]

    if _check_response is not None:
        should_block, reason = _check_response(query, rows)
        if should_block:
            if _log_query is not None:
                _log_query(
                    query, rows,
                    guard_outcome={"stage": "post_response", "reason": reason},
                )
            raise PermissionError(f"[query_guard] {reason}")

    if _log_query is not None:
        import traceback
        try:
            _log_query(query, rows)
        except Exception:
            # Print full traceback so bugs are visible during development.
            # Once logging is stable, replace this block with a silent `pass`.
            print("[query_logger] Logging error (query still succeeded):", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)

    return rows, columns


# ── CLI ─────────────────────────────────────────────────────────────────────
def _format_table(rows: list[dict], columns: list[str], max_col_width: int = 40) -> str:
    """Format rows as a simple ASCII table."""
    if not rows:
        return "(0 rows)"

    # Truncate long values for display
    def trunc(val):
        s = str(val) if val is not None else "NULL"
        return s if len(s) <= max_col_width else s[: max_col_width - 1] + "\u2026"

    col_widths = {c: max(len(c), *(len(trunc(r.get(c))) for r in rows)) for c in columns}
    header = " | ".join(c.ljust(col_widths[c]) for c in columns)
    sep = "-+-".join("-" * col_widths[c] for c in columns)
    body = "\n".join(
        " | ".join(trunc(r.get(c)).ljust(col_widths[c]) for c in columns)
        for r in rows
    )
    return f"{header}\n{sep}\n{body}\n({len(rows)} rows)"


def main():
    if len(sys.argv) < 2:
        print(__doc__.strip())
        sys.exit(1)

    query = sys.argv[1]
    try:
        rows, columns = execute_sql(query)
        print(_format_table(rows, columns))
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Query failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
