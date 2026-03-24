# Skill Templates

Authoring standards and shared workflows for all analytical skills.

| File | Purpose | When to Read |
|------|---------|-------------|
| `SKILL_STRUCTURE.md` | How to **build** a skill: directory layout, SKILL.md format, SQL conventions, references | When creating or scaffolding a new skill |
| `REPORT_STANDARDS.md` | What **output** should look like: report sections, finding quality, charts, Linear integration | When generating reports (Phase 5) or reviewing quality |
| `ANALYSIS_WORKFLOW.md` | How to **run** a skill: the Phase 0-7 interactive workflow | Loaded at the start of every scripted skill run |
| `CHART_REFERENCE.md` | Vega-Lite v5 patterns for every supported chart type | When populating charts in outcome reports |

## How these files relate

```
Creating a skill:     SKILL_STRUCTURE.md  (structure) + REPORT_STANDARDS.md (output spec)
Running a skill:      ANALYSIS_WORKFLOW.md (phases)   + REPORT_STANDARDS.md (Phase 5)
Building charts:      CHART_REFERENCE.md  (patterns)  + REPORT_STANDARDS.md (standards)
```

Skills are discovered from `.claude/skills/` at runtime. Generated reports go to `reports/<skill>/`.
