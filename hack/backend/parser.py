import re
from models import LogLine

# ── Regex patterns for common log formats ──────────────────────────────────
PATTERNS = {
    "apache": re.compile(
        r'(?P<timestamp>\d{2}/\w+/\d{4}:\d{2}:\d{2}:\d{2})'
        r'.+?"(?P<method>\w+)\s(?P<path>\S+).*?"\s(?P<status>\d{3})'
    ),
    "nginx": re.compile(
        r'(?P<timestamp>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2})'
        r'\s+\[(?P<level>\w+)\]'
        r'.+?(?P<message>.+)$'
    ),
    "json": re.compile(r'^\s*\{'),
    "standard": re.compile(
        r'(?P<timestamp>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})'
        r'.*?(?P<level>INFO|WARN|WARNING|ERROR|DEBUG|FATAL|CRITICAL)'
        r'\s+(?P<message>.+)$',
        re.IGNORECASE
    ),
    "spring": re.compile(
        r'(?P<timestamp>\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})'
        r'\s+(?P<level>INFO|WARN|ERROR|DEBUG)'
        r'\s+\d+\s+---\s+.+?\s+:\s+(?P<message>.+)$'
    ),
    "syslog": re.compile(
        r'(?P<timestamp>\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2})'
        r'\s+\S+\s+(?P<service>\S+):\s+(?P<message>.+)$'
    ),
}

LEVEL_KEYWORDS = {
    "ERROR":    ["error", "exception", "failed", "failure", "fatal", "critical"],
    "WARN":     ["warn", "warning", "deprecated", "timeout", "retry"],
    "INFO":     ["info", "started", "stopped", "success", "connected"],
    "DEBUG":    ["debug", "trace"],
}


def detect_level(line: str) -> str:
    """Guess log level from line content if not explicitly found."""
    lower = line.lower()
    for level, keywords in LEVEL_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return level
    return "INFO"


def detect_service(line: str) -> str:
    """Try to extract service/component name from log line."""
    # Look for patterns like [ServiceName] or ServiceName:
    bracket = re.search(r'\[([A-Za-z0-9_\-]+)\]', line)
    if bracket:
        return bracket.group(1)
    colon = re.search(r'\b([A-Za-z][A-Za-z0-9_\-]+Service|[A-Za-z][A-Za-z0-9_\-]+Controller|[A-Za-z][A-Za-z0-9_\-]+Handler)\b', line)
    if colon:
        return colon.group(1)
    return "unknown"


def parse_line(line: str, index: int) -> LogLine:
    """Parse a single log line into a LogLine object."""
    line = line.strip()
    if not line:
        return None

    # Try JSON format
    if PATTERNS["json"].match(line):
        try:
            import json
            data = json.loads(line)
            return LogLine(
                id=index,
                timestamp=str(data.get("timestamp", data.get("time", "unknown"))),
                level=str(data.get("level", data.get("severity", "INFO"))).upper(),
                service=str(data.get("service", data.get("logger", "unknown"))),
                message=str(data.get("message", data.get("msg", line))),
                raw=line
            )
        except Exception:
            pass

    # Try standard format (most common — covers Spring Boot, generic apps)
    match = PATTERNS["standard"].search(line)
    if match:
        return LogLine(
            id=index,
            timestamp=match.group("timestamp"),
            level=match.group("level").upper(),
            service=detect_service(line),
            message=match.group("message").strip(),
            raw=line
        )

    # Try Spring Boot specific
    match = PATTERNS["spring"].search(line)
    if match:
        return LogLine(
            id=index,
            timestamp=match.group("timestamp"),
            level=match.group("level").upper(),
            service=detect_service(line),
            message=match.group("message").strip(),
            raw=line
        )

    # Try syslog
    match = PATTERNS["syslog"].search(line)
    if match:
        return LogLine(
            id=index,
            timestamp=match.group("timestamp"),
            level=detect_level(line),
            service=match.group("service"),
            message=match.group("message").strip(),
            raw=line
        )

    # Fallback — store raw line, guess level
    return LogLine(
        id=index,
        timestamp="unknown",
        level=detect_level(line),
        service=detect_service(line),
        message=line[:200],
        raw=line
    )


def parse_logs(content: str) -> list[LogLine]:
    """Parse full log file content into list of LogLine objects."""
    lines = content.split("\n")
    parsed = []
    for i, line in enumerate(lines):
        result = parse_line(line, i)
        if result:
            parsed.append(result)
    return parsed
