# Basecamp: <!-- TEMPLATE: project/client name -->

**Date:** <!-- TEMPLATE: YYYY-MM-DD -->
**Approved:** No
**Schema(s):** <!-- TEMPLATE: schema name(s) -->

## Engagement Context

- **Client:** <!-- TEMPLATE: who they are -->
- **Problem as stated:** <!-- TEMPLATE: what they asked for -->
- **Problem behind the problem:** <!-- TEMPLATE: what the analyst thinks is actually going on -->
- **Scope:** <!-- TEMPLATE: project, schema(s), focus area -->
- **Prior basecamp:** <!-- TEMPLATE: link or "None" -->
- **Dataset:** <!-- TEMPLATE: total tables, total rows -->

---

## 1. Executive Summary

<!-- TEMPLATE: 3 bullets a managing director reads in 30 seconds -->
- <!-- What the data covers and the big picture -->
- <!-- Top finding against industry benchmarks -->
- <!-- Key risk or data limitation -->

---

## 2. Analyst Brain Dump (Structured)

<!-- TEMPLATE: Structured version of everything the analyst said in Phase 0 -->

### What We Were Told

<!-- TEMPLATE: The engagement brief, the problem statement, the context -->

### Initial Impressions & Hunches

<!-- TEMPLATE: The analyst's gut feel, captured and tagged -->

| ID | Analyst Hypothesis | Confidence | What Data Would We Need? |
|----|-------------------|:----------:|--------------------------|
| HA-1 | <!-- what the analyst suspects --> | Strong / Gut feel / Wild guess | <!-- tables, columns, metrics --> |
| HA-2 | <!-- --> | | |

### The Slant

<!-- TEMPLATE: What angle is the analyst leaning toward? What would they look for first? -->
<!-- This frames the entire analysis — make it explicit so Go Hunt can either confirm or challenge it -->

---

## 3. Entity Relationship Diagram

<!-- TEMPLATE: First-class artifact from Phase 1. Go Hunt loads this directly (§3). -->

```mermaid
erDiagram
    %% TEMPLATE: Replace with actual ERD from Phase 1
    %% Include explicit FKs, inferred joins, and cardinality markers
```

### The Spine

**Central entity:** <!-- e.g., "tickets — everything connects here" -->

<!-- TEMPLATE: Explain why this is the spine and what hangs off it -->

### Relationship Map

| From Table | Column | To Table | Column | Type | Populated % |
|-----------|--------|----------|--------|------|------------:|
| <!-- child --> | <!-- fk --> | <!-- parent --> | <!-- pk --> | FK / Inferred | <!-- pct --> |

### Naming Conventions

| Prefix/Pattern | Meaning | Example |
|---------------|---------|---------|
| <!-- CD_ --> | <!-- Code/categorical --> | <!-- CD_ACTION_CODE --> |

---

## 4. Data Dictionary

<!-- TEMPLATE: First-class artifact from Phase 1. Go Hunt loads this directly (§4). -->
<!-- This replaces information_schema queries for all downstream skills. -->
<!-- One subsection per table, ordered by analytical importance. -->

### <!-- table_name -->

**Grain:** <!-- what one row represents -->
**Rows:** <!-- count -->
**Type:** Fact / Dim / Reference

| Column | Data Type | NULL % | Cardinality | Sample Values | Analytical Notes |
|--------|-----------|-------:|------------:|---------------|-----------------|
| <!-- col --> | <!-- type --> | <!-- pct --> | <!-- n --> | <!-- top 3-5 values --> | <!-- what this column is useful for, join targets, known quirks --> |

<!-- TEMPLATE: Repeat the above block for each table in the schema -->

---

## 5. Data Profiles

<!-- TEMPLATE: From Phase 2. One subsection per table, ordered by analytical importance. -->
<!-- Profiles build on the Data Dictionary — adding distributions, spreads, and anomalies. -->

### <!-- table_name -->

**Rows:** <!-- n --> | **Columns:** <!-- n --> | **Date range:** <!-- min → max --> | **Trust:** <!-- A-F -->

| Column | Type | Non-null % | Cardinality | Min | Max | Notes |
|--------|------|----------:|------------:|-----|-----|-------|
| <!-- col --> | <!-- type --> | <!-- pct --> | <!-- n --> | <!-- val --> | <!-- val --> | <!-- notable pattern --> |

#### Concentration Analysis

<!-- TEMPLATE: Top-N values by frequency for key dimensions -->

