---
name: basecamp
description: Get smart on a new client dataset fast — absorb analyst context, map the data, research the industry with data-informed targeting, define what good looks like, and arm Go Hunt with everything it needs.
---

# Basecamp (Interactive SOP)

## Purpose

You just landed on an engagement. Someone hands you database credentials and a vague brief. Basecamp is how you go from "I don't know anything" to "I can hold my own in a steering committee" — and more importantly, it's how you set up Go Hunt and every downstream skill to hit the ground running.

**Start from scratch.** Basecamp assumes zero prior knowledge. Do not be influenced by existing documentation, prior reports, pre-built hypotheses, or skill references outside the declared scope. Your job is to discover what the data contains and what the industry says about it — independently. If existing artifacts happen to align with your findings, that's validation. If they don't, trust what you found. The only inputs Basecamp accepts are: (1) the analyst's brain dump, (2) the declared schema, and (3) what you discover through queries and research.

Basecamp does three things no other skill does:

1. **Absorbs everything the analyst already knows** — the messy, unstructured brain dump of context, hunches, client politics, and half-formed theories. Basecamp structures it.
2. **Maps the actual data** — ERD, data dictionary, profiles. You can't research intelligently until you know what you're working with.
3. **Researches what the analyst doesn't know — targeted by the data** — now that you've seen 36 action codes with dwell times, you can search for "automotive technical assistance SLA benchmarks" instead of generic industry KPIs.

**Skill chain:** `Basecamp ("where are we?") → Go Hunt ("what's interesting?") → Hypothesis Skills ("is this true?")`

### What Basecamp Produces for Go Hunt

Go Hunt consumes these specific Basecamp artifacts:
- **ERD + Data Dictionary (§3-§4)** — table relationships, column-level metadata, data types, cardinality, sample values. Go Hunt never has to call `information_schema` again.
- **Data profiles (§5)** — NULL rates, distributions, performance spreads per table
- **Trust scorecard (§8)** — per-table grades (A-F) with landmine register. Go Hunt knows what to trust, what to caveat, what to avoid.
- **Industry context brief (§6)** — domain overview, known problem patterns — researched AFTER seeing the data so benchmarks target actual columns
- **Performance benchmarks (§9)** — industry benchmark × client actual × data field mapping. The "what good looks like" framework.
- **Analyst hypotheses (§11)** — structured versions of the analyst's initial hunches, tagged with confidence and data verdict
- **Candidate hypotheses (§11)** — data-derived patterns (HC-<n> format) ready for Go Hunt's coverage matrix
- **Go Hunt Starter Pack (§12)** — curated summary: context, benchmarks, hypotheses, trust constraints, recommended exploration order

Without Basecamp, Go Hunt explores blind. With it, Go Hunt explores informed.

## When to Use

- **Day 1 on any engagement.** Always run Basecamp first.
- **When the analyst has context to share.** Even "I think their dealers are terrible" is useful — Basecamp will structure it and find the data to test it.
- **Before scoping analytical work.** Don't promise deliverables before you know what the data supports *and* what the industry expects.
- **After a data refresh or schema change.** Re-baseline the landscape.

## Trust Model

- **Read-only database access.** `SELECT` queries only — no DML, no DDL.
- **Web research access.** Basecamp uses WebSearch to research the client's industry and company.
- **No pre-written queries.** All queries generated at runtime from schema metadata.
- **No query approval gate.** Read-only + research means governance happens at the report layer.

## Artifacts Produced

| Artifact | Report Section | Consumer |
|----------|:-------------:|----------|
| Basecamp report | Full document | Team, Go Hunt, all downstream skills |
| ERD (Mermaid erDiagram) | §3 | Go Hunt Phase 0, all skills |
| Data Dictionary | §4 | Go Hunt Phase 0 — replaces schema re-discovery |
| Data Profiles | §5 | Go Hunt Phase 1, all skills |
| Industry context brief | §6 | Go Hunt Phase 0, hypothesis skill framing |
| Trust scorecard | §8 | Go Hunt Phase 0, all skills |
| Performance benchmarks | §9 | Go Hunt synthesis, hypothesis skill thresholds |
| Analyst hypothesis register (HA-<n>) | §11 | Go Hunt coverage matrix |
| Candidate hypotheses (HC-<n>) | §11 | Go Hunt Phase 0 intake |
| Go Hunt Starter Pack | §12 | Go Hunt Phase 0 — curated intake package |

**Report location:** `reports/basecamp/basecamp-<project>-YYYY-MM-DD.md`

