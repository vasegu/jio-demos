---
id: INC-001
title: Ratio column aggregation error
severity: HIGH
date_reported: 2026-03-09
reported_by: ralph
status: resolved
tags: [sql, aggregation, derived-metrics, data-quality]
affected_skills: [all]
corrections_applied:
  - file: .claude/skills/hypotheses/_templates/SKILL_STRUCTURE.md
    section: "Section 5: queries.sql conventions"
    change: "Added derived-metric aggregation rule"
---

# INC-001: Ratio Column Aggregation Error

## What Happened

During analysis of utilisation data, the system produced inconsistent totals because it averaged a derived percentage column (YTD_Chg %) instead of recomputing the metric from its base columns (YTD_Chg Hrs and YTD_Standard Available Hrs).

The error was caught during a live review when aggregated percentages didn't match the expected total.

## Why It Was Wrong

Averaging row-level ratios is mathematically incorrect when denominators differ. Each row gets equal weight regardless of its underlying volume.

**Example:**
- Group A: 10 / 100 = 10%
- Group B: 90 / 200 = 45%
- Wrong (simple average): (10% + 45%) / 2 = **27.5%**
- Correct (weighted): (10 + 90) / (100 + 200) = **33.3%**

The 5.8 percentage point error is enough to flip a KPI status from OK to HIGH in many threshold schemes.

This affects all derived metrics: percentages, rates, ratios, margins, utilisation figures, conversion rates, yields.

## Correct Pattern

```sql
-- WRONG: averaging a pre-computed ratio
SELECT region, AVG(ytd_chg_pct) AS avg_chg
FROM utilisation
GROUP BY region;

-- CORRECT: recomputing from base columns
SELECT region,
       SUM(ytd_chg_hrs) / NULLIF(SUM(ytd_standard_available_hrs), 0) AS chg_pct
FROM utilisation
GROUP BY region;
```

**General rule:** For any column that is a ratio of two other columns:
```sql
-- WRONG
AVG(derived_column)

-- CORRECT
SUM(numerator_column) / NULLIF(SUM(denominator_column), 0)
```

## Detection Rule

Before aggregating any column, check:

1. **Is the column a derived metric?** Look for keywords: %, rate, ratio, margin, utilisation, conversion, yield, index, per, average (when it's a pre-computed average)
2. **Can you identify the numerator and denominator?** Check column naming patterns, data dictionary, or the source calculation
3. **If yes:** Aggregate the base columns separately, then compute the ratio
4. **If unsure:** Flag in the checkpoint (Phase 2) and confirm with the user before proceeding

## Skills Reviewed

| Skill | Branch | Affected? | Action Taken |
|-------|--------|-----------|-------------|
| (Initial filing -- skill audit pending on active engagement branches) | | | |

## Related

- Commit that surfaced the issue: Ralph's utilisation analysis session (2026-03-09)
- Broader principle: never use pre-computed values for aggregation; always go back to raw base columns
