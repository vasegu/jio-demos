# Experience Brief: [H# — Name]

**Status:** Vetted
**Date:** YYYY-MM-DD
**Confidence:** HIGH / MEDIUM
**Linear Ticket:** [VAS-##]
**Experience folder:** `app/experiences/[slug]/`

---

## What This Does

[2-sentence plain English summary. What Jio Buddy does. When. Why it matters.]

**Example:** "When we detect your network signal dropping, Jio Buddy calls you within 2 hours to let you know we've added ₹50 credit to your account. This prevents angry calls to support and gives you peace of mind when connectivity matters most."

---

## Signal

| Field | Value |
|-------|-------|
| **Trigger** | [Specific data event and threshold, e.g. "SINR drops >15dB within 72h"] |
| **Source** | [Data table / stream, e.g. "network_events"] |
| **Lead time** | [X hours/days before customer pain peaks, e.g. "72h before MNP port-out"] |
| **Type** | LIVE / DEFERRED |
| **Coverage** | ~[N]M customers/month at risk |

---

## Customer Problem We're Solving

[1-2 sentences. What the customer experiences. Why this moment matters to them.]

**Example:** "When network signal drops unexpectedly, customers don't know if it's their device, their plan, or the network. Without reassurance, they assume the worst and start researching competitor plans. We catch them in that moment of doubt and turn it into trust."

---

## CX Impact

| Metric | Target |
|--------|--------|
| **Churn reduction** | [X% reduction in port-out rate within 90d] |
| **IVR deflection** | [Y% of potential support contacts avoided] |
| **NPS lift (cohort)** | [+Z NPS points within 90d] |
| **Revenue protected** | [₹Xk/month in retained customer value] |

---

## What Jio Buddy Says

**Channel:** [Voice push immediately / Stored in memory, recalled on next contact]
**Timing:** [e.g., "within 2 hours of signal firing" or "when customer next opens app"]

> "[**Exact voice script with [VARIABLE] placeholders**]"
>
> Example: "Hi [customer_name], we noticed you were offline for [duration]. Sorry about that — here's [credit_amount] credit that should help you stay connected."

**Personalization variables:**
- `[customer_name]` — customer's first name
- `[duration]` — how long they were offline (e.g., "30 minutes")
- `[credit_amount]` — credit being offered (e.g., "₹50")
- [add others specific to this experience]

**Offer / Action:**
- [e.g., "₹50 credit auto-applied to account"]
- [e.g., "Callback within 1 hour if customer presses 1"]
- [e.g., "Link to plan explanation video"]

---

## Evidence

| Metric | Value |
|--------|-------|
| **Events analyzed** | [N] |
| **Precision** | [X%] |
| **Recall** | [Y%] |
| **Sample period** | [date range, e.g., "Jan–Mar 2026"] |
| **Confidence** | [HIGH / MEDIUM / LOW] |

---

## Guardrails (Who NOT to Target)

- [ ] Already received this intervention in past 7 days
- [ ] Has open complaint ticket in system
- [ ] In churn-offer cooldown period (recent retention offer)
- [ ] VIP / enterprise account flag set
- [add engagement-specific constraints]

---

## Build Spec for WS2-mvp

| Need | Detail |
|------|--------|
| **Signal listener** | [Which event stream to subscribe to, e.g., "network_events Kafka topic"] |
| **Memory schema** | [What to store about this signal, e.g., "{customer_id, event: 'offline', duration, timestamp}"] |
| **Trigger condition** | [Exact threshold in code, e.g., "SINR < 0 for >15dB drop"] |
| **Voice pipeline** | [Which TTS/voice system, language code] |
| **Offer API** | [Which system to call for credit, e.g., "billing/apply_credit with amount"] |
| **Guardrail checks** | [Database queries to check each guardrail before intervening] |
| **Rollout scope** | [% of customer base, regions, plan tiers to start with] |

---

## Next Steps

- [ ] WS2-mvp: Create experience folder at `app/experiences/[slug]/`
- [ ] WS2-mvp: Implement signal listener
- [ ] WS2-mvp: Integrate voice script and personalization
- [ ] WS2-mvp: Test with mock signals
- [ ] Shadow release: Monitor precision and customer response
- [ ] Full release: Validate CX impact metrics
