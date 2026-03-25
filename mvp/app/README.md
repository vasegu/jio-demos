# JIO CX MVP — Live App

## What This Is
The new live MVP app for Jio CX. Live GCP connection + Databricks data integration + real voice agent.

Experiences here are built from skills findings — each validated hypothesis maps to a specific interaction pattern in this app.

## Building It
- Framework: React + Vite (like demo/, but with live backend)
- Design: Reuse Jio brand shell from `../demo/` — same JioType, same design tokens
- Data: Consume validated findings from `../discovery/`
- Backend: GCP + Databricks signal layer (see `../docs/ARCHITECTURE.md`)
- Voice: Gemini Live API or IndicWhisper (swappable, per `../docs/GOOGLE-STACK.md`)

## Run Locally
```bash
cd mvp/app
npm run dev
```

## Experiences Built (Track findings → experiences)
Track each Linear ticket that comes from a validated hypothesis skill. Link to the experience code here.

| Finding | MVP Experience | Status |
|---------|----------------|--------|
| H1: Network degradation predicts churn | Proactive credit + "we noticed" before they churn | — |
| H2: Silent sufferers | Buddy reaches out to non-complainers with bad metrics | — |
| H4: Complaint fingerprint | Intervention 24h before customer contacts care | — |
| H7: Geography clustering | Location-aware offers in degraded tower areas | — |
| H8: Cross-sell readiness | Right-moment ecosystem expansion suggestion | — |

See `../mvp/docs/HYPOTHESES.md` for the full hypothesis set.