| Dimension | Top Value | % of Total | Top 5 Cumulative % | Notes |
|----------|-----------|----------:|-------------------:|-------|
| <!-- e.g., dealer --> | <!-- --> | <!-- --> | <!-- --> | <!-- e.g., "one dealer has 40% of tickets" --> |

#### Performance Spread

<!-- TEMPLATE: For key entities (dealers, agents, regions), how wide is the spread? -->

| Dimension | Metric | Best | Median | Worst | Spread | Notes |
|----------|--------|-----:|-------:|------:|-------:|-------|
| <!-- e.g., Dealer --> | <!-- e.g., Tickets/month --> | <!-- --> | <!-- --> | <!-- --> | <!-- Nx --> | <!-- --> |

---

## 6. Industry & Company Context

<!-- TEMPLATE: From Phase 3. Research was targeted at patterns found in Phases 1-2. -->
<!-- This comes AFTER the data sections because research was informed by data discovery. -->

### Company Profile

<!-- TEMPLATE: Who the client is, market position, relevant structure -->

### Industry Landscape

<!-- TEMPLATE: Domain overview — what this industry looks like, key challenges, competitive dynamics -->

### Known Problem Patterns in This Domain

<!-- TEMPLATE: What typically goes wrong in this type of operation -->
- <!-- e.g., "In automotive aftersales, 60-70% of ticket time is typically passive waiting" -->
- <!-- e.g., "Dealer performance follows a power law — bottom 10% generate disproportionate rework" -->

### Analyst Hypotheses × Industry Context

<!-- TEMPLATE: How the analyst's hunches stack up against industry knowledge -->

| ID | Analyst Hypothesis | Industry Context | Updated Assessment |
|----|-------------------|-----------------|-------------------|
| HA-1 | <!-- their hunch --> | <!-- what the industry says --> | <!-- Supported by context / Adds nuance / No industry parallel --> |

---

## 7. Business Process Flows

<!-- TEMPLATE: From Phase 4. Entity lifecycle discovered from the data. -->

```mermaid
%% TEMPLATE: Entity lifecycle / process flow
```

### Fact vs Dimension

| Table | Classification | Rationale |
|-------|:-------------:|-----------|
| <!-- table --> | Fact / Dim | <!-- why --> |

### Process vs Industry Standard

<!-- TEMPLATE: How does the client's process compare to typical industry practice? -->

| Process Step | Client's Data Shows | Industry Typical | Notable Difference |
|-------------|--------------------|-----------------|--------------------|
| <!-- step --> | <!-- what the data says --> | <!-- standard practice --> | <!-- deviation or alignment --> |

---

## 8. Trust Scorecard

<!-- TEMPLATE: From Phase 5. Go Hunt loads this directly (§8). -->
<!-- Format is fixed — Go Hunt parses this table to set trust constraints. -->

### Overall Grades

| Table | Completeness | Orphans | Temporal | Anomalies | Freshness | Overall | Usability |
|-------|:-----------:|:-------:|:--------:|:---------:|:---------:|:-------:|-----------|
| <!-- table --> | <!-- A-F --> | <!-- A-F --> | <!-- A-F --> | <!-- A-F --> | <!-- A-F --> | <!-- A-F --> | safe / caveats / flag / do not use |

### Landmine Register

| # | Table | Issue | Severity | Impact on Analysis | Recommendation |
|---|-------|-------|----------|-------------------|----------------|
| 1 | <!-- --> | <!-- --> | CRITICAL/HIGH/MED | <!-- --> | <!-- --> |

---

## 9. Performance Benchmarks

<!-- TEMPLATE: From Phase 3 research + Phase 6 synthesis. Go Hunt loads this directly (§9). -->
<!-- Every benchmark is mapped to the specific data field(s) that produce it. -->
<!-- A benchmark without a data mapping is just trivia — always include the field. -->

| KPI | Industry Benchmark | Source | Client Actual | Gap | Data Field(s) |
|-----|-------------------|--------|:------------:|:---:|---------------|
| <!-- e.g., Reopen rate --> | <!-- e.g., 5-8% --> | <!-- where you found this --> | <!-- from profiling --> | <!-- above/below/at --> | <!-- schema.table.column --> |
| <!-- First-time fix rate --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> |
| <!-- Mean time to resolution --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> |
| <!-- Passive wait % --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> | <!-- --> |

---

## 10. Quick Wins & Coverage Assessment

### Quick Wins

<!-- TEMPLATE: Patterns worth presenting early that build client confidence -->

