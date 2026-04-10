# Jio Home Assistant - MVP

Voice-first AI assistant for Jio Home broadband customers. Built on Google ADK + Vertex AI. Speaks Hindi, Hinglish, and English.

## What's Running

### Agent (deployed on GCP)

| Component | Service | Status |
|-----------|---------|--------|
| Agent Engine | `projects/896447499660/locations/us-central1/reasoningEngines/2407535190399254528` | Live |
| Model | gemini-2.5-flash (text), gemini-live-2.5-flash-native-audio (voice) | Live |
| RAG Corpus | `projects/896447499660/locations/europe-west1/ragCorpora/2305843009213693952` | 17 files indexed |
| GCS Bucket | gs://jio-cx-corpus-eu/ | Plans, support, synthetic data |
| Staging Bucket | gs://jio-cx-agent-staging/ | Agent Engine deployment artifacts |
| Observability | OpenTelemetry traces + prompt/response logging | Enabled |

### Signal Pipeline

| Component | Service | Status |
|-----------|---------|--------|
| Pub/Sub Topics | jio-billing-events, jio-network-events, jio-app-events, jio-device-events, jio-agent-triggers | Live |
| Simulator | `signals/simulator.py` - 6 scenarios, 100 synthetic customers | Working |
| Processor | `signals/processor.py` - filter/enrich/interpret pipeline | Working |
| Trigger | `signals/trigger.py` - connects signals to Agent Engine | Working |

### Apps

| App | Port | What it does |
|-----|------|-------------|
| ADK Web | 8081 | Dev testing UI (text + audio) |
| Chat App | 8080 | Customer-facing phone mockup |
| Dashboard Backend | 3001 | Control plane API (FastAPI) |
| Dashboard Frontend | 5173 | Control plane UI (React) |
| Phone App | 5174 | Forked WS0 demo with live agent (in progress) |

## Architecture

```
                        OBSERVE                    ORIENT + DECIDE              ACT
                     (deterministic)               (LLM-powered)           (agent + tools)

Simulator -----> Pub/Sub (4 topics) -----> Processor -----> Agent Triggers -----> Agent Engine
(synthetic         billing                  filter            jio-agent-           gemini-2.5-flash
 events)           network                  enrich            triggers             3 sub-agents
                   app                      interpret         topic                RAG grounded
                   device                   urgency calc

                                                                                     |
                                                                                     v
                                                                              Tool calls:
                                                                              - plan_lookup
                                                                              - customer_lookup
                                                                              - network_diagnostics
                                                                              - complaint_ops
                                                                              - jio_knowledge_search (RAG)
```

## Agent Structure

```
jio_home_assistant (root - orchestrator)
  |
  |-- jio_knowledge_search (RAG tool - Vertex AI corpus)
  |
  |-- troubleshoot_agent
  |     tools: get_customer_profile, check_connection_status,
  |            run_speed_test, check_router_health,
  |            restart_router, check_device_count
  |
  |-- plan_agent
  |     tools: get_customer_profile, search_plans, get_plan_details
  |
  |-- complaint_agent
        tools: get_customer_profile, log_complaint, check_complaint_status
```

## RAG Corpus (17 files, ~300KB)

**Plans (4 files):** JioFiber plans (Silver 599 - Titanium 3999), AirFiber plans, OTT bundle mapping, devices and installation process.

**Support (8 files):** General FAQ (34 Q&A), Fiber FAQ (28 Q&A), WiFi troubleshooting (5 step-by-step guides), billing help, support channels with full escalation matrix (L1 through TRAI), community-style complaints in Hindi/Hinglish/English, customer language-to-intent mapping (12 intents x 4 language registers), top 20 issues with root causes and fixes.

**Synthetic (5 JSON files):** 100 customer profiles, 30 complaint categories with trilingual examples, 50 diagnostic scenarios with Hindi complaints and tool sequences, 50 bilingual FAQ, 10 IVR decision trees.

## Signal Pipeline

Six simulated scenarios:

| Scenario | Topic | Example |
|----------|-------|---------|
| Approaching data cap | billing | JIO-012 Pooja Bhatt at 91% usage on day 12 |
| Network degraded | network | JIO-062 Sameer Ahuja getting 21Mbps on 100Mbps plan |
| CPE offline | device | JIO-066 Mukesh Pandey's router went dark |
| Recharge expiring | billing | JIO-059 Sapna Rastogi, 3 days left |
| Churn signal (app) | app | JIO-014 Neha Tiwari (NPS 2) viewed cancel page |
| Heavy streaming | device | JIO-078 Shankar Iyer, 12 devices, router at 61C |

Processor enriches with customer profile and calculates urgency contextually:
- Early-life (< 30 days) + high risk + low NPS = critical urgency
- Standard customer + medium signal = medium urgency

## GCP Project

| Key | Value |
|-----|-------|
| Project ID | jiobuddy-492811 |
| Project Number | 896447499660 |
| Model region | us-central1 |
| RAG region | europe-west1 |

See `agent/GCP-SETUP.md` for all working commands, auth patterns, and common errors.

## How to Run

### Prerequisites
- Python 3.11+ with venv
- Node.js 18+
- gcloud CLI authenticated
- API key in `agent/.env`

### Agent (local dev)
```bash
cd WS2-mvp/agent
source .venv/bin/activate
adk web --port 8081
# Open http://localhost:8081
```

### Customer chat app
```bash
cd WS2-mvp/app
python chat.py
# Open http://localhost:8080
```

### Signal pipeline (full OODA loop)
```bash
cd WS2-mvp/signals

# 1. Simulate an event
python simulator.py --scenario data_cap

# 2. Process it (filter/enrich/interpret)
python processor.py --once

# 3. Trigger the deployed agent
python trigger.py

# Or run all at once:
python simulator.py && python processor.py --once && python trigger.py
```

### Control plane dashboard
```bash
# Terminal 1: backend
cd WS2-mvp/dashboard/backend
uvicorn main:app --reload --port 3001

# Terminal 2: frontend
cd WS2-mvp/dashboard/frontend
npm run dev
# Open http://localhost:5173
```

## What's Real vs Mocked

| Component | Real | Mocked |
|-----------|------|--------|
| Agent Engine deployment | Yes - live on GCP | - |
| Model inference (gemini-2.5-flash) | Yes - Vertex AI | - |
| RAG retrieval | Yes - Vertex AI corpus | Content is inferred, not from Jio |
| Pub/Sub topics | Yes - live on GCP | - |
| Customer profiles | - | 100 synthetic profiles |
| Network diagnostics | - | Random data from tools |
| Billing/CRM APIs | - | Hardcoded plan catalog |
| Voice (STT/TTS) | Browser Web Speech API | Not production ASR |

## What's Next

1. **Memory Bank** - persistent customer context across sessions (requires Agent Engine)
2. **LangFuse integration** - decision trace capture for the control plane
3. **Phone UI** - forked WS0 demo with live agent connection (in progress)
4. **Evaluation suite** - automated test conversations proving routing, grounding, language handling
5. **Real data** - replace synthetic with Databricks access when available
