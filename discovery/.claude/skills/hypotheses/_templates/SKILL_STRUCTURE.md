# Skill Structure Guide

How to build an analytical skill: directory layout, SKILL.md format, SQL conventions, and reference material standards.

For report output standards, see `REPORT_STANDARDS.md`.
For the runtime Phase 0-7 workflow, see `ANALYSIS_WORKFLOW.md`.

Treat all **MUST** items as hard requirements, **SHOULD** items as strong guidance, and **AVOID** lists as explicit anti-patterns.

## 1. Introduction
- Skills are interactive analytical workflows executed by the CLAUDE agent defined in `CLAUDE.md`. They read data from Supabase, perform SOP-driven analysis, and ship auditable artifacts.
- Every skill lives under `.claude/skills/<skill_name>/` and is self-contained: documentation, SQL, references, outputs, and process guidance are co-located.
- Skills output Markdown reports stored under `reports/<skill>/`.
- Authors **MUST** follow this guide and `REPORT_STANDARDS.md` when creating new skills.

## 2. Scope & Goals
- **Goal:** Provide authoring standards so any contributor can create a high-quality skill that aligns with CLAUDE identity, Supabase usage rules, and downstream deliverable expectations.
- **Scope:** File structure, SKILL.md format, SQL query conventions, reference material expectations, outputs naming, and SOP checkpoint integration.
- **Out of Scope:** Supabase credential management, application code changes, or non-analytical automations. Report formatting, chart standards, and Linear integration are covered in `REPORT_STANDARDS.md`.

## 3. Directory Overview
Each skill directory MUST include the following items:

| Path | Purpose | MUST / SHOULD | AVOID |
|------|---------|---------------|-------|
| `.claude/skills/<skill>/SKILL.md` | Canonical SOP + thresholds | **MUST** exist and stay synced with actual workflow | AVOID duplicating SOP steps elsewhere |
| `.claude/skills/<skill>/queries.sql` | Parameterized SQL templates | **MUST** define every query via `@name:` blocks | AVOID embedding SQL inside SKILL.md |
| `.claude/skills/<skill>/references/` | Context docs, hypotheses, cheat-sheets | **SHOULD** contain at least one reference that Phase 1 consumes | AVOID mixing working analysis here; keep it evergreen |
| `.claude/skills/<skill>/templates/` | Report structure templates | **MUST** include `report-template.md` and README | AVOID storing generated reports here |
| `reports/<skill>/` | Generated reports | **MUST** receive all generated content (outcomes, plans) | AVOID undated or ambiguous filenames |

### references/
- **MUST** store durable background material (patterns, hypotheses, glossary) that Phase 1 cites.
- **SHOULD** be Markdown with headers for quick skimming and include a short "How to Use" preface so CLAUDE can cite the file verbatim.
- **SHOULD** include an index or README summarizing available references when more than three docs exist.
- **AVOID** dropping raw query output or transient notes here; use templates/ instead.

### templates/
- **MUST** include a `README.md` explaining what templates are available and where reports get saved (`reports/<skill>/`).
- **MUST** include `report-template.md` defining the outcome document structure with chart placeholders, section ordering, and tables.
- **SHOULD** include diagrams (`erd-template.mmd`) and example Vega-Lite specs where relevant.
- **AVOID** storing generated reports here — this folder is for templates only.

## 4. SKILL.md Structure
SKILL.md is the contract for how the agent runs the skill. Authors **MUST** follow this structure:

1. **Frontmatter** (YAML)
   - `name` (**MUST**) – snake_case identifier matching the directory name.
   - `description` (**MUST**) – short, action-oriented summary.
   - Additional metadata may be added but MUST remain parseable YAML.
2. **Title & Purpose Section**
   - `# <Skill Name> (Interactive SOP)` heading (**MUST**).
   - Purpose paragraph describing business value (**SHOULD**) with clarity on outputs.
3. **Usage Context Sections**
   - `## Purpose`, `## When to Use`, and `## Artifacts Produced` (**SHOULD**).
   - Artifacts section **MUST** state both working and review locations with explicit filenames (e.g., `reports/<skill>/outcome-<skill>-<date>.md`).
