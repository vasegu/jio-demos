# Google AI Stack for Jio: End-to-End Walkthrough

**Audience**: CX Development Lead (not ML engineer)
**Context**: Jio -- 500M+ subscribers, India's largest telco
**Purpose**: Understand what each Google service actually does, how they connect, and where the boundaries are

---

## Architecture Overview

```
                          THE FULL PICTURE
  ┌──────────────────────────────────────────────────────────┐
  │                    DATABRICKS                            │
  │  Events (600-700/customer/day) → Structured Streaming    │
  │  → Pattern Detection → Signal Published to Pub/Sub       │
  └──────────────────┬───────────────────────────────────────┘
                     │ Google Cloud Pub/Sub
                     ▼
  ┌──────────────────────────────────────────────────────────┐
  │              VERTEX AI AGENT ENGINE                      │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │              ADK AGENTS (Python)                   │  │
  │  │                                                    │  │
  │  │  ┌──────────┐   ┌──────────┐   ┌──────────────┐   │  │
  │  │  │ Router   │──▶│ Billing  │   │ Network      │   │  │
  │  │  │ Agent    │──▶│ Agent    │   │ Agent        │   │  │
  │  │  │          │──▶│ Churn    │   │ Upsell Agent │   │  │
  │  │  │          │   │ Agent    │   │              │   │  │
  │  │  └──────────┘   └────┬─────┘   └──────┬───────┘   │  │
  │  │                      │                │            │  │
  │  │              ┌───────▼────────────────▼──────┐     │  │
  │  │              │         TOOLS                 │     │  │
  │  │              │  - Jio CRM API               │     │  │
  │  │              │  - Network Status API         │     │  │
  │  │              │  - Billing API                │     │  │
  │  │              │  - Push Notification API      │     │  │
  │  │              │  - Databricks SQL Connector   │     │  │
  │  │              └──────────────────────────────┘     │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  Sessions (short-term) ◀──▶ Memory Bank (long-term)     │
  │  Auto-scaling ◀──▶ Monitoring                            │
  └──────────────────┬───────────────────────────────────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
     Push/SMS    In-App     Voice (IVR)
     via Jio     Message    via Gemini
     APIs                   Live API
```

---

## 1. Google ADK -- How It Actually Works

### What Is an Agent in ADK?

An Agent is a Python class with four things:
1. A **model** (which LLM to use)
2. An **instruction** (system prompt -- who it is, what it does)
3. **Tools** (Python functions it can call)
4. Optionally, **sub_agents** (other agents it can delegate to)

That's it. No YAML. No drag-and-drop UI. It's code.

### The Simplest Possible Agent

```python
# agent.py -- this is the entire file
from google.adk.agents import Agent

def check_balance(customer_id: str) -> dict:
    """Checks the prepaid balance for a Jio customer.

    Args:
        customer_id: The Jio customer ID (10-digit number)

    Returns:
        dict with balance_inr, plan_name, days_remaining
    """
    # In production, this calls Jio's billing API
    return {
        "status": "success",
        "balance_inr": 149,
        "plan_name": "Jio Freedom 399",
        "days_remaining": 12
    }

def check_network_status(customer_id: str) -> dict:
    """Checks recent network quality for a customer's location.

    Args:
        customer_id: The Jio customer ID

    Returns:
        dict with signal_strength, recent_drops, tower_status
    """
    return {
        "status": "success",
        "signal_strength": "good",
        "recent_drops": 3,
        "tower_status": "maintenance_scheduled"
    }

# This is the agent definition. That's it.
root_agent = Agent(
    model="gemini-2.5-flash",
    name="jio_support_agent",
    description="Handles Jio customer support inquiries",
    instruction="""You are a Jio customer support agent. You help customers
    with billing questions, network issues, and plan recommendations.

    Always check the customer's balance and network status before making
    recommendations. Be concise. Speak in the customer's preferred language
    (Hindi or English).

    If the customer has had 3+ network drops recently, proactively acknowledge
    the issue and explain any scheduled maintenance.""",
    tools=[check_balance, check_network_status],
)
```

**Key insight**: The docstrings on the tool functions are critical. The LLM reads them to decide WHEN to call each tool and WHAT arguments to pass. Bad docstrings = agent that doesn't use tools correctly.

### How You Give It Tools

ADK supports three types of tools:

#### 1. Function Tools (most common)

Any Python function becomes a tool. ADK auto-generates the schema from the function signature, type hints, and docstring.

```python
def send_recharge_reminder(customer_id: str, days_until_expiry: int) -> dict:
    """Sends a recharge reminder to the customer via their preferred channel.

    Args:
        customer_id: Jio customer ID
        days_until_expiry: Number of days until current plan expires

    Returns:
        dict with send_status and channel used
    """
    # Call Jio's notification API
    response = jio_notification_api.send(
        customer_id=customer_id,
        template="recharge_reminder",
        params={"days": days_until_expiry}
    )
    return {"status": "sent", "channel": response.channel}
```

#### 2. MCP Tools (connect to external servers)

MCP (Model Context Protocol) lets your agent connect to tool servers -- yours or third-party.

```python
from google.adk.agents import Agent
from google.adk.tools.mcp_tool import MCPToolset, SseServerParams

# Connect to Jio's internal MCP server that exposes CRM tools
jio_crm_tools = MCPToolset(
    connection_params=SseServerParams(
        url="https://internal-mcp.jio.com/sse",
        headers={"Authorization": "Bearer ${JIO_MCP_TOKEN}"}
    )
)

agent = Agent(
    model="gemini-2.5-flash",
    name="jio_crm_agent",
    instruction="You manage customer relationship data for Jio.",
    tools=[jio_crm_tools],  # All tools from the MCP server are available
)
```

#### 3. Agents-as-Tools

One agent can use another agent as a tool. The parent agent calls the child agent like a function, gets back a result, and continues its own reasoning.

```python
from google.adk.tools import AgentTool

# The billing agent is wrapped as a tool for the router
billing_tool = AgentTool(agent=billing_agent)
```

### The Router Agent Pattern

This is the pattern you'll use for Jio. A single "router" agent receives all customer requests and dispatches to specialist agents.

