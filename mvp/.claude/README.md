# .claude/

Agent configuration only. No generated content lives here.

```
.claude/
├── incidents/                      ← Bug/error records driving proactive skill reviews
│   ├── README.md                   ← Filing guide + review process
│   └── register.md                 ← Incident index
│
├── scripts/                        ← Agent-callable utility scripts
│   └── query.py                    ← Backup SQL query runner
│
└── skills/
    ├── _templates/
    │   ├── README.md                   ← Index of template files and when to use each
    │   ├── SKILL_STRUCTURE.md          ← How to build a skill (directory layout, SKILL.md, queries.sql)
    │   ├── REPORT_STANDARDS.md         ← What reports should look like (naming, charts, Linear)
    │   ├── ANALYSIS_WORKFLOW.md        ← Shared Phase 0-7 workflow for scripted skills
    │   └── CHART_REFERENCE.md          ← Vega-Lite v5 chart patterns
    │
    ├── basecamp/                       ← Orientation skill (run first on any dataset)
    │   ├── SKILL.md
    │   ├── references/
    │   └── templates/
    │
    ├── go_hunt/                        ← Discovery skill (finds gaps, scaffolds new skills)
    │   ├── SKILL.md
    │   ├── references/
    │   └── templates/
    │
    ├── hypothesis_to_notebook/         ← Converts outcome reports into live marimo notebooks
    │   ├── SKILL.md
    │   ├── references/
    │   └── templates/
    │
    └── hypotheses/                     ← Engagement-specific hypothesis skills (added per use case)
        ├── _templates/                 ← Skill authoring templates
        └── <skill-name>/              ← added by Go Hunt during an engagement
```

**Skill chain:** `Basecamp → Go Hunt → Hypothesis Skills → hypothesis_to_notebook`

Generated reports go to `reports/<skill>/` at the project root.
