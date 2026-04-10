"""LangFuse tracing setup for the Jio agent.

Configures OpenTelemetry to export spans to LangFuse.
ADK already emits OTEL spans for model calls, tool calls, and agent routing.
This just points those spans at LangFuse instead of (or in addition to) Cloud Trace.

Import this module early - before any agent code runs.

Usage:
    from jio_home_assistant.tracing import init_tracing
    init_tracing()
"""

import os

_initialized = False


def init_tracing():
    """Initialize LangFuse tracing via OpenTelemetry.

    Reads LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL from env.
    Safe to call multiple times - only initializes once.
    """
    global _initialized
    if _initialized:
        return

    public_key = os.environ.get("LANGFUSE_PUBLIC_KEY")
    secret_key = os.environ.get("LANGFUSE_SECRET_KEY")
    base_url = os.environ.get("LANGFUSE_BASE_URL", "https://cloud.langfuse.com")

    if not public_key or not secret_key:
        print("LangFuse tracing: skipped (no keys in env)")
        return

    from langfuse import Langfuse

    # Initialize the LangFuse client (used by the callback handler)
    langfuse = Langfuse(
        public_key=public_key,
        secret_key=secret_key,
        host=base_url,
    )

    # Verify connection
    try:
        langfuse.auth_check()
        print(f"LangFuse tracing: connected to {base_url}")
    except Exception as e:
        print(f"LangFuse tracing: auth failed - {e}")
        return

    _initialized = True
    return langfuse
