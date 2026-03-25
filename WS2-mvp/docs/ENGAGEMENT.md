# Jio CX Engagement Brief

## The Deal

Accenture × Reliance Jio joint venture. Board-level partnership (Julie Sweet ↔ Mukesh Ambani origins). Five workstreams leading to a formal JV that sells Jio's indigenous telco platform + Accenture's AI/implementation capability to the top 30-50 global telcos.

Our scope: **Workstream 1 — AI Native Ways of Working for Jio**, specifically **Customer Experience Interventions**.

## What We're Proving

**This is NOT a JAR (Journey Analytics Record) engagement.** The rx-skills pipeline was built for deep journey analytics — discovering unknown patterns in process data. For Jio, the mission is different:

**Can we confirm that the CX experiences promised in the North Star deck are actually achievable with Jio's data?**

The deck promises: proactive network diagnosis, personalized plan optimization, churn prediction, cross-sell at the right moment, Jio Buddy with persistent memory. These are promises made to Jio C-suite and Accenture GMC. Our job is to get into the data FAST and confirm:

1. **Is the data there?** Do the tables exist to support each promised experience?
2. **Is the signal there?** Can we actually find churn precursors, complaint fingerprints, cross-sell moments in the event stream?
3. **What's missing?** What gaps in the data would block delivery of specific experiences?
4. **What can we show quickly?** Which promised experience can we prototype first as proof?

The success metric isn't "surprise the room with a finding" (though that's great if it happens). It's **"confirm we can deliver what we promised, and show the first proof."**

Secondary goal: produce a concrete finding that demonstrates the methodology works at Jio scale — the kind that makes a room go quiet. The Stellantis equivalent: "3% of tickets close without the customer trying = 90% reopen rate."

## The Client

**Jio (Reliance)** — India's largest telecom operator.
- 500 million subscribers
- Super-app covering mobile, fiber, entertainment (JioHotstar), finance, shopping (JioMart), cloud
- Already has a 4-layer agentic architecture: signal → intelligence (Databricks + Mosaic AI) → orchestration (MCP, 5 specialist agents) → action (closed-loop, no human)
- 320 billion events mapped in real-time via JioGridX (147M micro-grids)
- Indigenous 5G stack, now selling internationally
- **They are NOT greenfield.** Don't tell them how to build a digital telco — they already are one.

## The Data Landscape

From Day 3 workshop (March 19, Mark Farbrace's notes):

### Volume
- **600-700 events per customer per day**, 30-day history retained
- 500M subscribers = ~300-350 billion events per month
- Extensive data collection for root cause analysis and network optimization

### Care Model
- **98% of interactions are digital** (app, IVR) — only 2% reach contact center advisors
- Most network complaints NOT solvable by agents or digital channels in real time
- Customers often call to vent rather than expecting a fix

### Key Metrics Already Tracked
- NPS (overall and per journey)
- Customer complaints (real-time for process breakage)
- Churn at MNP individual level
- **Monthly MNP churn: 0.9%** — Jio is net positive in port-ins vs port-outs

### Call Drivers
**Mobility:** network issues (slow speed, coverage, connectivity) are predominant. Billing/plan queries secondary.
**Home services:** frequent disconnection, no internet, slow speed > billing > device/OTT issues.

### Proactive Communication
- Network outage comms limited (SMS can't reach if tower down in single-tower villages)
- Home services: robust proactive comms via SMS, WhatsApp, service gestures
- Rebates only for abnormal large-scale outages (natural disasters), NOT routine congestion

## What Success Looks Like

### For the 90-Day Track
Two parallel deliverables:
1. **Network improvement via agentic/AI** — anticipate and resolve issues before customer notices
2. **Jio Buddy prototype** — AI-powered personalized agent with memory, multi-channel (voice, chat, app, set-top box), Hindi + local languages

### For THIS Data Dive (First 48 Hours)
One finding that demonstrates our methodology works on their data at their scale. Candidates:

1. **Churn prediction signal** — what network events in the 600-700/day stream predict MNP churn within 30 days? (0.9% monthly = ~4.5M churners)
2. **Complaint precursor pattern** — what happens in the event stream 24-48 hours before a customer calls to complain?
3. **Venter vs genuine** — can we distinguish customers who call to vent (no fix needed) from those with real issues? What's the event signature?
4. **NPS correlation** — which of the 600-700 daily events most strongly correlate with NPS score changes?
5. **Proactive intervention window** — for customers who eventually churn, was there a moment where proactive outreach could have saved them?
6. **Single-tower villages** — which geographies have the worst customer experience and what does the event pattern look like there?
7. **Cross-sell signal** — what interaction patterns predict receptivity to plan upgrades or ecosystem expansion (mobile → fiber → entertainment)?
8. **Silent sufferers** — customers with terrible network metrics who NEVER complain. Are they about to churn?

### The Presentation Frame
When we demo to Mark (and eventually to Jio C-suite):
- Lead with the finding, not the tech
- Use their data, not generic benchmarks
- "6 weeks to 3 hours" became the Stellantis catchphrase — find the Jio equivalent
- The audience includes Aayush Bhatnagar (SVP Tech R&D, built their 5G stack) — he will evaluate technical credibility
- Mark Farbrace frames commercially — give him a number he can put on a slide

## The Vision We're Building Toward

### Jio OS — "Your Personal Operating System"
The intelligent layer that truly understands you and quietly orchestrates your network, home, work, and family life.

Path: Today (Jio is a Service) → 90 Days (Jio is my Partner) → 12 Months (Jio is my Operating System)

What makes it irreversible: **Memory Moat** (deep, lifelong memory nobody can replicate), Zero Effort, Personalized, Trustworthy.

North Star: **zero-complaint, anticipatory experience** — eliminate the need for a call center entirely.

### How Our Data Dive Feeds This
Every finding we produce should point toward the Jio Buddy vision. We're not just doing analytics — we're finding the signals that Jio Buddy will use to be proactive. "We found that customers who experience X are 4x more likely to churn → Jio Buddy should detect X and intervene."

## Stakeholders

### Jio Side (present at workshop)
- **Aayush Bhatnagar** — SVP Technology R&D. Technical gatekeeper. Built 5G stack and JioBrain.
- **Saurabh Sancheti** — CFO. His presence = deal conversation.
- **Kiran Thomas** — President. Innovation/platforms. Stanford MBA. Architect of Jio.
- **Dan Bailey** — President (International). Ex-Deutsche Bank. Global expansion.
- **Anish Shah** — President & COO. Digital platforms & IT.
- **Suman** (surname TBD) — drafting CX pain points
- **Madhav** (surname TBD) — drafting CX pain points

### Accenture Side
- **Francesco Venturini** — GMC, deal sponsor. Not day-to-day.
- **Mark Farbrace** — MD, RX lab. Handles optics, C-suite, deal governance.
- **Sharad Sachdev** — MD, GenAI/Data. Drafting pain points with Jio. Agentic AI for telecom.
- **Vasco** — CX Development Lead. Runs the squad, travels, makes technical decisions.
