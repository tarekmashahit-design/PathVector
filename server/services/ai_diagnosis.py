"""AI diagnosis service — Mistral Nemotron via the NVIDIA NIM API."""
from __future__ import annotations

import asyncio
import json
import os
import re

from openai import AsyncOpenAI

from models.schemas import Finding, Topology

_CONFIDENCE_RE = re.compile(r"confidence\s*[:\-]?\s*(\d{1,3})\s*%", re.IGNORECASE)
_CALL_DELAY_SECONDS = 0.5

def _get_client() -> AsyncOpenAI:
    # Deliberately not cached as a module-level singleton: a long-lived
    # AsyncOpenAI/httpx client sitting idle inside the uvicorn process can
    # end up handing out a stale pooled connection, which surfaces as a
    # generic "Connection error" on the next call. A fresh client per call
    # is a cheap price for that class of bug never happening in a demo.
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


def _extract_confidence(text: str, default: int = 75) -> tuple[str, int]:
    match = _CONFIDENCE_RE.search(text)
    confidence = int(match.group(1)) if match else default
    confidence = max(0, min(100, confidence))
    cleaned = _CONFIDENCE_RE.sub("", text).strip()
    cleaned = _strip_markdown(cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip(" \n-")
    return cleaned, confidence


FINDING_SYSTEM_PROMPT = (
    "You are PathVector's AI network analyst. You receive a network misconfiguration finding with "
    "evidence. Produce a concise diagnosis in 2-3 sentences explaining: what is wrong, why it matters "
    "(the real-world impact), and what to do about it. End your response on its own line with "
    "'Confidence: NN%'. Be specific, cite the exact device names and interface names from the evidence. "
    "Do not use generic language. Write in plain prose sentences — no markdown, no asterisks, no headers, no bullet lists."
)

SUMMARY_SYSTEM_PROMPT = (
    "You are PathVector's AI network analyst. You receive a complete list of findings from a network "
    "analysis. Produce a 3-4 sentence executive summary: the overall state of the network, the single "
    "most urgent issue, and the recommended first action. Be direct and specific. "
    "Write in plain prose sentences — no markdown, no asterisks, no headers, no bullet lists."
)

VEMO_SYSTEM_PROMPT_TEMPLATE = (
    "You are PathVector's AI network analyst. You are analyzing a network topology uploaded by the user. "
    "Here is the topology: {topology_summary}. Here are the findings: {findings_summary}. Answer the "
    "user's question about this network specifically. Be precise — reference exact device names, "
    "interface names, VLAN numbers, and config lines where relevant. If you are unsure, say so. "
    "Write in plain prose sentences — no markdown, no asterisks, no headers, no bullet lists."
)


async def _complete_with_retry(**kwargs):
    """One retry with a brand-new client — covers both transient network
    blips and the stale-pooled-connection class of error described above."""
    try:
        return await _get_client().chat.completions.create(**kwargs)
    except Exception:  # noqa: BLE001
        await asyncio.sleep(1)
        return await _get_client().chat.completions.create(**kwargs)


async def diagnose_finding(finding: Finding) -> dict:
    user_message = (
        f"Finding: {finding.title} ({finding.rule_id}, severity: {finding.severity})\n"
        f"Description: {finding.description}\n"
        f"Affected devices: {', '.join(finding.affected_devices)}\n"
        f"Evidence:\n" + "\n".join(f"- {e}" for e in finding.evidence)
    )
    resp = await _complete_with_retry(
        model=_model(),
        messages=[
            {"role": "system", "content": FINDING_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        max_tokens=300,
        temperature=0.3,
    )
    text = resp.choices[0].message.content or ""
    cleaned, confidence = _extract_confidence(text)
    await asyncio.sleep(_CALL_DELAY_SECONDS)
    return {"text": cleaned, "confidence": confidence}


async def diagnose_all(findings: list[Finding], on_each=None) -> list[Finding]:
    """Sequentially (not in parallel) diagnose every finding, respecting NIM
    rate limits. Calls on_each(finding) after each one is updated in place."""
    for finding in findings:
        try:
            result = await diagnose_finding(finding)
            finding.ai_diagnosis = result["text"]
            finding.confidence = result["confidence"]
        except Exception as exc:  # noqa: BLE001 — degrade gracefully, never break the pipeline
            finding.ai_diagnosis = f"AI diagnosis unavailable: {exc}"
            finding.confidence = None
        if on_each:
            on_each(finding)
    return findings


def _findings_brief(findings: list[Finding]) -> str:
    brief = [{"rule_id": f.rule_id, "title": f.title, "severity": f.severity, "affected_devices": f.affected_devices} for f in findings]
    return json.dumps(brief)


async def summarize(findings: list[Finding]) -> str:
    resp = await _complete_with_retry(
        model=_model(),
        messages=[
            {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
            {"role": "user", "content": _findings_brief(findings)},
        ],
        max_tokens=300,
        temperature=0.3,
    )
    await asyncio.sleep(_CALL_DELAY_SECONDS)
    return _strip_markdown((resp.choices[0].message.content or "").strip()).strip()


def _topology_summary(topology: Topology) -> str:
    devices = [f"{d.name} ({d.type})" for d in topology.devices]
    link_map = [f"{next((x.name for x in topology.devices if x.id == l.source_device), l.source_device)} <-> {next((x.name for x in topology.devices if x.id == l.target_device), l.target_device)}" for l in topology.links]
    return json.dumps({"devices": devices, "links": link_map})


async def chat(message: str, topology: Topology, findings: list[Finding], history: list[dict[str, str]] | None = None) -> dict:
    system_prompt = VEMO_SYSTEM_PROMPT_TEMPLATE.format(
        topology_summary=_topology_summary(topology),
        findings_summary=_findings_brief(findings),
    )
    messages = [{"role": "system", "content": system_prompt}]
    for turn in history or []:
        messages.append(turn)
    messages.append({"role": "user", "content": message})

    resp = await _complete_with_retry(model=_model(), messages=messages, max_tokens=400, temperature=0.4)
    text = resp.choices[0].message.content or ""
    cleaned, confidence = _extract_confidence(text, default=85)
    return {"response": cleaned, "confidence": confidence}