4. **Key Metrics & Thresholds**
   - Present tables describing codes/metrics, thresholds, and notes.
   - **MUST** include severity or threshold logic that maps directly to analysis outputs.
   - **SHOULD** explain rationale for each threshold — why that number, what it's based on (industry benchmark, historical data, expert judgement).
   - **SHOULD** include an "Expected Values" reference table mapping each KPI to its industry benchmark, the data field(s) that produce it, and the query that calculates it. This table bridges Basecamp's benchmark framework to the skill's operational thresholds.
5. **SOP Content Structure**
   - **Scripted analysis skills** **MUST** include a prerequisite callout at the top of SKILL.md instructing the agent to load and read `.claude/skills/_templates/ANALYSIS_WORKFLOW.md` before ANY action or user interaction, and include a "SOP Phase Customizations" section documenting only their deviations from the standard workflow.
   - **Discovery skills** (like go_hunt) **MAY** define custom phase structures inline if their workflow differs significantly.
   - Skills **SHOULD NOT** duplicate Phase 0-7 procedural content that's already in ANALYSIS_WORKFLOW.md.
6. **Artifacts and Review Guidance**
   - Outline required sections (Executive Summary, Key Metrics, Vega-Lite charts, Mermaid diagrams, Recommendations, Decisions, Follow-ups).
   - **MUST** link to templates stored under templates/ and remind authors to push to `reports/<skill>/`.
7. **Linear Integration Instructions**
   - Provide issue template and required metadata (**MUST** for skills that capture follow-ups).
8. **Example Interaction** or notes (**SHOULD**) to illustrate conversation flow.

### Threshold Tables – Requirements
- Use Markdown tables with Code/Name/Threshold/Notes columns.
- **MUST** declare severity mappings (e.g., CRITICAL > 100 hrs) and align them with chart annotations.
- **AVOID** ambiguous thresholds such as "high" or "low" without numeric values.

### Anti-Patterns (SKILL.md)
1. **AVOID** skipping Phase 0 checkpoints; every skill must confirm scope before querying.
2. **AVOID** mixing active instructions with past analysis narratives—keep the SOP prescriptive.
3. **AVOID** referencing external docs without summarizing key requirements inside SKILL.md (contributors may lack access).
4. **AVOID** hardcoding Vega-Lite JSON specs with sample data in SKILL.md or templates — these anchor the agent on specific values instead of using real query data. Use CHART_REFERENCE.md patterns and KPI-driven guidance comments instead.

### 4.5 Hypothesis-KPI Mapping

Every scripted skill **MUST** include a Hypothesis-KPI Mapping table that connects its parent hypothesis to measurable KPIs, the queries that produce them, and the chart types that visualise them.

**KPI Table Structure:**

| KPI ID | KPI Name | Query (`@name`) | Target / Threshold | Direction | Suggested Viz |
|--------|----------|-----------------|-------------------|-----------|---------------|
| H<n>-K1 | [KPI name] | `<query_name>` | < [threshold] | lower-is-better | donut/arc |

**Rules:**
- **KPI ID** — `H<n>-K<m>` format linking to the parent hypothesis.
- **Query** — maps to an `@name` tag in queries.sql (scripted skills) or "TBD" (Go Hunt skeletal KPIs).
- **Target / Threshold** — numeric boundary with severity where applicable.
- **Direction** — `lower-is-better` or `higher-is-better`.
- **Suggested Viz** — chart pattern hint referencing `CHART_REFERENCE.md`, NOT a Vega-Lite spec (e.g., "bar/comparison", "line/trend", "scatter/quadrant").

**Flow:** Hypothesis → KPIs → Queries → Charts. KPIs give reports direction without prescribing exact visualisations. Findings in reports **SHOULD** be KPI-driven: "only include finding if data supports a KPI deviation."

**Cross-cutting angle (generic):** When mapping KPIs, ask whether any finding would be more interesting broken by a secondary dimension — for example, drilling the primary metric by a brand, tier, category, or another attribute that might reveal heterogeneity within the headline number. Back-to-back multi-series bars across a secondary cut are often sufficient to expose this. The downstream `hypothesis_to_notebook` layer can render richer visualizations (bubble/risk matrix, heatmap scorecard, linked cross-filter views) when queries return multi-metric or cross-dimensional result shapes — so design at least one query with that potential in mind where the data naturally supports it.

