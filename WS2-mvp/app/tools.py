"""Server-side tool executor for the Jio voice agent spine.

Tools execute HERE, not in the browser, not in Gemini. This is where
guardrails are enforced, decisions are logged, and the RAG corpus is queried.

Each tool is registered with its Gemini function_declaration schema AND
its server-side implementation. When Gemini sends a tool_call, the spine
looks up the tool here, checks guardrails, executes, logs, and returns.
"""

import json
import sys
import datetime
from pathlib import Path

# Add agent directory to path so we can import existing tools
AGENT_DIR = Path(__file__).parent.parent / "agent"
sys.path.insert(0, str(AGENT_DIR))

from jio_home_assistant.tools.rag_search import jio_knowledge_search
from jio_home_assistant.tools.plan_lookup import search_plans, get_plan_details
from jio_home_assistant.tools.customer_lookup import get_customer_profile
from jio_home_assistant.tools.network_diagnostics import (
    check_connection_status, run_speed_test, check_router_health,
    restart_router, check_device_count,
)
from jio_home_assistant.tools.complaint_ops import log_complaint, check_complaint_status


# --- Decision log ---

_decision_log = []


def log_decision(tool_name, args, result, guardrail_check=None):
    entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "tool": tool_name,
        "args": args,
        "result_preview": str(result)[:300],
        "guardrail": guardrail_check,
    }
    _decision_log.append(entry)
    print(f"  [TOOL] {tool_name}({json.dumps(args)[:80]}) -> {str(result)[:100]}")
    # Write to log file
    with open(Path(__file__).parent / "spine_decisions.jsonl", "a") as f:
        f.write(json.dumps(entry) + "\n")


def get_decision_log():
    return _decision_log


# --- Guardrails ---

BLOCKED_TOOLS = set()  # No tools are fully blocked, but some need confirmation

CONFIRMATION_REQUIRED = {
    "restart_router": "Router restart disconnects all devices for 2-3 minutes",
    "log_complaint": "Filing a formal complaint",
}

EXPOSURE_MODE = "shadow"  # shadow | advisory | controlled


def check_guardrails(tool_name, args):
    """Check if this tool call is allowed. Returns (allowed, reason)."""
    if tool_name in BLOCKED_TOOLS:
        return False, f"Tool '{tool_name}' is blocked by policy"

    if tool_name == "restart_router" and not args.get("confirm"):
        return True, "confirmation_required"

    return True, "allowed"


# --- Tool registry ---
# Maps tool names to (implementation_fn, gemini_function_declaration)