## Inputs Required

- Supabase MCP access (project ID)
- Target schema(s) (default: `public`)
- **The analyst.** Their brain dump, hunches, initial impressions, whatever they've got. The less structured the better — Basecamp structures it.

---

## SOP Phases

### Phase 0 — Brain Dump

**Goal:** Extract everything the analyst knows (or thinks they know) before touching the data.

This is NOT a structured interview. The analyst should just talk. Dictate. Stream of consciousness. "The client is [company], they [do X], their [entity network] is a mess, I think the [segment A] has better service than [segment B], the [escalation queue] is apparently a black hole, someone mentioned [KPI] is a problem..."

**Prompt the analyst:**

> "Tell me everything you know. The client, the industry, what you've heard, what you suspect, what the brief says, what the politics are, initial impressions, hunches — anything. Don't worry about structure, just dump it. I'll organise it."

**What to listen for:**
- **Client identity:** Who are they? What do they do? What's their market position?
- **The problem as stated:** What did they ask for? What do they think is wrong?
- **The problem behind the problem:** What does the analyst *actually* think is going on?
- **Domain clues:** Industry terms, process names, KPIs they've mentioned, competitors they worry about
- **People dynamics:** Who's the sponsor? Who's sceptical? Who has the data knowledge?
- **Hunches:** "I think X is the real issue" — capture these as analyst hypotheses (HA-<n>)
- **The slant:** What angle is the analyst leaning toward? What would they look for first?

**After the dump, structure it:**
1. Confirm Supabase project and target schema(s)
2. Check `reports/basecamp/` for prior runs
3. Present back: "Here's what I heard — [structured summary]. Did I miss anything?"

**Outputs:**
- Analyst context document (structured version of the brain dump)
- Analyst hypotheses register: HA-1, HA-2... (their hunches, tagged with confidence: strong hunch / gut feel / wild guess)
- Engagement brief: client, problem, scope

**Checkpoint:** "Does this capture it? Anything else before I look at the data?"

### Phase 1 — Data Landscape

**Goal:** Map the actual data before researching anything. You need to see what you're working with — the ERD, the columns, the grain — before you can ask targeted questions about the industry.

You can't search for "automotive L2 dwell time benchmarks" if you don't yet know L2 dwell time exists in the data. Phase 1 gives you the vocabulary for Phase 3's research.

**Schema lock:** Only query tables in the schema(s) declared during Phase 0 intake. Do not query other schemas (e.g., `schema_a` when scoped to `schema_b`, or vice versa) unless the analyst explicitly adds them to scope. All `information_schema` queries must filter by `table_schema`. All table references must be schema-qualified (`<schema>.<table>`, not just `<table>`).

**Actions:**
- Use `mcp__claude_ai_Supabase__list_tables` with only the declared schema(s).
- Query `information_schema.columns` for column types, nullable flags, defaults — **filtered to declared schema(s) only**.
- Query `information_schema.table_constraints` and `information_schema.key_column_usage` for PKs and FKs — **filtered to declared schema(s) only**.
- Identify implicit joins by column name patterns.
- **Build a Mermaid ERD** from discovered relationships — explicit FKs, inferred joins, cardinality markers.
- **Spine identification:** Which table is the central entity everything hangs off?
- **Naming convention analysis:** Identify the client's column naming patterns and document them.

**Data Dictionary (first-class artifact):**

Build a formal per-table, per-column reference that Go Hunt can consume directly without re-querying the schema:

For each table:
- Table name, grain (what one row represents), row count, type (fact/dim/reference)

For each column:
- Column name, data type, NULL %, cardinality, sample values (top 3-5), analytical notes

The data dictionary is what means Go Hunt never has to call `information_schema` again. It's the single source of truth for "what columns exist, what they contain, and what they're useful for."

**Outputs:**
- Table inventory: name, row count, column count, grain, description
- Mermaid ERD with explicit FKs and inferred joins (report §3)
- Data Dictionary: per-table, per-column metadata (report §4)
- Naming convention guide
- Spine identification

**Checkpoint:** "Here's the ERD and data dictionary. Does this match what you expected? Any tables I should focus on or skip?"

### Phase 2 — Data Profiling

**Goal:** Know what you can trust, what's empty, and what's going to surprise you.