## 5. queries.sql Patterns

### 5.1 File Organization
A skill's `queries.sql` is the single source of truth for every database query the agent may execute. The file **MUST** follow this layout:

1. **File-level header block** — a `==` banner listing the skill name, target schema version, relevant hypothesis codes, key action codes/table references, and a brief explanation of the skill's core metric calculation (e.g., dwell time via `LEAD()`).
2. **Query blocks** — each separated by a blank line, following the structure in 5.2.

### 5.1.1 Schema Parameterization
All table references in queries.sql **MUST** use `$SCHEMA.table_name` instead of hardcoding the schema name. The agent reads the schema name from `.env.schema` (`SUPABASE_SCHEMA=<name>`) and substitutes `$SCHEMA.` before executing any query.

**Example:**
```sql
-- WRONG: hardcoded schema
SELECT * FROM sc_full.chg_current WHERE ...

-- CORRECT: parameterized schema
SELECT * FROM $SCHEMA.chg_current WHERE ...
```

This ensures skills are portable across engagements without find-and-replace. The file-level header block **SHOULD** note: `-- SCHEMA: $SCHEMA (resolved from .env.schema at runtime)`.

Reference: any existing skill's `queries.sql` for a file header example.

### 5.2 Query Block Structure
Every query **MUST** include, in order:

```sql
-- ----------------------------------------------------------------------------
-- QUERY: <identifier>
-- PURPOSE: <one-line business question this answers>
-- PARAMETERS: $1 = <meaning>, $2 = <meaning>[, $3 = <meaning> (optional, default X)]
-- [NOTE: <schema caveats, derived categories, edge cases>]
-- ----------------------------------------------------------------------------
-- @name: <identifier>
SELECT ...
```

| Element | Level | Detail |
|---------|-------|--------|
| `-- QUERY:` line | **MUST** | Matches the `@name` value exactly |
| `-- PURPOSE:` line | **MUST** | Describes the business question answered |
| `-- PARAMETERS:` line | **MUST** | Lists every `$N` placeholder with type/meaning; notes defaults |
| `-- NOTE:` line(s) | **SHOULD** | Explains schema assumptions or edge cases |
| `-- @name: <id>` tag | **MUST** | Immediately precedes the `SELECT`; agent references queries by this name |

### 5.3 Parameterization Rules
- **MUST** use positional placeholders (`$1`, `$2`, `$3`) — never string interpolation.
- Date-range filters **MUST** appear as `$1 = start_date, $2 = end_date` by convention.
- Optional parameters **SHOULD** use `COALESCE($N, <default>)` (e.g., `COALESCE($3, 20)` for a limit) or `$N IS NULL OR col = $N` guards for optional entity filters.
- **AVOID** hard-coding dates, dealer IDs, or any runtime-configurable value.

### 5.4 CTE Usage
CTEs (`WITH ... AS (...)`) **SHOULD** isolate intermediate calculations from the final aggregation.

**Pattern — multi-metric union:** Wrap the core calculation (e.g., per-ticket dwell time) in a single CTE, then `UNION ALL` multiple `SELECT` statements that each filter a different dimension (action code, entity type, etc.) to compute parallel metrics. The expensive calculation runs once in the CTE; final selects stay short and uniform.

**Pattern — multi-stage cycle:** Use two or more named CTEs to measure sequential stages of a process. Stage 1 pairs the initiating event to its response; Stage 2 measures the next transition. The final `UNION ALL` presents both stages side-by-side for comparison.

### 5.5 Dwell-Time Calculation Pattern
The canonical pattern for measuring time spent in a state:

```sql
SELECT
    ticket_id, action_code,
    EXTRACT(EPOCH FROM (
        LEAD(action_timestamp) OVER (PARTITION BY ticket_id ORDER BY action_timestamp)
        - action_timestamp
    )) / 3600 AS dwell_hours
FROM ticket_actions
WHERE action_timestamp BETWEEN $1 AND $2
```

- **MUST** partition by `ticket_id` and order by `action_timestamp`.
- **MUST** filter out `NULL` and `<= 0` dwell values in the outer query.
- **SHOULD** convert to hours (`/ 3600`) at the subquery level so downstream calculations share the same unit.
- **SHOULD** reuse the same subquery pattern across all queries in a file for consistency and maintainability.