```python
from google.adk.agents import Agent

# --- Specialist Agents ---

billing_agent = Agent(
    model="gemini-2.5-flash",
    name="billing_agent",
    description="Handles all billing inquiries: balance checks, recharge, "
                "plan changes, payment issues, invoice requests.",
    instruction="""You are a billing specialist for Jio. You can check balances,
    process recharges, change plans, and resolve payment disputes.
    Always confirm the action before executing it.""",
    tools=[check_balance, process_recharge, change_plan, get_invoice],
)

network_agent = Agent(
    model="gemini-2.5-flash",
    name="network_agent",
    description="Handles network quality issues: dropped calls, slow data, "
                "coverage problems, tower maintenance updates.",
    instruction="""You are a network specialist for Jio. You diagnose
    connectivity issues, check tower status, and escalate persistent problems.
    If a tower is under maintenance, give the customer an honest ETA.""",
    tools=[check_network_status, check_tower_status, create_network_ticket],
)

churn_prevention_agent = Agent(
    model="gemini-2.5-flash",
    name="churn_prevention_agent",
    description="Handles customers showing signs of leaving: frequent complaints, "
                "competitor mentions, plan downgrades, long inactivity.",
    instruction="""You are a retention specialist. Your goal is to understand
    WHY the customer is unhappy and offer a genuine solution -- not just a
    discount. Check their history, acknowledge past issues, and propose a
    specific remedy. You can offer retention plans and credits.""",
    tools=[get_customer_history, get_retention_offers, apply_credit,
           offer_retention_plan],
)

upsell_agent = Agent(
    model="gemini-2.5-flash",
    name="upsell_agent",
    description="Handles upsell opportunities: customers who consistently exceed "
                "their data limits, families who could benefit from group plans, "
                "customers eligible for JioFiber bundles.",
    instruction="""You are a plan advisor. Only recommend upgrades that genuinely
    benefit the customer based on their actual usage patterns. Never push.
    Show them the math: 'You used 45GB last month on a 30GB plan, the 75GB
    plan would save you X per month in overage charges.'""",
    tools=[get_usage_patterns, get_plan_recommendations, initiate_plan_change],
)

# --- Router Agent (the front door) ---

root_agent = Agent(
    model="gemini-2.5-flash",
    name="jio_router",
    description="Routes customer requests to the right specialist",
    instruction="""You are the Jio customer service coordinator. Your ONLY job
    is to understand what the customer needs and route them to the right
    specialist agent. Do NOT try to answer questions yourself.

    Routing rules:
    - Billing questions → billing_agent
    - Network/connectivity issues → network_agent
    - Customer seems frustrated, mentions competitors, or has a history
      of complaints → churn_prevention_agent (even if they're asking about
      billing -- the churn agent handles the relationship)
    - Customer is on a plan that doesn't fit their usage → upsell_agent

    If unclear, ask ONE clarifying question before routing.""",
    sub_agents=[billing_agent, network_agent, churn_prevention_agent,
                upsell_agent],
)
```

**How routing actually works**: The router agent's LLM reads the `description` field of each sub_agent and decides which one to delegate to. The description is basically the routing table. Make it precise.

### How A2A Works Between Agents

A2A (Agent-to-Agent protocol) is different from sub_agents. Sub_agents are agents within YOUR system. A2A is for agents talking to agents in OTHER systems -- across organizations, across vendors.

**Analogy**: sub_agents = departments within Jio. A2A = Jio's agent talking to a bank's agent to process a payment.

```
A2A Protocol
┌─────────────────┐         ┌─────────────────┐
│  JIO AGENT      │  HTTP   │  BANK AGENT     │
│  (Client)       │◀──────▶│  (Remote)        │
│                 │ JSON-RPC│                  │
│  "Process       │         │  "Here's the     │
│   payment for   │         │   payment        │
│   customer X"   │         │   confirmation"  │
└─────────────────┘         └─────────────────┘
        ▲                          ▲
        │                          │
  Agent Card                 Agent Card
  (what I can do)            (what I can do)
```

Each A2A agent publishes an **Agent Card** at `/.well-known/agent.json`:

```json
{
  "name": "jio-billing-agent",
  "description": "Processes Jio billing inquiries and payment operations",
  "url": "https://agents.jio.com/billing",
  "version": "1.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "skills": [
    {
      "id": "check-balance",
      "name": "Check Balance",
      "description": "Check prepaid or postpaid balance for a Jio subscriber"
    },
    {
      "id": "process-payment",
      "name": "Process Payment",
      "description": "Process a bill payment through UPI, card, or net banking"
    }
  ],
  "securitySchemes": {
    "oauth2": {
      "type": "oauth2",
      "flows": { "clientCredentials": { "tokenUrl": "https://auth.jio.com/token" }}
    }
  }
}
```

Communication uses JSON-RPC over HTTP/SSE:

```json
// Client sends a task
{
  "jsonrpc": "2.0",
  "method": "tasks/send",
  "params": {
    "id": "task-123",
    "message": {
      "role": "user",
      "parts": [{ "text": "Check balance for customer 9876543210" }]
    }
  }
}

// Remote agent responds
{
  "jsonrpc": "2.0",
  "result": {
    "id": "task-123",
    "status": { "state": "completed" },
    "artifacts": [{
      "parts": [{ "text": "Balance: ₹149, Plan: Freedom 399, 12 days remaining" }]
    }]
  }
}
```

