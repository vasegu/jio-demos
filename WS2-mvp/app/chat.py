"""Jio Home Assistant - voice-first customer app.

Connects to the deployed Agent Engine on GCP.
Phone mockup UI with voice orb and conversation stream.

Usage:
    cd WS2-mvp/app
    python chat.py
    # Open http://localhost:8080
"""

import json
import os
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "agent" / ".env")

os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "jiobuddy-492811")
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "us-central1")
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "TRUE")

import vertexai
from vertexai import agent_engines
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

vertexai.init(project="jiobuddy-492811", location="us-central1")

AGENT_RESOURCE = "projects/896447499660/locations/us-central1/reasoningEngines/2407535190399254528"

app = FastAPI(title="Jio Home Assistant")
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")

_agent = None
_sessions = {}


def get_agent():
    global _agent
    if _agent is None:
        _agent = agent_engines.get(AGENT_RESOURCE)
    return _agent


@app.post("/api/chat")
async def chat(request: Request):
    body = await request.json()
    message = body.get("message", "")
    user_id = body.get("user_id", "demo-user")
    customer_id = body.get("customer_id", "JIO-001")

    agent = get_agent()

    if user_id not in _sessions:
        session = agent.create_session(user_id=user_id)
        _sessions[user_id] = session["id"]

    session_id = _sessions[user_id]
    full_message = f"[Customer ID: {customer_id}] {message}"

    final_text = ""
    tools_used = []
    agent_name = "jio_home_assistant"

    for chunk in agent.stream_query(
        user_id=user_id,
        session_id=session_id,
        message=full_message,
    ):
        if isinstance(chunk, dict):
            content = chunk.get("content", {})
            parts = content.get("parts", [])
            author = chunk.get("author", "")
            if author:
                agent_name = author
            for part in parts:
                if isinstance(part, dict):
                    if "function_call" in part:
                        tools_used.append(part["function_call"]["name"])
                    if "text" in part:
                        final_text = part["text"]

    return {
        "response": final_text,
        "agent": agent_name,
        "tools": tools_used,
        "session_id": session_id,
    }


@app.post("/api/reset")
async def reset_session(request: Request):
    body = await request.json()
    user_id = body.get("user_id", "demo-user")
    if user_id in _sessions:
        del _sessions[user_id]
    return {"status": "session reset"}


@app.get("/")
async def home():
    return FileResponse(Path(__file__).parent / "static" / "index.html")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)
