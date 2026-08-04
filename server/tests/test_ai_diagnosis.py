"""Run: python tests/test_ai_diagnosis.py (from the server/ directory).
Makes REAL calls to the NVIDIA NIM API — requires NVIDIA_NIM_API_KEY in .env.
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from models.schemas import Topology
from services import ai_diagnosis, config_analyzer

FIXTURE = Path(__file__).parent / "fixtures" / "sample_topology.json"


async def main() -> None:
    topology = Topology.model_validate(json.loads(FIXTURE.read_text()))
    findings = config_analyzer.analyze(topology)

    top_finding = findings[0]
    print(f"Diagnosing: {top_finding.rule_id} {top_finding.title}...")
    result = await ai_diagnosis.diagnose_finding(top_finding)
    assert result["text"], "expected non-empty diagnosis text"
    assert 0 <= result["confidence"] <= 100
    print(f"  confidence={result['confidence']}%")
    print(f"  text: {result['text'][:300]}")

    print("\nSummarizing all findings...")
    summary = await ai_diagnosis.summarize(findings)
    assert summary
    print(f"  summary: {summary[:400]}")

    print("\nAsking Vemo a contextual question...")
    chat_result = await ai_diagnosis.chat("What is the biggest risk in this network?", topology, findings)
    assert chat_result["response"]
    print(f"  confidence={chat_result['confidence']}%")
    print(f"  response: {chat_result['response'][:400]}")

    print("\nOK — all AI diagnosis calls succeeded")


if __name__ == "__main__":
    asyncio.run(main())
