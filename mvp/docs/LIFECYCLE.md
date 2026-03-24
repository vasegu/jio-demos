# LLM Agent Production Lifecycle at Telco Scale

**Context**: Jio (500M subscribers), self-hosted Llama 4 Scout, Google ADK orchestration, Databricks data platform.
**Audience**: CX development lead preparing for technical discussions with a VP of Technology R&D who built an indigenous 5G stack.

---

## 1. Model Lifecycle Management

### From "We Have Llama 4 Scout" to Production Hindi CX

The journey has five distinct phases. Each is a separate workstream with its own team, tooling, and success criteria.

**Phase 1: Base Model Validation**

Llama 4 Scout ships as a 109B-parameter MoE model (17B active per token, 16 experts). Hindi is one of 12 officially supported languages. The first job is to validate that the base instruct model (Llama-4-Scout-17B-16E-Instruct) actually handles Jio's CX domain in Hindi at acceptable quality. This means:

- Run the model against a curated set of 500-1000 real customer queries in Hindi (billing, plan changes, network issues, recharges)
- Measure: correctness, language fluency, hallucination rate, refusal rate
- Compare against the current CX system (IVR scripts, human agent responses) as the baseline
- This phase answers the question: "Can we prompt-engineer our way to production, or do we need fine-tuning?"

**Phase 2: Domain Adaptation (if needed)**

If base model + prompt engineering falls short, the progression is:

| Technique | What It Does | When to Use | Data Required | Compute Cost |
|-----------|-------------|-------------|---------------|--------------|
| **RAG (Retrieval-Augmented Generation)** | Injects relevant documents into context at query time | Knowledge changes frequently (plan details, pricing, policies); factual accuracy is critical | Knowledge base of documents, no labeled training data needed | Low (inference-time only) |
| **LoRA/QLoRA adapters** | Trains small adapter layers (typically 0.1-1% of model params) on top of frozen base model | Need to change model behavior/style/tone, not just knowledge; Hindi fluency improvement | 10K-100K labeled examples in chat format | Medium (single-node multi-GPU, hours not days) |
| **Full fine-tuning** | Updates all model weights | Fundamental capability gaps; new language proficiency; deeply specialized domain | 100K-1M+ examples; minimum ~1.5M tokens for continued pre-training | High (multi-node GPU cluster, days) |

The practical answer for Jio: **start with RAG for knowledge, LoRA for behavior**. Full fine-tuning of a 109B MoE model is expensive and risky -- you can lose general capabilities.

**Phase 3: Fine-Tuning Pipeline (when you do it)**

Data format for Databricks Foundation Model Training:

```jsonl
{"messages": [{"role": "system", "content": "You are Jio's customer assistant..."}, {"role": "user", "content": "मेरा रिचार्ज प्लान बदलना है"}, {"role": "assistant", "content": "आपका वर्तमान प्लान ₹399..."}]}
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

Key data requirements:
- **Format**: JSONL with chat-completion structure (system/user/assistant turns)
- **Volume**: Minimum one full context window of tokens (~131K tokens) for instruction fine-tuning; 1.5M+ tokens for continued pre-training
- **Quality matters more than quantity**: 10K high-quality, diverse, edge-case-heavy examples beat 100K repetitive ones
- **Data sources**: Historical agent transcripts, QA pairs from knowledge base, synthetically generated edge cases (use a strong model like GPT-4 or Llama 4 Maverick to generate Hindi CX scenarios)
- **Must include**: Bilingual queries (Hindi-English code-switching is normal in Indian CX), error cases, refusal examples, multi-turn conversations

Note: Databricks Foundation Model Training currently supports Llama 3.x models. Llama 4 Scout fine-tuning will likely require custom training infrastructure (DeepSpeed, FSDP) on Jio's own GPU cluster until Databricks adds Llama 4 support. This is a conversation point -- who runs the fine-tuning jobs?

**Phase 4: Evaluation Before Deployment**

Three-layer evaluation:

1. **Automated benchmarks** (fast, cheap, run on every iteration):
   - Task completion accuracy on held-out test set (does the agent give the right answer?)
   - Hindi language quality metrics (BLEU, chrF for reference-based; LLM-as-judge for open-ended)
   - Safety classification pass rate (Llama Guard 3 on all outputs)
   - Hallucination rate (groundedness check against retrieved documents)
   - Databricks Agent Evaluation via `mlflow.evaluate()` with `model_type="databricks-agent"` -- automated LLM judges score correctness, groundedness, and guideline adherence

2. **Human evaluation** (slower, essential for language/cultural quality):
   - Hindi-fluent evaluators rate: naturalness, cultural appropriateness, accuracy, helpfulness
   - Minimum 200-500 conversations per evaluation round
   - Databricks Review App enables structured human review with feedback capture
   - Pay special attention to: honorifics (आप vs तुम), regional dialect handling, code-switching

3. **A/B testing in shadow mode** (before any user exposure):
   - Run new model alongside current system on live traffic
   - Both produce responses; only current system's response is shown to user
   - Compare quality metrics side-by-side
   - Graduate to live A/B test (10% traffic) only after shadow metrics are satisfactory

**Phase 5: Model Versioning and Promotion**

Databricks Unity Catalog model registry:
- Models registered as `catalog.schema.model_name` (e.g., `jio_prod.cx_agents.hindi_cx_v2`)
- Each training run creates a new version automatically
- **Aliases** replace staging concepts: assign `Champion` to the production version, `Challenger` to the candidate
- Serving endpoints reference aliases -- promoting a model is just reassigning the `Champion` alias
- Lineage tracking via `mlflow.log_input()` links each model version to its training data
- Rollback = reassign `Champion` alias back to previous version (takes effect in seconds)

### Retraining Cadence

| Trigger | Action | Frequency |
|---------|--------|-----------|
| New plans/products/policies | Update RAG knowledge base | As needed (hours) |
| Drift detected (quality metrics declining) | Retrain LoRA adapter with recent conversations | Monthly or when metrics cross threshold |
| New capability required (e.g., video troubleshooting) | Fine-tune with new task-specific data | Quarterly or project-driven |
| Major model upgrade (Llama 5) | Full evaluation and potential re-adaptation | When available |
| Regulatory/compliance change | Update system prompts + safety guardrails | Immediately |

**Rule of thumb**: If you can fix it with prompt changes or RAG updates, don't retrain. Retraining is for behavioral changes.

---

## 2. Agent Lifecycle (Beyond the Model)

### What Is an Agent?

An agent is NOT just a model. An agent is:

```
Agent = Model + System Prompt + Tools + Memory + Guardrails + Orchestration Logic
```

Changing ANY of these components changes the agent's behavior. You need to version, test, and deploy the entire bundle.

### Google ADK Agent Architecture

ADK defines agents in code. A Jio CX agent might look like:

```python
from google.adk import Agent, SequentialAgent, ParallelAgent