**When to use A2A vs sub_agents**:
- sub_agents: agents you own and deploy together (Jio's internal agents)
- A2A: agents across trust boundaries (Jio talking to a payment provider, a government ID verification service, etc.)

ADK has built-in A2A support. You can expose any ADK agent as an A2A server:

```python
from google.adk.a2a import to_a2a_app

# Turn your ADK agent into an A2A-compliant server
a2a_app = to_a2a_app(billing_agent)
# Deploy this as a Cloud Run service
```

### Deployment: `adk deploy`

From development to production in one command:

```bash
# Local development (interactive CLI)
adk run jio_support_agent

# Local development (web UI with chat interface)
adk web jio_support_agent

# Deploy to Vertex AI Agent Engine (production)
adk deploy agent_engine \
    --project=jio-cx-prod \
    --region=asia-south1 \
    --display_name="Jio CX Agent v2.1" \
    jio_support_agent
```

The `adk deploy agent_engine` command:
1. Packages your agent code
2. Uploads it to Vertex AI Agent Engine
3. Creates a managed endpoint with auto-scaling
4. Returns an endpoint URL you can call from your app

For production tuning:
```python
# deploy_config.py -- production deployment configuration
config = {
    "min_instances": 10,        # Always keep 10 warm (no cold starts)
    "max_instances": 500,       # Scale up to 500 for peak traffic
    "container_concurrency": 9, # Each instance handles 9 concurrent requests
    "resource_limits": {
        "cpu": "4",
        "memory": "8Gi"
    }
}
```

You can also deploy to **GKE** (Google Kubernetes Engine) or **Cloud Run** if you need more control over the infrastructure.

### How You Swap the LLM

ADK uses a `model` parameter. For Gemini models, you just pass the model name string. For anything else, you wrap it in `LiteLlm()`.

```python
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm

# --- Same agent, three different models ---

# Option 1: Gemini (native, fastest, cheapest on Google Cloud)
agent_gemini = Agent(
    model="gemini-2.5-flash",
    name="jio_agent",
    instruction="You are a Jio support agent...",
    tools=[check_balance, check_network_status],
)

# Option 2: Claude (via LiteLLM)
agent_claude = Agent(
    model=LiteLlm(model="anthropic/claude-sonnet-4-5-20250929"),
    name="jio_agent",
    instruction="You are a Jio support agent...",  # Same instruction
    tools=[check_balance, check_network_status],   # Same tools
)

# Option 3: Llama (via LiteLLM + Vertex AI Model Garden)
agent_llama = Agent(
    model=LiteLlm(model="vertex_ai/meta/llama-3.1-405b-instruct"),
    name="jio_agent",
    instruction="You are a Jio support agent...",  # Same instruction
    tools=[check_balance, check_network_status],   # Same tools
)

# Option 4: Llama running locally via Ollama
agent_local = Agent(
    model=LiteLlm(model="ollama/llama3.1"),
    name="jio_agent",
    instruction="You are a Jio support agent...",
    tools=[check_balance, check_network_status],
)
```

**What changes**: only the `model=` line.
**What stays the same**: instruction, tools, sub_agents, deployment.

**Gotchas when swapping models**:
| Issue | Detail |
|-------|--------|
| Function calling format | Gemini, Claude, and GPT all have slightly different function calling schemas. LiteLLM normalizes this, but edge cases exist (e.g., Claude's tool_use blocks vs Gemini's functionCall). Test your tools with each model. |
| Context window | Gemini 2.5 Pro: 1M tokens. Claude: 200K. Llama 3.1: 128K. If your agent loads large customer histories, check you're not exceeding the window. |
| Streaming behavior | Gemini streams natively. Others may have latency differences through LiteLLM. |
| Cost | Gemini Flash is extremely cheap on Vertex AI. Claude and GPT are significantly more expensive per token. For 500M subscribers, this matters enormously. |
| Speed | Gemini Flash on Vertex AI will be fastest (no network hop to another provider). |

**Practical recommendation for Jio**: Use Gemini Flash for the high-volume agents (router, billing, network). Consider Gemini Pro or Claude for the churn prevention agent where nuance matters more than speed. Use LiteLLM so you can A/B test models without code changes.

---

## 2. Vertex AI Agent Engine -- What It Actually Manages

### What "Managed Runtime" Means Practically

Without Agent Engine, you'd need to build and operate:
- Container orchestration (Kubernetes)
- Auto-scaling logic
- Session storage database
- Memory extraction pipeline
- Monitoring and alerting
- Security (auth, VPC, IAM)
- Load balancing

Agent Engine does all of this. You give it your agent code, it gives you a production endpoint.

```
What You Build               What Agent Engine Handles
─────────────────            ─────────────────────────
Agent logic (Python)         Container orchestration
Tool functions               Auto-scaling (0 → 500 instances)
Instructions/prompts         Load balancing
Business rules               Session storage
                             Memory Bank (long-term)
                             Auth & IAM
                             VPC-SC compliance
                             Monitoring & logging
                             Code execution sandbox
```

### Session Management

A **session** is one conversation between one customer and the agent.

```
Session = conversation context
├── Event 1: Customer says "my calls keep dropping"
├── Event 2: Agent calls check_network_status(customer_id="9876543210")
├── Event 3: Tool returns {signal: "poor", drops: 7, tower: "maintenance"}
├── Event 4: Agent says "I can see you've had 7 dropped calls..."
├── Event 5: Customer says "yes, it's been terrible"
├── Event 6: Agent calls create_network_ticket(...)
└── State: {customer_id: "9876543210", issue_type: "network",
            escalated: true, sentiment: "frustrated"}
```

Key concepts:
- **Events**: Every message and action in chronological order
- **State**: Key-value pairs that persist within the session (like variables)
- **Session ID**: Unique identifier, typically mapped to customer_id + channel + timestamp

When deployed to Agent Engine, sessions are stored automatically. You don't manage a database.

```python
# ADK session usage in code
from google.adk.sessions import VertexAiSessionService

session_service = VertexAiSessionService(
    project="jio-cx-prod",
    location="asia-south1"
)

# Create a session for a customer interaction
session = await session_service.create_session(
    app_name="jio_support_agent",
    user_id="customer_9876543210",
    state={
        "customer_id": "9876543210",
        "language_preference": "hi",  # Hindi
        "channel": "whatsapp"
    }
)
```

### Memory: Short-Term vs Long-Term

```
SHORT-TERM (Session)                  LONG-TERM (Memory Bank)
─────────────────────                 ──────────────────────
Lives within one conversation         Lives across ALL conversations
"You said your calls drop             "This customer prefers Hindi,
 near Andheri station"                 lives in Mumbai, has had 3
                                       network complaints in 60 days,
Destroyed when session ends            was offered retention plan in
                                       Jan and declined"

Stored as events in session           Stored as extracted "memories"
                                      organized by topic

Automatic                             You trigger generation at
                                      session end
```

**How Memory Bank works under the hood**:

1. Customer finishes a conversation (session ends)
2. You call `generate_memories()` on that session
3. Memory Bank's ML model (based on Google Research's ACL 2025 paper) reads the conversation
4. It extracts facts organized by **topics** you define
5. It merges new facts with existing memories for that customer (deduplication, update, contradiction resolution)
6. Next time this customer calls, the agent retrieves their memories and has context

```python
from google.adk.memory import VertexAiMemoryBankService

memory_service = VertexAiMemoryBankService(
    project="jio-cx-prod",
    location="asia-south1",
    agent_engine_id="your-engine-id"
)

# After a session ends, generate memories from it
await memory_service.generate_memories(
    session_id=session.id,
    user_id="customer_9876543210"
)

# Before the NEXT session starts, load memories
memories = await memory_service.search_memories(
    user_id="customer_9876543210",
    query="What issues has this customer had recently?"
)
# Returns: ["Customer experienced 7 dropped calls near Andheri station
#            in March 2026", "Customer was offered a network credit of
#            ₹50 and accepted", "Customer prefers communication in Hindi"]
```

### Auto-Scaling for 5M Concurrent Users

Agent Engine scales horizontally. Each instance handles multiple concurrent requests.

**Back-of-envelope for Jio**:

```
500M subscribers
├── ~5% active at peak hour = 25M
├── ~20% of those contact support in a month = 5M
├── Spread across 8 peak hours = 625K concurrent sessions
├── Each session = ~2 requests/minute
├── Each instance handles 9 concurrent requests (default)
├── Needed instances at peak: 625,000 * 2 / (9 * 60) ≈ 2,300 instances
└── Google can handle this. You request quota increase upfront.
```

For proactive messaging (where YOU initiate):
```
25M proactive messages/day (Jio's current volume via Haptik)
├── Spread across 16 hours = 1.56M messages/hour
├── = 26K messages/minute
├── If each message needs 1 agent call: ~434 requests/second
├── At 9 concurrent per instance: ~48 instances minimum
└── With 3x headroom: ~150 instances
```

This is well within Vertex AI's capabilities, but you need to:
1. Request quota increases BEFORE launch
2. Set `min_instances` high enough to avoid cold starts
3. Use regional deployment closest to users (asia-south1 = Mumbai)

### What Agent Engine Does NOT Handle

| You Still Build | Why |
|----------------|-----|
| **Tool implementations** | Agent Engine runs your tools but doesn't write them. You connect to Jio's APIs. |
| **Channel integration** | WhatsApp, SMS, IVR, push notifications -- you build the connectors that feed messages to/from the agent |
| **Signal detection pipeline** | Databricks/streaming -- Agent Engine doesn't do event processing |
| **Outcome tracking** | "Did the customer churn anyway?" -- that feedback loop is yours to close |
| **Multi-language prompt engineering** | Hindi/English/regional language instructions -- you write and test them |
| **Business rules that aren't in the LLM** | Regulatory compliance, offer eligibility rules, approval workflows |
| **Data pipeline back to Databricks** | Logging interactions back to the data lake for analytics |
| **A/B testing framework** | Testing different agent instructions, models, or tool configurations |

