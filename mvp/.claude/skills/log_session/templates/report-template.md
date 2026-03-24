# Session Efficiency Report — YYYY-MM-DD
## Skill Chain: [skills executed]

**Session ID:** `[session-id]`
**Date:** YYYY-MM-DD
**Model:** [model]
**Engagement:** [engagement name]
**Data source:** [automatic (JSONL) / manual]

---

## 1. Session Overview

| Field | Value |
|-------|-------|
| Start time | [HH:MM:SS UTC] |
| End time | [HH:MM:SS UTC] |
| **Total duration** | **[Xh Ym Zs]** |
| Total API turns | [N] |
| Total tool calls | [N] |
| Skills executed | [list] |
| Files created / modified | [N] |
| Query method | [Python script / MCP] |

---

## 2. Token Usage

### 2.1 Raw Counts

| Token Type | Count | Share of total |
|------------|------:|---------------:|
| Input tokens (non-cached) | [N] | [X]% |
| Output tokens | [N] | [X]% |
| Cache read tokens | [N] | [X]% |
| Cache creation tokens | [N] | [X]% |
| **Grand total** | **[N]** | 100% |

### 2.2 Cost Estimate

Pricing: [model] · Input $3/MTok · Output $15/MTok · Cache read $0.30/MTok · Cache creation $3.75/MTok

| Cost component | Tokens | Rate | Estimated cost |
|----------------|-------:|------:|---------------:|
| Input (non-cached) | [N] | $3.00/MTok | $[X] |
| Output | [N] | $15.00/MTok | $[X] |
| Cache read | [N] | $0.30/MTok | $[X] |
| Cache creation | [N] | $3.75/MTok | $[X] |
| **Total** | | | **~$[X]** |

### 2.3 Cache Efficiency

Session average cache hit rate: **[X]%** ([Y]% on input context). [1–2 sentences interpreting the cache behaviour — was this a warm cache session or cold start? any compaction events?]

---

## 3. Tool Call Analysis

| Tool | Calls | % of total | Purpose |
|------|------:|----------:|---------|
| **[Tool1]** | [N] | **[X]%** | [purpose] |
| [Tool2] | [N] | [X]% | [purpose] |
| [Tool3] | [N] | [X]% | [purpose] |
| **Total** | **[N]** | 100% | |

### Most Expensive Individual API Calls

| Rank | Timestamp | Output tokens | Cache read | Cache creation | Task |
|------|-----------|-------------:|----------:|---------------:|------|
| 1 | [HH:MM:SS] | [N] | [N] | [N] | [description] |
| 2 | [HH:MM:SS] | [N] | [N] | [N] | [description] |
| 3 | [HH:MM:SS] | [N] | [N] | [N] | [description] |

---

## 4. Phase-by-Phase Breakdown

### Per-Phase Summary

| Phase | Duration | Cost | Turns | Peak context | Output/turn |
|-------|----------|-----:|------:|-------------:|------------:|
| [Phase 1] | [Xm] | $[X] | [N] | [N] | [N] tok |
| [Phase 2] | [Xm] | $[X] | [N] | [N] | [N] tok |
| **Total** | **[Xh Ym]** | **$[X]** | **[N]** | — | — |

### Phase 1 — [Name] ([start]–[end] · ~[X] min)

| Sub-phase | Duration | Key tool calls | Output |
|-----------|----------|----------------|--------|
| [sub-phase] | ~[X] min | [tools] | [output] |

**Context growth:**
```
[HH:MM]  [N]k │[bar]  [description]
[HH:MM]  [N]k │[bar]  [description]
```

**Errors / wasted time:** [describe or "None"]

<!-- Repeat Phase block for each phase -->

---

## 5. Context Window Deep-Dive

### Session-Level Stats

| Metric | Value | When |
|--------|------:|------|
| Session start | [N] tokens | Turn 1 |
| Peak context | **[N] tokens** | Turn [N] |
| Session end | [N] tokens | Turn [N] |
| Average across all turns | [N] tokens | — |
| Context compaction events | [N] | |

### Context Threshold Crossings

| Threshold | Crossed at turn | Time | Minutes in |
|----------:|----------------:|------|----------:|
| 50,000 tokens | Turn [N] | [HH:MM] | ~[X] min |
| 100,000 tokens | Turn [N] | [HH:MM] | ~[X] min |
| 150,000 tokens | Turn [N] | [HH:MM] | ~[X] min |

| Threshold | Turns above it |
|----------:|--------------:|
| > 100,000 tokens | [N] turns ([X]% of session) |
| > 150,000 tokens | [N] turns ([X]% of session) |

### Cache Hit Rate

| Metric | Value | Turn |
|--------|------:|-----:|
| Session average | **[X]%** | — |
| Maximum | [X]% | Turn [N] |
| Minimum | [X]% | Turn [N] |

---

## 6. Deliverables Inventory

| File | Size | Phase |
|------|------|-------|
| [file path] | [N] lines | [phase] |

**Total: [N] files created, [N] updated | ~[N] lines of content**

---

## 7. Efficiency Assessment

### What Worked Well

- [observation]
- [observation]

### Bottleneck Summary

| # | Bottleneck | Time lost | Root cause | Fix |
|---|-----------|----------:|-----------|-----|
| 1 | [name] | ~[X] min | [cause] | [fix] |
| **Total waste** | | **~[X] min** | | |

**Net efficiency: ~[X]%** ([N] min waste / [Xh Ym] total). [1 sentence on trajectory vs baseline.]

### Time-to-Value

| Deliverable | Time | Analyst-equivalent |
|-------------|:----:|-------------------:|
| [deliverable] | [X] min | [N] days/hours |
| **Total** | **[Xh Ym]** | **~[N] working days** |

At ~$[X] total: [brief cost-per-deliverable note].

---

## 8. Sub-Agent / Architecture Observations

[What architectural changes (if any) were in effect this run? Did parallel sub-agents fire for scaffolding? Was MCP used? Did context stay lower as a result? Compare to baseline observations.]

| Recommendation | Status in this run | Effect observed |
|---------------|:-----------------:|----------------|
| Skill Scaffolding → parallel sub-agents | Implemented / Not yet | [observation] |
| Go Hunt → starter pack only | Implemented / Not yet | [observation] |
| MCP over Python script | Implemented / Not yet | [observation] |
| Pre-flight `.env` check | Implemented / Not yet | [observation] |

---

*Session file: `[session-id].jsonl` | [N] API turns analysed*
