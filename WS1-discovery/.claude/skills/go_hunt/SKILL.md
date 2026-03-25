---
name: go_hunt
description: Explore the database for uncovered hypotheses, validate them with read-only queries, and scaffold new skills from discoveries.
---

# Go Hunt (Interactive SOP)

## Purpose
Go Hunt is a discovery skill that finds analytical gaps across existing skills. It reads the schema live from Supabase, cross-references known hypotheses against existing skill coverage, runs exploratory read-only queries, and produces either a new skill (conforming to `.claude/skills/_templates/SKILL_STRUCTURE.md`) or concrete recommendations to update an existing one.

Go Hunt does not produce final analytical reports — it produces **skills** that produce reports.

## When to Use
- When existing skills have been run and you want to find what they missed.
- When new hypotheses emerge and you need to assess whether the data can support them.
- When cross-skill patterns (e.g., do time-sink dealers overlap with high-reopen dealers?) need investigation.
- When the schema has changed and you want to identify new analytical opportunities.

## Trust Model
- **Read-only database access.** Go Hunt runs `SELECT` queries only — no DML, no DDL. The Supabase connection enforces this.
- **No query approval gate.** Because access is read-only, the worst outcome of a bad query is wasted compute, not data corruption. Go Hunt explores freely.
- **Governance at the output layer.** Before any discovery becomes a recommendation, and before any new skill gets scaffolded, the user reviews and approves.

## Reports Produced
- **Discovery report:** `reports/go_hunt/discovery-go-hunt-YYYY-MM-DD.md` — findings, ranked hypotheses, data quality notes.
- **New skill directory** (when approved): `.claude/skills/<new_skill>/` conforming to `.claude/skills/_templates/SKILL_STRUCTURE.md`.
- **Skill update proposal** (when applicable): concrete changes to an existing skill's queries.sql or SKILL.md.

## Inputs Required
- Supabase MCP access (project ID from Supabase configuration)
- Existing skills under `.claude/skills/`
- Hypothesis reference: Basecamp report (§11 Hypothesis Register) or user-supplied hypotheses
- User input: optional new hypotheses or focus areas
- **Recommended:** Basecamp report (`reports/basecamp/basecamp-<project>-YYYY-MM-DD.md`) — provides:
  - ERD (§3) and Data Dictionary (§4) — replaces schema discovery entirely
  - Data Profiles (§5) — column-level stats, distributions, performance spreads
  - Trust Scorecard (§8) — per-table grades and landmine register
  - Performance Benchmarks (§9) — industry benchmarks mapped to specific data fields
  - Analyst Hypotheses (§11) and Candidate Hypotheses (§11) — the working hypothesis list
  - Go Hunt Starter Pack (§12) — curated intake summary with recommended exploration order
  When available, Go Hunt skips schema re-discovery entirely and enters Phase 2 with full data context.

---

## SOP Phases

### Phase 0 — Intake
**Goal:** Establish exploration scope, capture any new hypotheses, and check what's already known.

Lead with a plain-language intro, then gather scope with structured steps:

1. **Intro:** "I can explore the database for patterns that existing skills don't cover — testing uncovered hypotheses, profiling unused columns, and looking for cross-skill correlations. This produces a discovery report with ranked findings and, if approved, scaffolds new skills."
2. **Basecamp check:** Look for a basecamp report under `reports/basecamp/`. If one exists, load these sections:
   - **§3 (ERD)** — relationship map and spine identification
   - **§4 (Data Dictionary)** — per-table, per-column metadata (types, NULL%, cardinality, sample values). This replaces `information_schema` queries.
   - **§8 (Trust Scorecard)** — per-table grades (A-F) and landmine register. Use this to set trust constraints: avoid F-graded tables, caveat C-D tables.
   - **§9 (Performance Benchmarks)** — industry benchmark × client actual × data field mapping. Use these as threshold references during exploration.
   - **§11 (Hypotheses)** — both analyst hypotheses (HA-<n>) and candidate hypotheses (HC-<n>). Add HC entries to the working hypothesis list.
   - **§12 (Go Hunt Starter Pack)** — curated summary with recommended exploration order.
   Offer context: "I found a basecamp report from [date] — it mapped [n] tables with a full data dictionary, graded trust on [n] tables, benchmarked [n] KPIs against industry, and proposed [n] candidate hypotheses. Should I use this as my starting point?" If no basecamp exists, note it and proceed — Go Hunt can still discover schema independently, but will need to run its own profiling queries.
