# Report Standards

What skill output should look like: report structure, finding quality, chart standards, and Linear integration.

This file is consumed during Phase 5 (Report Generation) of `ANALYSIS_WORKFLOW.md`. For skill authoring structure, see `SKILL_STRUCTURE.md`.

---

## 1. Templates & Report Naming

### templates/ Folder
- **MUST** live at `.claude/skills/<skill>/templates/`.
- **MUST** contain `report-template.md` defining the outcome document structure.
- **SHOULD** contain `erd-template.mmd` for entity relationship diagrams where relevant.
- **AVOID** storing generated reports here — templates only.

### 1.1 Template Flexibility Rules
- Report templates in `templates/report-template.md` **MUST NOT** include complete Vega-Lite JSON specs with hardcoded data values. Instead, use `<!-- TEMPLATE -->` guidance comments that describe the chart type, KPI, data source, and a reference to `CHART_REFERENCE.md`.
- Templates **SHOULD** use placeholder sections wrapped in `<!-- TEMPLATE: ... -->` comments so the agent populates them from query results at runtime.
- Findings sections **MUST** be KPI-driven — include one finding per KPI cluster with a notable result: deviation, confirmation, or inconclusive with reason. Do not prescribe a fixed number of findings or only report deviations. Null findings (KPI within threshold) are required — they narrow the problem space.
- Template tables **SHOULD** indicate flexible row counts (e.g., "one row per entity, sorted by metric") rather than hardcoding a specific number of rows.
- Templates **SHOULD** include guidance for supplementary analysis — a section placeholder for cross-cut findings (entity breakdown, temporal trend, interaction effects) that gets populated when Phase 3.5 produces additional data. Not every report will have supplementary findings, but the template should accommodate them.
- Templates **MUST** include a Mermaid process flow placeholder when the skill's domain involves a sequential process or lifecycle. Process flows make the "where does time go?" or "where do things break?" question visually answerable.

### 1.2 Required Report Sections
Every report template **MUST** include the following structural elements:

**Approval field** (immediately after title and date):
- `**Approved:** No` — updated to `Yes` when the user approves (Phase 6 for outcomes, Phase 2 for plans).

**Intent & Scope block** (top of every report, after the approval field):
- **User asked:** the user's original question or request, verbatim.
- **Confirmed scope:** date range, filters applied, focus area.
- **Prior runs referenced:** link to previous report if any, or "None".
- **Dataset:** ticket count, action count.

This block makes reports self-documenting: a reader (or future skill run) can see what was asked, what was tested, and what the data showed — including what it *didn't* show.

**Hypothesis Assessment section** (after Key Metrics, before Findings):
- A table mapping every KPI in the skill's mapping table to an assessment status.
- Columns: KPI ID, KPI Name, Value, Target, Status (CRITICAL / HIGH / OK), N (sample size), Assessment (Supported / Not Supported / Partially Supported / Inconclusive).
- This section ensures every KPI is accounted for — not just the ones that found problems.

**Evidence strength in Findings:**
- Every finding **MUST** include sample size (N = x tickets/dealers/actions).
- **SHOULD** note when N < 30 as a data sufficiency warning.
- Each finding reports a notable result: a deviation, a confirmation that values are within range, or an inconclusive result with reason.

**Finding Anatomy (required structure within each finding):**

Every finding section in the report **MUST** follow this internal structure. This is the single most important quality driver — a finding without this structure is a restated metric, not analysis.

1. **Title with severity tag** — e.g., `### Finding 3: Parts Wait Exceeds Threshold by 2.3x (HIGH)`
2. **Opening line** — plain-language headline: what the number is, what it means, how it compares.
3. **Comparison table** — the metric alongside threshold, peer groups, or time periods. Use multipliers (e.g., "3.7x the fleet average") to make magnitude tangible. The table adds analytical surface area that the Key Metrics table doesn't have.
4. **Key insight** (bold) — one sentence explaining the *mechanism* or *structural cause*, not just restating the number. "Why is this happening?" not "what is the number?"
5. **Evidence line** — `**Evidence:** N = X [units]. Sample is [robust/adequate/thin].`
6. **Context or nuance** (when needed) — selection bias caveats, confounding variables, small-N warnings, or why a seemingly bad number might be benign.

**Minimum finding depth:** 100-300 words per finding. A finding that only restates a number from the Key Metrics table has zero marginal value. Findings exist to add comparison, mechanism, or nuance.

**Null findings (confirmations):** When a KPI is within threshold, write a short finding (50-100 words) confirming health and explaining why this is useful to know. Title it: `### Finding N: [Metric] Is Within Threshold (OK)`. Null findings narrow the problem space for future investigation.