| # | Finding | Evidence | vs Industry Benchmark | Client Impact | Effort |
|---|---------|---------|----------------------|---------------|--------|
| 1 | <!-- --> | <!-- numbers --> | <!-- above/below/at benchmark --> | <!-- why they care --> | <!-- hours/days --> |

### What We Can Answer

- <!-- Business question the data supports -->

### What We Cannot Answer

- <!-- Gap the client will ask about but data can't support -->

### What's Blocked by Data Quality

- <!-- Answerable in theory but quality issues prevent it -->

---

## 11. Hypothesis Register

<!-- TEMPLATE: From Phase 6 synthesis. Go Hunt loads both tables (§11). -->

### Analyst Hypotheses (HA-<n>) — Data Verdict

<!-- TEMPLATE: Format is fixed — Go Hunt parses this table for coverage matrix. -->

| ID | Hypothesis | Confidence | Data Verdict | Go Hunt Action |
|----|-----------|:----------:|:------------:|---------------|
| HA-1 | <!-- --> | <!-- Strong/Gut feel/Wild guess --> | <!-- Supported / Plausible / No data / Contradicted --> | <!-- Test / Explore / Drop --> |

### Candidate Hypotheses (HC-<n>) — From Data Profiling

<!-- TEMPLATE: Format is fixed — Go Hunt adds these to its working hypothesis list. -->

| ID | Hypothesis | Evidence | Impact | Testability | Speed | Priority |
|----|-----------|---------|:------:|:-----------:|:-----:|:--------:|
| HC-1 | <!-- --> | <!-- from profiling --> | High/Med/Low | High/Med/Low | <!-- days --> | <!-- 1-n --> |

### Mapping to Existing Skills

| Hypothesis | Existing Skill | Action |
|-----------|---------------|--------|
| <!-- --> | <!-- skill or "None — Go Hunt" --> | <!-- "Run directly" / "Explore first" --> |

---

## 12. Go Hunt Starter Pack

<!-- TEMPLATE: From Phase 6-7. Everything Go Hunt needs, summarised in one section. -->
<!-- Go Hunt Phase 0 loads this section (§12) as its primary intake document. -->

### Context for Go Hunt Phase 0

- **Client:** <!-- one line -->
- **Domain:** <!-- industry + specific process -->
- **Core question:** <!-- what we're ultimately trying to answer -->
- **Analyst slant:** <!-- what direction the analyst is leaning -->

### Performance Reference

<!-- TEMPLATE: Summary of §9 Performance Benchmarks with client actuals filled in -->

| KPI | Industry Benchmark | Client Actual | Gap | Priority |
|-----|-------------------|:------------:|:---:|:--------:|
| <!-- --> | <!-- --> | <!-- from profiling --> | <!-- above/below/at --> | <!-- for Go Hunt --> |

### Hypotheses for Go Hunt

| Source | ID | Hypothesis | Recommended Action |
|--------|-----|-----------|-------------------|
| Analyst | HA-1 | <!-- --> | <!-- --> |
| Data | HC-1 | <!-- --> | <!-- --> |

### Trust Constraints

<!-- TEMPLATE: What Go Hunt should avoid or handle carefully -->
- **Avoid:** <!-- tables with F grades -->
- **Caveat:** <!-- tables with C-D grades, explain limitations -->
- **Safe:** <!-- A-B tables Go Hunt can query freely -->

### Recommended Exploration Order

<!-- TEMPLATE: Prioritised list of where Go Hunt should start -->
1. <!-- Highest-priority hypothesis or gap -->
2. <!-- Next -->
3. <!-- Next -->

---

## Appendix

### A. Business Glossary

| Data Term | Client Term | Definition | Source |
|----------|------------|-----------|--------|
| <!-- --> | <!-- --> | <!-- --> | <!-- table.column --> |

### B. Queries Run

| # | Phase | Purpose | Query (abbreviated) | Key Result |
|---|-------|---------|-------------------|------------|
| 1 | <!-- 1/2/3/... --> | <!-- --> | `SELECT ...` | <!-- --> |

### C. Research Sources

| # | Source | What It Informed |
|---|--------|-----------------|
| 1 | <!-- URL or publication --> | <!-- which section --> |

### D. Data Quality Details

- **Dataset size:** <!-- total rows -->
- **Date range:** <!-- earliest → latest -->
- **Exclusions:** <!-- skipped tables/columns -->

### E. Limitations

- <!-- Limitation 1 -->
- <!-- Limitation 2 -->
