# FINDINGS

## H4 — Complaint Fingerprint Signal  |  2026-03-27  |  HIGH confidence
Network QoS drops in specific pattern 24-48h before customer contacts IVR.
Evidence: 2.1M events, 81% precision. Covers 23% of all contact volume.
Status: Passes gate → Ticket VAS-14 | Experience: pending scaffold

## H2 — Silent Sufferers  |  2026-03-25  |  MEDIUM confidence
Customers with worst QoS metrics have highest 90-day churn, almost never complain.
Evidence: 680K accounts, 3.4x churn rate vs. complainers. Privacy: OK.
Status: Passes gate → Ticket VAS-13 | Experience: H2-silent-outreach in dev

## H1 — Network Degradation → MNP  |  2026-03-24  |  HIGH confidence
SINR degradation + competitor tower proximity predicts port-out 72h in advance.
Evidence: 4.2M events, 78% precision, 15% recall. 4.5M/month at stake.
Status: Passes gate → Ticket VAS-12 | Experience: H1-proactive-credit in dev
