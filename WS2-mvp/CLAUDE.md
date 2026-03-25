# MVP Workstream

## Where This Fits in ADLC

This workstream is **Phase 2: Real-World Validation**.

- Hypotheses from WS1-discovery findings are built as experiences here
- Each experience folder (H1-proactive-credit, H2-silent-outreach, etc.) is a validated behavior ready for shadow testing and hardening
- See `../CLAUDE.md` for "The Loop" overview

---

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
WS2-mvp/
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

---

## Prototype Phase: Working Voice Agent

**Timeline:** Week 1-2
**Question:** Can we create the experience we want?

### Objective

Build a working voice agent using Google ADK that demonstrates the core experience: proactive outreach to a customer whose signal dropped.

### Core Experience Flow

```
1. Signal Detection
   └─► Customer goes offline (network drop)

2. Memory Write
   └─► Store: {customer_id, event: "offline", timestamp, context}

3. Signal Detection
   └─► Customer comes back online

4. Memory Read
   └─► Retrieve: recent offline event, customer history, preferences

5. Voice Push (Google ADK)
   └─► "Hi [name], we noticed you were offline for [duration].
        Sorry about that - here's [offer] to make it right."

6. Memory Update
   └─► Store: intervention delivered, response
```

### Tech Stack

#### Google ADK (Primary)
- Agent framework: ADK agents
- Voice: Google TTS/STT (or swappable)
- Orchestration: ADK tools + function calling

#### Memory Layer
- Pattern: "Human memory" - accumulated context over time
- Storage: TBD (Firestore? Supabase? Jio's Databricks?)
- Schema: Signals → Preferences → Interventions → Lifetime metrics

#### Phone UI
- Reuse: `../WS0-demo/` patterns
- Modification: Add incoming call/push simulation

### Build Sequence

#### Week 1
- [ ] Day 1-2: ADK agent scaffold + basic voice response
- [ ] Day 3-4: Memory layer (in-memory first, then persistent)
- [ ] Day 5: Phone UI integration (incoming call simulation)

#### Week 2
- [ ] Day 6-7: Connect to real signals (or realistic mock)
- [ ] Day 8-9: Personalization from memory
- [ ] Day 10: Polish, latency optimization, demo prep

### Success Criteria

Working demo that shows:
- [ ] Voice agent responds naturally
- [ ] Retrieves customer context from memory
- [ ] Personalizes the apology + offer
- [ ] Latency < 2 seconds from trigger to voice

---

## Check

Before every change to architecture or stack: read `docs/ARCHITECTURE.md` and `docs/GOOGLE-STACK.md`.

Root FINDINGS.md is the single source of truth for what's been validated and why.