# Specialized sub-agents
billing_agent = Agent(
    name="billing_agent",
    model="llama-4-scout",  # points to your serving endpoint
    instruction="You handle billing queries for Jio customers...",
    tools=[check_balance, get_bill_details, process_payment],
)

plan_agent = Agent(
    name="plan_agent",
    model="llama-4-scout",
    instruction="You help customers change or compare plans...",
    tools=[get_current_plan, list_plans, change_plan],
)

# Router agent that delegates
cx_router = Agent(
    name="cx_router",
    model="llama-4-scout",
    instruction="Route customer queries to the right specialist agent.",
    sub_agents=[billing_agent, plan_agent, network_agent, ...],
)
```

ADK supports three orchestration patterns:
- **SequentialAgent**: Steps execute in order (e.g., authenticate → classify → route → respond → log)
- **ParallelAgent**: Independent checks run simultaneously (e.g., check billing + check network status at same time)
- **LoopAgent**: Iterative refinement (e.g., retry with clarification until user confirms)

Communication between agents happens via:
1. **Shared session state** (`session.state`) -- agents read/write to a common state dict
2. **LLM-driven delegation** -- the model generates `transfer_to_agent("billing_agent")` calls
3. **AgentTool wrapping** -- treat sub-agents as callable tools

### Agent Versioning

There is no built-in "agent version" in ADK or Vertex AI Agent Engine today. You build this yourself:

**Practical approach**:
- Agent code lives in git. A git commit SHA = an agent version.
- Tag releases: `cx-agent-v1.2.3`
- The agent bundle (code + config + prompt templates + tool definitions) is packaged as a container image
- Deploy via CI/CD: `git tag → build container → deploy to Vertex AI Agent Engine or Cloud Run`
- Version metadata tracked in MLflow: log the git SHA, model version, prompt template hash, tool versions

**What gets versioned separately**:
| Component | Versioning Mechanism | Change Frequency |
|-----------|---------------------|------------------|
| Model weights | Databricks Unity Catalog (aliases) | Monthly |
| System prompts | Git + prompt template registry | Weekly |
| Tools (API integrations) | Git + API versioning | Per release |
| RAG knowledge base | Vector DB snapshots + timestamps | Daily/weekly |
| Guardrail config | Git (NeMo Guardrails Colang files) | Per policy change |
| Orchestration logic | Git (ADK agent definitions) | Per release |

### A/B Testing Agents

ADK does not natively support A/B testing. You implement it at the routing layer:

**Option 1: Gateway-level routing**
- Use an API gateway (Envoy, Istio, Cloud Load Balancer) in front of agent serving endpoints
- Route 10% of sessions to `cx-agent-v2` endpoint, 90% to `cx-agent-v1`
- Session-sticky routing (once a user is assigned v2, they stay on v2 for the session)

**Option 2: Databricks Model Serving traffic split**
- Create a serving endpoint with two "served entities" pointing to different agent versions
- Configure traffic percentage per entity
- Databricks handles the routing

**Option 3: Application-level feature flags**
- Use a feature flag system (LaunchDarkly, Unleash, or Jio's own)
- Flag determines which agent version is instantiated for a given user
- Most flexible: can target by user segment (prepaid vs postpaid, region, language)

### Rolling Back a Bad Agent

Rollback strategy depends on deployment method:

1. **Model rollback**: Reassign `Champion` alias in Unity Catalog to previous model version. Takes effect on next request.
2. **Agent code rollback**: Redeploy previous container image. Standard Kubernetes rollback or Cloud Run revision rollback.
3. **Prompt rollback**: If prompts are in a config store (not baked into container), update config and restart.
4. **Emergency kill switch**: Route 100% traffic to previous version via gateway. This should be a one-click operation.

**Critical requirement**: Rollback must complete in under 5 minutes. At 500M subscriber scale, even a 1% error rate means 5M affected users.

### Monitoring Agent Quality in Production

Metrics that matter (in priority order):

| Metric | What It Measures | Target | Alert Threshold |
|--------|-----------------|--------|-----------------|
| **Task completion rate** | Did the agent actually resolve the query? | >85% | Drop below 75% |
| **Escalation rate** | How often does it hand off to human agent? | <20% | Spike above 30% |
| **Customer satisfaction (CSAT)** | Post-interaction survey | >4.0/5.0 | Drop below 3.5 |
| **First contact resolution** | Resolved without callback/repeat | >70% | Drop below 60% |
| **Hallucination rate** | Factually incorrect statements | <2% | Above 5% |
| **Safety violation rate** | Llama Guard flags | <0.1% | Any spike |
| **Avg. response latency (p50/p95)** | Time to first token | p50 <500ms, p95 <2s | p95 >3s |
| **Cost per interaction** | Total token cost + infra | Benchmark per category | 2x spike |
| **Conversation turns to resolution** | Efficiency | <5 turns avg | >8 turns avg |

### Vertex AI Agent Engine Production Features

What it provides:
- **Managed runtime**: Deploy and scale without managing infrastructure
- **Sessions service**: Stores conversation context as the definitive state source
- **Memory Bank**: Cross-session memory for personalization (remembers past interactions)
- **Observability**: Integrated with Cloud Trace (OpenTelemetry), Cloud Monitoring, Cloud Logging
- **Security**: VPC Service Controls, customer-managed encryption keys, data residency
- **Agent Starter Pack**: Pre-built CI/CD pipelines via Cloud Build, Terraform automation, observability out of the box

What it does NOT provide (yet):
- Native agent versioning (you manage this via CI/CD)
- Native A/B testing (you build this at the routing layer)
- Native agent-level evaluation in production (use Databricks Agent Evaluation or custom)

---

## 3. Evaluation and Safety

### Evaluation Framework for 500M Users

You cannot human-review every conversation. The framework is a pyramid:

```
                    /\
                   /  \  Human expert review
                  /    \  (0.1% of conversations)
                 /------\
                / LLM-as \  Automated LLM judge
               /  -judge  \  (10% of conversations)
              /------------\
             / Automated     \  Rule-based + metric checks
            /  metrics        \  (100% of conversations)
           /------------------\