---

## 3. The Signal Detection Pipeline

### Events Land in Databricks

Jio generates 600-700 events per customer per day. For 500M subscribers, that's:

```
500M × 650 events/day = 325 BILLION events/day
= 3.76 MILLION events/second sustained
```

These events include:
- Network events (call drops, data sessions, handovers, signal quality)
- Billing events (recharges, payments, balance queries)
- App events (JioTV watched, JioCinema usage, MyJio app opens)
- Support events (IVR calls, chat sessions, complaints)
- Location events (tower connections, roaming status)

### How Pattern Detection Works

This happens in **Databricks**, not in Google's AI stack. The detection pipeline uses Databricks Structured Streaming with Delta Lake.

```python
# Databricks notebook -- signal detection pipeline
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.window import Window

# Read the raw event stream
events = (spark.readStream
    .format("delta")
    .table("jio_events.customer_events"))

# --- SIGNAL 1: Churn Risk ---
# Pattern: 3+ network drops in 7 days AND a bill inquiry
churn_signals = (events
    .filter(col("event_type").isin("call_drop", "data_session_fail",
                                    "bill_inquiry"))
    .withWatermark("event_timestamp", "7 days")
    .groupBy(
        window("event_timestamp", "7 days"),
        "customer_id"
    )
    .agg(
        count(when(col("event_type") == "call_drop", 1)).alias("drops"),
        count(when(col("event_type") == "data_session_fail", 1)).alias("data_fails"),
        count(when(col("event_type") == "bill_inquiry", 1)).alias("bill_checks"),
    )
    .filter(
        (col("drops") >= 3) & (col("bill_checks") >= 1)  # The pattern
    )
    .withColumn("signal_type", lit("churn_risk"))
    .withColumn("signal_score",
        col("drops") * 0.3 + col("data_fails") * 0.2 + col("bill_checks") * 0.5)
)

# --- SIGNAL 2: Upsell Moment ---
# Pattern: Data usage > 80% of plan limit 3 months running
upsell_signals = (events
    .filter(col("event_type") == "daily_usage_summary")
    .withWatermark("event_timestamp", "90 days")
    .groupBy(
        window("event_timestamp", "30 days"),
        "customer_id"
    )
    .agg(
        avg(col("data_used_pct")).alias("avg_usage_pct"),
        max(col("data_used_pct")).alias("max_usage_pct")
    )
    .filter(col("avg_usage_pct") > 80)
    .withColumn("signal_type", lit("upsell_moment"))
)

# --- SIGNAL 3: Complaint Pattern ---
# Pattern: 2+ complaints in 30 days with no resolution
complaint_signals = (events
    .filter(col("event_type").isin("complaint_filed", "complaint_resolved"))
    .withWatermark("event_timestamp", "30 days")
    .groupBy(
        window("event_timestamp", "30 days"),
        "customer_id"
    )
    .agg(
        count(when(col("event_type") == "complaint_filed", 1)).alias("complaints"),
        count(when(col("event_type") == "complaint_resolved", 1)).alias("resolutions")
    )
    .filter(
        (col("complaints") >= 2) & (col("resolutions") < col("complaints"))
    )
    .withColumn("signal_type", lit("complaint_escalation"))
)
```

### How a Detected Signal Triggers an Agent

There is no native "Databricks to ADK" connector. The integration uses **Google Cloud Pub/Sub** as the bridge.

```
Databricks                  Google Cloud               ADK Agent
──────────                  ────────────               ─────────
Signal detected     ──▶     Pub/Sub Topic      ──▶     Cloud Run /
                            "jio-cx-signals"            Agent Engine
                                                        processes signal
                                                        and takes action
```

**Step 1: Databricks publishes to Pub/Sub**

```python
# In the Databricks streaming pipeline, write signals to Pub/Sub
from google.cloud import pubsub_v1
import json

publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path("jio-cx-prod", "jio-cx-signals")

def publish_signal(signal_row):
    """Publish a detected signal to Pub/Sub."""
    message = json.dumps({
        "customer_id": signal_row.customer_id,
        "signal_type": signal_row.signal_type,  # "churn_risk", "upsell_moment", etc.
        "signal_score": signal_row.signal_score,
        "details": {
            "drops": signal_row.drops,
            "bill_checks": signal_row.bill_checks
        },
        "detected_at": signal_row.window.end.isoformat()
    }).encode("utf-8")

    future = publisher.publish(topic_path, message)
    return future.result()

# Write stream to Pub/Sub
(churn_signals
    .writeStream
    .foreach(publish_signal)
    .option("checkpointLocation", "/checkpoints/churn_signals")
    .trigger(processingTime="5 minutes")
    .start())
```

Alternatively, use the Pub/Sub Spark connector directly:

```python
# Direct Pub/Sub sink from Structured Streaming
(churn_signals
    .selectExpr("to_json(struct(*)) AS value")
    .writeStream
    .format("pubsub")
    .option("pubsub.project", "jio-cx-prod")
    .option("pubsub.topic", "jio-cx-signals")
    .option("checkpointLocation", "/checkpoints/churn_signals_pubsub")
    .trigger(processingTime="5 minutes")
    .start())
```

**Step 2: Pub/Sub triggers a Cloud Run service that calls the agent**

```python
# signal_handler.py -- deployed as a Cloud Run service
# Triggered by Pub/Sub via Eventarc
import json
from flask import Flask, request
from google.cloud import aiplatform

app = Flask(__name__)

@app.route("/", methods=["POST"])
def handle_signal():
    """Receives a Pub/Sub signal and triggers the appropriate agent action."""
    envelope = request.get_json()
    message = json.loads(
        base64.b64decode(envelope["message"]["data"]).decode()
    )

    customer_id = message["customer_id"]
    signal_type = message["signal_type"]

    # Call the ADK agent via Agent Engine API
    agent_engine = aiplatform.Agent(
        agent_engine_name="projects/jio-cx-prod/locations/asia-south1/"
                          "agentEngines/your-engine-id"
    )

    # Create a session for this proactive interaction
    session = agent_engine.create_session(
        user_id=customer_id,
        session_id=f"proactive-{signal_type}-{customer_id}"
    )

    # Send the signal to the agent as a system message
    response = agent_engine.stream_query(
        session_id=session.name,
        message=f"""PROACTIVE SIGNAL DETECTED:
        Customer: {customer_id}
        Signal: {signal_type}
        Score: {message.get('signal_score', 'N/A')}
        Details: {json.dumps(message.get('details', {}))}

        Decide the appropriate action and compose a message for this customer.
        Consider their memory/history before deciding what to say."""
    )

    # The agent decides what to do and calls the appropriate tools
    # (send push notification, schedule callback, etc.)
    return "OK", 200
```

**Step 3: The pipeline end to end**

