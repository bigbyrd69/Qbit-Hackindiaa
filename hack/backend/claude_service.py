import os
import json
import re
import time
from openai import OpenAI
from models import LogLine, CrashReport

# ✅ CPU-First Optimization: Qwen 0.5b is nearly instant even without a GPU
MODEL = "qwen2.5:0.5b"
OLLAMA_BASE_URL = "http://localhost:11434/v1"

_client = None

def _get_client():
    """Initialize OpenAI-compatible client for local Ollama."""
    global _client
    if _client is None:
        _client = OpenAI(
            api_key="ollama",
            base_url=OLLAMA_BASE_URL,
            timeout=30.0 
        )
    return _client

def _clean_json(text: str) -> str:
    """Robust JSON extraction for smaller models."""
    if not text:
        return "{}"
        
    # Remove DeepSeek thinking tags if they ever appear
    if "<think>" in text:
        text = text.split("</think>")[-1].strip()

    # Strip Markdown code blocks
    text = re.sub(r"```json\s*|```", "", text).strip()

    try:
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > start:
            return text[start:end]
    except Exception:
        pass
    return text

def generate_crash_report(lines: list[LogLine], session_id: str) -> CrashReport:
    """Generate AI crash report with CPU-speed optimizations."""
    
    start_time = time.time()

    # Limit to 30 lines for maximum CPU speed
    snippet = "\n".join([
        f"[{l.timestamp}] {l.level}: {l.message}"
        for l in lines[-30:]
    ])

    prompt = (
        "Analyze these system logs and identify the root cause.\n"
        "Return ONLY a valid JSON object. Required fields:\n"
        "first_anomalous_event, probable_root_cause, affected_services (list), "
        "timeline (list of {'time', 'event', 'severity'}), recommended_fix, "
        "anomaly_category, confidence (HIGH/MEDIUM/LOW).\n\n"
        f"LOGS:\n{snippet}"
    )

    try:
        client = _get_client()

        # 🔥 extra_body forces the model to stop early and stay fast
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a fast SRE. Output ONLY JSON. No reasoning. No prose. Be concise."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            extra_body={"num_predict": 400} 
        )

        raw_content = response.choices[0].message.content
        cleaned_json_str = _clean_json(raw_content)
        data = json.loads(cleaned_json_str)

        required_fields = [
            "first_anomalous_event", "probable_root_cause", "affected_services", 
            "timeline", "recommended_fix", "anomaly_category", "confidence"
        ]
        
        # Bug-proof: Fill missing fields so the frontend doesn't break
        for field in required_fields:
            if field not in data:
                data[field] = "N/A" if field not in ["timeline", "affected_services"] else []

        print(f"⚡ CPU-AI Report Generated in {round(time.time() - start_time, 2)}s")
        return CrashReport(session_id=session_id, **data)

    except Exception as e:
        print(f"❌ AI Error: {str(e)}")
        return CrashReport(
            session_id=session_id,
            first_anomalous_event="Local Analysis Failed",
            probable_root_cause=f"Error: {str(e)}",
            affected_services=[],
            timeline=[],
            recommended_fix=f"Ensure Ollama is running and '{MODEL}' is pulled.",
            anomaly_category="LOCAL_ENGINE_ERROR",
            confidence="LOW"
        )