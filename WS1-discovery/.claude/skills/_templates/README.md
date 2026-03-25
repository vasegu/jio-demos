# Shared Templates for Skills Pipeline

All framework and engagement-specific skills reference these templates. One source of truth.

## Templates

| Template | Purpose | Used By |
|----------|---------|---------|
| `ANALYSIS-WORKFLOW.md` | Standard Phase 0-7 SOP for testing hypotheses | All hypothesis skills |
| `REPORT-STRUCTURE.md` | Output report structure and sections | All skills producing reports |
| `CHART-REFERENCE.md` | Vega-Lite v5 chart patterns (line, bar, scatter, heatmap) | All reporting skills |
| `SKILL-TEMPLATE.md` | How to author a new hypothesis skill (directory layout, SKILL.md format) | When scaffolding new hypothesis |
| `notebook-scaffold.py` | Python scaffold for marimo notebooks | hypothesis_to_notebook skill |
| `erd-template.mmd` | Mermaid ERD template | basecamp skill |

## How to Use

Each skill's SKILL.md references the relevant templates:
```
Shared templates: see discovery/.claude/skills/_templates/REPORT-STRUCTURE.md
```

Skill-specific templates (if any) stay in their own skill directory.

## Update Protocol

When improving a template:
1. Edit the file in `_templates/`
2. All skills automatically pick up the change next run
3. No manual propagation needed
