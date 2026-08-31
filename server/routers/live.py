"""Mode A ("Live Network") API — connects to a real switch over SSH via
netmiko and serves data shaped exactly like the frontend's existing
src/data/*.ts mock schemas. The frontend itself is not wired to this yet;
these endpoints are ready to swap in as a drop-in replacement for the
seeded data.

No rate limiting is applied anywhere in this backend — every session,
including the admin account, has unlimited usage of every endpoint below.
"""
from __future__ import annotations

import os

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from services import live_builder, live_diagnosis, live_netmiko, live_session_store

router = APIRouter(prefix="/api/live", tags=["live"])


class ConnectRequest(BaseModel):
    ip: str | None = None
    username: str | None = None
    password: str | None = None
    secret: str | None = None


def _resolve_credentials(body: ConnectRequest) -> tuple[str, str, str, str]:
    """Body fields win; falls back to SWITCH_IP / SWITCH_USERNAME /
    SWITCH_PASSWORD / SWITCH_SECRET in .env, all optional — the test switch
    has no authentication configured at all."""
    ip = body.ip or os.environ.get("SWITCH_IP", "")
    username = body.username if body.username is not None else os.environ.get("SWITCH_USERNAME", "")
    password = body.password if body.password is not None else os.environ.get("SWITCH_PASSWORD", "")
    secret = body.secret if body.secret is not None else os.environ.get("SWITCH_SECRET", "")
    if not ip:
        raise HTTPException(status_code=400, detail="No switch IP given and SWITCH_IP is not set in .env.")
    return ip, username, password, secret


@router.post("/connect")
async def connect(body: ConnectRequest):
    ip, username, password, secret = _resolve_credentials(body)

    try:
        raw = await live_netmiko.pull(ip, username, password, secret)
    except live_netmiko.LiveConnectError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    outputs = raw.outputs
    outputs["_connect_ip"] = ip

    switch_device = live_builder.build_switch_device(outputs, previous_config=None, actor=username or "admin")
    neighbors_raw = _parse_neighbors(outputs)
    neighbor_devices = live_builder.build_neighbor_devices(neighbors_raw)
    topology = live_builder.build_topology(switch_device, neighbor_devices, neighbors_raw)
    alerts = live_builder.build_alerts(switch_device)
    dashboard = live_builder.build_dashboard_stats(switch_device, neighbor_devices, alerts)
    all_devices = [switch_device, *neighbor_devices]

    session = live_session_store.create_session(ip, username, password, secret)
    session.dashboard = dashboard
    session.topology = topology
    session.devices = all_devices
    session.alerts = alerts
    session.bandwidth_series = live_builder.build_bandwidth_series(switch_device)
    session.severity_breakdown = live_builder.build_severity_breakdown(alerts)
    session.risk_leaderboard = live_builder.build_risk_leaderboard(all_devices)
    session.last_config = outputs.get("running_config", "")

    return {
        "session_token": session.token,
        "device_count": len(session.devices),
        "warnings": [outputs[k] for k in outputs if k.endswith("_error") and outputs[k]],
    }


def _parse_neighbors(outputs: dict) -> list[dict]:
    from services import live_parser

    return live_parser.parse_cdp_neighbors_detail(outputs.get("cdp_neighbors_detail", ""))


def _get_session_or_401(session_token: str | None) -> live_session_store.LiveSession:
    if not session_token:
        raise HTTPException(status_code=401, detail="Missing X-Session-Token header. Call POST /api/live/connect first.")
    session = live_session_store.get_session(session_token)
    if session is None:
        raise HTTPException(status_code=401, detail="Session not found or expired. Reconnect via POST /api/live/connect.")
    return session


@router.get("/dashboard")
async def get_dashboard(x_session_token: str | None = Header(default=None)):
    session = _get_session_or_401(x_session_token)
    return {
        "stats": session.dashboard,
        "alerts": session.alerts,
        "bandwidthSeries": session.bandwidth_series,
        "severityBreakdown": session.severity_breakdown,
        "riskLeaderboard": session.risk_leaderboard,
    }


@router.get("/topology")
async def get_topology(x_session_token: str | None = Header(default=None)):
    session = _get_session_or_401(x_session_token)
    return session.topology


@router.get("/devices")
async def get_devices(x_session_token: str | None = Header(default=None)):
    session = _get_session_or_401(x_session_token)
    return {"devices": session.devices}


class VemoRequest(BaseModel):
    message: str
    history: list[dict[str, str]] | None = None


@router.post("/vemo")
async def vemo(body: VemoRequest, x_session_token: str | None = Header(default=None)):
    session = _get_session_or_401(x_session_token)
    if not session.devices:
        raise HTTPException(status_code=409, detail="No live data yet — call POST /api/live/connect first.")

    switch_device = session.devices[0]
    neighbor_devices = session.devices[1:]
    result = await live_diagnosis.chat(body.message, switch_device, neighbor_devices, session.alerts or [], history=body.history or session.conversation)
    session.conversation.append({"role": "user", "content": body.message})
    session.conversation.append({"role": "assistant", "content": result["response"]})
    session.conversation = session.conversation[-20:]
    return result
