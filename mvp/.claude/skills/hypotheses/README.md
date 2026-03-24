# Hypothesis Skills

This directory contains skills that test specific hypotheses with pre-written queries,
structured KPI assessments, and a Phase 0–7 lifecycle.

## Structure

```
hypotheses/
├── _templates/                    # Templates for authoring new hypothesis skills
│   ├── SKILL_STRUCTURE.md        # How to build a skill (directory layout, conventions)
│   ├── ANALYSIS_WORKFLOW.md      # Phase 0–7 SOP shared by all hypothesis skills
│   ├── REPORT_STANDARDS.md       # Report structure, naming, chart conventions
│   └── CHART_REFERENCE.md        # Vega-Lite v5 patterns
└── <skill-name>/                  # Engagement-specific skills added here by Go Hunt
```

## Conventions

- Each skill has: `SKILL.md` · `queries.sql` · `references/` · `templates/`
- `SKILL.md` defines the hypotheses, KPI mappings, thresholds, and Phase 0 intake checklist
- `queries.sql` contains all named queries (`-- @name: <query_name>`)
- Reports output to `reports/<skill_name>/`
- Go Hunt scaffolds new skills here when it discovers a testable hypothesis

## Adding a new skill

Follow `_templates/SKILL_STRUCTURE.md`. The minimum viable skill:

```
hypotheses/<skill_name>/
├── SKILL.md        # Hypotheses, KPIs, thresholds, intake checklist
├── queries.sql     # Named queries with -- @name: markers
└── templates/
    └── report-template.md
```

## Getting started

No hypothesis skills are defined yet — this is the skeleton. Hypothesis skills are
engagement-specific and are scaffolded by **Go Hunt** during an engagement. Run
**Basecamp** first, then **Go Hunt**, and skills will be created here automatically.
