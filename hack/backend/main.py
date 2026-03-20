import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from storage import create_session, update_session, get_session, init_db, save_crash_report, get_past_incidents
from parser import parse_logs
from anomaly import build_anomaly_result
from claude_service import generate_crash_report, natural_language_query, find_similar_incidents
from models import QueryRequest
from stream import stream_with_alerts

app = FastAPI(title="Log-Whisperer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()
    print("Log-Whisperer backend started.")

@app.get("/")
async def health():
    return {"status": "ok", "service": "Log-Whisperer"}

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8", errors="ignore")
    lines = parse_logs(content)
    if not lines:
        raise HTTPException(400, "No parseable logs")
    session_id = create_session(lines)
    return {"session_id": session_id, "total_lines": len(lines)}

@app.post("/upload-text")
async def upload_text(payload: dict):
    text = payload.get("text", "")
    if not text.strip():
        raise HTTPException(400, "No log text provided.")
    lines = parse_logs(text)
    if not lines:
        raise HTTPException(400, "No parseable log lines found.")
    session_id = create_session(lines)
    return {"session_id": session_id, "total_lines": len(lines)}

@app.get("/analyze/{session_id}")
async def analyze(session_id: str):
    lines = get_session(session_id)
    if not lines:
        raise HTTPException(404, "Session not found.")
    result = build_anomaly_result(lines, session_id)
    update_session(session_id, lines)
    return result

@app.get("/report/{session_id}")
async def report(session_id: str):
    lines = get_session(session_id)
    if not lines:
        raise HTTPException(404, "Session not found.")
    report_data = generate_crash_report(lines, session_id)
    save_crash_report(report_data)
    similar = find_similar_incidents(report_data, get_past_incidents())
    return {"crash_report": report_data, "similar_incidents": similar}

@app.post("/query")
async def query(request: QueryRequest):
    lines = get_session(request.session_id)
    if not lines:
        raise HTTPException(404, "Session not found.")
    result = natural_language_query(request.question, lines)
    return result

@app.get("/stream/{session_id}")
async def stream(session_id: str):
    lines = get_session(session_id)
    if not lines:
        raise HTTPException(404, "Session not found.")
    return StreamingResponse(
        stream_with_alerts(lines),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

@app.get("/sessions")
async def sessions():
    from storage import _sessions
    return {"active_sessions": list(_sessions.keys())}

@app.get("/incidents")
async def incidents():
    return {"incidents": get_past_incidents()}