```

**Layer 1: 100% automated metrics (every conversation)**
- Latency, token count, cost
- Llama Guard 3 safety classification on every input and output
- Tool call success/failure rates
- Conversation completion (did the user get a resolution or abandon?)
- Regex/rule-based checks for: PII leakage, profanity, competitor mentions, unauthorized actions

**Layer 2: 10% LLM-as-judge (sampled)**
- Use a separate evaluator model (can be Llama 4 Scout itself, or a stronger model)
- Score: helpfulness, accuracy, tone, language quality
- Databricks Agent Evaluation runs `mlflow.evaluate()` on sampled conversations
- Produces: correctness score, groundedness score, guideline adherence score
- Flag conversations scoring below threshold for human review

**Layer 3: 0.1% human expert review**
- Databricks Review App distributes conversations to reviewers
- Reviewers assess: factual accuracy, cultural appropriateness, safety, resolution quality
- Feedback feeds back into training data pipeline
- Prioritize: conversations flagged by automated systems, edge cases, new query types

### Guardrails Stack

For Jio's deployment, the guardrails should be layered:

**Input guardrails (before the model sees the query)**:
1. **Prompt Guard** (Meta) -- detects prompt injection and jailbreak attempts
2. **PII detection** -- mask Aadhaar numbers, bank details, phone numbers before they reach the model
3. **Language detection** -- route non-Hindi/English queries appropriately
4. **Rate limiting** -- prevent abuse from single users

**Output guardrails (before the response reaches the user)**:
1. **Llama Guard 3** -- classifies output against 14 safety categories (S1-S14). Hindi supported with F1=0.871. Deploy the INT8 quantized version (meta-llama/Llama-Guard-3-8B-INT8) for cost efficiency.
2. **NeMo Guardrails** -- programmable rails using Colang DSL:
   - Topic guardrails: prevent the agent from discussing competitors, politics, religion
   - Action guardrails: require explicit confirmation for billing actions (see telco-specific below)
   - Fact-checking rail: verify claims against knowledge base before responding
3. **Custom business rules**: Regex for plan names, price validation, URL allowlisting

**Telco-specific safety concerns (critical)**:

These are not theoretical -- they are liability-creating actions:

| Action | Risk | Required Guardrail |
|--------|------|-------------------|
| Plan change | Customer charged differently | Explicit confirmation with plan details + price shown before execution |
| Bill payment | Financial transaction | OTP verification + amount confirmation |
| Credit/refund issuance | Revenue loss if exploited | Amount limits per interaction, manager approval above threshold |
| Account access | Privacy/identity theft | Authentication before any account-specific info |
| SIM swap/port | Identity fraud vector | Redirect to verified channel (in-store or authenticated app) |
| Data pack activation | Unexpected charges | Show price + validity, get explicit "yes" |

**Implementation pattern for high-risk actions**:

```python
# NeMo Guardrails Colang definition
define flow confirm_plan_change
    user wants to change plan
    bot show plan comparison with prices
    bot ask "Please confirm: change from ₹399 to ₹599? Reply YES to confirm."
    user confirms
    # Only THEN execute the tool call
    execute change_plan_tool
