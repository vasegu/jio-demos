# Discovery Report: Go Hunt

**Date:** <YYYY-MM-DD>

## Intent & Scope
**User asked:** <verbatim quote or "Broad exploration from existing hypothesis list">
**Confirmed scope:** <broad / targeted — describe focus, any user-supplied hypotheses>
**Prior runs referenced:** <links to recent skill outcome reports if any, or "None">
**Existing skills reviewed:** <list skill names>

---

## Coverage Matrix

| Hypothesis | Existing Skill | Status |
|-----------|---------------|--------|
| H<n> — <description> | *none* | Uncovered |
| H<m> — <description> | `<existing_skill>` | Covered |
| ... | ... | ... |

---

## Hypotheses Tested

<!-- TEMPLATE: One row per hypothesis tested during exploration. Include both supported and unsupported results. -->

| Hypothesis | Queries Run | Result | Evidence | Assessment |
|-----------|------------|--------|----------|:-----------|
| H<n> — <description> | <n> queries | <key finding or "No supporting evidence"> | N = <x> rows, data quality: <good/marginal/poor> | <Supported / Not Supported / Partially / Inconclusive / Not Testable> |
| ... | ... | ... | ... | ... |

---

## Schema Exploration

### Untouched Tables / Columns
| Table | Column | Cardinality | NULL % | Notes |
|-------|--------|------------|--------|-------|
| <table> | <column> | <n> | <x>% | <observation> |

### Data Quality Flags
- <flag 1>
- <flag 2>

---

## Findings

### 1. <Finding Title>
**Hypothesis:** <which H# this relates to, or "New">
**Supporting Query:**
```sql
<the query that surfaced this>
```
**Key Result:** <specific numbers>
**Business Impact:** <High / Medium / Low — why>
**Data Sufficiency:** <Sufficient / Marginal / Insufficient>
**Recommendation:** New skill / Update existing / Note only

<!-- TEMPLATE: Include candidate KPIs for each finding that warrants a new skill or skill update -->
**Candidate KPIs:**

| KPI ID | KPI Name | Metric | Target | Suggested Viz |
|--------|----------|--------|--------|---------------|
| H<n>-K1 | <name> | <what to measure> | <threshold> | <chart type from CHART_REFERENCE.md> |

### 2. <Finding Title>
...

---

## Cross-Skill Correlations

| Pattern | Skills Involved | Finding |
|---------|----------------|---------|
| <pattern> | <skill A> + <skill B> | <what the overlap reveals> |

---

## Ranked Recommendations

| Priority | Finding | Action | Rationale |
|----------|---------|--------|-----------|
| 1 | <finding> | New skill: `<name>` | <why this is highest priority> |
| 2 | <finding> | Update: `<existing skill>` | <what to change> |
| ... | ... | ... | ... |

---

## Appendix: Queries Run

| # | Query Purpose | Query File | Rows Returned | Key Metric |
|---|--------------|-----------|--------------|------------|
| 1 | <purpose> | <ad-hoc / skill queries.sql path> | <n> | <metric> |
| 2 | <purpose> | <ad-hoc / skill queries.sql path> | <n> | <metric> |
