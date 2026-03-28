# Situation Context — Jio CX

> Read this at Phase 0 intake of any skill run. Apply as interpretation frame throughout.
> This file adapts generic discovery skills to the Jio CX engagement without forking them.

## What We're Building
Jio Buddy: a proactive voice agent that knows everything that's happened to the customer — even when they weren't talking.

Jio Buddy acts on signals across the full CX lifecycle — not just churn prevention, but proactive offers, experience improvements, cross-sell moments, and deflecting contact centre calls before they happen.

**Architecture:** Signal Layer (Flink/Kafka) → Memory Store (Firestore/Databricks) → ADK Agent (Gemini 2.5 Flash) → Voice (Gemini Live API / IndicWhisper)

**Full spec:** ../WS2-mvp/docs/ARCHITECTURE.md

**Timeline:** June 30 live in 2 regions. NPS + CX lift measured.

---

## The Lens: Signals, Not Root Causes

We're not finding what's broken. We're finding **SIGNALS** — measurable events in the data that should trigger Jio Buddy to act.

**Generic discovery:** "Here's a pattern. Here's why it exists."
**Jio CX discovery:** "Here's a signal. Here's when Jio Buddy should act on it."

Every finding must answer five questions:

1. **Signal** — What is the specific measurable event in the data?
   - Example: "SINR drops >15dB in 72h window"
   - Example: "Zero data usage for 7 consecutive days"
   - Example: "Customer mentions travel destination in chat"
   - Example: "Complaint file opened + specific keywords (network, slow, dropped)"

2. **Lead time** — How far ahead does it appear?
   - Example: "72h before MNP port-out"
   - Example: "48h before customer contacts IVR"
   - Example: "2–5 days before stated travel date"
   - Example: "Real-time signal during conversation"

3. **Intent** — Why are we acting? Choose one:
   - **PREEMPT:** Stop a negative outcome (e.g., churn, contact centre call)
   - **CROSS-SELL:** Offer complementary service at the right moment (e.g., roaming pack before travel)
   - **IMPROVE:** Enhance experience or reduce friction
   - **RESELL:** Re-engage or upsell existing customer
   - **PREVENT-CONTACT:** Deflect inbound contact centre contact
   - **CELEBRATE:** Proactively reward positive moments — loyalty milestones, good behavior, unexpected delight

4. **Type** — LIVE or DEFERRED?
   - **LIVE:** Trigger agent outreach now (within hours). Act while signal is hot.
   - **DEFERRED:** Store in memory, retrieve when customer next contacts. "We noticed…"

5. **Jio Buddy behavior** — What does the agent say or do with this signal?
   - Example LIVE (preempt): "Your network is struggling. Here's ₹50 credit to help you through."
   - Example LIVE (cross-sell): "Heading to Singapore? Want me to activate your usual SE Asia pack?"
   - Example DEFERRED (improve): "We noticed you had signal issues last week. You're all set now, but here's a credit."

---

## Signal Taxonomy

Use this to map data discoveries to signal types and intents.

| Signal Type | Examples | Intent(s) | Lead Time | LIVE/DEFERRED | TTL (Time to Live) |
|-------------|----------|-----------|-----------|---------------|-------------------|
| **Network** | SINR degradation, RSRP drops, packet loss, handoff failures, tower proximity to competitor | PREEMPT, RESELL | 24–72h | DEFERRED → LIVE | 48–72h |
| **Behavioral** | Rage quits, session drops, zero-usage cliffs, device usage patterns, streaming hours | IMPROVE, PREVENT-CONTACT | 7–30d or real-time | DEFERRED or LIVE | 7–14d |
| **Transactional** | Payment failures, recharge timing, plan downgrades, MNP inquiry patterns | RESELL, PREVENT-CONTACT | Concurrent to 14d | DEFERRED or LIVE | 14d |
| **Contextual** | Travel statements, study time patterns, family plan usage, stated intent ("going to Singapore") | CROSS-SELL, IMPROVE | Real-time or near-term | LIVE | Until stated event passes |
| **Temporal** | Complaint timing patterns, planned maintenance windows, predictive events (IPL tonight, Diwali week) | PREVENT-CONTACT, IMPROVE, PREEMPT | Varies (historical) or near-term (predictive) | DEFERRED or LIVE | 30d |
| **Composite** | App fail → IVR escalation within 30m, speed test initiation, post-complaint recurrence, competitor app + MNP inquiry | PREVENT-CONTACT, PREEMPT, RESELL | Real-time (app) to 10d (recurrence) | LIVE | Session-scoped or 10d |
| **Onboarding** | New SIM no data usage 7d, feature activated but unused 14d, first bill confusion, new customer app not downloaded | IMPROVE, PREVENT-CONTACT | 0–90 days from activation | LIVE or DEFERRED | 90d from activation |
| **Device** | 3G device in 4G coverage area, dormant SIM 90+ days inactive, app crash frequency, device type mismatch | CROSS-SELL, RESELL, PREEMPT | Real-time or 30d pattern | LIVE or DEFERRED | 30d |
| **Loyalty** | 5-year anniversary, 100th recharge, perfect payment history N years, referred 3+ friends | CELEBRATE | Milestone date or event | LIVE | Event-date triggered |

---

## Where to Find Contextual Signals