```

### Adversarial Users at Scale

At 500M users, adversarial attacks are guaranteed. Defense layers:

1. **Volume-based**: Rate limiting per user ID, per IP, per device fingerprint
2. **Pattern-based**: Prompt Guard catches known jailbreak patterns
3. **Behavioral**: Flag users who repeatedly trigger safety classifiers
4. **Honeypot responses**: For detected adversarial probes, return safe canned responses instead of model outputs
5. **Escalation**: Persistent adversarial users get flagged and routed to human moderation queue
6. **Logging**: Every interaction is logged for forensic review. Adversarial conversations are high-value training data.

---

## 4. Observability and Monitoring

### What to Monitor

Three categories: infrastructure, model, and business.

**Infrastructure metrics (SRE team owns this)**:
| Metric | Tool | Alert Condition |
|--------|------|-----------------|
| GPU utilization | DCGM Exporter → Prometheus | Sustained >90% or <20% (waste) |
| GPU memory | DCGM Exporter → Prometheus | >95% (OOM risk) |
| GPU temperature | DCGM Exporter | >80°C |
| Inference latency (p50/p95/p99) | OpenTelemetry → Cloud Trace | p99 >5s |
| Throughput (requests/sec) | API gateway metrics | Below capacity plan |
| Error rate (5xx) | API gateway metrics | >1% |
| Token throughput | vLLM metrics endpoint | Below baseline |
| Queue depth | vLLM/serving framework | Growing (indicates undercapacity) |
| Node/pod health | Kubernetes metrics | Any unhealthy |

**Model/Agent metrics (ML team owns this)**:
| Metric | Tool | Alert Condition |
|--------|------|-----------------|
| Token usage per conversation | MLflow tracing | Unusual spikes (indicates loops) |
| Tool call success rate | MLflow tracing / custom | Drop below 95% |
| Guardrail trigger rate | NeMo Guardrails logs | Sudden spike |
| Safety violation rate | Llama Guard output logs | Any spike above baseline |
| Hallucination rate (sampled) | LLM-as-judge pipeline | Above 5% |
| Conversation abandonment | Session tracking | Spike above baseline |
| Mean turns per resolution | Session tracking | Increasing trend |

**Business metrics (product team owns this)**:
| Metric | Source | Alert Condition |
|--------|--------|-----------------|
| CSAT score | Post-interaction survey | Below 3.5/5.0 |
| Task completion rate | Session outcome tracking | Below 75% |
| Escalation rate to human | Routing logs | Above 30% |
| Cost per resolution | Token cost + infra allocation | Above budget |
| Call deflection rate | IVR → AI agent handoff metrics | Below target |
| Revenue impact | CRM + billing systems | Unusual credit issuance patterns |

### Tooling Stack

Recommended observability stack for Jio's setup:

```
┌─────────────────────────────────────────────────────────┐
│                    Grafana Dashboards                    │
├──────────┬──────────┬──────────┬────────────────────────┤
│ Prometheus│ Cloud    │ MLflow 3 │ Databricks            │
│ (infra   │ Trace    │ Tracing  │ Agent Evaluation      │
│  metrics)│ (latency)│ (agent   │ (quality scoring)     │
│          │          │  traces) │                        │
├──────────┴──────────┴──────────┴────────────────────────┤
│              OpenTelemetry Collector                     │
├──────────┬──────────┬──────────┬────────────────────────┤
│ vLLM     │ Google   │ NeMo     │ Application           │
│ serving  │ ADK      │ Guardrails│ code                 │
│ metrics  │ traces   │ logs     │ logs                  │
└──────────┴──────────┴──────────┴────────────────────────┘
```

- **MLflow 3** (Databricks): Agent-native tracing -- logs every step of agent execution (tool calls, model invocations, retrieval steps) with input/output at each step. This is the primary agent observability tool.
- **OpenTelemetry**: Standard instrumentation layer. ADK natively supports Cloud Trace with OTel. vLLM exposes Prometheus metrics.
- **Databricks Agent Evaluation**: Runs automated LLM-judge scoring on production traffic samples. Produces quality dashboards.
- **Vertex AI observability**: Cloud Trace + Cloud Monitoring + Cloud Logging if running on Agent Engine.

### Drift Detection

How do you know the model is getting worse?

1. **Statistical process control on key metrics**: Track task completion rate, escalation rate, and CSAT as time series. Alert on sustained deviations (not just single-point anomalies).
2. **Reference evaluation set**: Maintain a fixed set of 500+ conversations. Re-evaluate the production model against this set weekly. If scores drop, investigate.
3. **Input drift detection**: Monitor the distribution of incoming queries. If new query types appear that weren't in training data, the model may struggle. Databricks can track feature/input drift.
4. **Human review trend**: If human reviewers are flagging more issues in the 0.1% sample, extrapolate to the full population.

### Integration with Jio's Existing Monitoring

Jio runs GridX for network monitoring. The integration point:

- Agent monitoring does NOT replace GridX -- they are different systems monitoring different things
- **Integration opportunity**: When the AI agent handles network complaints ("my internet is slow"), it should query GridX data to check actual network status in the customer's area. This makes GridX a tool the agent calls, not a monitoring peer.
- **Unified alerting**: Route agent alerts to the same PagerDuty/OpsGenie instance that GridX uses, so the NOC (Network Operations Center) has visibility when the AI CX system is degraded
- **Correlation**: If GridX shows a network outage in Mumbai, expect a spike in AI agent conversations about connectivity. Alert thresholds should account for correlated spikes.

---

## 5. Data Flywheel

### Production Conversations → Training Data

This is the engine that makes the system get better over time. Without it, you deployed a static model.

```
Production conversations
        │
        ▼
