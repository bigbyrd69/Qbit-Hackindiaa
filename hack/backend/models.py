from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class LogLine(BaseModel):
    id: int
    timestamp: str
    level: str          # INFO, WARN, ERROR, DEBUG
    service: str        # which service/component
    message: str
    raw: str            # original unparsed line
    anomaly_score: float = 0.0


class AnomalyResult(BaseModel):
    session_id: str
    total_lines: int
    anomaly_count: int
    peak_score: float
    flagged_lines: List[LogLine]
    status: str         # "normal", "warning", "critical"


class CrashReport(BaseModel):
    session_id: str
    first_anomalous_event: str
    probable_root_cause: str
    affected_services: List[str]
    timeline: List[dict]
    recommended_fix: str
    anomaly_category: str   # OOM, DB_FAILURE, NETWORK, CONFIG_ERROR, UNKNOWN
    confidence: str         # HIGH, MEDIUM, LOW


class QueryRequest(BaseModel):
    session_id: str
    question: str


class QueryResponse(BaseModel):
    answer: str
    matching_lines: List[LogLine] = []


class UploadResponse(BaseModel):
    session_id: str
    total_lines: int
    message: str


class SimilarIncident(BaseModel):
    incident_id: int
    summary: str
    root_cause: str
    resolution: str
    similarity_score: float
