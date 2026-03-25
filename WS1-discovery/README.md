# Discovery Workstream

## Where This Fits in ADLC

This workstream is **Phase 1: Technical Feasibility** — the agentic experimentation track.

- Skills here (basecamp, go_hunt) discover and test hypotheses
- Findings feed into `FINDINGS.md` (root) and drive `WS2-mvp` builds
- See `../CLAUDE.md` for "The Loop" overview
- See `CONTEXT.md` below for how to interpret findings

---

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

---

## Discovery Phase: Customer Journeys

**Timeline:** Week 1-2
**Question:** Which experiences should we create?

### Objective

Identify and prioritize the customer signals and interventions that deliver the most value with acceptable feasibility.

### Core Hypothesis

> A customer whose signal drops (network outage, app crash, rage quit) is at high churn risk. Proactive outreach when they return - before they complain - converts a negative moment into loyalty.

### Signal Inventory

#### Network/Connectivity Signals
| Signal | Detection Method | Data Source | Priority |
|--------|-----------------|-------------|----------|
| Network drop | Connection state change | Network logs | P0 |
| Extended offline period | Timestamp delta | Session data | P0 |
| Repeated reconnection attempts | Event frequency | App telemetry | P1 |
| Coverage gap (known dead zone) | Location + history | Geo + network | P2 |

#### Behavioral Signals
| Signal | Detection Method | Data Source | Priority |
|--------|-----------------|-------------|----------|
| Rage quit (abrupt session end) | Session termination pattern | App events | P1 |
| Support page visit without ticket | Page view + no action | Web analytics | P1 |
| Competitor research (?) | TBD | TBD | P2 |
| Payment failure retry | Transaction logs | Billing | P1 |

#### Contextual Signals
| Signal | Detection Method | Data Source | Priority |
|--------|-----------------|-------------|----------|
| Cricket match + buffering | Event correlation | Content + QoS | P1 |
| Work hours + outage | Time + connectivity | Calendar hint + network | P2 |
| Travel + roaming issues | Location change + service | Geo + billing | P2 |

### Intervention Matrix

| Trigger | Intervention | Channel | Timing |
|---------|--------------|---------|--------|
| Back online after drop | Voice push: "Sorry, here's a discount" | Voice (ADK) | Immediate |
| Extended offline resolved | SMS + app notification | Multi | Within 5 min |
| Rage quit detected | Proactive support callback | Voice | Next session |
| Payment retry success | Thank you + loyalty bump | Push | Immediate |

---

## Reference

- **Hypotheses detail**: ../WS2-mvp/docs/HYPOTHESES.md (8 hypotheses, data requirements, priority)
- **Architecture**: ../WS2-mvp/docs/ARCHITECTURE.md (Signal → Memory → Agent → Voice)
- **Tech stack**: ../WS2-mvp/docs/GOOGLE-STACK.md (ADK, Vertex AI, Flink CEP)
