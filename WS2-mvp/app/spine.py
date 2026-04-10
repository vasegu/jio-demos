"""Jio Voice Agent Spine Server.

The spine sits between the phone UI and Gemini Live API.
It handles auth, tool execution, guardrails, and logging.
The phone only sends/receives audio. Everything else is server-side.

Usage:
    cd WS2-mvp/app
    python spine.py
    # Phone UI connects to ws://localhost:9090
    # HTTP serves phone app on http://localhost:9000

Architecture:
    Phone UI <--audio--> Spine <--audio+tools--> Gemini Live API
                           |
                           |--- RAG search (Vertex AI)
                           |--- Plan/customer/diagnostic tools
                           |--- Guardrails engine
                           |--- Decision logger
"""

import asyncio
import json
import os
import ssl
from pathlib import Path

import certifi
import google.auth
import websockets
from aiohttp import web
from google.auth.transport.requests import Request

from tools import get_function_declarations, execute_tool

# Config
PROJECT_ID = "jiobuddy-492811"
MODEL = "gemini-live-2.5-flash-native-audio"
MODEL_URI = f"projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/{MODEL}"
GEMINI_WS_URL = "wss://us-central1-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent"

HTTP_PORT = 9000
WS_PORT = 9090

# System prompt - the agent's brain
SYSTEM_PROMPT = (Path(__file__).parent.parent / "agent" / "jio_home_assistant" / "prompts" / "system.md").read_text()


def get_access_token():
    """Get Google Cloud OAuth token from default credentials."""
    creds, _ = google.auth.default()
    if not creds.valid:
        creds.refresh(Request())
    return creds.token


def build_setup_message():
    """Build the Gemini Live API setup message with tools and config."""
    return {
        "setup": {
            "model": MODEL_URI,
            "generation_config": {
                "response_modalities": ["AUDIO"],
                "temperature": 0.7,
                "speech_config": {
                    "voice_config": {
                        "prebuilt_voice_config": {
                            "voice_name": "Kore",
                        }
                    }
                },
            },
            "system_instruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "tools": {
                "function_declarations": get_function_declarations()
            },
            "realtime_input_config": {
                "automatic_activity_detection": {
                    "disabled": False,
                    "silence_duration_ms": 2000,
                    "prefix_padding_ms": 500,
                },
            },
            "input_audio_transcription": {},
            "output_audio_transcription": {},
        }
    }


