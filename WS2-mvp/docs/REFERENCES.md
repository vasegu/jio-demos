# Jio CX — Reference Material

## Key Documents

| Document | Location | What it contains |
|----------|----------|-----------------|
| Jio Sessions 1 & 2 Transcript | `vasegu/jio-demos/jio-sessions-1-2-extract.md` | 437 lines. Full workshop transcript from Day 1-2. US market landscape, CX vision, Mark's demos, Jio's tech stack |
| North Star Deck v0.1 | Vasco's Desktop (`Jio v0.1_NorthStar.pdf`) | 26 slides. JV workstreams, squad structure, pricing, ADLC, Jio OS vision, architecture |
| Jio Demo App | `vasegu/jio-demos/app/` | React/Vite app built overnight. CX intelligence prototype. Jio brand system |
| Mark's Day 3 Notes | Vault: `Granola/2026/03/2026-03-19 - Jio Workshop Day 3 CX Deep Dive.md` | CX deep dive outcomes, data metrics, Jio Buddy agreement |

## Jio's Existing Tech Stack

From session transcript and North Star deck:

### JioBrain — AI Platform
- Industry-agnostic AI platform sitting on top of everything
- Mosaic AI Agent Framework for multi-agent orchestration
- MCP (Model Context Protocol) for agent communication
- 5 specialist agents: Plan, Network, Retention, Care, Upsell

### Data Platform
- **Databricks Unified Lakehouse** (Delta Lake + ODD)
- 180K+ attributes in Gold datasets
- Feature store for ML models
- MLflow for model registry, A/B testing, explainability, drift detection
- **This is where we connect.** Our Basecamp runs on their Databricks.

### JioGridX — Network Digital Twin
- 147 million micro-grids enabling precise visibility
- 320 billion events from 500M subscribers mapped in real-time
- Autonomous root cause engine (AI detects, diagnoses, fixes)
- Zero-touch field orchestration
- Closed-loop learning flywheel

### Existing Digital Assistant
- HelloJio / Haptik intelligent virtual assistant
- 700+ query coverage, FAQs, troubleshooting flows
- Multilingual chat already lives in MyJio app
- **Jio Buddy replaces/evolves this** — from FAQ bot to persistent AI companion with memory

### Customer Identity
- Jio ID / MyJio login
- OTP flows
- Multi-account management (mobile, Fiber, JioFi, business)
- Profile data already standardized
- **This is the customer identifier we need to track across tables**

## Industry Benchmarks (for Basecamp §6)

### Telecom CX Benchmarks (pre-research for Basecamp)
- Average telco churn rate globally: 1.5-2% monthly (Jio's 0.9% is industry-leading)
- Average NPS for telcos: 20-35 (varies by market)
- Digital containment best-in-class: >90% (Jio at 98% is exceptional)
- Average handle time for telco calls: 6-8 minutes
- First call resolution industry average: 70-75%
- Network complaints as % of total contacts: typically 30-40%

### India Telecom Specifics
- Market: 1.14B subscribers total, ~40% Jio share
- Competitors: Airtel (~35%), Vodafone Idea (~20%), BSNL (~5%)
- Prepaid dominance: ~95% of Indian mobile subscribers are prepaid
- ARPU: Jio ~₹203/month (~$2.40), industry average lower
- MNP (Mobile Number Portability): available since 2010, streamlined process
- Regulatory: TRAI oversees tariffs, QoS standards, MNP process

## Jio Data Schema — Expected Tables (Pre-Basecamp)

Based on workshop context, we expect to find tables covering:

| Expected Table | Contents | Key Columns (likely) |
|----------------|----------|---------------------|
| Customer profiles | Subscriber demographics, plan, tenure | jio_id, plan_type, activation_date, location_grid |
| Network events | The 600-700 events/day/customer | customer_id, event_type, timestamp, tower_id, severity |
| Care interactions | Digital + agent contacts | customer_id, channel, category, resolution, timestamp |
| MNP/Churn | Port-in/port-out records | customer_id, mnp_date, direction (in/out), destination_operator |
| NPS scores | Survey responses per journey | customer_id, journey_type, score, timestamp |
| Billing | Plan, charges, payments | customer_id, plan, amount, payment_date |
| GridX network health | Per-tower/grid metrics | grid_id, tower_id, traffic_gb, latency_ms, coverage_dbm, drops |
| Ecosystem services | JioCinema, JioMart, JioFiber usage | customer_id, service, usage_metrics, timestamp |

**NOTE:** These are assumptions based on workshop discussion. Basecamp will discover the actual schema. Don't lock onto these — let the data tell us what's there.