**Executive Summary quality:**

The 3 bullets are the most-read section. They **MUST** form a causal chain, not a list of independent facts:

1. **Root cause** — name the dominant driver and its disproportionate impact
2. **Mechanism** — explain how the root cause creates damage (compounding, routing failure, etc.)
3. **Concentration** — quantify the Pareto effect (small % of entities -> large % of cost)

Bad: three independent statistics. Good: root cause -> mechanism -> concentrated impact.

**Recommendation traceability:**

Each recommendation **MUST** reference the finding and KPI it addresses in parentheses: e.g., "(Addresses Finding 3, H2-K1)". This prevents vague recommendations disconnected from evidence.

**Limitations appendix** (in Appendix, after Data Quality Notes):
- **MUST** include a "Limitations" section listing known data limitations, confounding variables, and what the analysis cannot determine.
- **SHOULD** include what evidence would change the conclusions (disproof criteria).
- This helps future analysts understand the boundaries of the findings.

### 1.3 Table Clarity Guidelines
- **Right-align** numeric columns using Markdown alignment syntax (`---:` or `------:`).
- **Include units** in column headers (e.g., "Avg Hours", "Resolution (days)", "Reopen %") rather than in cell values.
- **Sort meaningfully** — by the primary metric descending, or by a logical grouping (e.g., tier-based, best -> worst).
- **Cap rows** at ~20 in template examples; add a `| ... | ... |` continuation row to signal the table is extensible.
- **Include a status column** when the skill defines thresholds (OK / HIGH / CRITICAL) so readers can scan flags at a glance.

### 1.4 Source Traceability
Every table and chart in a report **MUST** include an inline source comment linking to the `@name` query and its file:

```markdown
### [Table or Chart Title]
<!-- Source: queries.sql#<query_name> -> <KPI_ID> -->
```

Every report template **MUST** include a **Sources** section at the bottom:

```markdown
## Sources

| # | Table / Chart | Query (`@name`) | File | KPI |
|---|--------------|-----------------|------|-----|
| 1 | Key Metrics | `<primary_summary>` | `.claude/skills/<skill>/queries.sql` | H<n>-K1, H<n>-K2 |
| 2 | [Chart Name] | `<breakdown_query>` | (same) | H<n>-K2 |
```

### reports/ Folder
- Generated reports **MUST** be saved to `reports/<skill>/`.
- **Naming Standard**:
  - Plans: `plan-<skill>-YYYY-MM-DD.md`
  - Outcomes: `outcome-<skill>-YYYY-MM-DD.md`
  - Discovery: `discovery-go-hunt-YYYY-MM-DD.md`
- **AVOID** storing non-Markdown binaries; chart specs and diagrams stay text-based for diffability.

---

## 2. Vega-Lite Chart Standards

