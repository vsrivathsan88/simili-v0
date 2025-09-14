import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health():
    return {"status": "ok", "service": "adk-poc"}

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        # Simple echo loop placeholder for ADK bridge
        while True:
            msg = await ws.receive_text()
            try:
                data = json.loads(msg)
            except Exception:
                data = {"type": "text", "data": msg}
            # Echo back with type-based structure (placeholder)
            await ws.send_text(json.dumps({"type": data.get("type", "text"), "data": data.get("data")}))
    except WebSocketDisconnect:
        pass