```
Customer has 4 call drops in 5 days + checks bill on MyJio app
                    │
                    ▼
Databricks Structured Streaming detects the pattern
                    │
                    ▼
Signal published to Pub/Sub topic "jio-cx-signals"
  {customer_id: "9876543210", signal_type: "churn_risk", score: 0.82}
                    │
                    ▼
Pub/Sub triggers Cloud Run signal_handler
                    │
                    ▼
Signal handler calls ADK Agent via Agent Engine
  - Agent loads customer memory (past interactions, preferences)
  - Agent checks current network status (tower under maintenance)
  - Agent decides: send a proactive WhatsApp message acknowledging
    the issue + offering ₹50 credit
                    │
                    ▼
Agent calls send_whatsapp_message tool
  → Jio's messaging API sends:
    "Hi [Name], we noticed you've had some connectivity issues
     near Andheri. Our team is working on tower maintenance that
     will be completed by March 25. We've added ₹50 credit to
     your account. Sorry for the trouble."
```

---

## 4. The Proactive Push Flow

### Signal Detected to Customer Gets a Message

```
COMPLETE PROACTIVE FLOW
═══════════════════════

[1] Databricks detects pattern
         │
         ▼
[2] Pub/Sub message published
         │
         ▼
[3] Cloud Run signal handler invoked
         │
         ▼
[4] ADK Agent activated with signal context
         │
         ├──▶ [5a] Agent retrieves customer memory
         │         (language preference, past issues, sentiment)
         │
         ├──▶ [5b] Agent checks current context
         │         (time of day, active plan, recent interactions)
         │
         └──▶ [5c] Agent applies business rules
                   (cooldown periods, DND lists, regulatory limits)
         │
         ▼
[6] Agent decides: WHAT + WHEN + WHICH CHANNEL
         │
         ▼
[7] Agent calls the appropriate Jio API tool
         │
         ▼
[8] Customer receives message
         │
         ▼
[9] Interaction logged back to Databricks
```

### How the Agent Decides WHAT to Say

The agent uses the LLM to generate the message, but within guardrails:

```python
proactive_agent = Agent(
    model="gemini-2.5-flash",
    name="proactive_message_agent",
    instruction="""You compose proactive messages for Jio customers.

    RULES:
    1. Messages must be under 160 characters for SMS, 500 for WhatsApp
    2. Always personalize: use the customer's name, reference their specific issue
    3. Lead with empathy, not the offer
    4. Include a clear action: "Reply YES to activate" or "Tap here to learn more"
    5. Never mention internal signal scores or that they were "detected"
    6. Match the customer's language preference (Hindi/English/regional)
    7. For network issues: be honest about timelines
    8. For upsell: show the math, don't just push a plan name

    BAD: "Dear Customer, we have a special offer for you! Upgrade now!"
    GOOD: "Hi Priya, you used 42GB on your 30GB plan last month. The
           Jio Plus 75GB plan costs just ₹50 more and would save you
           ₹120/month in data charges. Interested? Reply YES."

    You have access to message templates for regulated communications
    (payment reminders, service changes). Use templates for those.
    Generate custom messages for retention and upsell.""",
    tools=[
        get_customer_profile,      # Name, language, plan, history
        get_message_templates,     # Pre-approved templates
        check_dnd_status,          # Is customer on Do Not Disturb?
        check_cooldown,            # Was customer contacted recently?
        send_whatsapp_message,
        send_sms,
        send_push_notification,
        schedule_callback,
    ],
)
```

So it's a **hybrid approach**: templates for regulated/transactional messages (payment due, plan expiry) and LLM-generated messages for relationship-driven communications (retention, upsell, apology).

### How It Decides WHEN

```python
def check_cooldown(customer_id: str) -> dict:
    """Checks if enough time has passed since the last proactive contact.

    Rules:
    - No more than 1 proactive message per 48 hours
    - No messages between 9 PM and 8 AM local time
    - No messages on the same day as a complaint
    - No messages during active support conversations

    Returns:
        dict with can_send (bool), reason, next_allowed_time
    """
    # Implementation checks against interaction history
    ...
```

The agent checks cooldown as part of its reasoning. If the timing isn't right, it schedules a delayed send:

```python
def schedule_delayed_message(customer_id: str, message: str,
                             channel: str, send_at: str) -> dict:
    """Schedules a message for later delivery.

    Args:
        customer_id: Jio customer ID
        message: The composed message
        channel: "whatsapp" | "sms" | "push" | "in_app"
        send_at: ISO timestamp for when to send

    Returns:
        dict with schedule_id and confirmation
    """
    # Publishes to a "scheduled-messages" Pub/Sub topic
    # A Cloud Scheduler job picks these up at the right time
    ...
```

### How It Decides WHICH CHANNEL

```python
def get_customer_channel_preference(customer_id: str) -> dict:
    """Determines the best channel to reach a customer.

    Priority logic:
    1. If customer has WhatsApp Business API opt-in → WhatsApp
    2. If customer recently used MyJio app (last 24h) → Push notification
    3. If neither → SMS
    4. For high-value retention (signal_score > 0.9) → Schedule callback

    Returns:
        dict with recommended_channel, fallback_channel, reasoning
    """
    ...
```

### Jio APIs the Agent Needs

| API | Purpose | Who Owns It |
|-----|---------|-------------|
| Jio CRM API | Customer profile, plan details, history | Jio IT |
| Jio Billing API | Balance, recharge, credits, invoices | Jio Finance |
| Jio Network API | Tower status, coverage, incident tickets | Jio Network Ops |
| Haptik Messaging API | WhatsApp, push notifications, in-app messages | Jio/Haptik |
| JioCloud Communication API | SMS delivery | Jio Telecom |
| MyJio App API | Push notifications to the MyJio app | Jio Digital |
| Jio IVR/CTI API | Schedule outbound calls, callback | Jio Contact Center |

Each of these becomes a **tool function** in your ADK agent. The ADK framework doesn't care where the API lives -- it's just a Python function.

---

## 5. Voice Conversation Flow

### The Full Voice Pipeline

There are two architectures. The traditional pipeline (more control, higher latency) and the Gemini Live API approach (lower latency, fewer moving parts).

#### Architecture A: Traditional Pipeline (Separated Components)

```
Customer calls        ASR              ADK Agent         TTS              Customer
Jio IVR         (Speech-to-Text)     (reasoning)    (Text-to-Speech)      hears
────────        ────────────────     ────────────    ────────────────     ────────

  "Mera            "Mera             Agent thinks:     "Aapka balance     ♪ audio
   balance          balance           1. Call           ek sau             plays
   batao"           batao"              check_balance    untees rupay
                                     2. Customer has    hai, aur aapka
   ──────▶          ──────▶            ₹149 balance     plan barah
   ~200ms           ~300ms           3. Plan expires    din mein khatam
                                       in 12 days       ho jayega."
                                     4. Compose
                                       response         ──────▶
                                      ──────▶           ~200ms
                                      ~500ms

                    TOTAL: ~1,200ms (pushing the <1 second target)
```

| Component | Google Service | Latency | Notes |
|-----------|---------------|---------|-------|
| ASR (Speech-to-Text) | Google Cloud Speech-to-Text V2 with `chirp_telephony` model | 200-400ms | Supports Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu. The `chirp_telephony` model is optimized for 8kHz phone audio. |
| Agent Processing | ADK Agent on Vertex AI Agent Engine | 300-800ms | Includes LLM reasoning + tool calls. Gemini Flash is fastest. |
| TTS (Text-to-Speech) | Google Cloud Text-to-Speech | 100-300ms | WaveNet and Neural2 voices for Hindi and English. Journey voices for more natural conversation. |
| **Total** | | **600-1,500ms** | Achievable for simple queries. Tool calls add latency. |

