import os
import json
from google import genai
from models import LogLine, CrashReport, QueryResponse, SimilarIncident

# New google-genai SDK
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
MODEL = "gemini-2.0-flash"


def _clean(text: str) -> str:
    text = text.replace("```json", "").replace("```", "").strip()
    start = text.find('{')
    end = text.rfind('}') + 1
    if start != -1 and end > start:
        return text[start:end]
    return text


def _clean_list(text: str) -> str:
    text = text.replace("```json", "").replace("```", "").strip()
    start = text.find('[')
    end = text.rfind(']') + 1
    if start != -1 and end > start:
        return text[start:end]
    return "[]"


def _log_snippet(lines: list[LogLine], max_lines: int = 60) -> str:
    relevant = [l for l in lines if l.anomaly_score > 20]
    if len(relevant) < 5:
        relevant = lines[-max_lines:]
    snippet = relevant[-max_lines:]
    return "\n".join(f"[{l.timestamp}] {l.level} {l.service}: {l.message}" for l in snippet)


def generate_crash_report(lines: list[LogLine], session_id: str) -> CrashReport:
    snippet = _log_snippet(lines)
    prompt = f"""You are a senior SRE analyzing a production failure.
Return ONLY a valid JSON object. No markdown. No explanation outside JSON.

{{
  "first_anomalous_event": "timestamp + log line where problem first appeared",
  "probable_root_cause": "one clear sentence explaining why the system failed",
  "affected_services": ["service1", "service2"],
  "timeline": [
    {{"time": "HH:MM:SS", "event": "what happened", "severity": "HIGH"}}
  ],
  "recommended_fix": "numbered steps to fix this",
  "anomaly_category": "OOM or DB_FAILURE or NETWORK or TIMEOUT or CONFIG_ERROR or UNKNOWN",
  "confidence": "HIGH or MEDIUM or LOW"
}}

LOGS TO ANALYZE:
{snippet}"""

    try:
        response = client.models.generate_content(model=MODEL, contents=prompt)
        raw = _clean(response.text)
        data = json.loads(raw)
        return CrashReport(
            session_id=session_id,
            first_anomalous_event=data.get("first_anomalous_event", "unknown"),
            probable_root_cause=data.get("probable_root_cause", "unknown"),
            affected_services=data.get("affected_services", []),
            timeline=data.get("timeline", []),
            recommended_fix=data.get("recommended_fix", ""),
            anomaly_category=data.get("anomaly_category", "UNKNOWN"),
            confidence=data.get("confidence", "MEDIUM")
        )
    except Exception as e:
        print(f"Gemini crash report error: {e}")
        return CrashReport(
            session_id=session_id,
            first_anomalous_event="Error generating report",
            probable_root_cause=f"AI Error: {str(e)[:100]}",
            affected_services=[],
            timeline=[],
            recommended_fix="Check Gemini API key and model availability",
            anomaly_category="UNKNOWN",
            confidence="LOW"
        )


def natural_language_query(question: str, lines: list[LogLine]) -> QueryResponse:
    sample = lines[-200:]
    log_text = "\n".join(f"[id:{l.id}] {l.level}: {l.message}" for l in sample)
    prompt = f"""Answer this question about the logs: "{question}"
Return ONLY valid JSON: {{"answer": "2-3 sentence answer", "matching_ids": [list of relevant log id numbers]}}
LOGS:
{log_text}"""

    try:
        response = client.models.generate_content(model=MODEL, contents=prompt)
        raw = _clean(response.text)
        data = json.loads(raw)
        ids = set(data.get("matching_ids", []))
        return QueryResponse(
            answer=data.get("answer", "No answer found."),
            matching_lines=[l for l in lines if l.id in ids]
        )
    except Exception as e:
        print(f"Gemini query error: {e}")
        return QueryResponse(answer="Query failed. Please try again.", matching_lines=[])


def find_similar_incidents(crash_report: CrashReport, past_reports: list[dict]) -> list[SimilarIncident]:
    if not past_reports:
        return []
    history = "\n".join(f"ID {r['id']}: {r['probable_root_cause']}" for r in past_reports[-10:])
    prompt = f"""Compare this crash: "{crash_report.probable_root_cause}"
Against history:
{history}
Return ONLY a JSON array of similar incidents with similarity > 0.4:
[{{"incident_id": 1, "summary": "...", "root_cause": "...", "resolution": "...", "similarity_score": 0.8}}]
Return empty array [] if no similar incidents found."""

    try:
        response = client.models.generate_content(model=MODEL, contents=prompt)
        raw = _clean_list(response.text)
        data = json.loads(raw)
        return [SimilarIncident(**item) for item in data if item.get("similarity_score", 0) > 0.4]
    except Exception as e:
        print(f"Gemini similar incidents error: {e}")
        return []