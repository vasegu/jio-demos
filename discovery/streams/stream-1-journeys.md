# Stream 1: Agentic Journey Analysis

**Owner:** TBD
**Timeline:** Week 1-2
**Question:** Which experiences should we create?

## Objective

Identify and prioritize the customer signals and interventions that deliver the most value with acceptable feasibility.

## Core Hypothesis

> A customer whose signal drops (network outage, app crash, rage quit) is at high churn risk. Proactive outreach when they return - before they complain - converts a negative moment into loyalty.

## Signal Inventory

### Network/Connectivity Signals
| Signal | Detection Method | Data Source | Priority |
|--------|-----------------|-------------|----------|
| Network drop | Connection state change | Network logs | P0 |
| Extended offline period | Timestamp delta | Session data | P0 |
| Repeated reconnection attempts | Event frequency | App telemetry | P1 |
| Coverage gap (known dead zone) | Location + history | Geo + network | P2 |

### Behavioral Signals
| Signal | Detection Method | Data Source | Priority |
|--------|-----------------|-------------|----------|
| Rage quit (abrupt session end) | Session termination pattern | App events | P1 |
| Support page visit without ticket | Page view + no action | Web analytics | P1 |
| Competitor research (?) | TBD | TBD | P2 |
| Payment failure retry | Transaction logs | Billing | P1 |

### Contextual Signals
| Signal | Detection Method | Data Source | Priority |
|--------|-----------------|-------------|----------|
| Cricket match + buffering | Event correlation | Content + QoS | P1 |
| Work hours + outage | Time + connectivity | Calendar hint + network | P2 |
| Travel + roaming issues | Location change + service | Geo + billing | P2 |

## Intervention Matrix

| Trigger | Intervention | Channel | Timing |
|---------|--------------|---------|--------|
| Back online after drop | Voice push: "Sorry, here's a discount" | Voice (ADK) | Immediate |
| Extended offline resolved | SMS + app notification | Multi | Within 5 min |
| Rage quit detected | Proactive support callback | Voice | Next session |
| Payment retry success | Thank you + loyalty bump | Push | Immediate |

## Privacy & Data Access

### Required Data
- [ ] Network event logs (connection state, quality)
- [ ] App session telemetry
- [ ] Customer profile (for personalization)
- [ ] Billing/transaction history

### Privacy Constraints
- Consent model: Opt-in for proactive outreach?
- Data residency: India local processing required?
- Retention: How long can we store signal history?

### Access Status
- [ ] Databricks access (pending - due March 26)
- [ ] Real-time event stream
- [ ] Customer profile API

## Ranking Criteria

Score each opportunity:
1. **Value** (1-5): Impact on churn, NPS, revenue
2. **Feasibility** (1-5): Data available, tech complexity, privacy clear
3. **Speed** (1-5): Can demo in 2 weeks?

## Output

By end of Week 1:
- Ranked list of 3-5 intervention opportunities
- Clear recommendation for prototype focus
- Data access requirements documented
