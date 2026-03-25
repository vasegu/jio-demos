# Discovery Workstream

Skills pipeline investigation. Findings append to root FINDINGS.md.

## How It Works

1. Run a skill: `/basecamp` → `/go_hunt` → specific hypothesis skill
2. Skill produces findings in `.claude/reports/YYYY-MM-DD/<skill>/report.md`
3. Append the finding to `../../FINDINGS.md` (4 lines: hypothesis | date | confidence | evidence | status)
4. If it passes governance (5-point gate in FINDINGS.md): create Linear ticket
5. Ticket → scaffold experience in `mvp/app/experiences/<H#-slug>/`

## Skills Directory

`.claude/skills/` has two types:

- **Framework skills** (reusable): basecamp, go_hunt, log_session, hypothesis_to_notebook
- **Hypothesis skills** (engagement-specific): H1-churn-precursor, H2-silent-sufferers, etc. (scaffolded by go_hunt)

Shared templates: `.claude/skills/_templates/` (ANALYSIS-WORKFLOW, REPORT-STRUCTURE, CHART-REFERENCE, etc.)

## Structure

```
discovery/
├── README.md               (you are here)
├── streams/                (stream-1-journeys, stream-2-prototype, stream-3-architecture)
└── .claude/
    ├── settings.json
    ├── skills/
    │   ├── _templates/     (ONE place for all shared templates)
    │   ├── basecamp/
    │   ├── go_hunt/
    │   ├── log_session/
    │   ├── hypothesis_to_notebook/
    │   └── hypotheses/     (engagement-specific skills for H1-H8)
    ├── reports/            (dated outputs from each skill run)
    ├── incidents/
    └── scripts/
```

## Reference

- **Hypotheses detail**: mvp/docs/HYPOTHESES.md (8 hypotheses, data requirements, priority)
- **Architecture**: mvp/docs/ARCHITECTURE.md (Signal → Memory → Agent → Voice)
- **Tech stack**: mvp/docs/GOOGLE-STACK.md (ADK, Vertex AI, Flink CEP)
