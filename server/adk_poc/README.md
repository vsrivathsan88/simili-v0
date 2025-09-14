# ADK POC Server (Gemini Real-time Voice Agent)

This is a minimal proof-of-concept server to evaluate the Gemini ADK for real-time, bi-directional voice and interrupt handling.

## What it does
- Exposes a WebSocket endpoint `/ws` that proxies audio/text between the browser and Gemini using ADK patterns.
- Runs a foundational agent (no external tools) for latency/interrupt benchmarks.

## Requirements
- Python 3.11+
- `pip install -r requirements.txt`
- Env var: `GOOGLE_API_KEY`

## Run
```
uvicorn app:app --host 0.0.0.0 --port 8787
```

## Next steps
- Add tools mapping for mark_reasoning_step, set_lesson_act, annotate_canvas.
- Measure latency and barge-in vs current Live client.
