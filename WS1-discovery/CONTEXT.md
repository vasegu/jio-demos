# Situation Context — Jio CX

> Read this at Phase 0 intake of any skill run. Apply as interpretation frame throughout.
> This file adapts generic discovery skills to the Jio CX engagement without forking them.

## What We're Building
Jio Buddy: a proactive voice agent that knows everything that's happened to the customer — even when they weren't talking.

**Architecture:** Signal Layer (Flink/Kafka) → Memory Store (Firestore/Databricks) → ADK Agent (Gemini 2.5 Flash) → Voice (Gemini Live API / IndicWhisper)

**Full spec:** ../WS2-mvp/docs/ARCHITECTURE.md

**Timeline:** June 30 live in 2 regions. NPS + CX lift measured.

---

## The Lens: Signals, Not Root Causes

We're not finding what's broken. We're finding **SIGNALS** — measurable events in the data that should trigger Jio Buddy to act.

**Generic discovery:** "Here's a pattern. Here's why it exists."
**Jio CX discovery:** "Here's a signal. Here's when Jio Buddy should act on it."

Every finding must answer four questions:

1. **Signal** — What is the specific measurable event in the data?
   - Example: "SINR drops >15dB in 72h window"
   - Example: "Zero data usage for 7 consecutive days"
   - Example: "Complaint file opened + specific keywords (network, slow, dropped)"

2. **Lead time** — How far ahead does it appear before customer pain peaks?
   - Example: "72h before MNP port-out"
   - Example: "48h before customer contacts IVR"
   - Example: "Concurrent with first complaint"

3. **Type** — LIVE or DEFERRED?
   - **LIVE:** Trigger agent outreach now (within hours). Customer is in pain right now.
   - **DEFERRED:** Store in memory, retrieve when customer next contacts. "We noticed your signal dropped last week."

4. **Jio Buddy behavior** — What does the agent say or do with this signal?
   - Example LIVE: "Your network is struggling. Here's ₹50 credit to help you through."
   - Example DEFERRED: "We noticed you had signal issues last week. You're all set now, but here's a credit."

---

## Signal Taxonomy

Use this to map data discoveries to signal types.

| Type | Examples | Typical Lead Time | LIVE/DEFERRED |
|------|----------|-------------------|---------------|
| **Network** | SINR degradation, RSRP drops, packet loss, handoff failures, tower proximity to competitor | 24-72h before churn | DEFERRED (store), then LIVE (proactive reach) |
| **Behavioral** | Rage quits, session drops, retry patterns, zero-usage cliffs, reduced engagement | 7-30d before churn | DEFERRED (pattern) or LIVE (cliff event) |
| **Transactional** | Payment failures, recharge timing, plan changes, MNP inquiry patterns, account downgrades | Concurrent to 14d before churn | DEFERRED or LIVE depending on pattern |
| **Temporal** | Complaint timing distributions, port-out lead times, intervention windows, seasonal patterns | Varies by signal | DEFERRED (historical) |

---

## Check These Before Hypothesizing

- **Known findings:** ../FINDINGS.md — don't duplicate signals already discovered. Add to it, don't re-discover.
- **Seeded hypotheses:** ../WS2-mvp/docs/HYPOTHESES.md — H1-H8 with data requirements. Check what's already scoped.
- **Demo scenarios:** ../WS0-demo — 7 scenarios already designed and built (Slow Wi-Fi, Singapore Trip, Match Night, Running Low, Weekly Shop, Pay Contact, Home). Don't build experiences for signals that don't map to a scenario.

---

## What a "Good Finding" Looks Like for Jio CX

| Field | Example Value |
|-------|----------------|
| **Signal** | Network SINR drops >15dB within 72h window |
| **Lead time** | 72h before MNP port-out |
| **Type** | DEFERRED — store in memory, recall if customer contacts |
| **Jio Buddy behavior** | "We noticed your signal dropped last week. We've added ₹100 credit." |
| **Evidence** | 4.2M events analysed, 78% precision, 15% recall. Covers ~4.5M customers/month. |
| **Governance** | ✓ Passes gate: data quality A-grade, privacy compliant, intervention scope clear |

---

## What a "Bad Finding" Looks Like (Does Not Pass)

| Issue | Example |
|-------|---------|
| No signal → no behavior | "Customers with bad network metrics have higher churn" (pattern, not signal) |
| No lead time | "Network degradation happens when customers churn" (concurrent, not predictive) |
| No Jio Buddy action | "3% of customers never use data" (insight, not trigger) |
| Intervention unclear | "Poor network quality in rural areas" (true, but what does Jio Buddy do?) |
| Privacy violation | "Target customers from competitor's network near their home" (geofencing + identity) |

If you can't answer all four questions, the finding is not ready for Jio CX. Run /go_hunt to re-frame or deprioritize.

---

## How to Apply This Lens

### In /basecamp (Phase 0 & §6)
- Read this context first
- Discover data fresh (no contamination)
- At §6 (Industry Research), add a "Signal Opportunities" section:
  - Map each data source to potential LIVE/DEFERRED signals using the taxonomy above
  - Example: "Network QoS tables → network signal opportunities (SINR degradation, packet loss)"

### In /go_hunt (Phase 0 & Phase 4)
- Read this context before exploring
- Phase 2: Hunt for signals, not just patterns
- Phase 4 governance gate: A finding passes if it answers all four questions. If not, return to Phase 2 or deprioritize.
- Phase 5: Scaffold hypothesis skills using local template (gets Jio CX Behavior section automatically)

### In hypothesis skills (Phase 1 intake)
- Complete the Jio CX Behavior table BEFORE writing queries
- If you can't fill it, this hypothesis doesn't belong in Jio CX pipeline
- This table guides what data you're hunting for

---

## Current State

**Findings discovered:** FINDINGS.md (root) — check before hypothesizing
**Hypotheses seeded:** H1-H8 in WS2-mvp/docs/HYPOTHESES.md
**Experiences built:** H1-proactive-credit, H2-silent-outreach in WS2-mvp/app/experiences/
**Demo reference:** 7 scenarios in WS0-demo showing what's already designed
