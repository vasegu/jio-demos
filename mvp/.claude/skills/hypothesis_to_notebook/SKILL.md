# Skill: hypothesis_to_notebook

Convert a hypothesis skill's outcome report into an interactive marimo notebook.
The notebook runs the skill's named SQL queries live against the database, renders
findings as dynamic charts and prose, and includes the full executive summary, key
metrics, hypothesis assessment, recommendations, decisions, and follow-ups.

## When to use

Run this after a hypothesis skill has produced an outcome report in `reports/<skill>/`.
The notebook becomes the deliverable — a self-contained, live-data view of the report
that stays current as the database changes.

## Inputs

| Input | Where to find it |
|-------|-----------------|
| Skill name | User provides (e.g., `analyze_<domain>`) |
| `queries.sql` | `.claude/skills/hypotheses/<skill>/queries.sql` |
| `SKILL.md` | `.claude/skills/hypotheses/<skill>/SKILL.md` |
| Latest outcome report | `reports/<skill>/outcome-<skill>-YYYY-MM-DD.md` |
| DB connection | `.env` → `DATABASE_URL` |

## Output

A marimo notebook at `notebooks/<skill-slug>.py` (e.g., `notebooks/<domain>.py`).

---

## Phase 0 — Intake

Confirm before doing anything:

0. **Outcome report check:** Look for `reports/<skill>/outcome-*.md`. If none exists, warn: "No outcome report found — the scripted skill has not been run yet. Queries in `queries.sql` may not have been validated against the database. Proceed anyway?" Do not block, but surface the risk explicitly.
1. **Which skill?** Name of the hypothesis skill to convert.
2. **Output path** — default: `notebooks/<skill-slug>.py`. Override?
3. **Date range** — default from the outcome report. Override?
4. **DB schema** — which schema holds the source tables? (default: `sample_data`)

Present as a confirmation block. Do not proceed until approved.

---

## Phase 1 — Read artifacts

Read in this order:

1. `SKILL.md` — extract: hypothesis list, KPI table, finding section names
2. `queries.sql` — extract all `-- @name:` entries; note which findings each query serves
3. Latest outcome report — extract:
   - Executive summary bullets (3)
   - Key metrics table (all rows)
   - Hypothesis assessment table
   - Findings (one per `### Finding N:` heading) — prose, tables, chart specs
   - Recommendations table
   - Decisions required
   - Follow-ups table
   - Data quality notes
4. Latest basecamp report (`reports/basecamp/basecamp-*.md`) — extract:
   - **"What We Were Told"** section: the plain-language description of the client and their problem
   - Engagement context bullets: client name, problem statement, dataset size
5. Latest go hunt report (`reports/go_hunt/discovery-go-hunt-*.md`) — extract:
   - Executive summary bullet(s) relevant to this hypothesis skill

Use the basecamp and go hunt text to **write the Background paragraph** for Cell 5 of the notebook.
This paragraph is a **static string in the notebook code** — do not add file-reading logic to the notebook.
The comment above `_told` should cite the source reports by filename.

Build a mental map: **finding N → query name(s) → chart type → prose summary**.

---

## Phase 2 — Plan cells

Present the proposed cell structure for user approval. Format as a numbered list:

```
Cell 1  [hide_code] — Imports, dotenv, SQL parser          → exports: QUERIES, alt, mo, pd, text, ...
Cell 2              — Engine + run() helper                 → exports: run
Cell 3              — Data loader (all queries)             → exports: df_<name> × N
Cell 4              — Aggregate computation                 → exports: fleet metrics, primary entity row
Cell 5  [hide_code] — Header + KPI stat tiles
Cell 6  [hide_code] — Executive summary + key metrics + hypothesis assessment
Cell 7  [hide_code] — Finding 1: <name>
...
Cell N  [hide_code] — Finding M: <name>
Cell N+1 [hide_code] — Lifecycle flow diagram (Mermaid) if applicable
Cell N+2 [hide_code] — Recommendations accordion (recs / decisions / follow-ups / SQL source)
```

User can:
- **Reorder** findings
- **Drop** a finding (e.g., if data is too sparse)
- **Merge** two findings into one cell
- **Add** a Mermaid diagram cell
- **Change** output path or date range

Do not generate code until the plan is approved.

---

## Phase 3 — Generate notebook

Write the `.py` file following the patterns in `references/marimo-patterns.md` and
using `templates/notebook-scaffold.py` and `templates/finding-cell.py` as the base.

### Cell generation rules

**Cell 1 — Infrastructure (hide_code)**
- Standard imports: `re, marimo as mo, altair as alt, pandas as pd, numpy as np, os, Path, load_dotenv, create_engine, text`
- `load_dotenv(Path(__file__).parent.parent / ".env")`
- Reads `queries.sql` and resolves `$SCHEMA` → the actual schema name (from Phase 0) at parse time, so queries contain no placeholders when they reach the database
- SQL parser regex: `re.finditer(r"-- @name: (\w+)\n(.*?)(?=\n-- -{10,}|\Z)", raw, re.DOTALL)`
- Strips trailing separator lines from each query body
- Returns: all imports + `QUERIES` dict

