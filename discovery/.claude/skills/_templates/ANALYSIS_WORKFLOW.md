# Analysis Workflow: Interactive Skill Phases

**Version:** 1.3
**Last Updated:** 2026-02-25
**Applies to:** All scripted hypothesis skills

This workflow defines the standard Phase 0-7 lifecycle that all scripted analysis skills follow. Domain-specific metrics, thresholds, and queries are defined in each skill's SKILL.md. For skill authoring standards, see `SKILL_STRUCTURE.md`. For report output standards, see `REPORT_STANDARDS.md`.

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 0: Intake & Scope](#phase-0-intake--scope)
3. [Phase 1: References](#phase-1-references)
4. [Phase 2: Query Selection](#phase-2-query-selection)
5. [Phase 3: Supabase MCP Execution](#phase-3-supabase-mcp-execution)
6. [Phase 3.5: Supplementary Queries](#phase-35-supplementary-queries)
7. [Phase 4: Analysis](#phase-4-analysis)
8. [Phase 5: Artifacts](#phase-5-artifacts)
9. [Phase 6: Review & Decision](#phase-6-review--decision)
10. [Phase 7: Follow-ups (Linear Integration)](#phase-7-follow-ups-linear-integration)
11. [Appendix](#appendix)

---

## Overview

### Skill Chain Context

This workflow is part of a deliberate skill chain:

```
Basecamp ("where are we?") → Go Hunt ("what's interesting?") → Hypothesis Skills ("is this true?")
```

- **Basecamp** maps the data landscape, researches the industry, and produces a report with an ERD, data dictionary, trust scorecard, performance benchmarks, and candidate hypotheses.
- **Go Hunt** consumes Basecamp output, explores analytical gaps, and scaffolds new hypothesis skills.
- **Hypothesis skills** (which use THIS workflow) test specific hypotheses surfaced by Basecamp or Go Hunt.

When a Basecamp report exists, hypothesis skills inherit its context — benchmarks inform thresholds, the trust scorecard constrains which tables to rely on, and the hypothesis register connects each skill back to the analytical questions that motivated it. This workflow describes how hypothesis skills use that inheritance at each phase.

### Phases

All scripted analysis skills follow this 8-phase interactive workflow:

- **Phases 0-2**: Planning and scoping
- **Phases 3-3.5**: Data collection
- **Phases 4-5**: Analysis and artifact generation
- **Phases 6-7**: Review, approval, and follow-up actions

Each phase includes checkpoints where user approval is required before proceeding.

**Tool requirement:** At every checkpoint, use the `AskUserQuestion` tool to present options — do not end messages with plain-text questions. This ensures structured, selectable responses for the user.

---

## Phase 0: Intake & Scope

**CHECKPOINT - Ask before proceeding:**

Lead with a plain-language intro and define terms up front, then gather scope:

1. **Intro + terms:** [SKILL-SPECIFIC - defined in each SKILL.md]

2. **Basecamp check:** Look for a Basecamp report under `reports/basecamp/`. If one exists, load these sections as working context:
   - **§8 (Trust Scorecard)** — per-table grades (A-F) and landmine register. Use this to constrain your queries: avoid F-graded tables, caveat C-D tables in findings.
   - **§9 (Performance Benchmarks)** — industry benchmark × client actual × data field mapping. Use these as threshold context when assessing KPIs.
   - **§11 (Hypothesis Register)** — analyst hypotheses (HA-<n>) and candidate hypotheses (HC-<n>). Identify which hypotheses this skill addresses.
   - **§3-§4 (ERD + Data Dictionary)** — table relationships and column metadata. Use to inform query design and join patterns.
   Offer context: "I found a Basecamp report from [date] — it graded trust on [n] tables, benchmarked [n] KPIs against industry, and registered [n] hypotheses. I'll use its trust scorecard and benchmarks as context for this analysis." If no Basecamp exists, note it and proceed — the skill can still run using its own thresholds, but findings won't have industry benchmark context.

3. **Prior-run check:** Look for recent reports in `reports/<skill_name>/`. If found, read their Intent & Scope and Hypothesis Assessment sections. Offer context: "Last time you asked about [intent] on [date] and found [key findings] — should I build on that or start fresh?" If no prior runs exist, note "None — starting fresh" (this value is written to the report's **Prior runs referenced** field).

4. **Fast-path:** Parse the user's initial message for scope clues (date range, dealer names, specific focus). If scope is already clear, pre-fill and confirm: "It sounds like you want [scope] — should I proceed with that?" rather than asking all questions sequentially.

5. **Date range:** Offer options — full dataset (default), last 6 months, last 3 months, or custom.

6. **Filters:** Multi-select — dealer code(s), brand(s), region/platform, or none. [Include appropriate, skill-specific and intent-specific filters if any]

7. **Plan preference:** Create a plan doc first (recommended), or go straight to analysis. Plan docs also include `**Approved:** No` after the title — updated to `Yes` when the user approves the plan.

8. **Intent capture:** Record the user's original question verbatim. This gets written to the report's Intent & Scope header so future runs can reference it.

---

## Phase 1: References

Read background documentation from the skill's `references/` folder.

[SKILL-SPECIFIC - reference file list defined in each SKILL.md]

**Basecamp artifacts (when available):** If a Basecamp report was loaded in Phase 0, its data dictionary (§4) and performance benchmarks (§9) serve as additional reference material alongside the skill's own references. The data dictionary provides column-level context (types, cardinality, sample values) that informs query design. The benchmarks provide "what good looks like" framing for interpreting results.

---

## Phase 2: Query Selection

Select from `queries.sql` based on the confirmed scope.

[SKILL-SPECIFIC - query list defined in each SKILL.md]

**CHECKPOINT:** Present the query list with purpose summaries. Offer explicit options: **approve** / **modify** / **cancel**.

**If user chooses "modify"**, present 4 sub-options:

1. **Drop** a query — remove it from the plan (explain what analysis it skips).
2. **Add from queries.sql** — include a named query not auto-selected.
3. **Propose ad-hoc** — Claude writes a new query for a specific question. Ad-hoc queries follow the same SQL conventions and get logged with an `(ad-hoc)` label.
4. **Change parameters** — adjust date range, filters, or optional params on a selected query.

---

## Phase 3: Supabase MCP Execution

**How to use Supabase MCP:**

```javascript
// Run read-only queries
mcp__supabase__execute_sql({
  query: "SELECT ... FROM tickets ..."
})

// Discover schema
mcp__supabase__list_tables({
  schemas: ["public"]
})
```

**Read-only access only.** Never run INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or any other data/schema-modifying statements. Use CTEs and subqueries for intermediate calculations.

**Sanity checks after each query:**
- Row counts match expected range
- Date range is correct
- No NULL surprises in aggregates

---

## Phase 3.5: Supplementary Queries

After results are in, check for surprises: if any metric is **>2x expected**, **anomalous** (e.g., a wait state with near-zero dwell when others are high), or reveals an edge case not covered by pre-written queries — flag the surprise and propose 1–3 targeted follow-up queries.

**Standard cross-cuts to consider:** Even when results are unsurprising, the following supplementary breakdowns often reveal hidden variance and should be proposed when the primary queries don't already cover them:

1. **Entity-type breakdown** — segment the primary metric by the entity dimension most relevant to the skill (e.g., dealer tier, ticket type, region). A fleet average can mask a 10x+ entity-level gap.
2. **Brand/product breakdown** — segment by brand or product line. Some brands may drive disproportionate share of the problem.
3. **Temporal trend** — break the primary metric by month or week to detect degradation or improvement.
4. **Interaction effects** — when two KPIs are both breaching (e.g., high bounce rate AND high reopen rate), check if they compound on the same tickets or affect different populations.

**When to propose:** If primary results show any metric breaching a threshold, propose at least one cross-cut that would help isolate the root cause (entity, brand, or temporal). If all metrics are within range, supplementary queries are optional.

User approves or rejects each supplementary query before execution. If results are unsurprising and no thresholds are breached, proceed directly to Phase 4.

---

## Phase 4: Analysis

**KPI Assessment (required):** For each KPI defined in the skill's Hypothesis-KPI Mapping table, classify the result:

- **Supported** — exceeds threshold in predicted direction
- **Not Supported** — within threshold (state this explicitly — it means the system is healthier than hypothesised)
- **Partially Supported** — mixed evidence across dealer types or time periods
- **Inconclusive** — insufficient data or ambiguous results

**Counter-evidence:** If values are within threshold for a metric, report that explicitly — it means the system is healthier than hypothesised. Do not omit findings just because they don't show a problem. A finding that confirms health is valuable — it focuses attention on the real problems.

**Evidence strength:** Include ticket/action counts (N = ...) alongside every percentage or average. Flag when N < 30.

### Finding Anatomy

Each finding in the outcome report MUST follow this internal structure:

1. **Opening line** — the headline number and what it means in plain language. Include severity in the finding title: e.g., "Finding 3: Parts Wait Exceeds Threshold by 2.3x **(HIGH)**"
2. **Comparison table or inline numbers** — show the metric alongside the threshold, peer groups, or prior periods. Use multipliers (e.g., "3.7x the fleet average") to make magnitude tangible.
3. **Key insight** — one bold sentence that explains the *mechanism*, not just the number. Why is this happening? What structural or process factor drives it?
4. **Evidence line** — `**Evidence:** N = X [units]. Sample is [robust/adequate/thin].` This makes every finding auditable.
5. **Context or nuance** (when needed) — selection bias caveats, confounding variables, or why a seemingly bad number might be explained by something benign.

**Depth expectation:** Each finding should be 100–300 words. A finding that's just a restated metric from the Key Metrics table adds no value — findings must add analytical depth: comparison, mechanism, or nuance that the metrics table alone doesn't convey.

**Null findings:** When a KPI is within threshold, write a short finding (50–100 words) confirming health. Title it positively: "Finding N: [Metric] Is Within Threshold **(OK)**". These narrow the problem space and prevent future analysts from re-investigating resolved questions.

### Analysis Depth Checklist

Before moving to Phase 5, verify:
- [ ] Every KPI in the Hypothesis-KPI Mapping has an assessment (Supported / Not Supported / Partially / Inconclusive)
- [ ] Every finding with a breaching KPI includes a multiplier or comparison
- [ ] At least one supplementary cross-cut was run for any CRITICAL metric (entity, brand, or temporal)
- [ ] Any hypothesis that was NOT supported is explicitly stated, not omitted
- [ ] Selection bias or confounding variables are noted where they affect interpretation

**Calculate and compare:**
[SKILL-SPECIFIC metrics - defined in each SKILL.md]

**Key questions to answer:**
[SKILL-SPECIFIC questions - defined in each SKILL.md]
- Which KPIs are within normal ranges?
- Is the sample large enough for each claim?
- What would disprove this hypothesis?
- Are there interaction effects between breaching KPIs?

---

## Phase 5: Artifacts

**Generate outcome doc using template:** `templates/report-template.md`

**Approval field:** Set `**Approved:** No` immediately after the title and date. This field is updated to `Yes` when the user approves at Phase 6.

**Intent & Scope block (top of report):** Populate from Phase 0 data — **User asked** (verbatim), **Prior runs referenced** (link or "None — starting fresh"), **Confirmed scope**, **Dataset**.

### Executive Summary Quality

The 3 bullets are the most-read part of any report. They must form a **causal chain**, not a list of independent facts:

1. **Bullet 1: Root cause** — name the single biggest driver and quantify its disproportionate impact (e.g., "X accounts for Y% of [cost metric] from only Z% of [volume metric]")
2. **Bullet 2: Mechanism** — explain *how* the root cause creates damage (e.g., "Each [event] doubles [cost metric] and quadruples [failure metric]")
3. **Bullet 3: Concentration** — quantify the Pareto effect (e.g., "N% of [units] with [condition] consume M% of all [cost metric]")

Bad pattern (dashboard-style): three independent statistics with no narrative thread.
Good pattern (story-style): root cause → mechanism → concentrated impact.

### Required Sections

- Executive Summary (3 bullets, causal chain)
- Key Metrics table with status flags (every row must have a threshold and status — no filler rows without thresholds)
- Hypothesis Assessment table (every KPI from the mapping, including Not Supported)
- Findings (one per KPI cluster, following the Finding Anatomy from Phase 4)
- Vega-Lite charts: [SKILL-SPECIFIC chart list - defined in each SKILL.md]
- Process flow diagram (Mermaid) [if applicable]
- Recommendations by timeframe (Immediate / Short-term / Medium-term) — each recommendation must reference the finding and KPI it addresses
- Decisions required (checkbox format)
- Follow-ups table (Linear-ready)
- Appendix: Data Quality Notes, Limitations, Sources table

### Recommendation Quality

Each recommendation MUST:
- Reference the finding and KPI it addresses in parentheses: "(Addresses Finding 3, H2-K1)"
- Be specific enough to act on — name the trigger, threshold, or entity involved
- Be different for different root causes — if two metrics breach for different reasons, they need different fixes

### Ad-hoc and Supplementary Findings

Findings from Phase 3.5 supplementary or Phase 2 ad-hoc queries are full findings — they appear in the Findings section with the same structure as planned findings. Label them `(ad-hoc)` or `(supplementary)` in the Sources table so the provenance is clear.

### Basecamp Context in Reports

When a Basecamp report exists, weave its context into the outcome document:

- **Key Metrics table:** Where the skill's thresholds align with Basecamp's performance benchmarks (§9), note the industry benchmark alongside the threshold (e.g., "Industry: 5-8% | Threshold: < 15%").
- **Findings:** Reference Basecamp's trust scorecard (§8) when data quality affects a finding's strength. Reference industry benchmarks when comparing client actuals to "what good looks like."
- **Hypothesis Assessment:** Connect each KPI back to its parent hypothesis from Basecamp's register (§11) — e.g., "H2-K1 tests HC-3 from Basecamp (candidate hypothesis: passive waits dominate resolution time)."
- **Intent & Scope:** Note which Basecamp report was used: "Basecamp context: `reports/basecamp/basecamp-<project>-YYYY-MM-DD.md`"

**Save to:** `reports/<skill_name>/outcome-<skill_name>-<YYYY-MM-DD>.md`

---

## Phase 6: Review & Decision

**CHECKPOINT - Present findings with structured review:**

1. Present each finding one at a time with KPI context (which KPI, current value, threshold, status).
2. Present the Hypothesis Assessment table showing every KPI's status — including Not Supported and Inconclusive.
3. For each finding, offer: **accept** / **revise** / **remove**.
4. **If user chooses "revise"**, offer 3 sub-options:
   - **Reword** — text changes only, no new data needed.
   - **Dig deeper** — loops back to Phase 2 to plan supplementary queries for more data, then re-enters at Phase 3 → 4 → 5 → 6.
   - **Challenge** — user presents a counter-argument; Claude examines the evidence and responds.
5. Present recommendations with expected impact.
6. Final gate: **approve and publish** / **request changes**. "Request changes" can loop to Phase 2 (for more data) or Phase 5 (for report edits only).
7. On approval, update the outcome doc's `**Approved:** No` to `**Approved:** Yes`.

---

## Phase 7: Follow-ups (Linear Integration)

**CHECKPOINT - Offer structured Linear options:**

1. Present the follow-up action table (Action, Owner, Priority, Team, Notes).
2. Offer **edit** and **add** options on the table — user may reword actions, change priorities, or add follow-ups the analysis didn't surface.
3. Offer options: **push all to Linear** / **push selected** / **include in doc only** / **skip**.
4. If pushing to Linear, confirm: team name/ID, default assignee (or TBD), labels to apply.
5. **Query promotion:** If any ad-hoc or supplementary queries were run during this session, offer to add them to `queries.sql` as permanent named queries for future runs.

**Linear issue format:**

```
Title: [CATEGORY] <brief description>

## Context
From [skill] analysis: <link to outcome doc>
Analysis date: <date>

## Problem
<specific finding that triggered this action>

## Task
<what needs to be done>

## Acceptance Criteria
- [ ] <criterion>

## Impact
<expected improvement if resolved>
```

---

## Appendix

### Supabase MCP Usage

See Phase 3 for code examples and sanity check requirements.

**Best practices:**
- Always aggregate in SQL — avoid dumping raw rows into context
- Use parameterized queries for date filtering
- Report insights and business impact, not just averages
- Keep sanity checks visible for auditability

### Chart Standards

- Vega-Lite charts render in VS Code, GitHub, and most markdown viewers
- Keep Mermaid for process flows (better for flowcharts)
- Refer to `CHART_REFERENCE.md` for valid Vega-Lite v5 chart patterns
- Refer to `REPORT_STANDARDS.md` §2 for chart anti-patterns and worked examples

### Upstream & Downstream Skills

| Skill | Relationship | What It Provides / Consumes |
|-------|:------------:|----------------------------|
| **Basecamp** | Upstream | Provides: ERD, data dictionary, trust scorecard, benchmarks, hypothesis register. Load in Phase 0 when available. |
| **Go Hunt** | Upstream | Provides: discovery reports with ranked hypotheses and candidate KPIs. May have surfaced the hypothesis this skill tests. |
| **Other hypothesis skills** | Peer | May share hypotheses or cross-skill correlations. Check `reports/` for prior runs on related topics. |

When a hypothesis skill's findings suggest new hypotheses outside its scope, note them in the Follow-ups table (Phase 7) and recommend Go Hunt or a new skill to investigate.
