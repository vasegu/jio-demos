# Agent Scripts

Utility scripts for query execution, logging, and privacy enforcement.

The entire `scripts/` directory at the repo root is excluded from agent
Read access (via `.claude/settings.json`). Scripts that agents or hooks
need to call live here instead.

## Agent-callable

- `query.py` — backup SQL query runner (reads `DATABASE_URL` from `.env`).
  Invoke when the Supabase MCP is unavailable. Enforces read-only access and runs
  the guard and logger automatically if they are available.

## Hook-executed (auto-run by Claude Code harness, not the agent)

> **Note: MCP servers are not currently in use, so these hooks do not fire. They are
> registered in `settings.json` for when MCP is re-enabled.**

- `query_guard.py` — **PreToolUse** hook: checks every `mcp__supabase__execute_sql`
  call against `guard_config.json` rules before execution. Blocks queries that select
  sensitive columns without aggregation (configurable). Exits silently if the guard
  is disabled or `guard_config.json` is absent.
- `query_post_hook.py` — **PostToolUse** hook: logs the query + result and applies the
  post-response guard in one atomic pass. Replaces the MCP tool output if the response
  is blocked.

## Library (not invoked directly)

- `query_logger.py` — JSONL audit logger with privacy-risk classification. Imported
  by `query.py`, `query_guard.py`, and `query_post_hook.py`. Writes to
  `reports/query_logs/<session>.jsonl`. Session name defaults to the current date
  (`YYYYMMDD`); override with the `QUERY_LOG_SESSION` environment variable.
