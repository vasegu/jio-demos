# MVP Workstream

Build experiences from validated findings. The experiences/ folder is where progress lives.

## The Build Loop

1. Check FINDINGS.md (root) — what's been discovered?
2. If finding passes governance → it's in FINDINGS.md with a ticket number and "Experience: pending scaffold"
3. Create folder in `app/experiences/` (named after hypothesis, e.g., H1-proactive-credit)
4. Write `README.md` (what it does, why, success metric) + `discovery-link.md` (link back to finding)
5. Build component
6. Test in mvp/docs flow before shadow release

## Structure

```
mvp/
├── CLAUDE.md              (you are here)
├── app/
│   ├── experiences/       (one folder per validated hypothesis behavior)
│   │   ├── H1-proactive-credit/
│   │   │   ├── README.md  (experience brief: what, why, success metric)
│   │   │   ├── discovery-link.md  (one line: "H1 | VAS-12 | 2026-03-24 | HIGH")
│   │   │   └── component.jsx (and supporting code)
│   │   └── H2-silent-outreach/
│   │       ├── README.md
│   │       ├── discovery-link.md
│   │       └── ...
│   └── src/               (React app, styles, assets)
│
└── docs/                  (Reference docs — don't move)
    ├── ARCHITECTURE.md    (Full stack: Signal → Memory → Agent → Voice)
    ├── HYPOTHESES.md      (All 8 hypotheses + data requirements)
    ├── GOOGLE-STACK.md    (ADK, Vertex AI, Flink CEP, signal pipeline)
    └── (other reference docs)
```

## Workflow

| Stage | Status | Examples |
|-------|--------|----------|
| Discovery → Finding | FINDINGS.md with ✓ | H1, H2, H4 |
| Finding → Ticket | STATUS.md shows ticket | VAS-12, VAS-13, VAS-14 |
| Ticket → Experience | folder exists | app/experiences/H1-proactive-credit/ |
| Experience → Shadow | STATUS.md Shadow column | Ready after component built |

## Check

Before every change to architecture or stack: read `mvp/docs/ARCHITECTURE.md` and `mvp/docs/GOOGLE-STACK.md`.

FINDINGS.md is the single source of truth for what's been validated and why.
