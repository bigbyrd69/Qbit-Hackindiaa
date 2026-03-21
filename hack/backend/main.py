from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from storage import create_session, get_session, init_db, save_crash_report
from parser import parse_logs
from anomaly import build_anomaly_result
from claude_service import generate_crash_report
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
import os

load_dotenv()  # 👈 THIS LINE FIXES YOUR ISSUE
import os

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

@app.get("/")
async def health():
    return {"status": "online", "port": 8001}

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    content = (await file.read()).decode("utf-8", errors="ignore")
    lines = parse_logs(content)
    if not lines: raise HTTPException(400, "Could not parse logs.")
    session_id = create_session(lines)
    return {"session_id": session_id, "total_lines": len(lines)}

@app.get("/analyze/{session_id}")
async def analyze(session_id: str):
    lines = get_session(session_id)
    return build_anomaly_result(lines, session_id)

@app.get("/report/{session_id}")
async def report(session_id: str):
    lines = get_session(session_id)
    report_data = generate_crash_report(lines, session_id)
    save_crash_report(report_data)
    return {"crash_report": report_data}