"""
notebook-scaffold.py
====================
Template for the first four infrastructure cells of a hypothesis notebook.
These cells are domain-independent — copy them verbatim, then substitute:

  SKILL_NAME   → hypothesis skill directory name (e.g. "closure_effectiveness")
  SCHEMA_NAME  → Supabase schema from .env.schema (e.g. "<schema_name>")
  START_DATE   → default from outcome report
  END_DATE     → default from outcome report

After Cell 4, add finding cells using templates/finding-cell.py.
See references/marimo-patterns.md for all gotchas before editing.
"""

import marimo

__generated_with = "0.20.2"
app = marimo.App(width="medium")


# ── Cell 1 — Imports, dotenv, SQL parser ──────────────────────────────────────
# hide_code=True: users should not need to see infrastructure boilerplate.
# Returns QUERIES (dict[str, str]) and all imported names the rest of the
# notebook will use.  Add extra imports here if a finding cell needs them.
@app.cell(hide_code=True)
def _():
    import re
    import marimo as mo
    import altair as alt
    import pandas as pd
    import numpy as np
    import os
    from pathlib import Path
    from dotenv import load_dotenv
    from sqlalchemy import create_engine, text

    load_dotenv(Path(__file__).parent.parent / ".env")

    # ── Parse queries.sql into a dict keyed by -- @name: <name> ───────────────
    # Substitute SKILL_NAME with the actual skill directory name.
    _SQL_FILE = (
        Path(__file__).parent.parent
        / ".claude/skills/hypotheses/SKILL_NAME/queries.sql"
    )
    _raw = _SQL_FILE.read_text().replace("$SCHEMA", "SCHEMA_NAME")

    QUERIES = {}
    for _m in re.finditer(
        r"-- @name: (\w+)\n(.*?)(?=\n-- -{10,}|\Z)", _raw, re.DOTALL
    ):
        _name = _m.group(1)
        _body = _m.group(2).strip()
        # Drop trailing separator comment lines that the regex may capture
        _body = re.sub(r"\n-- -{10,}.*", "", _body, flags=re.DOTALL).strip()
        QUERIES[_name] = _body

    return QUERIES, alt, create_engine, mo, np, os, pd, text


# ── Cell 2 — Database engine + run() helper ───────────────────────────────────
# NOT hide_code because it shows connection status via mo.callout.
# The callout is shown as a side-effect; only `run` is exported.
#
# pg8000 driver note: psycopg2-binary has SSL issues on ARM Macs.
# Replace postgresql:// → postgresql+pg8000:// and pass ssl_context=True.
#
# run() substitutions:
#   $1 → :start_date   (bound to START_DATE)
#   $2 → :end_date     (bound to END_DATE)
#   $3 → literal "8"   (action-sequence limit; adjust per skill)
@app.cell
def _(QUERIES, create_engine, mo, os, pd, text):
    START_DATE = "YYYY-01-01"   # ← replace with date range from outcome report
    END_DATE   = "YYYY-12-31"   # ← replace with date range from outcome report

    _db_url = os.environ.get("DATABASE_URL", "")

    if _db_url:
        _engine = create_engine(
            _db_url.replace("postgresql://", "postgresql+pg8000://"),
            connect_args={"ssl_context": True},
            pool_pre_ping=True,
        )
        mo.callout(
            mo.md(f"**Connected** · Period **{START_DATE}** → **{END_DATE}**"),
            kind="success",
        )
    else:
        _engine = None
        mo.callout(mo.md("DATABASE_URL not set in `.env`"), kind="warn")

    def run(query_name):
        """Execute a named query from queries.sql and return a DataFrame."""
        if _engine is None:
            return pd.DataFrame()
        _sql = (
            QUERIES[query_name]
            .replace("$1", ":start_date")
            .replace("$2", ":end_date")
            .replace("$3", "8")
        )
        with _engine.connect() as _conn:
            return pd.read_sql(
                text(_sql), _conn,
                params={"start_date": START_DATE, "end_date": END_DATE},
            )

    return (run,)


# ── Cell 3 — Data loader ──────────────────────────────────────────────────────
# Wrap ALL run() calls in a single spinner so the user sees one loading state.
# List query names in the order they appear in queries.sql.
# Return a tuple of ALL dataframes, sorted alphabetically — marimo uses the
# return-tuple alphabetical ordering to track dependencies across cells.
@app.cell
def _(mo, run):
    with mo.status.spinner("Running queries…"):
        df_query_one = run("query_one_name")     # ← replace with actual names
        df_query_two = run("query_two_name")
        # … add one line per named query …

    return (
        df_query_one,
        df_query_two,
    )


# ── Cell 4 — Fleet-level aggregation ─────────────────────────────────────────
# Pure computation — no display.
# Compute fleet-level aggregates from the primary grouping dataframe.
# Identify the primary entity row (worst-performing type, dealer, etc.).
# Return all aggregate variables INDIVIDUALLY (not as a dict).
# Guard against empty data (db not connected) at the top.
@app.cell
def _(df_query_one, pd):
    if df_query_one.empty:
        # ── Empty guard — set safe zero-value defaults ─────────────────────
        fleet_n       = 0
        fleet_avg_h   = 0.0
        fleet_reopen  = 0.0
        fleet_total_h = 0.0
        primary_entity = None
        primary_share  = 0.0
        type_stats     = pd.DataFrame()
    else:
        type_stats     = df_query_one.copy()
        fleet_n        = int(type_stats["tickets"].sum())
        fleet_total_h  = float(type_stats["total_hours"].sum())
        fleet_avg_h    = float(
            (type_stats["avg_resolution_h"] * type_stats["tickets"]).sum()
            / fleet_n
        )
        fleet_reopen   = float(
            (type_stats["reopen_pct"] * type_stats["tickets"]).sum()
            / fleet_n
        )
        # Identify the worst-performing primary entity (edit filter as needed)
        _worst_rows = type_stats[
            type_stats["group_column"] == "PRIMARY_ENTITY_VALUE"
        ]
        primary_entity = _worst_rows.iloc[0] if len(_worst_rows) else None
        primary_share  = (
            float(primary_entity["total_hours"]) / fleet_total_h * 100
            if primary_entity is not None and fleet_total_h
            else 0.0
        )

    return (
        fleet_avg_h,
        fleet_n,
        fleet_reopen,
        fleet_total_h,
        primary_entity,
        primary_share,
        type_stats,
    )


if __name__ == "__main__":
    app.run()
