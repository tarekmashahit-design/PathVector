"""Run: python tests/test_config_analyzer.py (from the server/ directory)."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.schemas import Topology
from services import config_analyzer, health_score

FIXTURE = Path(__file__).parent / "fixtures" / "sample_topology.json"

EXPECTED_RULE_IDS = {"SW-001", "SW-002", "SEC-002", "SEC-003", "RT-001", "INF-002"}


def main() -> None:
    data = json.loads(FIXTURE.read_text())
    topology = Topology.model_validate(data)
    assert len(topology.devices) == 6, f"expected 6 devices, got {len(topology.devices)}"
    assert len(topology.links) == 8, f"expected 8 links, got {len(topology.links)}"

    findings = config_analyzer.analyze(topology)
    found_ids = {f.rule_id for f in findings}

    missing = EXPECTED_RULE_IDS - found_ids
    assert not missing, f"missing expected findings: {missing}. Got: {sorted(found_ids)}"

    scores = health_score.calculate(findings)
    assert 0 <= scores.overall <= 100

    print(f"OK — {len(findings)} findings, rule_ids={sorted(found_ids)}")
    print(f"Scores: overall={scores.overall} switching={scores.switching} routing={scores.routing} security={scores.security} infrastructure={scores.infrastructure}")
    for f in findings:
        print(f"  [{f.severity:>8}] {f.rule_id} {f.title} -> {f.affected_devices}")


if __name__ == "__main__":
    main()