3. **Prior-run awareness:** Read recent reports under `reports/` (all skill directories, not just `go_hunt/`). Pull their Intent & Scope blocks and key findings. Offer context: "I see you ran <skill_name> on [date] asking about [intent] and found [key findings]. Should I use those as a starting point, or explore independently?" If recent findings suggest promising directions, mention them.
3. **Hypothesis source:** Offer options — work from existing list only, add new hypotheses, or both.
4. **Scope:** Full exploration (all uncovered hypotheses) or focused area (e.g., electric vehicles, escalation loops, backlog).
5. **Table preferences:** Any tables or columns to prioritise or avoid.
6. **Intent capture:** Record the user's question or focus area. This gets written to the discovery report's Intent & Scope header so future runs can reference it.

**Outputs:** Confirmed scope — broad vs targeted, any user-supplied hypotheses added to working context, intent recorded.

**Checkpoint:** Do not proceed until scope is confirmed.

### Phase 1 — Inventory
**Goal:** Map what existing skills already cover so exploration focuses on gaps.

**Actions:**
- Read every skill's `SKILL.md` and `queries.sql` under `.claude/skills/`.
- Read Basecamp report (§11) for analyst hypotheses (HA-<n>) and candidate hypotheses (HC-<n>). If no Basecamp report exists, hypotheses come from user input during Phase 0 intake.
- Read any existing reports (under `reports/`) to understand what's already been found.
- **If a basecamp report exists:** Load the Data Dictionary (§4) to skip schema re-discovery entirely — column types, cardinality, and sample values are already documented. Load Trust Scorecard (§8) to exclude F-graded tables and caveat C-D tables. Load Performance Benchmarks (§9) for threshold context when assessing hypothesis feasibility. Add basecamp candidate hypotheses (HC-<n> from §11) to the working hypothesis list alongside the established ones. With basecamp artifacts loaded, Phase 2 exploration can start immediately on hypothesis testing rather than schema profiling.
- Produce a coverage matrix: hypothesis × skill → covered / partially covered / uncovered.

**Outputs:** Coverage matrix showing gaps. List of uncovered or partially covered hypotheses.

**Checkpoint:** Present the coverage matrix to the user. Confirm which gaps to explore.

### Phase 2 — Explore
**Goal:** Profile the schema, run exploratory queries, and look for patterns.

**Actions:**

**Schema discovery:**
- Pull the live schema from Supabase MCP (`mcp__claude_ai_Supabase__list_tables`).
- Identify tables and columns not referenced by any existing skill's `queries.sql`.
- Profile untouched columns: cardinality, NULL rates, value distributions.

**Hypothesis testing:**
- For each uncovered hypothesis, write and run exploratory `SELECT` queries.
- No query approval needed — read-only is the safety net.
- Log every query run and its key results for auditability.
- **Negative result logging:** When a hypothesis test returns no supporting evidence, log it explicitly as "H<n>: NOT SUPPORTED — [reason]". Do not silently skip hypotheses that don't pan out — they are findings too.

**Mid-exploration checkpoints:** After every 2–3 hypotheses tested, present a progress summary to the user:
- What's been tested so far and key results (including null findings).
- Options: **continue broadly** / **focus on [specific finding]** / **stop exploring**.
- This lets the user steer the exploration mid-flight rather than waiting for all ~30 queries to complete.

**Cross-skill correlation:**
- Look for overlaps between skill domains (e.g., do high-reopen dealers also have the worst wait times?).
- Run join queries across dimensions that individual skills don't combine.

**Data quality checks:**
- Assess whether data volume and completeness can support each hypothesis.
- Flag tables/columns with high NULL rates or suspicious distributions.

**Outputs:** Raw findings with supporting query results. Data quality assessment per hypothesis. Negative results logged alongside positive ones.

### Phase 3 — Synthesise
**Goal:** Rank discoveries by impact and feasibility, present findings to the user — including what was NOT found.

**Actions:**
- Group findings into themes (e.g., "vehicle type patterns", "escalation inefficiencies", "backlog dynamics").
- Rank each finding by:
  - **Business impact:** How much does this affect resolution time, cost, or customer experience?
  - **Data availability:** Is the data sufficient and clean enough to build a reliable skill?
  - **Novelty:** Does this add something existing skills don't cover?
  - **Evidence strength:** How large is the sample? How clean is the data? Include N (rows/tickets/dealers) for each finding.
- For each finding, note whether it warrants a new skill, an update to an existing skill, or is just an observation.
- **Include disconfirmed hypotheses** in the discovery report — they are findings too. A hypothesis tested and not supported is valuable because it narrows the search space.
- **Assess every tested hypothesis:** For each, state one of: Supported / Not Supported / Partially Supported / Inconclusive / Not Testable (data unavailable).
- **Define candidate KPIs** for each finding that warrants a new skill or update. Use the KPI table structure from `SKILL_STRUCTURE.md` Section 4.5 (KPI ID, Name, Metric, Target, Suggested Viz). These become the seed KPIs for any scaffolded skill.

