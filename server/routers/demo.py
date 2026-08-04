from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from services import analysis_orchestrator, session_store

router = APIRouter(prefix="/api/demo", tags=["demo"])

ALLOWED_EXTENSIONS = (".pkt", ".pka", ".gns3", ".zip")
MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50MB


@router.post("/upload")
async def upload(file: UploadFile, background_tasks: BackgroundTasks):
    filename = file.filename or "upload"
    if not filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Upload one of: {', '.join(ALLOWED_EXTENSIONS)}")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File is too large (max 50MB).")

    session = session_store.create_session(filename)
    background_tasks.add_task(analysis_orchestrator.analyze, session.data.session_id, file_bytes, filename)
    return {"session_id": session.data.session_id}


@router.post("/fixture")
async def load_fixture(background_tasks: BackgroundTasks):
    """Start an analysis session directly from the built-in demo fixture.
    Useful when the user doesn't have a real .pkt file, or when parsing fails.
    """
    session = session_store.create_session("demo-fixture.pkt")
    background_tasks.add_task(analysis_orchestrator.analyze_fixture, session.data.session_id)
    return {"session_id": session.data.session_id}


def _get_session_or_404(session_id: str) -> session_store.Session:
    session = session_store.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    return session


@router.get("/{session_id}/stream")
async def stream(session_id: str):
    session = _get_session_or_404(session_id)

    async def event_generator():
        # Only replay terminal state for late/reconnecting clients — an
        # in-progress session is still delivering its own events through the
        # live queue below, so replaying "parsed" here would just duplicate it.
        if session.data.status == "complete":
            yield {
                "event": "complete",
                "data": json.dumps(
                    {
                        "topology": session.data.topology.model_dump() if session.data.topology else None,
                        "findings": [f.model_dump() for f in session.data.findings],
                        "scores": session.data.scores.model_dump() if session.data.scores else None,
                        "summary": session.data.summary,
                    }
                ),
            }
            return
        if session.data.status == "error":
            yield {"event": "error", "data": json.dumps({"message": session.data.error})}
            return

        while True:
            try:
                item = await asyncio.wait_for(session.queue.get(), timeout=30)
            except asyncio.TimeoutError:
                yield {"event": "ping", "data": "{}"}
                continue
            yield {"event": item["event"], "data": json.dumps(item["data"])}
            if item["event"] in ("complete", "error"):
                return

    return EventSourceResponse(event_generator())


@router.get("/{session_id}/topology")
async def get_topology(session_id: str):
    session = _get_session_or_404(session_id)
    if session.data.topology is None:
        raise HTTPException(status_code=409, detail="Analysis not complete yet.")
    return session.data.topology.model_dump()


@router.get("/{session_id}/findings")
async def get_findings(session_id: str):
    session = _get_session_or_404(session_id)
    return [f.model_dump() for f in session.data.findings]


@router.get("/{session_id}/scores")
async def get_scores(session_id: str):
    session = _get_session_or_404(session_id)
    if session.data.scores is None:
        raise HTTPException(status_code=409, detail="Analysis not complete yet.")
    return session.data.scores.model_dump()


@router.get("/{session_id}/summary")
async def get_summary(session_id: str):
    session = _get_session_or_404(session_id)
    return {"summary": session.data.summary}


@router.get("/{session_id}/device/{device_id}")
async def get_device(session_id: str, device_id: str):
    session = _get_session_or_404(session_id)
    if session.data.topology is None:
        raise HTTPException(status_code=409, detail="Analysis not complete yet.")
    device = next((d for d in session.data.topology.devices if d.id == device_id), None)
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found in this session.")
    device_findings = [f for f in session.data.findings if device.name in f.affected_devices]
    return {"device": device.model_dump(), "findings": [f.model_dump() for f in device_findings]}


class VemoRequest(BaseModel):
    message: str
    history: list[dict[str, str]] | None = None


@router.post("/{session_id}/vemo")
async def vemo(session_id: str, body: VemoRequest):
    session = _get_session_or_404(session_id)
    if session.data.topology is None:
        raise HTTPException(status_code=409, detail="Analysis not complete yet.")

    from services import ai_diagnosis

    result = await ai_diagnosis.chat(body.message, session.data.topology, session.data.findings, history=body.history or session.conversation)
    session.conversation.append({"role": "user", "content": body.message})
    session.conversation.append({"role": "assistant", "content": result["response"]})
    session.conversation = session.conversation[-20:]
    return result
