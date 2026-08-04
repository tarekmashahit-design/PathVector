"""Run: python tests/test_integration_e2e.py (server must already be running on :8000).
Builds a synthetic 6-device .pkt file (same deliberate misconfigs as
fixtures/sample_topology.json), uploads it, streams the SSE analysis, and
cross-checks every REST endpoint against the final state.
"""
import io
import json
import sys
import time
import zipfile
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

BASE = "http://127.0.0.1:8000"
FIXTURE = Path(__file__).parent / "fixtures" / "sample_topology.json"


def build_pkt_from_fixture() -> bytes:
    data = json.loads(FIXTURE.read_text())
    dev_xml = []
    for d in data["devices"]:
        ports_xml = "".join(f'<PORT name="{i["name"]}" status="{i["status"]}"/>' for i in d["interfaces"])
        config_escaped = d["config"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        dev_xml.append(
            f'<DEVICE id="{d["id"]}"><SAVE_REF_NAME>{d["name"]}</SAVE_REF_NAME><TYPE>{d["type"]}</TYPE>'
            f'<MODEL>{d["model"]}</MODEL><POSITION x="{d["position"]["x"]}" y="{d["position"]["y"]}"/>'
            f"<ENGINE><CONFIG>{config_escaped}</CONFIG></ENGINE><PORTS>{ports_xml}</PORTS></DEVICE>"
        )
    link_xml = []
    for l in data["links"]:
        link_xml.append(
            "<CONNECTION><CABLE>"
            f'<PORT device="{l["source_device"]}" name="{l["source_interface"]}"/>'
            f'<PORT device="{l["target_device"]}" name="{l["target_interface"]}"/>'
            "</CABLE></CONNECTION>"
        )
    xml = (
        '<?xml version="1.0"?><PACKETTRACER5><NETWORK><DEVICES>'
        + "".join(dev_xml)
        + "</DEVICES><CONNECTIONS>"
        + "".join(link_xml)
        + "</CONNECTIONS></NETWORK></PACKETTRACER5>"
    )
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("topology.xml", xml)
    return buf.getvalue()


def main() -> None:
    pkt_bytes = build_pkt_from_fixture()

    with httpx.Client(timeout=30) as client:
        resp = client.post(f"{BASE}/api/demo/upload", files={"file": ("lab.pkt", pkt_bytes, "application/octet-stream")})
        resp.raise_for_status()
        session_id = resp.json()["session_id"]
        print(f"OK — uploaded, session_id={session_id}")

    events_seen = []
    ai_diagnosed_count = 0
    complete_payload = None

    with httpx.Client(timeout=60) as client:
        with client.stream("GET", f"{BASE}/api/demo/{session_id}/stream") as resp:
            event_name = None
            for line in resp.iter_lines():
                if line.startswith("event:"):
                    event_name = line.split(":", 1)[1].strip()
                elif line.startswith("data:"):
                    payload = json.loads(line.split(":", 1)[1].strip())
                    if event_name == "ping":
                        continue
                    events_seen.append(event_name)
                    if event_name == "ai_diagnosed":
                        ai_diagnosed_count += 1
                    if event_name == "parsed":
                        print(f"  [parsed] {payload['message']}")
                    if event_name == "analyzed":
                        print(f"  [analyzed] {payload['message']}")
                    if event_name == "scored":
                        print(f"  [scored] {payload['message']}")
                    if event_name == "complete":
                        complete_payload = payload
                        print(f"  [complete] score={payload['scores']['overall']} findings={len(payload['findings'])}")
                        break
                    if event_name == "error":
                        raise SystemExit(f"analysis errored: {payload}")

    assert "parsed" in events_seen
    assert "analyzed" in events_seen
    assert "scored" in events_seen
    assert ai_diagnosed_count >= 1, "expected at least one ai_diagnosed event"
    assert complete_payload is not None

    found_rule_ids = {f["rule_id"] for f in complete_payload["findings"]}
    expected = {"SW-001", "SW-002", "SEC-002", "SEC-003", "RT-001", "INF-002"}
    missing = expected - found_rule_ids
    assert not missing, f"missing expected findings via full HTTP pipeline: {missing}"
    print(f"OK — SSE stream delivered all phases, rule_ids={sorted(found_rule_ids)}")

    for f in complete_payload["findings"]:
        assert f.get("ai_diagnosis"), f"finding {f['rule_id']} has no ai_diagnosis"
    print("OK — every finding has an AI diagnosis attached")

    # Cross-check REST endpoints against the streamed final state.
    with httpx.Client(timeout=30) as client:
        topo = client.get(f"{BASE}/api/demo/{session_id}/topology").json()
        assert len(topo["devices"]) == 6

        findings = client.get(f"{BASE}/api/demo/{session_id}/findings").json()
        assert len(findings) == len(complete_payload["findings"])

        scores = client.get(f"{BASE}/api/demo/{session_id}/scores").json()
        assert scores["overall"] == complete_payload["scores"]["overall"]

        summary = client.get(f"{BASE}/api/demo/{session_id}/summary").json()
        assert summary["summary"]
        print(f"OK — REST endpoints consistent. Summary: {summary['summary'][:200]}")

        rtr_device_id = next(d["id"] for d in topo["devices"] if d["name"] == "RTR-GW-01")
        device_detail = client.get(f"{BASE}/api/demo/{session_id}/device/{rtr_device_id}").json()
        assert device_detail["device"]["name"] == "RTR-GW-01"
        assert any(f["rule_id"] == "RT-001" for f in device_detail["findings"])
        print("OK — device detail endpoint returns device-specific findings")

        vemo_resp = client.post(f"{BASE}/api/demo/{session_id}/vemo", json={"message": "What is the biggest risk?"}).json()
        assert vemo_resp["response"]
        print(f"OK — Vemo endpoint responded: {vemo_resp['response'][:200]}")

    print("\nALL INTEGRATION CHECKS PASSED")


if __name__ == "__main__":
    main()