┌──────────────────┐
│ Log to inference  │ ← Every conversation stored
│ tables (Databricks)│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Automated quality │ ← LLM-judge scores, guardrail flags,
│ scoring           │   task completion, user feedback
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Triage pipeline   │ ← Route to: training data, human review,
│                   │   bug report, or ignore
└────────┬─────────┘
         │
    ┌────┴────────┬──────────────┐
    ▼             ▼              ▼
 Good          Bad/Edge      Ambiguous
 conversations  cases        → Human review
 → Positive     → Rewrite    → Label
   training       with correct  → Route to
   examples       responses     training or
                  → Hard         discard
                    negative
                    examples
```

### Privacy and Consent

This is a legal minefield in India. Key considerations:

- **DPDP Act 2023** (Digital Personal Data Protection): Customer data can only be used for the purpose it was collected. Using CX conversations to train AI likely requires explicit consent.
- **Consent mechanism**: Add to Jio's Terms of Service that interactions with the AI assistant may be used to improve the service. Provide opt-out option.
- **PII stripping**: Before any conversation enters the training pipeline, strip: name, phone number, Aadhaar, address, account number. Replace with placeholders.
- **Data residency**: Training data must stay in India. This aligns with Jio's self-hosted infrastructure but needs explicit policy.
- **Retention period**: Define how long raw conversations are kept vs. anonymized training data.
- **Audit trail**: Log who accessed training data, when, and for what purpose.

### Human-in-the-Loop Review

| Parameter | Recommendation |
|-----------|---------------|
| **Sample rate** | 0.1% of all conversations for general review; 100% of guardrail-flagged conversations |
| **Reviewers** | Internal Jio CX team (they know the domain); 10-20 reviewers for initial scale |
| **Review tool** | Databricks Review App (built into Agent Framework) |
| **Review criteria** | Accuracy, helpfulness, safety, language quality, cultural appropriateness |
| **Feedback loop** | Reviewed conversations with corrections become training data within 2 weeks |
| **Escalation** | Serious safety violations → immediate model/prompt update |

### Active Learning

The system should identify its own knowledge gaps:

1. **Low-confidence detection**: When the model's token probabilities are low, flag the conversation as "uncertain." These are the highest-value examples for human review.
2. **New intent detection**: Cluster incoming queries. When a new cluster emerges that doesn't map to existing intents, flag for human categorization.
3. **Tool failure patterns**: When tool calls fail repeatedly for a category of query, that's a capability gap -- either the tool needs fixing or the agent needs retraining.
4. **Escalation analysis**: Every conversation that escalates to a human agent is a failure case. Analyze why. Common patterns become training priorities.
5. **User correction detection**: When a user says "no, that's wrong" or "I didn't ask for that," the preceding agent response is a negative example.

---

## 6. Infrastructure Operations

### Operating Model

This is a political question as much as a technical one. Three models:

| Model | Jio Runs | Accenture Runs | Shared |
|-------|----------|----------------|--------|
| **Full Jio** | Everything (GPU infra, model serving, agent development, monitoring) | Advisory only | Nothing |
| **Hybrid (Recommended)** | GPU infra, model serving, network integration, data platform | Agent development, evaluation framework, MLOps pipeline, fine-tuning operations | Agent monitoring, safety framework, production support |
| **Managed Service** | Data platform, business rules | Agent platform end-to-end | SLAs and handoff points |

**Reality check**: Jio built their own 5G stack. They have the engineering depth to run GPU infrastructure. Accenture's value-add is the CX domain expertise, agent development methodology, and MLOps maturity. The hybrid model is the natural fit.

### SRE Practices for LLM Serving

**GPU health monitoring**:
- NVIDIA DCGM (Data Center GPU Manager) exports metrics to Prometheus
- Monitor: GPU utilization, memory usage, temperature, ECC errors, NVLink bandwidth
- ECC errors are a leading indicator of GPU failure -- alert and preemptively migrate workloads
- Xid errors in kernel logs indicate GPU hardware issues

**Model serving autoscaling**:
- vLLM is the likely serving framework for Llama 4 Scout (confirmed support in v0.8.3+)
- Scaling dimensions:
  - **Horizontal**: Add more vLLM replicas behind a load balancer
  - **Vertical**: Increase tensor parallelism (spread model across more GPUs per replica)
  - **Request batching**: vLLM's continuous batching maximizes GPU utilization
- Autoscaling signals: queue depth, p95 latency, GPU utilization
- Scale-up must be fast enough to handle traffic spikes (morning recharge rush, evening usage peak, IPL match days)

**Hardware configuration for Llama 4 Scout**:
- 8x H100 GPUs: supports 1M token context window
- 8x H200 GPUs: supports 3.6M token context window
- INT4 quantization: fits on single H100 (reduced quality, likely not recommended for production CX)
- FP8 KV cache (`--kv-cache-dtype fp8`): doubles usable context with minimal accuracy loss -- **recommended**
- For Jio's scale: multiple replicas of 8-GPU instances behind load balancer

### Cost Optimization

| Technique | Savings | Trade-off |
|-----------|---------|-----------|
| **Response caching** | High (exact match queries return cached response) | Cache invalidation complexity; stale responses |
| **Semantic caching** | Medium-High (similar queries return cached response using embedding similarity) | Requires embedding model + vector DB; threshold tuning |
| **Request batching** | Medium (vLLM continuous batching is automatic) | Slight latency increase for individual requests |
| **Shorter system prompts** | Low-Medium (fewer tokens per request) | Less instruction → potentially worse quality |
| **Tiered routing** | High (simple queries → smaller/cheaper model; complex → Scout) | Need a reliable classifier; latency for classification step |
| **Spot/preemptible instances** | 60-80% cost reduction for non-critical workloads | Not for production serving; good for batch evaluation, fine-tuning |
| **Off-peak scaling** | Medium (scale down replicas at 2am) | Risk of cold-start latency if traffic spikes unexpectedly |

**Tiered routing is the highest-impact optimization**: A significant percentage of CX queries are simple ("what's my balance?", "when is my plan expiry?"). These can be handled by a smaller model (Llama 3.2 3B) or even deterministic API calls without LLM involvement. Reserve Scout for complex queries that need reasoning.

### Disaster Recovery

| Scenario | Mitigation |
|----------|-----------|
| GPU node failure | Kubernetes reschedules pods to healthy nodes; maintain N+2 redundancy |
| Full GPU cluster down | Failover to secondary cluster (if multi-cluster); degrade to deterministic bot + human agents |
| Model serving crash | Health checks + automatic restart; load balancer routes to healthy replicas |
| Data corruption (vector DB) | Regular snapshots; rebuild from source documents |
| Model produces harmful output at scale | Emergency kill switch → route all traffic to safe fallback (rule-based bot or human queue) |
| Region-level outage | Multi-region deployment (see below) |

**Key principle**: The AI agent is an enhancement, not the only CX channel. If the AI goes down, customers must be able to reach human agents or use self-service IVR. Never let the AI system become a single point of failure.

### Multi-Region Deployment for India

India's geography requires consideration:

- **Primary regions**: Mumbai (west), Chennai (south), Delhi (north) -- matching Jio's data center footprint
- **Latency target**: <200ms end-to-end for text; <500ms for voice-to-text-to-voice
- **Data residency**: All data stays in India (aligns with DPDP Act and Jio's infrastructure philosophy)
- **Regional routing**: Route users to nearest GPU cluster based on IP/cell tower location
- **Language routing**: Hindi-dominant north India vs. regional language needs in south -- may need different model configurations per region

---

## 7. The Conversations Vasco Needs to Have

### Topic: Model Lifecycle

**Questions to ask Jio's tech team**:
- "What's your current inference stack for Llama 4 Scout? vLLM? TensorRT-LLM? TGI? Custom?"
- "How many GPU nodes are allocated to CX agent serving vs. other AI workloads?"
- "Have you done any fine-tuning on Scout for Hindi CX, or are you running the base instruct model with prompt engineering?"
- "What's your current evaluation pipeline? Are you using Databricks Agent Evaluation, or something custom?"
- "What's the retraining cadence you're planning? Who triggers a retrain?"

**Answers to be prepared to give**:
- "We recommend starting with RAG + prompt engineering, then LoRA adapters for behavioral tuning. Full fine-tuning should be a last resort for Scout's MoE architecture." (Strong opinion -- this is based on best practice.)
- "For evaluation, we'll implement a three-layer pyramid: 100% automated metrics, 10% LLM-judge, 0.1% human review, using Databricks Agent Evaluation as the backbone." (Strong opinion.)
- "Data format is JSONL chat-completion. We need at least 10K high-quality Hindi CX examples for LoRA, and we should generate synthetic edge cases." (Specific and actionable.)

**Where to say "let's figure this out together"**:
- "The fine-tuning infrastructure for Llama 4 MoE is new territory -- Databricks doesn't support it natively yet. We need to decide: do we use your GPU cluster with DeepSpeed, or wait for platform support?"
- "The retraining cadence depends on drift patterns we'll only see after we're in production. Let's start with monthly evaluation and adjust."

### Topic: Agent Architecture

**Questions to ask**:
- "How do you envision the agent architecture? Single monolithic agent, or multi-agent with routing?"
- "What CX tools already have APIs we can call? (Billing, CRM, plan management, network status)"
- "Are you planning to use Google ADK, or do you have an internal orchestration framework?"
- "How does the agent integrate with your existing IVR and human agent handoff systems?"

**Answers to be prepared to give**:
- "We recommend a multi-agent architecture with ADK: a router agent that classifies intent and delegates to specialized agents (billing, plans, network, general). This gives us independent versioning and testing per domain." (Strong opinion.)
- "Each specialized agent needs its own tool set, system prompt, and evaluation criteria. We version the whole bundle via git, deploy as containers." (Strong opinion.)
- "For A/B testing, we'll use feature flags at the application layer for maximum flexibility -- gateway-level routing doesn't give us the user-segment targeting we need." (Strong opinion, open to Jio's infrastructure preferences.)

**Where to say "let's figure this out together"**:
- "The boundary between what the AI agent handles autonomously vs. what requires human confirmation needs to be defined by your compliance and CX teams. We'll implement the guardrails, but you own the policy."
- "Memory architecture -- how much cross-session personalization do you want? This has privacy implications we need to navigate with your legal team."

### Topic: Safety and Guardrails

**Questions to ask**:
- "What are your compliance requirements for automated customer interactions? (TRAI regulations, DPDP Act)"
- "What's the maximum financial action the AI agent should be able to take without human approval?"
- "Have you defined your safety taxonomy? What topics should the agent refuse to discuss?"
- "What's the escalation path when the agent fails? How fast can it hand off to a human?"

**Answers to be prepared to give**:
- "We'll deploy Llama Guard 3 on every input and output. It supports Hindi with 0.871 F1. We'll run the INT8 quantized version for cost efficiency." (Specific, backed by benchmarks.)
- "For high-risk actions (plan changes, payments, SIM operations), we implement explicit confirmation flows using NeMo Guardrails Colang. No billing action executes without the customer seeing the price and confirming." (Non-negotiable strong opinion.)
- "We'll layer: Prompt Guard (input) → PII masking → model → Llama Guard 3 (output) → NeMo business rules → response. Four checkpoint layers before anything reaches the customer." (Architecture opinion.)

**Where to say "let's figure this out together"**:
- "The threshold for credit/refund issuance without human approval is a business decision. We can implement any threshold, but the business needs to define the risk appetite."
- "Adversarial user handling at 500M scale requires volume-based defenses that integrate with your existing fraud detection systems. Let's map what you already have."

### Topic: Observability

**Questions to ask**:
- "What's your current observability stack? Prometheus/Grafana? Datadog? Custom?"
- "How does GPU monitoring work today? DCGM? Custom tooling?"
- "What are your SLAs for the AI CX channel? (Uptime, response time, resolution rate)"
- "Can we get access to GridX APIs for the agent to check network status?"

**Answers to be prepared to give**:
- "We'll use MLflow 3 tracing as the primary agent observability layer -- it captures every step of agent execution with inputs and outputs. This integrates natively with Databricks." (Strong opinion -- it's their platform.)
- "We need three dashboards: infrastructure (GPU/infra health), agent quality (task completion, safety, escalation), and business impact (CSAT, cost, call deflection). Different teams own different dashboards." (Specific.)
- "Drift detection via weekly evaluation against a fixed reference set, plus statistical process control on daily quality metrics." (Methodology opinion.)

**Where to say "let's figure this out together"**:
- "The alerting thresholds need to be calibrated based on actual production data. We'll start with industry benchmarks and adjust in the first month."
- "Integration between agent monitoring and GridX is an opportunity but needs API access and data mapping we haven't scoped yet."

### Topic: Data Flywheel

**Questions to ask**:
- "What's your legal position on using customer conversations for model improvement under DPDP?"
- "Do you have a labeling team, or do we need to build/outsource one?"
- "What's the current volume of CX interactions per day? (This sizes the review infrastructure.)"
- "How quickly do you need the flywheel to turn? Weekly model updates? Monthly?"

**Answers to be prepared to give**:
- "Every production conversation gets logged to Databricks inference tables. We run automated quality scoring on 100%, sample 0.1% for human review. Bad conversations become the highest-priority training data." (Strong opinion -- this is standard practice.)
- "PII stripping is non-negotiable before any conversation enters the training pipeline. We use regex + NER model to catch Aadhaar, phone numbers, account numbers, and names." (Non-negotiable.)
- "Active learning: we flag low-confidence responses, new intent clusters, and user corrections automatically. These are the conversations that make the next model version better." (Methodology opinion.)

**Where to say "let's figure this out together"**:
- "The consent mechanism for data usage needs your legal team's input. We recommend explicit ToS language plus opt-out, but the legal structure is yours."
- "Review team sizing depends on conversation volume and quality targets. Let's start with 10 reviewers, measure throughput, and scale."

### Topic: Infrastructure Operations

**Questions to ask**:
- "Who operates the GPU cluster today? Is there a dedicated AI infrastructure team?"
- "What's the DR plan for the GPU cluster? Active-active multi-region, or active-passive?"
- "What's your GPU procurement pipeline? (Lead times for scaling up)"
- "How do you handle GPU failures today for other AI workloads?"

**Answers to be prepared to give**:
- "We recommend a hybrid operating model: Jio owns GPU infrastructure and model serving, Accenture owns agent development, evaluation, and MLOps. We share production support." (Directional opinion -- open to negotiation.)
- "For serving Llama 4 Scout, we recommend 8x H100 per replica with FP8 KV cache, multiple replicas behind a load balancer, autoscaling on queue depth and p95 latency." (Specific technical recommendation.)
- "Cost optimization priority: (1) tiered routing to avoid using Scout for simple queries, (2) semantic caching, (3) right-sizing replicas with autoscaling, (4) off-peak scaling." (Prioritized list.)

**Where to say "let's figure this out together"**:
- "The exact autoscaling parameters (min/max replicas, scale-up/down thresholds) need load testing with realistic traffic patterns. We need access to Jio's traffic data to model this."
- "Multi-region deployment topology depends on Jio's data center footprint and latency requirements. We need to map this together."

---

## Quick Reference: Key Technology Decisions

| Decision | Recommendation | Confidence |
|----------|---------------|------------|
| Inference framework | vLLM v0.8.3+ (confirmed Llama 4 Scout support) | High |
| Quantization | FP8 KV cache on 8x H100 | High |
| Agent orchestration | Google ADK (multi-agent with SequentialAgent/ParallelAgent) | High (it's the stated choice) |
| Agent deployment | Vertex AI Agent Engine or Cloud Run (depends on Jio's GCP footprint) | Medium |
| Model registry | Databricks Unity Catalog with Champion/Challenger aliases | High |
| Evaluation | Databricks Agent Evaluation + Llama Guard 3 + human review | High |
| Safety guardrails | Llama Guard 3 (I/O) + Prompt Guard (input) + NeMo Guardrails (business rules) | High |
| Observability | MLflow 3 tracing + OpenTelemetry + Prometheus/Grafana | High |
| Fine-tuning approach | LoRA adapters first, full fine-tune only if needed | High |
| RAG platform | Databricks Vector Search (native to their data platform) | High |
| Human review | Databricks Review App | Medium |

## Licensing Alert

Llama 4 Scout's license requires a **custom commercial license from Meta** for products with >700M monthly active users. Jio's 500M subscribers are below this threshold, but the combined user base across all Jio services may exceed it. **This needs legal review before production deployment.**
