"""In-memory session store for live-connected switch sessions.

Mirrors services/session_store.py's pattern (in-memory, TTL-expiring, never
persisted to disk) but kept as a separate store so Demo mode's session store
is untouched. Sessions are keyed by an opaque token returned from
POST /api/live/connect.
"""
from __future__ import annotations

import os
import time
import uuid
from dataclasses import dataclass, field


@dataclass
class LiveSession:
    token: str
    ip: str
    username: str
    password: str
    secret: str
    created_at: float
    dashboard: dict | None = None
    topology: dict | None = None
    devices: list[dict] | None = None
    alerts: list[dict] | None = None
    last_config: str | None = None
    conversation: list[dict[str, str]] = field(default_factory=list)


_sessions: dict[str, LiveSession] = {}


def _ttl_seconds() -> int:
    return int(os.environ.get("LIVE_SESSION_TTL_SECONDS", os.environ.get("SESSION_TTL_SECONDS", "7200")))


def _sweep_expired() -> None:
    now = time.time()
    ttl = _ttl_seconds()
    expired = [tok for tok, s in _sessions.items() if now - s.created_at > ttl]
    for tok in expired:
        del _sessions[tok]


def create_session(ip: str, username: str, password: str, secret: str) -> LiveSession:
    _sweep_expired()
    token = str(uuid.uuid4())
    session = LiveSession(token=token, ip=ip, username=username, password=password, secret=secret, created_at=time.time())
    _sessions[token] = session
    return session


def get_session(token: str) -> LiveSession | None:
    _sweep_expired()
    return _sessions.get(token)