**Outputs:** Discovery report with ranked findings (including negative results), hypothesis assessments, candidate KPIs, supporting data, and recommendations.

**Save to:** `reports/go_hunt/discovery-go-hunt-YYYY-MM-DD.md`

### Phase 4 — Governance Gate
**Goal:** User decides what to act on.

**Checkpoint — Present findings with structured triage:**

1. Summary of top findings with supporting numbers and evidence strength.
2. For each actionable finding, present structured options:
   - **New skill** — scaffold a new skill directory
   - **Update existing** — propose changes to an existing skill
   - **Note only** — record in discovery report, no action
   - **Investigate further** — loops back to Phase 2 for 2–3 more targeted queries on this specific finding before committing to a decision. Use this when evidence is promising but thin.
   - **Skip** — exclude from report
3. Recommended priority order.
4. Final gate: **proceed to scaffolding** / **stop here (discovery complete)**.

**MUST NOT proceed to Phase 5 without explicit user approval.**

### Phase 5 — Scaffold
**Goal:** Produce a new skill (or skill update) conforming to `.claude/skills/_templates/SKILL_STRUCTURE.md`.

**For a new skill, generate:**
```
.claude/skills/<new_skill>/
  SKILL.md          — tailored to the discovery, per SKILL_STRUCTURE Section 4
  queries.sql       — parameterized, @named, following Section 5 conventions
  references/       — populated with context discovered during exploration
  templates/
    README.md       — naming conventions
    report-template.md — outcome document template
    erd-template.mmd   — if relevant
```

- Update `.claude/skills/hypotheses/README.md` to add the new skill to the directory tree.

**Requirements:**
- SKILL.md **MUST** follow the structure defined in SKILL_STRUCTURE Section 4.
- SKILL.md **MUST** include a Hypothesis-KPI Mapping table (Section 4.5) seeded from the candidate KPIs defined in Phase 3.
- queries.sql **MUST** follow the conventions in SKILL_STRUCTURE Section 5.
- queries.sql **MUST** use `$SCHEMA.table_name` for all table references (see SKILL_STRUCTURE Section 5.1.1). Read the schema name from `.env.schema` — never hardcode it.
- All queries **MUST** be read-only (`SELECT` / CTE only).
- Thresholds **MUST** be derived from the exploratory data, not guessed.
- The new skill **MUST** reference which hypothesis/hypotheses it addresses.
- Report templates **MUST NOT** include hardcoded Vega-Lite specs — use `<!-- TEMPLATE -->` guidance comments referencing `CHART_REFERENCE.md`.

**Validation gate:** After writing `queries.sql`, run `EXPLAIN` on each `-- @name:` query via MCP. If any query fails, inspect the actual table columns (`information_schema.columns`), fix the SQL, and re-validate before presenting the skill for review. Log pass/fail results in the discovery report under a "Query Validation" section.

**Note on two-file pattern:** Scripted analysis skills use SKILL.md (domain-specific content) + ANALYSIS_WORKFLOW.md (shared Phase 0-7 workflow). SKILL.md includes a reference to ANALYSIS_WORKFLOW.md at the top and a "SOP Phase Customizations" section. See SKILL_STRUCTURE Section 4 for full details and examples.

**For an existing skill update, produce:**
- A diff description: what changes to queries.sql, SKILL.md, or references/.
- The specific new/modified query blocks.
- Rationale tied to Go Hunt findings.

**Checkpoint:** Present the scaffolded skill (or update proposal) for user review before writing files.

---

## Exploration Query Guidelines

Go Hunt generates queries at runtime rather than using pre-written queries.sql. These guidelines apply:

- **Read-only only.** `SELECT` and CTEs. No DML, no DDL, no temp tables.
- **Always include date guards** (`WHERE created_at BETWEEN ...` or similar) to avoid unbounded scans.
- **Aggregate in SQL.** Do not dump raw rows into context — summarise in the query.
- **Round outputs.** Use `ROUND(value::numeric, 1)` for consistency.
- **Log every query.** Include the SQL and key result metrics in the discovery report for auditability.
- **Fail gracefully.** If a query returns unexpected results (zero rows, implausible values), note it and move on rather than re-running blindly.

---

## What Go Hunt Does NOT Do

- **Does not produce final analytical reports.** Its output is a skill (or skill update), not a client-facing outcome document.
- **Does not modify data.** Read-only access, always.
- **Does not push to Linear.** New skills may have their own Phase 7 Linear integration, but Go Hunt itself does not create issues.
- **Explores independently.** Go Hunt discovers patterns from the data itself, not from pre-loaded answer keys.