Contextual signals (travel mentions, life events, usage intent) don't live in network or billing tables. They come from conversational and interaction data.

When running /basecamp or /go_hunt, explicitly check for:

| Data Source | What to Look For | Signal Examples |
|-------------|-----------------|-----------------|
| IVR transcripts / call logs | Keywords: travel, destination, roaming, children, school, study | Cross-sell, improve |
| Chat / messaging logs | Stated intent, questions about plans, implied needs | All intents |
| App session logs | Feature usage patterns, screen flow drop-offs, high-usage times | Improve, prevent-contact |
| Account preferences | Stated family size, device inventory, device types | Cross-sell, resell |
| Recharge history | Roaming pack purchase history, timing patterns, plan add-ons | Cross-sell |

**If these data sources don't exist in Supabase/Databricks:** Flag as a data gap — contextual signals require them.

---

## Check These Before Hypothesizing

- **Known findings:** ../FINDINGS.md — don't duplicate signals already discovered. Add to it, don't re-discover.
- **Seeded hypotheses:** ../WS2-mvp/docs/HYPOTHESES.md — H1-H8 with data requirements. Check what's already scoped.
- **Demo scenarios:** ../WS0-demo — 7 scenarios already designed and built (Slow Wi-Fi, Singapore Trip, Match Night, Running Low, Weekly Shop, Pay Contact, Home). These are inspiration for what experiences look like — they do not limit what signals discovery can validate.

---

## What a "Good Finding" Looks Like for Jio CX

### Example 1: Churn Prevention Signal

| Field | Value |
|-------|-------|
| **Signal** | Network SINR drops >15dB within 72h window |
| **Lead time** | 72h before MNP port-out |
| **Intent** | PREEMPT |
| **Type** | DEFERRED → LIVE |
| **Behavior** | "We noticed your signal dropped. Here's ₹100 credit." |
| **Evidence** | 4.2M events analysed, 78% precision, 15% recall. Covers ~4.5M customers/month. |
| **Governance** | ✓ Passes gate: data quality A-grade, privacy compliant, intervention scope clear |

### Example 2: Cross-Sell Signal

| Field | Value |
|-------|-------|
| **Signal** | Customer mentions travel + has roaming pack history |
| **Lead time** | 2–5 days before stated travel date |
| **Intent** | CROSS-SELL |
| **Type** | LIVE |
| **Behavior** | "Heading to Singapore? Want me to activate your usual SE Asia pack?" |
| **Evidence** | 127K travel mentions/month, 68% prior roaming user conversion, offer ROI +320%. Privacy: chat transcript + travel declared. |
| **Governance** | ✓ Passes gate: contextual offer (no location tracking), customer opt-in via chat, clear value |

---

## What a "Bad Finding" Looks Like (Does Not Pass)

| Issue | Example |
|-------|---------|
| No signal → no behavior | "Customers with bad network metrics have higher churn" (pattern, not actionable signal) |
| No lead time | "Network degradation happens when customers churn" (concurrent, not predictive) |
| No intent | "3% of customers never use data" (insight, but what does Jio Buddy do?) |
| Intervention unclear | "Poor network quality in rural areas" (true, but what's the action?) |
| Privacy violation | "Target customers from competitor's network near their home" (location inference + identity) |
| No evidence | "We think customers want roaming packs when travelling" (hypothesis, not validated) |

If you can't answer all five questions, the finding is not ready for Jio CX. Run /go_hunt to re-frame or deprioritize.

---

## Contact Governance

Before any signal triggers a LIVE outreach, all findings must respect these constraints:

**Frequency policy:**
- Max 2 proactive contacts per customer per 30 days (any channel combined)
- Min 48h between any two contacts to the same customer
- If customer opts out of proactive contact: suppress all LIVE signals, store DEFERRED signals (retrieve on next inbound contact)

**Priority order when multiple signals fire simultaneously:**
1. **PREEMPT** — Customer is in active pain (network failure, payment issue)
2. **PREVENT-CONTACT** — Inbound contact imminent (payment due, complaint flag, repeated outage)
3. **RESELL** — Churn risk (competitor signal, MNP inquiry, engagement cliff)
4. **IMPROVE** — Experience degradation (feature adoption, support efficiency)
5. **CROSS-SELL** — Opportunity, not urgency (travel moment, plan upgrade timing)

**Channel preference:**
- Check customer's last successful contact channel
- Default to in-app notification → SMS → voice (ascending intrusiveness)
- PREEMPT and PREVENT-CONTACT signals may escalate to voice regardless of stated preference

**Guardrails in every experience brief:**
Every finding that proposes a LIVE outreach MUST include guardrail checks that enforce the frequency policy (see Guardrails section in EXPERIENCE-BRIEF-TEMPLATE.md).

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
- Phase 2: Hunt for signals across all six intents, not just churn prevention. Look for composite signals (cross-table patterns) and geographic clusters.
- **Geographic clusters:** When signals fire for 50+ customers in the same postcode simultaneously, flag as area-level signal (e.g., tower fault, planned maintenance impact) → triggers coordinated individual outreach.
- Phase 4 governance gate: A finding passes if it answers all five questions (Signal, Lead time, Intent, Type, Behavior). If not, return to Phase 2 or deprioritize.
- Phase 5: Scaffold hypothesis skills using local template (gets Jio CX Behavior section with Intent mapping automatically)

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
