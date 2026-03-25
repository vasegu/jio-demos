# Pre-Built Hypotheses for Jio CX

These hypotheses are derived from the March 17-19 workshop, Mark's Day 3 CX deep dive notes, and the North Star deck. They should be fed to Go Hunt as starting points after Basecamp completes schema discovery.

Ranked by expected impact × data availability.

---

## H1: Churn Precursor Signal (HIGHEST PRIORITY)

**Hypothesis:** Customers who experience >N network degradation events within a 7-day window are X times more likely to churn (MNP port-out) within 30 days.

**Why it matters:** 0.9% monthly MNP churn = ~4.5M customers/month. Even a 10% reduction = 450K saved subscribers. If we can identify the signal window, Jio Buddy can intervene proactively.

**Data needed:** Network event logs (600-700 events/customer/day), MNP churn flags with dates, customer IDs linking both.

**Expected finding pattern:** "Customers with >5 coverage drops in 7 days churn at 3x the base rate within 30 days."

---

## H2: Silent Sufferers

**Hypothesis:** A significant segment of customers have poor network metrics (frequent drops, slow speeds, coverage gaps) but never contact care. These "silent sufferers" churn at higher rates than complainers because they've already decided to leave.

**Why it matters:** 98% of interactions are digital, only 2% reach agents. The dangerous customers aren't the ones calling — they're the ones quietly experiencing bad service and leaving. Jio Buddy's proactive outreach should target this segment first.

**Data needed:** Network quality metrics per customer, complaint/contact history, churn flags.

**Expected finding pattern:** "12% of customers experience below-threshold network quality but have zero care interactions. Their churn rate is 2.5x higher than customers who complain."

---

## H3: Venter vs Genuine Issue Classification

**Hypothesis:** Contact center and digital interactions can be classified into "venters" (emotional, no actionable fix) vs "genuine issue holders" (specific technical problem, fixable). The event patterns preceding each type differ predictably.

**Why it matters:** Mark's notes say "most network complaints are not solvable by agents in real time — customers call to vent." If we can classify this in data, Jio Buddy can route differently: empathy + proactive credit for venters, technical resolution for genuine issues.

**Data needed:** Interaction logs with resolution codes, network event history preceding interaction, NPS post-interaction.

---

## H4: Complaint Precursor Pattern

**Hypothesis:** There is a detectable pattern in the network event stream 24-48 hours before a customer contacts care. This "complaint fingerprint" can be used to trigger proactive outreach before the customer picks up the phone.

**Why it matters:** If Jio Buddy can detect the complaint fingerprint and intervene (proactive SMS, in-app notification, automatic credit), the customer never needs to call. This is the "zero-complaint" North Star.

**Data needed:** Timestamped network events, timestamped care contacts, 48-hour lookback window.

---

## H5: NPS Driver Analysis

**Hypothesis:** Specific event types in the 600-700 daily events disproportionately drive NPS score changes. Network quality events (drops, speed degradation) have more impact than billing or service events.

**Why it matters:** Jio tracks NPS per journey. If we can map which events most strongly predict NPS decline, Jio Buddy knows exactly what to protect against.

**Data needed:** Per-customer NPS scores with timestamps, network event logs, interaction logs.

---

## H6: Proactive Intervention Window

**Hypothesis:** For customers who eventually churn, there was a specific window (7-14 days before MNP request) where the right intervention (proactive credit, plan optimization, personal outreach) could have retained them. The window has a detectable signature in the event stream.

**Why it matters:** Churn is 0.9% monthly but Jio is net positive on port-ins. If we can catch even a fraction of the 4.5M monthly churners in their "decision window," the business impact is massive.

**Data needed:** MNP request dates, full event history 30 days prior, any intervention/outreach history.

---

## H7: Geographic Experience Clustering

**Hypothesis:** Customer experience quality clusters geographically, with single-tower villages and high-density urban areas showing distinct degradation patterns. The pattern is predictable from network topology.

**Why it matters:** Mark's notes mention "SMS can't be delivered if the network is down in single-tower villages" — there's a specific proactive communication problem here. Different geography types need different Jio Buddy strategies.

**Data needed:** Customer location/grid data (JioGridX has 147M micro-grids), network events by grid, complaints by grid.

---

## H8: Cross-Sell Readiness Signal

**Hypothesis:** Customers who are satisfied with one Jio service and show specific usage patterns are receptive to ecosystem expansion (mobile → fiber → entertainment → finance). The "ready to cross-sell" moment can be detected in the event stream.

**Why it matters:** Jio is a super-app. Revenue growth comes from ecosystem depth, not just subscriber count. If Jio Buddy can identify the right moment to suggest "you'd love JioFiber based on how you use mobile data," that's personalized upsell at 500M scale.

**Data needed:** Multi-service subscription data, usage patterns across services, cross-sell campaign response history.

---

## Meta-Hypothesis: The "6 Weeks to 3 Hours" Equivalent

The Stellantis demo landed because of one number: "6 weeks of analyst work compressed to 3 hours." For Jio, the equivalent might be:

- "We found X in 48 hours that your team hasn't surfaced in Y months of monitoring"
- "This signal predicts churn 14 days before MNP request — your current system detects it at 0 days"
- "4.5M monthly churners × $Z ARPU × intervention success rate = $XXXM annual save"

The finding needs to be: specific, surprising, tied to revenue, and impossible to have found without our methodology.
