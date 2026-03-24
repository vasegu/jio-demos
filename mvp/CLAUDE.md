# Jio CX - Engineering Discovery Sprint

## Context

2-week engineering-led discovery for Jio CX use case. Three parallel streams converging on a working prototype.

**Core Experience:**
Signal drops → store in human memory → customer comes back online → voice push: "sorry, here's a discount"

**Platform:** Google ADK for voice agents

## Directory Structure

```
mvp/
├── .claude/          ← Claude Code skills (basecamp, go_hunt, hypotheses, log_session)
├── docs/             ← Investigation layer (ARCHITECTURE, GOOGLE-STACK, SPRINT-PLAN, etc.)
├── discovery/        ← Stream outputs
│   ├── stream-1-journeys.md    ← Which signals trigger which interventions
│   ├── stream-2-prototype.md   ← ADK agent build log
│   └── stream-3-architecture.md ← Voice, memory, swappable layers
├── mvp/              ← Working prototype code
│   ├── agent/        ← Google ADK voice agent
│   ├── memory/       ← Human memory store (signals about the person)
│   └── signals/      ← Signal detection layer
└── CLAUDE.md         ← This file
```

## The 3 Streams (2 weeks)

### Stream 1: Agentic Journey Analysis
- Which signals indicate unhappy customer?
- What interventions make sense?
- Privacy & data access requirements
- Score and rank by value + feasibility

### Stream 2: Working Prototype
- Google ADK voice agent
- Real data connection (pending Databricks access)
- Memory layer for customer context
- API integration for push notifications
- Latency requirements

### Stream 3: Architecture & Voice
- Source data audit
- Voice provider selection (ADK native vs alternatives)
- Target architecture for swappable components (model, voice, local GPU deployment)
- Gap analysis

## Key Architecture Decisions

1. **Voice:** Google ADK (primary) - need to evaluate against alternatives
2. **Memory:** Human memory pattern - accumulated context, not just sessions
3. **Swappability:** Design for model/voice provider swap, future local GPU deployment
4. **Reuse:** Phone UI from existing jio-demos app

## References

- Parent demo: `../app/` (workshop demo)
- Skills: `.claude/skills/` (basecamp, go_hunt, hypotheses, log_session)
- Google stack research: `docs/GOOGLE-STACK.md`
- Sprint plan: `docs/SPRINT-PLAN.md`
- Architecture: `docs/ARCHITECTURE.md`

## Timeline

- Week 1: All streams in parallel, daily syncs
- End Week 1: Stream 1 delivers ranked opportunities, Stream 2 has voice agent scaffold, Stream 3 has target architecture
- Week 2: Converge on single prototype, integrate streams
- End Week 2: Working demo of core experience (signal → memory → voice push)

## Success Criteria

By end of sprint:
- [ ] Voice agent responds to "I'm back online" with contextual apology + offer
- [ ] Memory layer stores and retrieves customer signal history
- [ ] Architecture supports swapping voice/model provider
- [ ] Clear path to production (data access, latency, privacy)