TOOL_REGISTRY = {
    "jio_knowledge_search": {
        "fn": jio_knowledge_search,
        "declaration": {
            "name": "jio_knowledge_search",
            "description": (
                "Search the Jio knowledge base for information about broadband plans, "
                "pricing, OTT bundles, troubleshooting steps, billing, support channels, "
                "and FAQs. ALWAYS use this before answering any factual question about Jio. "
                "Works with Hindi, Hinglish, and English queries."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The question or topic to search for"}
                },
                "required": ["query"],
            },
        },
    },
    "search_plans": {
        "fn": search_plans,
        "declaration": {
            "name": "search_plans",
            "description": "Search Jio Home broadband plans matching criteria.",
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_type": {"type": "string", "description": "Filter by type: 'fiber' or 'airfiber'"},
                    "max_price": {"type": "integer", "description": "Maximum monthly price in INR"},
                    "min_speed": {"type": "integer", "description": "Minimum speed in Mbps"},
                    "includes_ott": {"type": "string", "description": "OTT service that must be included (e.g. 'Netflix')"},
                },
            },
        },
    },
    "get_plan_details": {
        "fn": get_plan_details,
        "declaration": {
            "name": "get_plan_details",
            "description": "Get full details for a specific Jio plan by ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_id": {"type": "string", "description": "Plan identifier (e.g. 'fiber-gold-999')"},
                },
                "required": ["plan_id"],
            },
        },
    },
    "get_customer_profile": {
        "fn": get_customer_profile,
        "declaration": {
            "name": "get_customer_profile",
            "description": "Look up a customer's profile including plan, tenure, and history.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string", "description": "Jio customer ID (e.g. JIO-001)"},
                },
                "required": ["customer_id"],
            },
        },
    },
    "check_connection_status": {
        "fn": check_connection_status,
        "declaration": {
            "name": "check_connection_status",
            "description": "Check if a customer's home broadband connection is active.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string", "description": "Jio customer ID"},
                },
                "required": ["customer_id"],
            },
        },
    },
    "run_speed_test": {
        "fn": run_speed_test,
        "declaration": {
            "name": "run_speed_test",
            "description": "Run a speed test for a customer's connection.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string", "description": "Jio customer ID"},
                },
                "required": ["customer_id"],
            },
        },
    },
    "check_router_health": {
        "fn": check_router_health,
        "declaration": {
            "name": "check_router_health",
            "description": "Check the health of a customer's home router/CPE.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string", "description": "Jio customer ID"},
                },
                "required": ["customer_id"],
            },
        },
    },
    "restart_router": {
        "fn": restart_router,
        "declaration": {
            "name": "restart_router",
            "description": "Restart a customer's home router remotely. MUST ask customer permission first.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string", "description": "Jio customer ID"},
                    "confirm": {"type": "boolean", "description": "Must be true. Ask customer first."},
                },
                "required": ["customer_id", "confirm"],
            },
        },
    },
    "check_device_count": {
        "fn": check_device_count,
        "declaration": {
            "name": "check_device_count",
            "description": "Check how many devices are connected to a customer's network.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string", "description": "Jio customer ID"},
                },
                "required": ["customer_id"],
            },
        },
    },
    "log_complaint": {
        "fn": log_complaint,
        "declaration": {
            "name": "log_complaint",
            "description": "Log a new customer complaint.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {"type": "string", "description": "Jio customer ID"},
                    "category": {"type": "string", "description": "Category: connectivity, speed, billing, router, other"},
                    "description": {"type": "string", "description": "Description of the issue"},
                    "priority": {"type": "string", "description": "Priority: low, medium, high"},
                },
                "required": ["customer_id", "category", "description"],
            },
        },
    },
    "check_complaint_status": {
        "fn": check_complaint_status,
        "declaration": {
            "name": "check_complaint_status",
            "description": "Check status of an existing complaint.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reference": {"type": "string", "description": "Complaint reference number"},
                    "customer_id": {"type": "string", "description": "Or look up by customer ID"},
                },
            },
        },
    },
}


def get_function_declarations():
    """Get all tool declarations for the Gemini setup message."""
    return [tool["declaration"] for tool in TOOL_REGISTRY.values()]


async def execute_tool(tool_name, args):
    """Execute a tool with guardrails and logging.

    Returns the result dict to send back as tool_response.
    """
    # 1. Check guardrails
    allowed, reason = check_guardrails(tool_name, args)
    if not allowed:
        log_decision(tool_name, args, {"blocked": reason}, guardrail_check="BLOCKED")
        return {"error": reason}

    # 2. Look up tool
    tool = TOOL_REGISTRY.get(tool_name)
    if not tool:
        log_decision(tool_name, args, {"error": "unknown tool"}, guardrail_check="UNKNOWN")
        return {"error": f"Unknown tool: {tool_name}"}

    # 3. Execute
    try:
        result = tool["fn"](**args)
        # Parse JSON string results back to dict for cleaner responses
        if isinstance(result, str):
            try:
                result = json.loads(result)
            except json.JSONDecodeError:
                result = {"text": result}
    except Exception as e:
        result = {"error": str(e)}

    # 4. Log
    log_decision(tool_name, args, result, guardrail_check=reason)

    return result
