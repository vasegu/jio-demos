# Incidents

Structured records of bugs, errors, and lessons learned during skill execution. Each incident drives a **proactive skill review** -- corrections are baked into templates and skills, not loaded at runtime.

## Filing an Incident

### When to File

File an incident when:
- A skill produces incorrect results due to a systematic error (not a one-off data issue)
- A pattern is discovered that could affect multiple skills or future skill runs
- A lesson learned should become a permanent guardrail in the templates

### Format

Create `INC-NNN-<kebab-case-description>.md` with:

**YAML frontmatter:**
```yaml
---
id: INC-NNN
title: Short description
severity: HIGH           # LOW | MEDIUM | HIGH | CRITICAL
date_reported: YYYY-MM-DD
reported_by: name
status: resolved         # open | investigating | resolved | wontfix
tags: [relevant, tags]
affected_skills: [all]   # or specific skill names
corrections_applied:
  - file: path/to/file
    section: "Section name"
    change: "What was changed"
---
```

**Body sections:**
1. **What Happened** -- describe the error and how it was discovered
2. **Why It Was Wrong** -- explain the underlying principle that was violated
3. **Correct Pattern** -- show the fix with code/SQL examples
4. **Detection Rule** -- how to spot this error in other skills
5. **Skills Reviewed** -- checklist of skills audited + whether correction was needed

### Severity Levels

| Level | Meaning | Example |
|-------|---------|---------|
| CRITICAL | Produces fundamentally wrong business conclusions | Wrong aggregation changes a KPI from "OK" to "CRITICAL" |
| HIGH | Produces materially incorrect numbers | Averaging ratios instead of recomputing from base columns |
| MEDIUM | Produces suboptimal but not wrong results | Rounding errors, missing NULL handling |
| LOW | Style/convention issue with no analytical impact | Missing chart labels, inconsistent naming |

## The Review Process

Incidents are **not** loaded during skill execution. Instead, they drive a correction cycle:

### 1. File the Incident
Create the incident file, update `register.md`.

### 2. Correct Shared Templates
If the error is structural, update the relevant `_templates/` file so **new skills are born correct**:
- SQL rules → `SKILL_STRUCTURE.md` Section 5
- Analysis rules → `ANALYSIS_WORKFLOW.md` Phase 4
- Reporting rules → `REPORT_STANDARDS.md`

### 3. Audit Existing Skills
Go through each hypothesis skill on **active engagement branches** and check if it's affected. Document what was reviewed and changed in the incident file's "Skills Reviewed" section.

### 4. A/B Opportunity (Optional)
Before patching a skill, optionally re-run its queries with the old approach and the corrected approach on the same data. Document the delta (e.g., "old aggregation: 27.5%, corrected: 33.3%, delta: 5.8pp"). This builds evidence for how much the correction matters.

## Syncing to Engagement Branches

Incidents live on `main` and sync to active engagement branches via the infrastructure sync command (see ONBOARDING.md). When `main` gets a new incident + template correction, active branches pull it on their next sync.

## Git Workflow

```bash
git checkout main
git checkout -b feat/inc-NNN-<description>
# Create incident file, update register.md, update templates
git push origin feat/inc-NNN-<description>
# Open PR into main
```