**Cell 2 — Engine + run helper**
- Reads `DATABASE_URL` from env
- pg8000 driver: replace `postgresql://` with `postgresql+pg8000://`, `connect_args={"ssl_context": True}`
- `run(query_name)` replaces `$1`/`$2` with `:start_date`/`:end_date`, `$3` with `"8"` (action sequence limit)
- Renders a `mo.callout` on connection success/failure (but callout is NOT returned — it's just for display; only `run` is returned)

**Cell 3 — Data loader**
- Wraps ALL `run()` calls in a single `mo.status.spinner("Running queries…")`
- One `df_<name>` variable per named query
- Returns all dataframes as a tuple (alphabetical order so marimo can track)

**Cell 4 — Aggregate computation**
- Pure computation, no display
- Computes fleet-level aggregates from the primary type/grouping dataframe
- Identifies the primary entity row (e.g., the worst-performing ticket type)
- Returns all aggregate variables individually (not as a dict/object)

**Cell 5 — Header + background + stat tiles (hide_code)**
- `mo.callout` if primary entity is None (data not loaded)
- Otherwise: `mo.vstack([title_md, background_md, mo.hstack([mo.stat(...) × 4])])`
- `background_md` contains:
  - `## Background` — a static paragraph written from the basecamp/go hunt reports
    (reference comment above `_told` names the source files; no file I/O in the notebook)
  - The hypothesis under investigation (one sentence)
  - A blockquote defining the primary entity category under analysis (e.g. a category, segment, or cohort specific to this dataset) for readers unfamiliar with the data
  - `---` separator + `**Headline metrics**` label before the tiles
- Uses `_out` pattern (see marimo-patterns.md)

**Cell 6 — Executive summary + key metrics + hypothesis assessment (hide_code)**
- Guard: `if primary_entity is None: _out = mo.md("")`
- Compute derived metrics from the loaded dataframes (not hardcoded from report)
- Build status labels as variables BEFORE the f-string
- Key metrics table: one row per metric, status column uses plain text labels (CRITICAL/HIGH/OK) — not emoji, they render inconsistently
- Hypothesis assessment table: one row per KPI from SKILL.md
- Uses `_out` pattern

**Finding cells (hide_code)**
- One cell per finding
- Guard: `if not df_<primary>.empty:`
- Compute all values needed for prose and chart from the dataframe
- Build detail tables as string joins (`"\n".join(rows)`) inside the guard block
- Chart: Altair from actual query results — never hardcode data from the report
- Chart properties: `width=620, height=260` for bar/line; `width=300, height=300` for donut
- Prose uses string concatenation (not triple-quoted f-strings with conditional expressions — see gotchas)
- `_out = mo.vstack([mo.md("---"), mo.md(prose + table), chart], gap="1rem")`
- Ends with `_out` as a bare top-level expression

**Mermaid flow cell (hide_code, optional)**
- Only include if the outcome report has a Mermaid diagram or the finding has a clear flow
- Compute branch probabilities from dataframes at runtime
- Use `mo.mermaid(string)` — NOT `mo.md("```mermaid\n...\n```")`
- Build diagram string via concatenation, not f-string (avoids brace-escaping issues)

**Recommendations accordion cell (hide_code)**
- `mo.vstack([mo.md("---"), mo.accordion({...})])`
- Four panels: Recommendations · Decisions Required · Follow-ups · Schema & SQL source
- Schema panel: `mo.vstack([mo.md(reference_text), mo.accordion({f"SQL: {name}": mo.md(f"```sql\n{sql}\n```") for name, sql in QUERIES.items()})])`
- This cell imports `QUERIES` from Cell 1

### What to take from the outcome report vs. compute live

| Source | Take from report | Compute from dataframes |
|--------|-----------------|------------------------|
| Executive summary bullets | Text/framing | All numbers |
| Key metrics table | Metric names, thresholds | All values and statuses |
| Hypothesis assessment | KPI names, targets, N descriptions | Values, statuses |
| Finding prose | Structure/framing | All specific numbers, multipliers |
| Finding tables | Column headers | All data rows |
| Charts | Chart type, axes, color scheme | All data |
| Recommendations | Full text (static) | — |
| Decisions required | Full text (static) | — |
| Follow-ups | Full text (static) | — |

---

## Phase 4 — Validate and handoff

1. Confirm the file was written: `ls -lh notebooks/<filename>.py`
2. Show the run command:
   ```
   python3.12 -m marimo run notebooks/<filename>.py
   ```
3. Note any findings that used hardcoded fallback values (e.g., sparse data tiers with N < 5)
4. Note any queries from `queries.sql` that were NOT used in the notebook

---

## Naming conventions

| Skill name | Notebook filename |
|-----------|-------------------|
| `analyze_<domain>` | `<domain>.py` |
| Custom | User specifies at Phase 0 |
