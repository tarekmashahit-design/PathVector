"""Vemo AI chat for Mode A (Live Network) — same NIM-backed pattern as
services/ai_diagnosis.chat() for Demo mode, kept as its own module so the
demo backend is not touched. Context here is the live-polled switch/topology
snapshot instead of a parsed .pkt's findings.
"""
from __future__ import annotations

import asyncio
import json
import os
import re

from openai import AsyncOpenAI

_CONFIDENCE_RE = re.compile(r"confidence\s*[:\-]?\s*(\d{1,3})\s*%", re.IGNORECASE)

SYSTEM_PROMPT_TEMPLATE = (
    "You are PathVector's AI network analyst, Vemo. You are looking at a live snapshot of a real "
    "network pulled just now over SSH. Here is the device: {device_summary}. Here are the current "
    "alerts: {alerts_summary}. Answer the user's question about this specific network. Be precise — "
    "reference exact interface names, VLANs, and counters from the data given. If something isn't in "
    "the data, say so rather than guessing. Write in plain prose sentences — no markdown, no asterisks, "
    "no headers, no bullet lists."
)


def _get_client() -> AsyncOpenAI:
    api_key = os.environ.get("NVIDIA_NIM_API_KEY")
    if not api_key:
        raise RuntimeError("NVIDIA_NIM_API_KEY is not set. Add it to server/.env.")
    return AsyncOpenAI(
        base_url=os.environ.get("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1"),
        api_key=api_key,
        timeout=20.0,
        max_retries=1,
    )


def _model() -> str:
    return os.environ.get("NVIDIA_NIM_MODEL", "mistralai/mistral-nemotron")


def _strip_markdown(text: str) -> str:
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)\*(?!\*)", r"\1", text)
    text = re.sub(r"^[\-\*]\s+", "• ", text, flags=re.MULTILINE)
    return text


def _extract_confidence(text: str, default: int = 85) -> tuple[str, int]:
    match = _CONFIDENCE_RE.search(text)
    confidence = int(match.group(1)) if match else default
    confidence = max(0, min(100, confidence))
    cleaned = _CONFIDENCE_RE.sub("", text).strip()
    cleaned = _strip_markdown(cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip(" \n-")
    return cleaned, confidence


async def _complete_with_retry(**kwargs):
    try:
        return await _get_client().chat.completions.create(**kwargs)
    except Exception:  # noqa: BLE001
        await asyncio.sleep(1)
        return await _get_client().chat.completions.create(**kwargs)


def _device_summary(switch_device: dict, neighbor_devices: list[dict]) -> str:
    ifaces = [f"{r['port']} ({r['status']}, {r['vlan']}, {r['errors']} errors)" for r in switch_device["interfaces"]]
    summary = {
        "switch": {
            "name": switch_device["name"],
            "ip": switch_device["ip"],
            "model": switch_device["model"],
            "firmware": switch_device["firmware"],
            "cpu": switch_device["cpu"],
            "mem": switch_device["mem"],
            "interfaces": ifaces,
        },
        "cdp_neighbors": [{"name": d["name"], "ip": d["ip"], "platform": d["model"]} for d in neighbor_devices],
    }
    return json.dumps(summary)


async def chat(
    message: str,
    switch_device: dict,
    neighbor_devices: list[dict],
    alerts: list[dict],
    history: list[dict[str, str]] | None = None,
) -> dict:
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        device_summary=_device_summary(switch_device, neighbor_devices),
        alerts_summary=json.dumps([{"severity": a["severity"], "message": a["message"]} for a in alerts]),
    )
    messages = [{"role": "system", "content": system_prompt}]
    for turn in history or []:
        messages.append(turn)
    messages.append({"role": "user", "content": message})

    resp = await _complete_with_retry(model=_model(), messages=messages, max_tokens=400, temperature=0.4)
    text = resp.choices[0].message.content or ""
    cleaned, confidence = _extract_confidence(text)
    return {"response": cleaned, "confidence": confidence}