async def handle_phone_session(phone_ws):
    """Handle a single phone UI WebSocket connection.

    Creates a Gemini Live API connection and bridges audio between them.
    Tool calls are executed server-side.
    """
    print("[SPINE] Phone connected")

    # Get auth token
    token = get_access_token()
    if not token:
        await phone_ws.send(json.dumps({"type": "error", "message": "Auth failed"}))
        return

    # Connect to Gemini Live API
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }

    try:
        async with websockets.connect(
            GEMINI_WS_URL, additional_headers=headers, ssl=ssl_ctx
        ) as gemini_ws:
            print("[SPINE] Connected to Gemini Live API")

            # Send setup message
            setup = build_setup_message()
            await gemini_ws.send(json.dumps(setup))
            print(f"[SPINE] Setup sent ({len(get_function_declarations())} tools registered)")

            # Wait for setup complete
            setup_response = await gemini_ws.recv()
            setup_data = json.loads(setup_response)
            if setup_data.get("setupComplete"):
                print("[SPINE] Gemini setup complete")
                await phone_ws.send(json.dumps({"type": "ready"}))
            else:
                print(f"[SPINE] Unexpected setup response: {setup_data}")

            # Bridge: phone <-> spine <-> gemini
            async def phone_to_gemini():
                """Forward audio from phone to Gemini."""
                try:
                    async for message in phone_ws:
                        data = json.loads(message)
                        msg_type = data.get("type")

                        if msg_type == "audio":
                            # Forward audio chunk to Gemini
                            gemini_msg = {
                                "realtime_input": {
                                    "media_chunks": [{
                                        "mime_type": "audio/pcm",
                                        "data": data["data"],
                                    }]
                                }
                            }
                            await gemini_ws.send(json.dumps(gemini_msg))

                        elif msg_type == "text":
                            # Forward text message to Gemini
                            gemini_msg = {
                                "client_content": {
                                    "turns": [{
                                        "role": "user",
                                        "parts": [{"text": data["text"]}],
                                    }],
                                    "turn_complete": True,
                                }
                            }
                            await gemini_ws.send(json.dumps(gemini_msg))

                except websockets.exceptions.ConnectionClosed:
                    print("[SPINE] Phone disconnected")

            async def gemini_to_phone():
                """Process Gemini responses: forward audio, execute tools."""
                try:
                    async for message in gemini_ws:
                        data = json.loads(message)

                        # Setup complete
                        if data.get("setupComplete"):
                            continue

                        # Turn complete
                        if data.get("serverContent", {}).get("turnComplete"):
                            await phone_ws.send(json.dumps({"type": "turn_complete"}))
                            continue

                        # Interrupted
                        if data.get("serverContent", {}).get("interrupted"):
                            await phone_ws.send(json.dumps({"type": "interrupted"}))
                            continue

                        # Input transcription
                        input_tx = data.get("serverContent", {}).get("inputTranscription")
                        if input_tx:
                            await phone_ws.send(json.dumps({
                                "type": "input_transcript",
                                "text": input_tx.get("text", ""),
                                "finished": input_tx.get("finished", False),
                            }))
                            continue

                        # Output transcription
                        output_tx = data.get("serverContent", {}).get("outputTranscription")
                        if output_tx:
                            await phone_ws.send(json.dumps({
                                "type": "output_transcript",
                                "text": output_tx.get("text", ""),
                                "finished": output_tx.get("finished", False),
                            }))
                            continue

                        # Tool call - execute server-side
                        tool_call = data.get("toolCall")
                        if tool_call:
                            tc_id = tool_call.get("id")
                            calls = tool_call.get("functionCalls", [])
                            for call in calls:
                                fn_name = call.get("name")
                                fn_args = call.get("args", {})
                                print(f"[SPINE] Tool call: {fn_name}({json.dumps(fn_args)[:80]})")

                                # Notify phone (for UI badges)
                                await phone_ws.send(json.dumps({
                                    "type": "tool_call",
                                    "tool": fn_name,
                                }))

                                # Execute tool server-side
                                result = await execute_tool(fn_name, fn_args)

                                # Send tool response back to Gemini
                                tool_response = {
                                    "tool_response": {
                                        "function_responses": [{
                                            "id": call.get("id", tc_id),
                                            "name": fn_name,
                                            "response": result,
                                        }]
                                    }
                                }
                                await gemini_ws.send(json.dumps(tool_response))
                                print(f"[SPINE] Tool response sent: {fn_name}")

                            continue

                        # Audio response - forward to phone
                        parts = data.get("serverContent", {}).get("modelTurn", {}).get("parts", [])
                        for part in parts:
                            if part.get("inlineData"):
                                await phone_ws.send(json.dumps({
                                    "type": "audio",
                                    "data": part["inlineData"]["data"],
                                }))
                            elif part.get("text"):
                                await phone_ws.send(json.dumps({
                                    "type": "text",
                                    "text": part["text"],
                                }))

                except websockets.exceptions.ConnectionClosed:
                    print("[SPINE] Gemini connection closed")

            # Run both directions concurrently
            done, pending = await asyncio.wait(
                [
                    asyncio.create_task(phone_to_gemini()),
                    asyncio.create_task(gemini_to_phone()),
                ],
                return_when=asyncio.FIRST_COMPLETED,
            )
            for task in pending:
                task.cancel()

    except Exception as e:
        print(f"[SPINE] Error: {e}")
        try:
            await phone_ws.send(json.dumps({"type": "error", "message": str(e)}))
        except:
            pass

    print("[SPINE] Session ended")


# --- HTTP server for phone UI ---

async def serve_static(request):
    """Serve phone UI static files."""
    path = request.match_info.get("path", "index.html")
    path = path.lstrip("/")
    if ".." in path:
        return web.Response(text="Invalid path", status=400)
    if not path or path == "/":
        path = "index.html"

    # Serve from phone/dist (built React app) or phone/frontend
    for base in ["phone/dist", "static"]:
        file_path = Path(__file__).parent / base / path
        if file_path.exists() and file_path.is_file():
            import mimetypes
            content_type, _ = mimetypes.guess_type(str(file_path))
            with open(file_path, "rb") as f:
                return web.Response(body=f.read(), content_type=content_type or "application/octet-stream")

    return web.Response(text="Not found", status=404)


async def start_http_server():
    app = web.Application()
    app.router.add_get("/", serve_static)
    app.router.add_get("/{path:.*}", serve_static)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", HTTP_PORT)
    await site.start()
    print(f"[SPINE] HTTP server on http://localhost:{HTTP_PORT}")


async def start_ws_server():
    async with websockets.serve(handle_phone_session, "0.0.0.0", WS_PORT):
        print(f"[SPINE] WebSocket server on ws://localhost:{WS_PORT}")
        await asyncio.Future()


async def main():
    print(f"""
    Jio Voice Agent Spine
    ---------------------
    Phone UI:   http://localhost:{HTTP_PORT}
    WebSocket:  ws://localhost:{WS_PORT}
    Model:      {MODEL}
    Tools:      {len(get_function_declarations())}
    Project:    {PROJECT_ID}
    """)
    await asyncio.gather(start_http_server(), start_ws_server())


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[SPINE] Stopped")