### 5.6 Severity & Threshold Mapping in SQL
When thresholds are stable, encode them directly via `CASE` expressions collocated with the aggregation.

**Pattern:**
```sql
CASE
    WHEN category = 'A' AND AVG(metric) > <critical_threshold> THEN 'CRITICAL'
    WHEN category = 'B' AND AVG(metric) > <high_threshold>     THEN 'HIGH'
    WHEN category = 'C' AND AVG(metric) > <moderate_threshold>  THEN 'MODERATE'
    ELSE 'NORMAL'
END AS severity
```

- **MUST** align severity labels with the threshold tables in SKILL.md.
- **SHOULD** handle the `ELSE` case explicitly (`'NORMAL'` or `'ACCEPTABLE'`, never `NULL`).

### 5.7 Entity Comparison & Trend Queries

**Entity comparisons SHOULD:**
- Include a fleet/global benchmark CTE so each row shows its own value plus the delta from the overall average.
- Include ticket counts so users can judge statistical significance.
- Filter low-volume entities with `HAVING COUNT(*) >= <min>` when ranking (e.g., `HAVING COUNT(*) >= 10`).
- `ORDER BY` the primary metric `DESC` with `NULLS LAST`.

**Trend queries SHOULD:**
- Accept an interval parameter (`$3 = 'week'/'month'`) and use `DATE_TRUNC($3, ...)` for flexible granularity.
- `ORDER BY` the truncated period ascending for chronological chart rendering.
- Include per-period occurrence counts alongside averages to surface volume shifts.

**Cross-dimensional queries SHOULD** (when a secondary cut adds analytical value):
- Return a `metric_matrix` result: primary dimension × secondary dimension with at least two metrics per cell (e.g., volume + rate). This shape is the prerequisite for bubble charts, heatmaps, and linked cross-filter views in the notebook layer.
- Keep the secondary grouping generic (`GROUP BY primary_dim, secondary_dim`) — let the skill author choose the right second dimension for their hypothesis rather than hard-coding it.

### 5.8 Aggregation & Rounding
- Calculated metrics **MUST** use `ROUND(...)` — typically `ROUND(value::numeric, 1)` for hours/days, `ROUND(value::numeric, 2)` for percentages.
- Percentages **MUST** use `NULLIF(denominator, 0)` guards to avoid division-by-zero.
- **SHOULD** prefer `FILTER (WHERE ...)` clauses for conditional aggregates over `CASE` inside `COUNT/SUM` when possible.
- **Derived metrics (percentages, rates, ratios, margins, utilisation, yields, conversion rates) MUST NEVER be aggregated directly.** Averaging pre-computed ratios weights each row equally regardless of denominator size, producing mathematically incorrect results. Instead: aggregate the numerator and denominator columns separately, then recompute the ratio. Example: `SUM(chg_hrs) / NULLIF(SUM(available_hrs), 0)` not `AVG(chg_pct)`. See `INC-001` in `.claude/incidents/` for full details. When unsure whether a column is derived, flag it at the Phase 2 checkpoint and confirm with the user before aggregating.

### 5.9 Requirements vs Recommendations

| # | Rule | Level | Rationale |
|---|------|-------|-----------|
| Q1 | Every query has a `-- @name:` tag | **MUST** | Agent references queries by name; unnamed queries are invisible |
| Q2 | Parameters documented with `-- PARAMETERS:` | **MUST** | Undocumented params cause runtime substitution errors |
| Q3 | Date range uses `$1`/`$2` convention | **MUST** | Consistency lets the SOP intake map directly to query params |
| Q4 | File header lists target schema and key codes | **MUST** | Prevents silent breakage on schema changes |
| Q5 | Dwell/duration calculations finish in SQL | **MUST** | Returning raw timestamps wastes agent tokens and risks errors |
| Q6 | Use CTEs for multi-step logic | **SHOULD** | Improves readability; simple queries may inline |
| Q7 | Round numeric outputs | **SHOULD** | Matches artifact reporting precision |
| Q8 | Severity flags in SQL when thresholds are stable | **SHOULD** | Keeps flags near data; use agent-side for user-adjustable thresholds |
| Q9 | Optional params use COALESCE or IS NULL guards | **SHOULD** | Prevents multiple near-identical query variants |
| Q10 | Include `NOTE:` lines for schema quirks | **SHOULD** | Saves the agent from rediscovering edge cases |

