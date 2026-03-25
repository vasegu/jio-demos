# Discovery Workstream

Skills pipeline investigation. Findings append to root FINDINGS.md.

## Before Running Any Skill

**Read `CONTEXT.md` first.** This is the situation modifier — it tells skills HOW to interpret what they find, without telling them WHAT to find.

CONTEXT.md defines:
- What we're building (Jio Buddy + architecture reference)
- The interpretation frame (signals → behaviors, not root causes)
- Signal taxonomy (network, behavioral, transactional, temporal)
- LIVE vs. DEFERRED signal types
- What a "good finding" looks like for Jio CX

Skills from the central framework + CONTEXT.md lens = Jio CX-specific discovery.

---

## How It Works

1. Run a skill: `/basecamp` → `/go_hunt` → specific hypothesis skill
2. Skill produces findings in `.claude/reports/YYYY-MM-DD/<skill>/report.md`
3. Append the finding to `../../FINDINGS.md` (4 lines: hypothesis | date | confidence | evidence | status)
4. If it passes governance (5-point gate in FINDINGS.md): create Linear ticket
5. Ticket → scaffold experience in `../WS2-mvp/app/experiences/<H#-slug>/`

## Skills Directory

`.claude/skills/` has two types:

- **Framework skills** (reusable): basecamp, go_hunt, log_session, hypothesis_to_notebook
- **Hypothesis skills** (engagement-specific): H1-churn-precursor, H2-silent-sufferers, etc. (scaffolded by go_hunt)

Shared templates: `.claude/skills/_templates/` (ANALYSIS-WORKFLOW, REPORT-STRUCTURE, CHART-REFERENCE, etc.)

## Structure

```
WS1-discovery/
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

- **Hypotheses detail**: ../WS2-mvp/docs/HYPOTHESES.md (8 hypotheses, data requirements, priority)
- **Architecture**: ../WS2-mvp/docs/ARCHITECTURE.md (Signal → Memory → Agent → Voice)
- **Tech stack**: ../WS2-mvp/docs/GOOGLE-STACK.md (ADK, Vertex AI, Flink CEP)