### 2.1 Schema & Format
- **MUST** use Vega-Lite **v5** JSON.
- **MUST** include `"$schema": "https://vega.github.io/schema/vega-lite/v5.json"` — renderers (GitHub, VS Code, Obsidian) rely on it.
- **MUST** wrap specs in ```` ```vega-lite ```` fenced code blocks.
- **SHOULD** set explicit `width` and `height` for consistent rendering across viewers.

### 2.2 Data Sourcing
- **MUST** populate the `"values"` array from actual query results — never leave template placeholder values (`0`, `"Sample"`) in final artifacts.
- Templates in `templates/` **MUST NOT** include complete Vega-Lite JSON specs. Instead, use `<!-- TEMPLATE -->` guidance comments that reference `CHART_REFERENCE.md` for the correct chart pattern and specify the KPI and `@name` query as the data source.
- **SHOULD** keep data inline via `"data": {"values": [...]}` rather than external URLs for portability.
- See `.claude/skills/_templates/CHART_REFERENCE.md` for valid Vega-Lite v5 examples for every chart type skills might use.

### 2.3 Layering & Threshold Overlays
Use `"layer"` arrays when a chart needs both data marks and reference lines:

- **Primary layer:** The data visualization (`bar`, `line`, `arc`, etc.).
- **Threshold layer:** A `rule` mark with `strokeDash` to show SLA or severity boundaries.

This pattern is required whenever the skill's SKILL.md defines thresholds — the chart **MUST** visually communicate where values stand relative to those thresholds.

### 2.4 Chart Types by Use Case

| Use Case | Chart Type | Key Encoding Notes |
|----------|-----------|-------------------|
| Metric comparison across categories | Bar | `nominal` x-axis, threshold `rule` overlay |
| Proportion breakdown | Arc (donut/pie) | `theta` encoding, `innerRadius` for donut, tooltip with format |
| Trend over time | Line with points | `ordinal` or `temporal` x-axis, threshold `datum` rule |
| Entity comparison (dealers, regions) | Grouped bar | `xOffset` for sub-grouping, `color` for metric type |

Skill `templates/report-template.md` **SHOULD** include at least one example of each chart type the skill uses.

### 2.5 Worked Example — Bar Chart with Threshold Overlay

```vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Average Metric by Category",
  "width": 420,
  "height": 260,
  "data": {
    "values": [
      {"category": "Category A", "value": 132, "threshold": 100},
      {"category": "Category B", "value": 78, "threshold": 50},
      {"category": "Category C", "value": 41, "threshold": 24},
      {"category": "Category D", "value": 5, "threshold": 12}
    ]
  },
  "layer": [
    {
      "mark": "bar",
      "encoding": {
        "x": {"field": "category", "type": "nominal", "axis": {"labelAngle": -20}},
        "y": {"field": "value", "type": "quantitative", "title": "Avg Value (units)"},
        "color": {"value": "#4C78A8"}
      }
    },
    {
      "mark": {"type": "rule", "strokeDash": [4, 4], "color": "#D14343"},
      "encoding": {
        "y": {"field": "threshold", "type": "quantitative"}
      }
    }
  ]
}
```

**What this demonstrates:** The bar layer shows actual values; the dashed red `rule` layer overlays the per-category threshold. Readers instantly see which categories breach their threshold.

### 2.6 Anti-Patterns (Visualization)
1. **Placeholder data in final artifacts** — template values like `"value": 0` or `"category": "A"` must be replaced with real query output before Phase 6 review.
2. **Omitting `$schema`** — without it, renderers cannot detect the spec version and may fail silently.
3. **Missing threshold overlays** — if SKILL.md defines thresholds, charts without them disconnect the visual from the analysis.
4. **Mixing unrelated chart types in one spec** — use separate specs; layering is for overlays (data + reference lines), not combining bar + pie.
5. **External data URLs** — charts should be self-contained with inline `values` for portability across environments.

---

## 3. Linear Integration Pattern

### 3.1 Follow-up Action Table
Every skill that produces recommendations **MUST** capture them in a structured table during Phase 7:

| Action | Owner | Priority | Team | Notes |
|--------|-------|----------|------|-------|
| [Specific action derived from findings] | [Role/team] | High | [Team] | Link to `reports/<skill>/outcome-...md` |

- **MUST** include all five columns; use "TBD" for unassigned owners rather than leaving blank.
- **SHOULD** order by Priority (Urgent -> High -> Medium -> Low).
- **MUST** include a traceability link to the outcome artifact in the Notes column.

### 3.2 Issue Template Structure
When pushing to Linear via `mcp__claude_ai_Linear__create_issue`, every issue **MUST** follow this structure:

```
Title: [CATEGORY] <brief action description>

## Context
Outcome: reports/<skill>/outcome-<skill>-<YYYY-MM-DD>.md
Analysis Date: <YYYY-MM-DD>

## Problem
<Specific metric or finding that triggered this action — include numbers>

## Task
- [ ] Step 1
- [ ] Step 2

## Acceptance Criteria
- [ ] <Measurable criterion, e.g., "[metric] reduced to < [target]">
- [ ] <Second criterion if applicable>

## Impact
<What happens if this is not addressed — quantify where possible>
```

### 3.3 Mandatory Metadata

| Field | Requirement | Example |
|-------|-------------|---------|
| Title prefix | **MUST** use `[CATEGORY]` tag matching the skill domain | `[SKILL-DOMAIN]` |
| Context link | **MUST** include path to the outcome artifact | `reports/<skill>/outcome-<skill>-YYYY-MM-DD.md` |
| Analysis date | **MUST** match the artifact date | `YYYY-MM-DD` |
| Acceptance criteria | **MUST** have at least one measurable criterion | Not "improve performance" but "reduce [metric] to < [target]" |
| Team + assignee | **SHOULD** be confirmed with user during Phase 7 | Confirmed before `create_issue` call |
| Labels | **SHOULD** include skill name and priority | `<skill-name>`, `high-priority` |

### 3.4 Anti-Patterns (Linear Integration)
1. **Pushing issues without user approval** — Phase 7 checkpoint requires explicit confirmation before any `create_issue` call.
2. **Missing context link** — an issue without traceability to its source analysis is unactionable for the recipient.
3. **Vague acceptance criteria** — "fix the problem" is not a criterion; use specific metrics and targets derived from the analysis.
4. **No impact statement** — stakeholders need to understand the cost of inaction to prioritize effectively.
5. **Orphaned follow-ups** — every row in the action table should either become a Linear issue or be explicitly deferred with a reason.
