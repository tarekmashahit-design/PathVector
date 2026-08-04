"""In-memory session store for uploaded/analyzed topologies.

Sessions live only for the process lifetime and expire after
SESSION_TTL_SECONDS. This is intentional — the demo mode never persists
uploaded network data to disk.
"""
from __future__ import annotations

import asyncio
import os
import time
import uuid
from dataclasses import dataclass, field

from models.schemas import AnalysisSession, Finding, Scores, Topology


@dataclass
class Session:
    data: AnalysisSession
    queue: asyncio.Queue = field(default_factory=asyncio.Queue)
    conversation: list[dict[str, str]] = field(default_factory=list)


_sessions: dict[str, Session] = {}


def _ttl_seconds() -> int:
    return int(os.environ.get("SESSION_TTL_SECONDS", "7200"))


def _sweep_expired() -> None:
    now = time.time()
    ttl = _ttl_seconds()
    expired = [sid for sid, s in _sessions.items() if now - s.data.created_at > ttl]
    for sid in expired:
        del _sessions[sid]


def create_session(filename: str) -> Session:
    _sweep_expired()
    session_id = str(uuid.uuid4())
    session = Session(data=AnalysisSession(session_id=session_id, filename=filename, created_at=time.time()))
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> Session | None:
    _sweep_expired()
    return _sessions.get(session_id)


async def emit(session_id: str, event: str, payload: dict) -> None:
    session = _sessions.get(session_id)
    if session is None:
        return
    await session.queue.put({"event": event, "data": payload})


def set_topology(session_id: str, topology: Topology) -> None:
    session = _sessions[session_id]
    session.data.topology = topology
    session.data.status = "analyzing"


def set_findings(session_id: str, findings: list[Finding]) -> None:
    session = _sessions[session_id]
    session.data.findings = findings


def set_scores(session_id: str, scores: Scores) -> None:
    session = _sessions[session_id]
    session.data.scores = scores


def set_summary(session_id: str, summary: str) -> None:
    session = _sessions[session_id]
    session.data.summary = summary
    session.data.status = "complete"


def set_error(session_id: str, message: str) -> None:
    session = _sessions[session_id]
    session.data.status = "error"
    session.data.error = message