#### Architecture B: Gemini Live API (Recommended for Jio)

This is the newer, better approach. Gemini Live API handles speech-in and speech-out natively in a single model -- no separate ASR and TTS steps.

```
Customer calls        Gemini Live API                    Customer
Jio IVR          (ASR + Reasoning + TTS in one)           hears
────────         ──────────────────────────────          ────────

  "Mera              Single WebSocket connection          ♪ audio
   balance         ┌──────────────────────────────┐       streams
   batao"          │  Audio in → Native processing │       back
                   │  → Function call              │
   ═══════════▶    │     (check_balance)           │  ═══════▶
   streaming       │  → Audio out (Hindi)          │  streaming
                   └──────────────────────────────┘

                   TOTAL: 320-800ms first audio response
```

```python
# ADK + Gemini Live API for voice
from google.adk.agents import Agent
from google.adk.streaming import LiveAPIToolkit

# Same agent definition, but used with streaming
voice_agent = Agent(
    model="gemini-2.5-flash",  # Must be a model that supports Live API
    name="jio_voice_agent",
    instruction="""You are a Jio voice assistant handling phone calls.

    VOICE-SPECIFIC RULES:
    1. Keep responses SHORT. 2-3 sentences max. This is a phone call.
    2. Speak naturally. Don't say "I found that your balance is..."
       Say "Your balance is 149 rupees."
    3. If you need to call a tool, say "Let me check that" first --
       don't leave dead air.
    4. Detect the customer's language from their first utterance and
       respond in the same language.
    5. Handle interruptions gracefully -- if the customer starts
       speaking, stop and listen.
    6. For complex issues, offer to transfer to a human agent.""",
    tools=[check_balance, check_network_status, transfer_to_human,
           create_ticket, process_recharge],
)

# The Live API toolkit wraps the agent for real-time streaming
live_toolkit = LiveAPIToolkit(agent=voice_agent)
```

**Key advantages of Gemini Live API for Jio**:
- **320-800ms** first audio response (vs 1,200ms+ with separate pipeline)
- **Native Hindi support** -- no separate ASR model needed
- **Interruption handling** -- customer can interrupt mid-response
- **Tool calling during conversation** -- agent can call check_balance while talking
- **Single WebSocket** -- lower infrastructure complexity

**Where each piece runs**:

```
Customer's phone
     │
     ▼
Jio IVR System (SIP/PSTN gateway)
     │
     ▼ (audio stream)
Media Gateway (converts telephony audio to WebSocket)
     │
     ▼ (WebSocket with audio frames)
Google Cloud - Gemini Live API on Vertex AI
     │
     ├──▶ ADK Agent (reasoning + tool dispatch)
     │         │
     │         ▼
     │    Tool calls to Jio APIs (check_balance, etc.)
     │         │
     │         ▼
     │    Agent generates response
     │
     ▼ (audio stream back)
Media Gateway
     │
     ▼
Customer hears response
```

**Integration with Jio's existing IVR**: The media gateway sits between Jio's existing PSTN/SIP infrastructure and the Gemini Live API WebSocket. Products like Dialogflow CX, AudioCodes, or custom SIP-to-WebSocket bridges handle this translation.

---

## 6. Memory and Learning

### After a Conversation: Where Does It Get Stored?

Three things happen after every interaction:

```
Conversation ends
       │
       ├──▶ [1] Session stored in Agent Engine Sessions
       │         (automatic -- every event preserved)
       │
       ├──▶ [2] Memories extracted to Memory Bank
       │         (you trigger this -- async extraction)
       │
       └──▶ [3] Interaction logged back to Databricks
                 (you build this -- becomes a new event)
```

#### [1] Session Storage (Automatic)

Agent Engine stores every session automatically. Each event (user message, agent response, tool call, tool result) is persisted with timestamps. You can retrieve past sessions for debugging, compliance, and audit.

#### [2] Memory Bank (You Trigger, It Extracts)

```python
# After a conversation ends
from google.adk.memory import VertexAiMemoryBankService

memory_service = VertexAiMemoryBankService(
    project="jio-cx-prod",
    location="asia-south1",
    agent_engine_id="your-engine-id"
)

# Tell Memory Bank to extract memories from this session
await memory_service.generate_memories(
    session_id="session-abc-123",
    user_id="customer_9876543210"
)

# What Memory Bank does internally:
# 1. Reads the full conversation
# 2. Extracts facts: "Customer complained about network drops in Andheri"
# 3. Merges with existing memories: "Customer had a previous complaint
#    about billing in January -- now has 2 unresolved issues"
# 4. Stores as topic-organized memories
```

**Memory topics** you'd configure for Jio:
- Plan & usage preferences
- Communication preferences (language, channel)
- Issue history (what went wrong, was it resolved?)
- Sentiment trajectory (getting happier? angrier?)
- Life events (moved locations, family plan changes)
- Offers presented and outcomes (accepted/declined/ignored)

#### [3] Logging Back to Databricks (You Build)

This closes the loop. Every agent interaction becomes a new event in Databricks.

```python
# Tool that runs at the end of every agent interaction
def log_interaction_to_databricks(
    customer_id: str,
    interaction_type: str,   # "inbound_chat", "proactive_push", "voice_call"
    channel: str,            # "whatsapp", "sms", "voice", "push"
    signal_type: str,        # What triggered this? "churn_risk", "customer_initiated"
    outcome: str,            # "resolved", "escalated", "offer_accepted", "offer_declined"
    agent_actions: list,     # What tools did the agent use?
    customer_sentiment: str, # "positive", "neutral", "negative"
    duration_seconds: int
) -> dict:
    """Logs the completed interaction back to Databricks Delta Lake.

    This event re-enters the event stream and can influence future
    signal detection. For example, if a proactive message was sent
    and the customer responded positively, the churn score decreases.
    """
    from google.cloud import pubsub_v1

    event = {
        "event_type": "agent_interaction",
        "customer_id": customer_id,
        "interaction_type": interaction_type,
        "channel": channel,
        "signal_type": signal_type,
        "outcome": outcome,
        "agent_actions": agent_actions,
        "customer_sentiment": customer_sentiment,
        "duration_seconds": duration_seconds,
        "timestamp": datetime.utcnow().isoformat()
    }

    # Publish to a "interaction-logs" topic that feeds back to Databricks
    publisher = pubsub_v1.PublisherClient()
    topic = publisher.topic_path("jio-cx-prod", "interaction-logs")
    publisher.publish(topic, json.dumps(event).encode())

    return {"status": "logged"}
```

### How the System Learns from Outcomes

The feedback loop is not a single feature -- it's a pipeline you build across Databricks and the agent.

