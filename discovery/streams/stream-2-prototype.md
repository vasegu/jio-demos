# Stream 2: Working Prototype

**Owner:** Vasco
**Timeline:** Week 1-2
**Question:** Can we create the experience we want?

## Objective

Build a working voice agent using Google ADK that demonstrates the core experience: proactive outreach to a customer whose signal dropped.

## Core Experience Flow

```
1. Signal Detection
   └─► Customer goes offline (network drop)

2. Memory Write
   └─► Store: {customer_id, event: "offline", timestamp, context}

3. Signal Detection  
   └─► Customer comes back online

4. Memory Read
   └─► Retrieve: recent offline event, customer history, preferences

5. Voice Push (Google ADK)
   └─► "Hi [name], we noticed you were offline for [duration]. 
        Sorry about that - here's [offer] to make it right."

6. Memory Update
   └─► Store: intervention delivered, response
```

## Tech Stack

### Google ADK (Primary)
- Agent framework: ADK agents
- Voice: Google TTS/STT (or swappable)
- Orchestration: ADK tools + function calling

### Memory Layer
- Pattern: "Human memory" - accumulated context over time
- Storage: TBD (Firestore? Supabase? Jio's Databricks?)
- Schema: See below

### Phone UI
- Reuse: `../app/` from jio-demos
- Modification: Add incoming call/push simulation

## Memory Schema (Draft)

```typescript
interface CustomerMemory {
  customer_id: string;
  
  // Signal history
  signals: Signal[];
  
  // Accumulated context
  preferences: {
    communication_channel: 'voice' | 'sms' | 'push';
    language: string;
    best_contact_time?: string;
  };
  
  // Intervention history
  interventions: Intervention[];
  
  // Lifetime metrics
  lifetime: {
    tenure_months: number;
    total_interventions: number;
    nps_trend: number[];
  };
}

interface Signal {
  type: 'offline' | 'rage_quit' | 'payment_fail' | 'support_visit';
  timestamp: Date;
  duration_seconds?: number;
  context: Record<string, any>;
  resolved: boolean;
}

interface Intervention {
  trigger_signal_id: string;
  type: 'voice_push' | 'sms' | 'callback';
  timestamp: Date;
  offer_given?: string;
  customer_response?: 'positive' | 'negative' | 'no_response';
}
```

## Build Sequence

### Week 1
- [ ] Day 1-2: ADK agent scaffold + basic voice response
- [ ] Day 3-4: Memory layer (in-memory first, then persistent)
- [ ] Day 5: Phone UI integration (incoming call simulation)

### Week 2
- [ ] Day 6-7: Connect to real signals (or realistic mock)
- [ ] Day 8-9: Personalization from memory
- [ ] Day 10: Polish, latency optimization, demo prep

## Technical Questions

### Must Answer
- [ ] ADK latency for voice push - acceptable for proactive outreach?
- [ ] Can ADK initiate outbound calls or only respond to inbound?
- [ ] Memory query latency at scale (500M customers)?

### Nice to Answer
- [ ] Voice cloning / brand voice options?
- [ ] Multi-language support (Hindi, Hinglish, English)?
- [ ] Offline-first for low connectivity areas?

## Dependencies

| Dependency | Status | Blocker? |
|------------|--------|----------|
| Google ADK access | ✅ Available | No |
| Databricks access | ⏳ Pending (Mar 26) | Partial - can mock |
| Phone UI (jio-demos) | ✅ Exists | No |
| Customer data schema | ⏳ From Stream 1 | Partial |

## Success Criteria

Working demo that shows:
- [ ] Voice agent responds naturally
- [ ] Retrieves customer context from memory
- [ ] Personalizes the apology + offer
- [ ] Latency < 2 seconds from trigger to voice

## Code Location

```
jio-cx/mvp/
├── agent/        ← ADK agent code
├── memory/       ← Memory store implementation
├── signals/      ← Signal detection (mock or real)
└── tests/        ← Demo scenarios
```
