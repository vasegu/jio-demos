# 100-Day Sprint Plan — CX Workstream

Sprint start: March 24, 2026
Deadline: June 30, 2026 (Kiran Thomas's three tests)

## June 30 Success Criteria (from Kiran Thomas, March 23)

1. **Compelling showcase** toward level 4 autonomous telco. Directionally there, question marks removed.
2. **IP clean and JV-ready.** Due diligence showstoppers removed. Product punch list complete.
3. **Market validation.** 2-3 friendly customer conversations validating the value proposition.

Our CX contribution to this: a Jio Buddy demo that shows proactive, personalised customer experience powered by real data, with a clear path to production.

## Where We Are Right Now

- Databricks access requested, pending infosec approval
- Teams group with Jio data team requested
- Song design candidates being sourced via James Gunn
- No squad staffed beyond Vasco + incoming lead (TBD)
- We have not seen the data schema
- We have not confirmed agent framework maturity (designed vs deployed)
- We have not confirmed API availability for proactive actions

## Phase 0: Before Data Access (Now to ~March 28)

What we can do without data access:

| Task | Owner | Status |
|------|-------|--------|
| Follow up with Manoj Mhatre and Rahul Joshi on Databricks access + Teams group | Vasco | Email drafted |
| Understand Haptik/HelloJio current capabilities (request documentation) | Vasco | Not started |
| Request MCP agent framework documentation from Jio tech team | Vasco (via Puneet Kathuria) | Not started |
| Request API catalog for customer actions (credit, notification, plan switch) | Vasco | Not started |
| Source Song designers for conversation design | Vasco (via James Gunn) | Outreach sent |
| Prepare Basecamp context (engagement brief, hypotheses, validation checklist) | Vasco | Done |
| Understand DPDPA implications for persistent memory | TBD (legal) | Not started |

**What we cannot do:** Anything involving actual data, model training, or prototype development.

## Phase 1: Data Access to Data Readiness (Week 1-3)

**Starts when:** Databricks access granted.
**Ends with:** Data readiness report shared with Mark and Sharad.

| Task | Owner | Depends on |
|------|-------|-----------|
| Connect to Databricks, run schema discovery | Vasco | Databricks access |
| Map actual tables to expected schema (REFERENCES.md) | Vasco | Schema discovery |
| Run validation checklist: which deck promises can the data support? | Vasco | Schema discovery |
| Data quality assessment (completeness, freshness, linkability) | Vasco | Schema discovery |
| Identify top 3 feasible hypotheses from HYPOTHESES.md | Vasco + lead | Schema discovery |
| Run first hypothesis (likely: churn precursor signal) | Vasco + lead | Data access + schema |
| Produce data readiness report | Vasco | All above |
| Present findings to Mark, Sharad, Jio data team | Vasco | Report complete |

**Deliverable:** Data readiness report. Answers: what data exists, what's missing, which CX experiences from the deck are feasible, which are not, and what we need from Jio to close gaps.

**Realistic capacity:** 1-2 people. This is analytical work, not engineering.

## Phase 2: Jio Buddy MVP Scope and Design (Week 3-6)

**Starts when:** Data readiness known, Song designers available, Jio API access clarified.
**Ends with:** Signed-off MVP scope and initial conversation design.

| Task | Owner | Depends on |
|------|-------|-----------|
| Define MVP scope: which use cases, which channels, which languages | Vasco + Mark + Jio | Data readiness report |
| Conversation design: Buddy personality, trust patterns, escalation logic | Song designers | Designers onboarded |
| Technical feasibility for each MVP feature | Vasco + lead | API catalog from Jio |
| Proactive intervention design: which signals trigger which actions | Vasco | Phase 1 findings |
| Memory layer design: what we store, where, retention policy | Vasco + legal | DPDPA guidance |
| Integration architecture: how Buddy connects to existing agents + app | Vasco + Jio tech | Agent framework docs |

**Deliverable:** MVP scope document. "Jio Buddy v0.1 does X on Y channel for Z customer segment. Here's the design."

**Risk:** If Song designers aren't available by week 3, conversation design slips and blocks build.

## Phase 3: Build (Week 6-10)

**Starts when:** MVP scope agreed, squad staffed, APIs available.
**Ends with:** Working prototype on test data.

What gets built depends entirely on squad size and API availability. Three scenarios:

**If full squad (6+ engineers + designers):**
- Working Buddy chat in MyJio app sandbox
- 2-3 proactive intervention flows live on test cohort
- Voice prototype in Hindi
- Memory tier 1+2 functional

**If partial squad (2-3 engineers, no designers):**
- Buddy conversation engine (text only, English + Hindi)
- 1 proactive intervention flow (highest-signal finding from Phase 1)
- Simulated memory (static preference profiles, no real accumulation)

**If just Vasco + lead:**
- Polished demo app (like the overnight Mumbai build but with real data behind it)
- Data-driven CX insights dashboard
- Proactive intervention logic documented with working signal detection
- Design specs for what Buddy would be with a real team

**Deliverable depends on scenario.** Be explicit with Mark about which scenario we're in by week 5.

## Phase 4: Showcase Prep (Week 10-13)

**Audience:** Jio C-suite + Accenture leadership
**Kiran Thomas's test:** "Compelling showcase toward level 4 autonomous telco"

What we show depends on what we built:

| Scenario | June 30 Demo |
|----------|-------------|
| Full squad | Live Buddy prototype on real data. "Here's what it does. Here's the measurement framework. Here's the roadmap." |
| Partial squad | Working text-based Buddy + one proactive flow + design vision for voice/full experience |
| Minimal team | Data findings + CX design system + demo app with real insights + "here's what the full build looks like with proper resourcing" |

All scenarios should include:
- At least one surprising data finding tied to business value
- A clear architecture for how Buddy scales
- Evidence that we've validated which deck promises are feasible
- Honest assessment of what's ready vs what needs more time

## Dependencies

| Dependency | Blocks | Owner | Expected |
|-----------|--------|-------|----------|
| Databricks access | Phase 1 (everything) | Manoj Mhatre + Rahul Joshi | ~March 26 |
| Infosec approval for recordings | Voice features | Rahul Joshi | ~2 weeks |
| Song designers onboard | Conversation design (Phase 2) | James Gunn sourcing | Unknown |
| Lead engineer hired | Phase 2-3 capacity | Mark sourcing | Unknown |
| MCP agent framework docs | Integration design | Aayush / Puneet (Jio) | Not requested |
| Action API catalog | Proactive interventions | Jio operations | Not requested |
| DPDPA legal guidance | Memory layer design | Legal team | Not requested |
| Pilot cohort sign-off | Real customer testing | Jio | Not before Phase 3 |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Databricks access delayed past week 2 | Medium | High. Entire Phase 1 blocked. | Design without data, validate later. Work on conversation design and integration architecture. |
| Squad not staffed by week 5 | High | High. June 30 demo is design-only, not working software. | Be explicit with Mark early. Adjust expectations. Focus on what 2 people can deliver. |
| Data doesn't support key hypotheses | Medium | Medium. Pivot to what data does support. | Run validation checklist first, not hypotheses. Know the boundaries before promising. |
| Jio APIs don't exist for proactive actions | Medium | High. Proactive intervention engine is the novel part. If no APIs, it's a dashboard, not Buddy. | Identify API gaps in Phase 1. Escalate to Aayush/Puneet immediately. |
| Hindi ASR latency too high for real-time voice | Medium | Medium. Voice becomes async only. | Design for text-first, voice as enhancement. |
| DPDPA blocks persistent memory at scale | Low | High. Memory moat concept is undermined. | Design opt-in model. Tier 1 (session) is safe. Tier 2-3 need consent. |
