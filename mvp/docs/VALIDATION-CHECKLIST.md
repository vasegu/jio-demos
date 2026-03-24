# CX Experience Validation Checklist

The North Star deck promises specific customer experiences. Our data dive must confirm each is feasible with Jio's actual data. This is the checklist to work through on Day 1.

## Top Experiences (from Deck Slide 19)

| # | Experience | What it does | Data needed to confirm | Status |
|---|-----------|-------------|----------------------|--------|
| 1 | **Ask Anything** | Voice + visual responses to user queries | Interaction logs, FAQ coverage, query classification | ⬜ |
| 2 | **Life Slices** | Manages internet speed and app access for data control | Per-customer bandwidth data, app usage, device inventory | ⬜ |
| 3 | **Proactive Network Diagnosis** | Monitors and alerts users to potential network issues | Network event stream (600-700/day), customer notification history | ⬜ |
| 4 | **The Traveler** | Adjusts roaming settings based on travel location | Location data, roaming events, plan features | ⬜ |
| 5 | **Buy X Top-up/Booster** | Simplifies data top-ups and boosters | Usage patterns, top-up history, plan exhaustion events | ⬜ |
| 6 | **Re-order Last Groceries** | Quick reordering of last purchases | JioMart order history (cross-ecosystem) | ⬜ |
| 7 | **Pay Someone / Check Balance** | Facilitates payments and balance checks | JioMoney/UPI transaction data, balance queries | ⬜ |

## What Accenture Promised to Build (from Deck Slide 20)

| # | Capability | What we said we'd build | Data dependency | Status |
|---|-----------|------------------------|----------------|--------|
| 1 | **Voice + Multimodal Layer** | Multilingual ASR/TTS, in-app conversation shell | Existing HelloJio/Haptik integration points, language distribution data | ⬜ |
| 2 | **AI Orchestration & Intent Engine** | Telecom-specific NLU, tool orchestration, LLM wrapper | Query logs, intent classification data, API catalog | ⬜ |
| 3 | **Lightweight OS Memory & Context** | Interaction memory, preference store, telecom hints | Session data, preference signals, device/SIM metadata | ⬜ |
| 4 | **AI Recommendation & Diagnostics** | Plan recommendation, network diagnostics, roaming helper | Plan comparison data, network health per customer, roaming events | ⬜ |
| 5 | **Guardrails, Consent & Audit** | Action confirmation policies, voice audit, user controls | Consent records, action history, compliance requirements | ⬜ |

## Jio Buddy Core Capabilities (from Day 3 Agreement)

| # | Capability | Data validation question | Status |
|---|-----------|------------------------|--------|
| 1 | **Memory across interactions** | Can we link interactions over time by customer ID? How far back? | ⬜ |
| 2 | **Network troubleshooting** | Can we correlate network events to specific customer complaints? | ⬜ |
| 3 | **Cross-sell/upsell** | Can we see multi-service usage patterns (mobile + fiber + entertainment)? | ⬜ |
| 4 | **Proactive engagement** | Can we detect "about to have a bad experience" signals in real time? | ⬜ |
| 5 | **Hindi + local language** | What's the language distribution in the data? Do interaction logs capture language? | ⬜ |
| 6 | **Multi-channel (voice, chat, app, STB)** | Are interactions tagged by channel? Can we link same customer across channels? | ⬜ |

## Day 1 Priority Order

When Databricks access arrives, validate in this order:

1. **Customer ID linkage** — can we track one person across all tables? (if no, everything else is blocked)
2. **Network event stream** — is the 600-700 events/day claim real? What event types exist?
3. **Churn/MNP data** — do we have port-out dates we can use as outcome variable?
4. **Interaction history** — can we see care contacts with timestamps and channels?
5. **NPS data** — do we have survey scores linked to customers?
6. **Cross-ecosystem** — can we see JioMart/JioCinema/JioFiber alongside mobile?

If #1 works and #2-3 are real, we can confirm the core Jio Buddy promise within hours.
