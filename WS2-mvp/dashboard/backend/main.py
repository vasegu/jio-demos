"""Spine Control Plane - FastAPI backend.

Bridges Pub/Sub signal feed, LangFuse traces, and Agent Engine
into a single API for the React dashboard.

Usage:
    cd WS2-mvp/dashboard/backend
    uvicorn main:app --reload --port 3001
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent.parent / "agent" / ".env")

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Jio Spine Control Plane")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory stores (replace with DB for production) ---

# Signal feed buffer (last 200 events)
signal_buffer = []
BUFFER_MAX = 200

# Decision log (enriched events + agent decisions)
decision_log = []

# Exposure ladder state
exposure_state = {
    "H1_onboarding": {"mode": "shadow", "decisions_today": 0},
    "H2_risk_guardian": {"mode": "shadow", "decisions_today": 0},
    "H3_voice_concierge": {"mode": "shadow", "decisions_today": 0},
    "H4_network_resolution": {"mode": "shadow", "decisions_today": 0},
}

# Connected WebSocket clients
ws_clients: list[WebSocket] = []


# --- WebSocket: live signal feed ---

@app.websocket("/ws/signals")
async def signal_feed(websocket: WebSocket):
    await websocket.accept()
    ws_clients.append(websocket)
    try:
        # Send buffer history on connect
        for event in signal_buffer[-50:]:
            await websocket.send_json(event)
        # Keep alive
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_clients.remove(websocket)


async def broadcast_signal(event: dict):
    """Push a signal event to all connected WebSocket clients."""
    signal_buffer.append(event)
    if len(signal_buffer) > BUFFER_MAX:
        signal_buffer.pop(0)

    dead = []
    for ws in ws_clients:
        try:
            await ws.send_json(event)
        except:
            dead.append(ws)
    for ws in dead:
        ws_clients.remove(ws)


# --- REST: Signal feed ---

@app.get("/api/signals/feed")
async def get_signal_feed(limit: int = 50):
    return {"signals": signal_buffer[-limit:], "count": len(signal_buffer)}


# --- REST: Decisions ---

@app.post("/api/decisions")
async def log_decision(decision: dict):
    """Log a decision from the trigger service."""
    decision["logged_at"] = datetime.now().isoformat()
    decision_log.append(decision)

    # Also broadcast to WebSocket
    await broadcast_signal({
        "type": "decision",
        "timestamp": decision["logged_at"],
        **decision.get("signal", {}),
        "agent_decision_preview": decision.get("decision", "")[:200],
    })

    return {"status": "logged", "id": len(decision_log) - 1}


@app.get("/api/decisions")
async def get_decisions(limit: int = 50):
    return {"decisions": decision_log[-limit:], "count": len(decision_log)}


@app.get("/api/decisions/{decision_id}")
async def get_decision(decision_id: int):
    if 0 <= decision_id < len(decision_log):
        return decision_log[decision_id]
    return {"error": "not found"}


# --- REST: Customer timeline ---

@app.get("/api/customers/{customer_id}/timeline")
async def get_customer_timeline(customer_id: str):
    signals = [s for s in signal_buffer if s.get("customer_id") == customer_id]
    decisions = [d for d in decision_log if d.get("signal", {}).get("customer_id") == customer_id]
    return {
        "customer_id": customer_id,
        "signals": signals,
        "decisions": decisions,
    }


# --- REST: Exposure ladder ---

@app.get("/api/exposure")
async def get_exposure():
    return exposure_state


@app.post("/api/exposure/{hypothesis}")
async def set_exposure(hypothesis: str, mode: str):
    if hypothesis in exposure_state and mode in ("shadow", "advisory", "controlled"):
        exposure_state[hypothesis]["mode"] = mode
        return {"status": "updated", "hypothesis": hypothesis, "mode": mode}
    return {"error": "invalid hypothesis or mode"}


# --- REST: Pipeline health ---

@app.get("/api/health")
async def get_health():
    return {
        "signal_buffer_size": len(signal_buffer),
        "decisions_logged": len(decision_log),
        "ws_clients_connected": len(ws_clients),
        "exposure": exposure_state,
        "status": "healthy",
    }


# --- REST: Ingest signal from processor ---

@app.post("/api/signals/ingest")
async def ingest_signal(event: dict):
    """Receive a processed signal from the processor and broadcast to dashboard."""
    event["ingested_at"] = datetime.now().isoformat()
    await broadcast_signal(event)
    return {"status": "ingested"}