```
THE LEARNING LOOP
═════════════════

[1] Signal detected: churn_risk for customer X
                    │
[2] Agent sends proactive message offering ₹50 credit
                    │
[3] Interaction logged to Databricks:
    {outcome: "offer_accepted", signal: "churn_risk"}
                    │
[4] 30 days later: Did customer X actually churn?
                    │
    ├── YES → This intervention FAILED
    │         Label: {signal: "churn_risk", action: "credit_50",
    │                 result: "churned_anyway"}
    │
    └── NO  → This intervention SUCCEEDED
              Label: {signal: "churn_risk", action: "credit_50",
                      result: "retained"}
                    │
[5] ML model in Databricks trains on labeled outcomes:
    - Which signals actually predict churn?
    - Which interventions work for which customer segments?
    - What's the ROI of ₹50 credits vs plan upgrades vs callbacks?
                    │
[6] Updated model improves signal detection scores
    - Weights adjust: "bill inquiry" might become less important
    - New patterns emerge: "customer viewed competitor plans on browser"
                    │
[7] Better signals → Better agent actions → Better outcomes
    (Virtuous cycle)
```

**What this looks like in Databricks**:

```python
# Monthly outcome labeling job in Databricks
from pyspark.sql.functions import *

# Get all proactive interventions from last 60 days
interventions = spark.table("jio_events.agent_interactions").filter(
    (col("interaction_type") == "proactive_push") &
    (col("timestamp") > date_sub(current_date(), 60))
)

# Get churn events (customer deactivated or ported out)
churns = spark.table("jio_events.customer_lifecycle").filter(
    col("event_type").isin("deactivation", "port_out")
)

# Join: did the customer churn within 30 days of our intervention?
labeled = (interventions
    .join(churns,
          (interventions.customer_id == churns.customer_id) &
          (churns.event_timestamp.between(
              interventions.timestamp,
              date_add(interventions.timestamp, 30)
          )),
          "left")
    .withColumn("outcome_label",
        when(churns.customer_id.isNotNull(), "churned_despite_intervention")
        .otherwise("retained"))
)

# Train/update the signal scoring model
# This is where Databricks ML (MLflow) comes in
from databricks.feature_store import FeatureStoreClient
fs = FeatureStoreClient()

# The updated model feeds back into the streaming signal detection
# Better scores → agents take better-targeted actions
```

**What the agent learns directly (via Memory Bank)**:
- "This customer doesn't respond to discount offers but does respond to service improvement promises"
- "This customer prefers callbacks over WhatsApp messages"
- "This customer has been offered a retention plan twice and declined both times -- escalate to human"

**What the ML pipeline learns (via Databricks)**:
- "Customers with >5 call drops per week in tier-2 cities churn at 3x the rate"
- "WhatsApp messages sent between 10-11 AM have 2x the response rate"
- "₹50 credits reduce churn by 15%, but free plan upgrades reduce churn by 35%"

---

## 7. The Model Swap Story

### Same Agent, Three Models

```python
from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm
import os

# --- Configuration (externalized) ---
MODEL_CONFIG = {
    "router": "gemini-2.5-flash",           # Fast, cheap, good at routing
    "billing": "gemini-2.5-flash",           # High volume, needs speed
    "network": "gemini-2.5-flash",           # High volume, needs speed
    "churn": "gemini-2.5-pro",               # Nuance matters, worth the cost
    "upsell": "gemini-2.5-flash",            # High volume, templates help
    "voice": "gemini-2.5-flash",             # Must support Live API
}

# --- Helper to create the right model wrapper ---
def get_model(model_string):
    """Returns a native Gemini model string or LiteLlm wrapper."""
    if model_string.startswith("gemini"):
        return model_string  # Native Gemini, no wrapper needed
    elif model_string.startswith("anthropic/"):
        return LiteLlm(model=model_string)
    elif model_string.startswith("openai/"):
        return LiteLlm(model=model_string)
    elif model_string.startswith("ollama/"):
        return LiteLlm(model=model_string)
    elif model_string.startswith("vertex_ai/"):
        return LiteLlm(model=model_string)
    else:
        return model_string

# --- Use it ---
churn_agent = Agent(
    model=get_model(MODEL_CONFIG["churn"]),
    name="churn_prevention_agent",
    description="Handles at-risk customers showing churn signals",
    instruction="...",
    tools=[...],
)
```

### Swapping in Action

Change one line in your config to A/B test:

```python
# Version A: Gemini Pro for churn prevention
MODEL_CONFIG["churn"] = "gemini-2.5-pro"

# Version B: Claude for churn prevention (better at empathy?)
MODEL_CONFIG["churn"] = "anthropic/claude-sonnet-4-5-20250929"

# Version C: Llama 3.1 405B on Vertex AI (open source, no vendor lock-in?)
MODEL_CONFIG["churn"] = "vertex_ai/meta/llama-3.1-405b-instruct"

# Version D: Llama running on Jio's own GPU cluster via Ollama
MODEL_CONFIG["churn"] = "ollama/llama3.1:405b"
```

The agent code, tools, instructions, and deployment all remain identical. Only the model string changes.

### Environment Variables for API Keys

```bash
# .env file -- set these for the models you want to use
GOOGLE_CLOUD_PROJECT=jio-cx-prod          # For Gemini (native)
ANTHROPIC_API_KEY=sk-ant-...              # For Claude (via LiteLLM)
OPENAI_API_KEY=sk-...                     # For GPT (via LiteLLM)
# Ollama needs no key -- it runs locally
```

### Gotchas Table (Expanded)

| Gotcha | Impact | Mitigation |
|--------|--------|------------|
| **Function calling format differences** | Gemini uses `functionCall`, Claude uses `tool_use`, GPT uses `function`. LiteLLM translates, but complex nested parameters can break. | Test every tool with every model you plan to use. Keep tool parameters simple (strings, ints, lists -- not deeply nested objects). |
| **Context window limits** | Gemini 2.5 Pro: 1M tokens. Claude: 200K. Llama 3.1: 128K. Loading full customer history may work on Gemini but fail on Claude. | Implement memory summarization. Don't load raw history -- load Memory Bank summaries. |
| **Streaming behavior** | Gemini Live API only works with Gemini models. If you swap to Claude, you lose the single-model voice pipeline. | Keep voice agents on Gemini. Use model swapping for text-based agents only. |
| **System prompt interpretation** | Same instruction, different behavior. Claude tends to be more verbose. Gemini tends to be more concise. Llama can be less reliable at following complex instructions. | Maintain model-specific instruction variants if quality differences are significant. |
| **Rate limits** | Each provider has different rate limits. Gemini on Vertex AI: generous quotas. Anthropic API: may throttle at Jio scale. | For 500M subscribers, Gemini on Vertex AI is the practical choice for volume. Use Claude/GPT for low-volume, high-value interactions only. |
| **Cost at scale** | Gemini Flash: ~$0.075/1M input tokens. Claude Sonnet: ~$3/1M input. At Jio's volume, this is the difference between $50K/month and $2M/month. | Default to Gemini Flash. Reserve premium models for churn prevention and complex escalations. |
| **Latency** | Gemini on Vertex AI: 200-400ms first token. Claude via API: 400-800ms. Llama via Ollama: depends on hardware. | Latency-sensitive paths (voice, real-time chat) should use Gemini Flash on Vertex AI. |
| **Hindi/Indic language quality** | Gemini has strong Hindi support (trained on Indian data). Claude is good but weaker on regional languages. Llama varies. | Benchmark each model on Hindi/regional language tasks before deploying. Gemini likely wins here. |