**Queries per table (generated at runtime):**
- Row count
- NULL rates per column (flag > 10%)
- Cardinality per column
- Value distributions for low-cardinality columns (< 50 distinct)
- Numeric ranges + averages: `MIN`, `MAX`, `AVG`, `STDDEV`
- Date ranges: `MIN`, `MAX`
- **Concentration analysis:** Top-N values by frequency — if one dealer has 40% of tickets, that's a finding
- **Performance spread:** For key metrics, calculate the spread between best and worst performers. This is where "who's the best dealer, what would good look like" starts to emerge from the data itself.

**Outputs:** Per-table profile tables with column stats.

**Mid-profiling checkpoint:** After 2-3 tables, present findings: "The data shows X. Here's what stands out."

### Phase 3 — Industry & Company Research

**Goal:** Get smart on the client's world — but now you've seen the data, so your research is targeted.

This phase was deliberately placed AFTER the data landscape and profiling. Generic industry research produces generic KPIs. Research informed by actual data produces targeted benchmarks. You've seen the ERD, the column names, the distributions. Now you can ask precise questions.

**Data-informed research targeting:**

Use what Phases 1-2 revealed to drive specific searches:
- "I see workflow events with dwell time patterns → search for **[industry] SLA benchmarks by event type**"
- "I see `[entity_code]` with 20x variance in resolution times → search for **[entity] performance benchmarking in [industry] networks**"
- "I see reopened tickets with timestamps → search for **first-time fix rate standards in [industry]**"
- "I see passive wait states consuming 50%+ of ticket time → search for **wait-state analysis in [domain] operations**"

For each benchmark found, **map it to the specific table and column that would produce it.** A benchmark without a data mapping is just trivia.

**Company research (via WebSearch):**
- What does the company do? Market position, size, recent news
- Organisational structure relevant to this data (e.g., brand portfolio, dealer network model)
- Recent strategic initiatives, pain points mentioned in press/earnings calls
- Public information about their technical assistance / warranty / service operations

**Industry research (via WebSearch):**
- What are the standard KPIs in this domain? Target searches at patterns visible in the data.
- What does "good" look like? Industry benchmarks, published standards
- What are the known problem patterns? (e.g., "in automotive aftersales, 60-70% of ticket time is typically passive waiting")
- Regulatory context that might matter (warranty obligations, recall processes)

**"What good looks like" framework:**
- Compile industry benchmarks into a reference table
- **Map every benchmark to the specific data field(s)** discovered in Phase 1 that would produce it
- Identify performance tiers used in the industry (e.g., dealer performance quartiles, SLA tiers)
- Note where benchmarks don't exist or vary widely — these are areas where the client's own data defines the baseline

**Cross-reference with analyst hypotheses:**
- For each HA-<n>, assess: does industry context support this hunch? Does it add nuance?
- Example: Analyst said "dealers are a mess" → Research shows industry average reopen rate is 5-8% → Data shows some dealers at 25% → Now we know both the benchmark AND the gap

**Outputs:**
- Industry context brief (2-3 paragraphs + benchmark table)
- Company profile (1 paragraph + org structure relevant to the data)
- Performance benchmarks: KPI × industry benchmark × source × data field(s) mapping
- Analyst hypotheses updated with industry context

**Checkpoint:** "Here's what I found about the industry — targeted at the patterns I saw in the data. Does this match your understanding? Anything I should dig deeper on?"

### Phase 4 — Business Process Mapping

**Goal:** Understand the story the data tells — map it to the business processes the client actually runs.

**Actions:**
- **Fact vs Dimension classification**
- **Entity lifecycle mapping:** Follow the spine entity through status transitions
- **Process flow diagrams:** Mermaid flowcharts of how entities move through the system
- **Relationship strength:** Which joins are reliable, which are sparse
- **Map to industry standard processes:** How does what we see in the data compare to how this process *typically* works in the industry? Where does the client's process deviate?

**Outputs:** Process flows (Mermaid), fact/dim classification, lifecycle maps, industry process comparison.

### Phase 5 — Trust Assessment

**Goal:** Grade every table on "can I stand behind this number in a steering committee?"

**Checks:**
- **Completeness:** NULL rates. > 30% = hard limitation. 10-30% = use with caveat.
- **Orphan records:** Child records with no parent. Breaks joins, inflates counts.
- **Temporal consistency:** Do timestamps make logical sense?
- **Distribution anomalies:** Single-value dominance, impossible ranges.
- **Freshness:** Is the data current?
- **Referential integrity:** Do FK relationships hold?
- **Volume sufficiency:** Enough data to draw conclusions? Flag < 30 rows.

