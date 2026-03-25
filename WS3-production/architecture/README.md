# Production Architecture & Voice

**Owner:** TBD
**Timeline:** Post-MVP
**Question:** What does the scaled production platform need to look like?

## Objective

Define the target architecture that supports:
1. Lessons learned from MVP/prototype
2. Swappable components (model, voice, deployment)
3. Scale to 500M customers
4. Future local GPU deployment

## Architecture Principles

### Swappability
Every major component should be swappable without rewriting the agent logic:
- **Model:** Gemini → Claude → Llama → local model
- **Voice:** Google TTS → ElevenLabs → Jio custom → local TTS
- **Memory:** Firestore → Databricks → local vector DB
- **Deployment:** Cloud → edge → on-device

### Abstraction Layers

```
┌─────────────────────────────────────────────────┐
│                 Agent Logic                      │
│   (conversation flow, decision making)           │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Model Layer  │ │  Voice Layer  │ │ Memory Layer  │
│   (LLM API)   │ │  (TTS/STT)    │ │  (Storage)    │
└───────────────┘ └───────────────┘ └───────────────┘
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Adapters    │ │   Adapters    │ │   Adapters    │
│ Gemini/Claude │ │ Google/11Labs │ │ Fire/Databricks│
│ /Llama/Local  │ │ /Jio/Local    │ │ /Local        │
└───────────────┘ └───────────────┘ └───────────────┘
```

## Component Audit

### Voice Providers

| Provider | Latency | Languages | Cost | Local Option |
|----------|---------|-----------|------|--------------|
| Google Cloud TTS | ~200ms | Hindi, Hinglish, English ✅ | $$ | No |
| ElevenLabs | ~300ms | Limited Hindi | $$$ | No |
| Azure TTS | ~250ms | Good Hindi | $$ | No |
| Jio Custom (?) | TBD | Native | ? | Possible |
| Coqui/Local | ~100ms | Needs training | Free | ✅ |

**Recommendation:** Start with Google (ADK native), design for swap to local.

### Model Providers

| Provider | Latency | Context | Cost | Local Option |
|----------|---------|---------|------|--------------|
| Gemini (ADK native) | ~500ms | 1M tokens | $$ | No |
| Claude | ~600ms | 200K | $$$ | No |
| GPT-4 | ~700ms | 128K | $$$ | No |
| Llama 3 (local) | ~200ms | 8K-128K | Free | ✅ |

**Recommendation:** Start with Gemini (ADK native), abstract for Claude/local swap.

### Memory/Storage

| Option | Query Latency | Scale | Cost | Local Option |
|--------|--------------|-------|------|--------------|
| Firestore | ~50ms | Good | $$ | No |
| Databricks | ~100ms | Excellent | Client infra | No |
| Supabase | ~30ms | Good | $ | Self-host ✅ |
| Local SQLite | ~5ms | Limited | Free | ✅ |

**Recommendation:** Databricks for production (Jio's infra), Supabase/SQLite for dev.

## Data Sources Audit

| Source | Status | API Available | Real-time |
|--------|--------|---------------|-----------|
| Network events | ⏳ Pending access | TBD | Yes |
| App telemetry | ⏳ Pending access | TBD | Yes |
| Customer profiles | ⏳ Pending access | TBD | No |
| Billing | ⏳ Pending access | TBD | Near-real |

### Integration Pattern

```
Jio Databricks (320B events)
        │
        ▼
┌─────────────────┐
│  Event Stream   │ ◄── Real-time signals
│   (Kafka?)      │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Signal Detector │ ◄── Pattern matching
│  (Flink CEP?)   │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Memory Write    │ ◄── Store signal in customer memory
│ (Databricks)    │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Trigger Engine  │ ◄── Decide: intervene now or defer?
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Voice Agent     │ ◄── ADK outbound push
│  (Orchestration)│
└─────────────────┘
```

## Gap Analysis

| Capability | Have | Need | Gap |
|------------|------|------|-----|
| Voice agent framework | ✅ Google ADK | - | None |
| Hindi/Hinglish TTS | ✅ Google | - | None |
| Outbound voice push | ❓ ADK capable? | Yes | Validate |
| Real-time signals | ⏳ | Yes | Access pending |
| Customer memory | ❌ | Yes | Build |
| Swappable model | ❌ | Yes | Design abstraction |
| Local deployment | ❌ | Future | Plan architecture |

## Target Production Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Jio CX Agent (Prod)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │   Signals    │  │    Memory    │  │  Voice   │  │
│  │  (Flink CEP) │  │ (Databricks) │  │  (ADK)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  │
│         │                 │               │        │
│         ▼                 ▼               ▼        │
│  ┌───────────────────────────────────────────────┐ │
│  │         Orchestration (ADK Orchestrator)      │ │
│  └───────────────────────────────────────────────┘ │
│                        │                           │
└────────────────────────┼───────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌────────────┐
   │  Gemini  │   │  Google  │   │Databricks  │
   │  (Model) │   │  (Voice) │   │  (Memory)  │
   └──────────┘   └──────────┘   └────────────┘
```

## Future Architecture (Local GPU)

```
┌─────────────────────────────────────────────────────┐
│                 Edge Deployment                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Local Llama │  │  Local TTS  │  │ Local Vector│  │
│  │   (Model)   │  │   (Coqui)   │  │    (SQLite) │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                        │                            │
│  ┌─────────────────────────────────────────────┐   │
│  │         Same Agent Logic (portable)          │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Production Readiness Checklist

- [ ] Failover strategy for voice provider
- [ ] Memory layer SLA and consistency guarantees
- [ ] Signal detection latency acceptable for LIVE signals
- [ ] Cost modeling at 500M customer scale
- [ ] Data residency and compliance (India, GDPR, etc.)
- [ ] Monitoring and observability (latency, error rates, signal quality)
- [ ] Intervention cap (max % of customer base per day)
- [ ] Feedback loop (customer response → signal quality learning)