### Practical Recommendation for Jio

```
Agent                   Model                  Why
─────                   ─────                  ───
Router                  Gemini 2.5 Flash       Fast routing, low cost
Billing                 Gemini 2.5 Flash       High volume, simple logic
Network                 Gemini 2.5 Flash       High volume, diagnostic logic
Churn Prevention        Gemini 2.5 Pro         Nuance, empathy, persuasion
Upsell                  Gemini 2.5 Flash       Template-heavy, math-focused
Voice (IVR)             Gemini 2.5 Flash       Only option for Live API
Proactive Messaging     Gemini 2.5 Flash       Volume + personalization
Complaint Escalation    Gemini 2.5 Pro         Complex, high-stakes
```

Keep LiteLLM in the stack even if you only use Gemini today. It costs nothing, and it means you can swap to Claude or Llama in a day if Google's pricing changes or a better model appears.

---

## Quick Reference: Google Cloud Services and Their Exact Role

| Service | What It Does in This Architecture |
|---------|----------------------------------|
| **Vertex AI Agent Engine** | Managed runtime: hosts agents, handles scaling, sessions, memory |
| **ADK (Agent Development Kit)** | Open-source Python framework: defines agents, tools, multi-agent patterns |
| **Gemini 2.5 Flash / Pro** | The LLM that powers agent reasoning and text generation |
| **Gemini Live API** | Real-time bidirectional voice streaming (ASR + reasoning + TTS in one model) |
| **Google Cloud Pub/Sub** | Message bus between Databricks and Google Cloud (signals in, logs out) |
| **Cloud Run** | Serverless container to run the signal handler (Pub/Sub → Agent Engine) |
| **Cloud Speech-to-Text V2** | Only needed if using traditional voice pipeline (not Live API) |
| **Cloud Text-to-Speech** | Only needed if using traditional voice pipeline (not Live API) |
| **Vertex AI Memory Bank** | Long-term cross-session customer memory |
| **Vertex AI Sessions** | Short-term per-conversation state |
| **A2A Protocol** | Cross-organization agent communication (Jio ↔ payment providers) |
| **MCP Protocol** | Tool connectivity standard (agent ↔ tool servers) |
| **LiteLLM** | Open-source model adapter (swap between Gemini/Claude/Llama/GPT) |
| **Databricks** | Event storage, structured streaming, ML pipeline, signal detection (NOT a Google service) |
| **Cloud Monitoring** | Observe agent performance, latency, error rates |
| **IAM + VPC-SC** | Security, access control, network isolation |

---

## What to Say in the Room

When you're presenting to Google Cloud engineers and Jio's CTO:

1. **"We're using ADK as the agent framework because it gives us code-level control while Agent Engine handles the infrastructure. We're not locked into a drag-and-drop builder."**

2. **"Signal detection stays in Databricks where the data lives. We bridge to Google Cloud via Pub/Sub. The agent doesn't poll a database -- it reacts to published signals."**

3. **"Memory Bank gives us cross-session personalization without building our own memory infrastructure. At 500M subscribers, that's not something we want to manage ourselves."**

4. **"For voice, we're evaluating Gemini Live API for sub-second response times. The traditional ASR→Agent→TTS pipeline adds 400ms+ of latency we don't need."**

5. **"We keep LiteLLM in the stack for model portability. Today it's Gemini. If tomorrow a Hindi-optimized open-source model outperforms, we swap the model string and redeploy."**

6. **"The learning loop closes through Databricks: every agent interaction becomes an event that feeds back into signal detection. Monthly outcome labeling tells us which interventions actually prevent churn."**

---

Sources:
- [ADK Documentation - Get Started (Python)](https://google.github.io/adk-docs/get-started/python/)
- [ADK Multi-Agent Systems](https://google.github.io/adk-docs/agents/multi-agents/)
- [ADK Custom Tools](https://google.github.io/adk-docs/tools-custom/)
- [ADK MCP Tools](https://google.github.io/adk-docs/tools-custom/mcp-tools/)
- [ADK LiteLLM Integration](https://google.github.io/adk-docs/agents/models/litellm/)
- [ADK Claude Integration](https://google.github.io/adk-docs/agents/models/anthropic/)
- [ADK Gemini Live API Streaming Toolkit](https://google.github.io/adk-docs/streaming/)
- [ADK A2A Protocol](https://google.github.io/adk-docs/a2a/)
- [ADK Memory](https://google.github.io/adk-docs/sessions/memory/)
- [Deploy to Vertex AI Agent Engine](https://google.github.io/adk-docs/deploy/agent-engine/)
- [Vertex AI Agent Engine Overview](https://docs.cloud.google.com/agent-builder/agent-engine/overview)
- [Vertex AI Agent Engine Sessions](https://docs.cloud.google.com/agent-builder/agent-engine/sessions/overview)
- [Vertex AI Memory Bank Overview](https://docs.cloud.google.com/agent-builder/agent-engine/memory-bank/overview)
- [Vertex AI Agent Engine Quotas](https://docs.cloud.google.com/agent-builder/quotas)
- [Optimize and Scale Agent Engine Runtime](https://docs.cloud.google.com/agent-builder/agent-engine/optimize-runtime)
- [Generate Memories](https://docs.cloud.google.com/agent-builder/agent-engine/memory-bank/generate-memories)
- [A2A Protocol Specification](https://a2a-protocol.org/latest/)
- [A2A Protocol GitHub](https://github.com/a2aproject/A2A)
- [Google Developers Blog - A2A Protocol](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [Google Developers Blog - Multi-Agent Patterns in ADK](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)
- [Gemini Live API Overview (Vertex AI)](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api)
- [Build Voice-Driven Applications with Live API](https://cloud.google.com/blog/products/ai-machine-learning/build-voice-driven-applications-with-live-api)
- [Google Cloud Speech-to-Text V2 Languages](https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages)
- [Google Cloud Text-to-Speech Voices](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types)
- [Databricks - Subscribe to Google Pub/Sub](https://docs.databricks.com/gcp/en/connect/streaming/pub-sub)
- [Cloud Run - Pub/Sub Triggers](https://docs.cloud.google.com/run/docs/triggering/pubsub-triggers)
- [Databricks Telco Churn Predictor](https://www.databricks.com/blog/2021/02/24/solution-accelerator-telco-customer-churn-predictor.html)
- [Jio Haptik CX Transformation](https://www.haptik.ai/resources/case-study/jio-digital-life)
- [Jio AI Strategy - The Register](https://www.theregister.com/2026/02/20/jio_ai_plans_india_summit)
- [LiteLLM - Google ADK Tutorial](https://docs.litellm.ai/docs/tutorials/google_adk)
- [Google ADK + LiteLLM Guide](https://selvamsubbiah.com/google-adk-litellm-model-agnostic-agents/)
- [ADK Python GitHub](https://github.com/google/adk-python)
- [ADK Samples GitHub](https://github.com/google/adk-samples)