**Grading:**
- A: > 95% complete, no orphans — **"safe to present to the client"**
- B: > 85% complete, < 1% orphans — **"reliable with minor caveats"**
- C: > 70% complete, < 5% orphans — **"use with documented limitations"**
- D: > 50% complete, significant issues — **"flag to the client before using"**
- F: < 50% complete or critical failures — **"do not use without remediation"**

**Outputs:** Trust scorecard, landmine register.

### Phase 6 — Synthesis

**Goal:** Bring everything together — data reality, industry context, analyst hunches — into a coherent picture.

This is where Basecamp earns its keep. You're not just saying "here are some stats." You're saying "the industry benchmark for reopen rate is 5-8%, your data shows 14%, concentrated in the bottom quartile of dealers, and the analyst suspected dealers were the problem — the data supports that hunch."

**Actions:**
- **Business glossary:** Data terms → client terms
- **Coverage assessment:** What can we answer? What can't we? What's blocked by data quality?
- **Quick wins:** Patterns visible in the profiles that are worth presenting early
- **Analyst hypothesis assessment:** For each HA-<n>, what does the data say? Supported / plausible / no data / contradicted?
- **Candidate hypotheses (HC-<n>):** New hypotheses generated from data patterns, ranked by:
  - Client impact (does it relate to their stated problem?)
  - Testability (is the data sufficient?)
  - Speed to insight (days, not weeks)
  - Industry relevance (is this a known problem pattern in the domain?)
- **Skill mapping (discovery-based):** Check `.claude/skills/` for existing hypothesis skills. Only map HC-<n> to skills that actually exist. For unmapped hypotheses, recommend Go Hunt exploration and scaffolding. Do not reference or assume skills that aren't present.
- **Performance benchmarks — data edition:** Update the benchmark framework with actual client numbers. Where are they above/below industry standard? This becomes Go Hunt's performance reference.
- **Landmine register:** Data issues that could derail analysis

**Outputs:**
- Business glossary
- Coverage map
- Quick-win list
- Analyst hypothesis assessment (HA-<n> × data verdict)
- Candidate hypotheses (HC-<n>) — **these are Go Hunt's primary input**
- Updated performance benchmarks with client actuals vs industry
- Landmine register
- Go Hunt starter pack: everything Go Hunt needs in one summary

### Phase 7 — Report & Handoff

**Goal:** Package everything, arm Go Hunt, get alignment on next steps.

**Actions:**
- Populate `templates/report-template.md` with all findings.
- Executive summary: 3 bullets a managing director reads in 30 seconds.
- Save to `reports/basecamp/basecamp-<project>-YYYY-MM-DD.md`.
- **Produce standalone Go Hunt starter pack file:** Extract §12 (Go Hunt Starter Pack) into a separate file at `reports/basecamp/starter-pack-<project>-YYYY-MM-DD.md`. This is the file Go Hunt Phase 0 loads directly — it should be self-contained with context, benchmarks, hypotheses, trust constraints, and recommended exploration order. Go Hunt should not need to parse the full Basecamp report.
- **Go Hunt handoff:** Present the candidate hypotheses, the performance benchmarks, and the trust scorecard as a package: "Here's what Go Hunt has to work with."
- **Recommend next steps:**
  - Quick wins → suggest Go Hunt exploration focus areas
  - Unfamiliar territory → suggest Go Hunt with specific HC-<n> focus areas
  - Data quality blocking → suggest remediation before analysis
- **Skill discovery (not assumption):** Only reference skills that actually exist in `.claude/skills/`. Check the directory. If a hypothesis maps to a skill that doesn't exist yet, recommend that Go Hunt explore and scaffold it — don't reference skills by name unless you've confirmed they're present.
- Offer steering committee summary

**Checkpoint:** "Does this capture the landscape? Ready for Go Hunt to start exploring?"

---

## Query Guidelines

- **Read-only only.** `SELECT` and `information_schema` queries only.
- **Aggregate in SQL.** Never dump raw rows.
- **Round outputs.** `ROUND(value::numeric, 1)`.
- **Log every query.** In the report's Appendix.
- **Schema-qualified tables.** Use `schema.table` when not `public`.
- **Fail gracefully.** Note failures and move on.
- **Batch where possible.** Multiple columns per query.

---

## What Basecamp Does NOT Do

- **Does not test hypotheses.** It generates and ranks them — Go Hunt and hypothesis skills test them.
- **Does not modify data.** Read-only, always.
- **Does not push to Linear.** Internal workflow only.
- **Does not produce client-facing analysis.** The basecamp report is a team reference and Go Hunt input. Client deliverables come from hypothesis skills.
