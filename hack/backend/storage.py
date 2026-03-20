import os, sqlite3, uuid, json
from typing import List, Dict, Any
from models import CrashReport

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "incidents.db")
_sessions: Dict[str, Any] = {}

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, first_anomalous_event TEXT,
        probable_root_cause TEXT, affected_services TEXT, timeline TEXT,
        recommended_fix TEXT, anomaly_category TEXT, confidence TEXT, created_at TEXT)""")
    conn.commit()
    conn.close()

def create_session(lines: list) -> str:
    session_id = str(uuid.uuid4())
    _sessions[session_id] = lines
    return session_id

def update_session(session_id: str, lines: list):
    """Updates the same session ID with scored lines."""
    if session_id in _sessions:
        _sessions[session_id] = lines

def get_session(session_id: str) -> list:
    return _sessions.get(session_id, [])

def save_crash_report(report: CrashReport) -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""INSERT INTO incidents (session_id, first_anomalous_event, probable_root_cause, 
        affected_services, timeline, recommended_fix, anomaly_category, confidence, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))""",
        (report.session_id, report.first_anomalous_event, report.probable_root_cause,
         ",".join(report.affected_services), json.dumps(report.timeline), 
         report.recommended_fix, report.anomaly_category, report.confidence))
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id

def get_past_incidents(limit: int = 100) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM incidents ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [{**dict(r), "affected_services": r["affected_services"].split(",") if r["affected_services"] else [],
             "timeline": json.loads(r["timeline"]) if r["timeline"] else []} for r in rows]