### 5.10 Anti-Patterns

| # | Anti-Pattern | Why It's Harmful |
|---|-------------|-----------------|
| A1 | **Non-parameterized filters** — hard-coding dates or entity IDs | Breaks reusability; forces file edits instead of substitution |
| A2 | **DML statements** (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`) | Skills are read-only per CLAUDE.md; violates trust model |
| A3 | **Missing `@name` tags** | Agent cannot reference unnamed queries during Phase 2 selection |
| A4 | **Unbounded scans** — omitting date guards on large tables | Full-table scans cause timeouts and excessive compute |
| A5 | **Returning raw unaggregated rows** for analytical queries | Floods agent context and pushes calculation to the LLM |
| A6 | **Embedding SQL inside SKILL.md** | Duplicates source of truth; causes drift |
| A7 | **Ambiguous column aliases** (`val`, `cnt`, `x`) | Uninterpretable results for reviewers and the agent |
| A8 | **Mixing DDL with SELECT** in the same file | Confuses the read-only contract |

## 6. references/ Folder Conventions
- Files **SHOULD** be named after the concept they cover (e.g., `<domain>-patterns.md`).
- Each doc **MUST** include sections for overview, expected values, causes, and recommended actions so Phase 1 can cite them verbatim.
- Reference docs **SHOULD** capture hypothesis linkage (e.g., "Validates Hypothesis #5").
- **AVOID** referencing transient metrics; keep references evergreen and note where dynamic values should be refreshed during analysis.

## 7. SOP Integration

**For scripted analysis skills**: The standard Phase 0-7 workflow is defined in `.claude/skills/_templates/ANALYSIS_WORKFLOW.md`. SKILL.md must reference that file and document only phase-specific customizations (intro text, reference list, query list, analysis questions, chart requirements).

**For discovery skills** (like go_hunt): May define custom phase structures inline when the workflow differs significantly from the standard SOP.

**For authors creating new skills**: Read `ANALYSIS_WORKFLOW.md` to understand the full Phase 0-7 lifecycle. Your SKILL.md should contain a prerequisite callout pointing to `ANALYSIS_WORKFLOW.md` and a "SOP Phase Customizations" section documenting only your deviations.

Skills **MUST** use structured, conversational interaction at every checkpoint. All checkpoint questions **MUST** use the `AskUserQuestion` tool to present selectable options — do not end messages with plain-text questions. See `ANALYSIS_WORKFLOW.md` for the full checkpoint definitions at each phase.

### SOP Anti-Patterns
1. **Skipping to querying (Phase 2/3) without Intake or References** — breaks the reviewable audit trail.
2. **Running unapproved queries** — violates the Phase 2 checkpoint contract.
3. **Publishing artifacts without Phase 6 review** — outcomes must be user-approved before landing in `reports/<skill>/`.
4. **Leaving follow-ups as prose** — every actionable recommendation must appear in the structured follow-up table.

## 8. Summary of Anti-Patterns to Avoid
1. **Skipping SOP checkpoints** – every phase transition requires confirmation to stay audit-friendly.
2. **Embedding SQL or reports outside their designated locations** – keep SKILL.md narrative, queries.sql SQL, templates for structure, reports/ for generated content.
3. **Storing generated reports in templates/** – templates/ holds structure definitions only; all generated content goes to `reports/<skill>/`.
4. **Publishing charts without thresholds/severity context** – visualizations must reflect the threshold tables defined in SKILL.md.
5. **Ignoring Linear handoff** – follow-ups need owners and optional issues; don't leave action items implied.
6. **Duplicating ANALYSIS_WORKFLOW.md content in SKILL.md** – Scripted skills should reference the shared workflow and document only their customizations. Duplicating Phase 0-7 procedural content creates maintenance burden and inconsistency risk.

Adhering to this guide ensures all new skills inherit the reliability, clarity, and governance standards established by the analytical skill framework.
