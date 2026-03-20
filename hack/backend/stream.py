import asyncio
import json
from models import LogLine


async def stream_logs(lines: list[LogLine], delay: float = 0.05):
    """
    Async generator that yields log lines one by one with a delay.
    Used for Server-Sent Events (SSE) real-time simulation.
    
    delay: seconds between each line (0.05 = 20 lines/second)
    """
    for line in lines:
        # Format as SSE event
        data = {
            "id": line.id,
            "timestamp": line.timestamp,
            "level": line.level,
            "service": line.service,
            "message": line.message,
            "anomaly_score": line.anomaly_score
        }
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(delay)

    # Send done signal
    yield f"data: {json.dumps({'event': 'done', 'message': 'Stream complete'})}\n\n"


async def stream_with_alerts(lines: list[LogLine], threshold: float = 60.0):
    """
    Stream logs AND emit special alert events when anomaly score spikes.
    Frontend can show toast notifications on alert events.
    """
    for line in lines:
        data = {
            "id": line.id,
            "timestamp": line.timestamp,
            "level": line.level,
            "service": line.service,
            "message": line.message,
            "anomaly_score": line.anomaly_score,
            "is_anomaly": line.anomaly_score >= threshold
        }
        yield f"data: {json.dumps(data)}\n\n"

        # Emit extra alert event for high-score lines
        if line.anomaly_score >= threshold:
            alert = {
                "event": "alert",
                "score": line.anomaly_score,
                "message": f"Anomaly detected in {line.service}: {line.message[:80]}",
                "severity": "critical" if line.anomaly_score >= 80 else "warning"
            }
            yield f"data: {json.dumps(alert)}\n\n"

        await asyncio.sleep(0.05)

    yield f"data: {json.dumps({'event': 'done'})}\n\n"
