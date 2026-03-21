import numpy as np
from collections import defaultdict
from models import LogLine, AnomalyResult
import uuid

WINDOW_SIZE = 20        # lines per scoring window
ERROR_WEIGHT = 10       # ERROR lines boost score heavily
WARN_WEIGHT = 3         # WARN lines boost score moderately
SPIKE_THRESHOLD = 60    # score above this = warning
CRITICAL_THRESHOLD = 80 # score above this = critical

# Keywords that strongly indicate anomalies
HIGH_RISK_KEYWORDS = [
    "outofmemory", "oom", "killed", "segfault",
    "connection refused", "connection timeout", "connection reset",
    "nullpointerexception", "stackoverflowerror",
    "disk full", "no space left",
    "deadlock", "lock wait timeout",
    "too many connections", "max connections",
    "circuit breaker", "fallback",
    "health check failed", "unhealthy",
    "panic", "fatal error", "unhandled exception",
]


def keyword_score(line: LogLine) -> float:
    """Boost score if high-risk keywords found in message."""
    msg = line.message.lower() + line.raw.lower()
    hits = sum(1 for kw in HIGH_RISK_KEYWORDS if kw in msg)
    return min(hits * 15, 40)  # max 40 points from keywords


def level_score(line: LogLine) -> float:
    """Score based on log level."""
    scores = {"ERROR": ERROR_WEIGHT, "FATAL": ERROR_WEIGHT,
              "CRITICAL": ERROR_WEIGHT, "WARN": WARN_WEIGHT,
              "WARNING": WARN_WEIGHT, "DEBUG": 0, "INFO": 0}
    return scores.get(line.level.upper(), 0)


def window_spike_score(lines: list[LogLine], idx: int) -> float:
    """
    Check if error rate in surrounding window is a spike.
    Returns 0–40 based on error density in window.
    """
    start = max(0, idx - WINDOW_SIZE // 2)
    end = min(len(lines), idx + WINDOW_SIZE // 2)
    window = lines[start:end]

    if not window:
        return 0.0

    error_count = sum(1 for l in window
                      if l.level.upper() in ("ERROR", "FATAL", "CRITICAL"))
    error_rate = error_count / len(window)

    # Baseline: expect <5% errors in healthy logs
    if error_rate < 0.05:
        return 0.0
    elif error_rate < 0.20:
        return 15.0
    elif error_rate < 0.50:
        return 30.0
    else:
        return 40.0


def isolation_forest_scores(lines: list[LogLine]) -> dict[int, float]:
    """
    Use Isolation Forest for deeper anomaly detection.
    Returns dict of {line_id: extra_score (0–20)}
    """
    if len(lines) < 10:
        return {}

    try:
        from sklearn.ensemble import IsolationForest

        # Feature vector per line: [is_error, is_warn, keyword_hits, msg_length]
        features = []
        for line in lines:
            is_error = 1 if line.level.upper() in ("ERROR", "FATAL", "CRITICAL") else 0
            is_warn = 1 if line.level.upper() in ("WARN", "WARNING") else 0
            kw_hits = sum(1 for kw in HIGH_RISK_KEYWORDS
                          if kw in line.message.lower())
            msg_len = min(len(line.message) / 100, 5)  # normalised
            features.append([is_error, is_warn, kw_hits, msg_len])

        X = np.array(features)
        clf = IsolationForest(contamination=0.1, random_state=42)
        preds = clf.fit_predict(X)  # -1 = anomaly, 1 = normal
        scores = clf.score_samples(X)  # more negative = more anomalous

        result = {}
        for i, (pred, score) in enumerate(zip(preds, scores)):
            if pred == -1:
                # Normalise IF score to 0–20 extra points
                extra = min(abs(score) * 10, 20)
                result[lines[i].id] = extra
        return result

    except Exception:
        return {}  # graceful fallback if sklearn fails


def score_lines(lines: list[LogLine]) -> list[LogLine]:
    """
    Assign anomaly_score 0–100 to every log line.
    Combines: level score + keyword score + window spike + Isolation Forest
    """
    if_scores = isolation_forest_scores(lines)

   # --- UPDATED LINE 100 ---
    for idx, line in enumerate(lines):
        base = level_score(line)
        kw = keyword_score(line)
        spike = window_spike_score(lines, idx)
        iso = if_scores.get(line.id, 0)

        # 1. Start with the calculated sum
        total = base + kw + spike + iso

        # 2. NEW: Force High Scores for Severe Events
        # If the level is FATAL or CRITICAL, jump straight to 85+
        if line.level.upper() in ("FATAL", "CRITICAL"):
            total = max(total, 85.0)
            
        # If specific disaster keywords exist, jump to 95+
        msg_lower = (line.message + line.raw).lower()
        disaster_keys = ["outofmemory", "panic", "segfault", "deadlock"]
        if any(k in msg_lower for k in disaster_keys):
            total = max(total, 95.0)

        # 3. Final round and assignment
        line.anomaly_score = round(min(total, 100), 1)

    return lines


def build_anomaly_result(lines: list[LogLine], session_id: str) -> AnomalyResult:
    """Build the full AnomalyResult summary from scored lines."""
    scored = score_lines(lines)

    flagged = [l for l in scored if l.anomaly_score >= SPIKE_THRESHOLD]
    peak = max((l.anomaly_score for l in scored), default=0)

    if peak >= CRITICAL_THRESHOLD:
        status = "critical"
    elif peak >= SPIKE_THRESHOLD:
        status = "warning"
    else:
        status = "normal"

    return AnomalyResult(
        session_id=session_id,
        total_lines=len(scored),
        anomaly_count=len(flagged),
        peak_score=peak,
        flagged_lines=flagged[:50],  # cap at 50 for response size
        status=status
    )
