from __future__ import annotations

import json
from pathlib import Path

from models.schemas import Topology
from services import ai_diagnosis, config_analyzer, gns3_parser, health_score, pkt_parser, session_store
from services.gns3_parser import ParseError as Gns3ParseError
from services.pkt_parser import ParseError as PktParseError

_FIXTURE_PATH = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "sample_topology.json"


def _load_fixture() -> Topology:
    return Topology.model_validate(json.loads(_FIXTURE_PATH.read_text()))


def _parse(filename: str, file_bytes: bytes) -> tuple[Topology, str | None]:
    """Return (topology, warning_message).  warning is set when falling back to demo data."""
    lower = filename.lower()
    if lower.endswith(".pkt") or lower.endswith(".pka"):
        try:
            return pkt_parser.parse(file_bytes), None
        except PktParseError:
            # Packet Tracer 6.2+ uses a proprietary obfuscation format.
            # Fall back to the built-in demo topology so the user still
            # gets a complete analysis rather than a dead-end error screen.
            topology = _load_fixture()
            warning = (
                "This Packet Tracer file uses a proprietary format that PathVector "
                "cannot parse directly. Showing analysis of the built-in demo topology instead."
            )
            return topology, warning
    if lower.endswith(".gns3") or lower.endswith(".zip"):
        return gns3_parser.parse(file_bytes, filename), None
    raise ValueError(f"Unsupported file type: {filename}. Upload a .pkt, .gns3, or .zip file.")


async def analyze(session_id: str, file_bytes: bytes, filename: str) -> None:
    try:
        # 1. Parse (falls back to demo fixture for unsupported .pkt versions)
        topology, parse_warning = _parse(filename, file_bytes)

        # 2. Emit progress
        session_store.set_topology(session_id, topology)
        parsed_payload: dict = {
            "message": f"Parsed {len(topology.devices)} devices, {len(topology.links)} links",
            "topology": topology.model_dump(),
        }
        if parse_warning:
            parsed_payload["warning"] = parse_warning
        await session_store.emit(session_id, "parsed", parsed_payload)

        # 3. Analyze configs
        findings = config_analyzer.analyze(topology)
        session_store.set_findings(session_id, findings)

        # 4. Emit progress
        await session_store.emit(
            session_id,
            "analyzed",
            {"message": f"Found {len(findings)} issue(s)", "findings": [f.model_dump() for f in findings]},
        )

        # 5. Calculate health score
        scores = health_score.calculate(findings)
        session_store.set_scores(session_id, scores)

        # 6. Emit progress
        await session_store.emit(session_id, "scored", {"message": f"Health score: {scores.overall}", "scores": scores.model_dump()})

        # 7. AI diagnosis for each finding (sequential — NIM rate limits)
        for finding in findings:
            try:
                diagnosis = await ai_diagnosis.diagnose_finding(finding)
                finding.ai_diagnosis = diagnosis["text"]
                finding.confidence = diagnosis["confidence"]
            except Exception as exc:  # noqa: BLE001 — one bad AI call should not kill the pipeline
                finding.ai_diagnosis = f"AI diagnosis unavailable: {exc}"
                finding.confidence = None
            await session_store.emit(session_id, "ai_diagnosed", {"finding": finding.model_dump()})

        # 8. Overall AI summary
        try:
            summary = await ai_diagnosis.summarize(findings)
        except Exception as exc:  # noqa: BLE001
            summary = f"AI summary unavailable: {exc}"
        session_store.set_summary(session_id, summary)

        # 9. Emit complete
        await session_store.emit(
            session_id,
            "complete",
            {
                "topology": topology.model_dump(),
                "findings": [f.model_dump() for f in findings],
                "scores": scores.model_dump(),
                "summary": summary,
            },
        )

    except (Gns3ParseError, ValueError) as exc:
        session_store.set_error(session_id, str(exc))
        await session_store.emit(session_id, "error", {"message": str(exc)})
    except Exception as exc:  # noqa: BLE001 — never let the background task die silently
        message = f"Unexpected error during analysis: {exc}"
        session_store.set_error(session_id, message)
        await session_store.emit(session_id, "error", {"message": message})


async def analyze_fixture(session_id: str) -> None:
    """Run the full analysis pipeline directly on the built-in demo fixture.
    Used when a user wants to explore PathVector without uploading a real file,
    or when triggered via the /api/demo/fixture endpoint.
    """
    topology = _load_fixture()
    # Re-use the main pipeline but inject a fixture-specific warning
    parsed_payload: dict = {
        "message": f"Loaded demo topology: {len(topology.devices)} devices, {len(topology.links)} links",
        "topology": topology.model_dump(),
        "warning": "Showing built-in demo topology (sample_topology.json). Upload a real .pkt or .gns3 file for analysis of your own network.",
    }
    try:
        session_store.set_topology(session_id, topology)
        await session_store.emit(session_id, "parsed", parsed_payload)

        findings = config_analyzer.analyze(topology)
        session_store.set_findings(session_id, findings)
        await session_store.emit(
            session_id,
            "analyzed",
            {"message": f"Found {len(findings)} issue(s)", "findings": [f.model_dump() for f in findings]},
        )

        scores = health_score.calculate(findings)
        session_store.set_scores(session_id, scores)
        await session_store.emit(session_id, "scored", {"message": f"Health score: {scores.overall}", "scores": scores.model_dump()})

        for finding in findings:
            try:
                diagnosis = await ai_diagnosis.diagnose_finding(finding)
                finding.ai_diagnosis = diagnosis["text"]
                finding.confidence = diagnosis["confidence"]
            except Exception as exc:  # noqa: BLE001
                finding.ai_diagnosis = f"AI diagnosis unavailable: {exc}"
                finding.confidence = None
            await session_store.emit(session_id, "ai_diagnosed", {"finding": finding.model_dump()})

        try:
            summary = await ai_diagnosis.summarize(findings)
        except Exception as exc:  # noqa: BLE001
            summary = f"AI summary unavailable: {exc}"
        session_store.set_summary(session_id, summary)

        await session_store.emit(
            session_id,
            "complete",
            {
                "topology": topology.model_dump(),
                "findings": [f.model_dump() for f in findings],
                "scores": scores.model_dump(),
                "summary": summary,
            },
        )
    except Exception as exc:  # noqa: BLE001
        message = f"Unexpected error during fixture analysis: {exc}"
        session_store.set_error(session_id, message)
        await session_store.emit(session_id, "error", {"message": message})
