"""Run: python tests/test_gns3_parser.py (from the server/ directory)."""
import io
import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.gns3_parser import ParseError, parse

NODE_A = "11111111-1111-1111-1111-111111111111"
NODE_B = "22222222-2222-2222-2222-222222222222"

GNS3_JSON = {
    "topology": {
        "nodes": [
            {"node_id": NODE_A, "name": "SW-CORE-01", "node_type": "ethernet_switch", "x": 100, "y": 200, "ports": [{"name": "Ethernet0/0", "adapter_number": 0, "port_number": 0}]},
            {"node_id": NODE_B, "name": "RTR-GW-01", "node_type": "dynamips", "x": 300, "y": 100, "properties": {"platform": "c7200"}, "ports": [{"name": "Ethernet0/0", "adapter_number": 0, "port_number": 0}]},
        ],
        "links": [
            {"nodes": [{"node_id": NODE_A, "adapter_number": 0, "port_number": 0}, {"node_id": NODE_B, "adapter_number": 0, "port_number": 0}]}
        ],
    }
}


def main() -> None:
    # Bare .gns3 JSON, no configs available.
    topology = parse(json.dumps(GNS3_JSON).encode("utf-8"), "lab.gns3")
    assert len(topology.devices) == 2
    assert len(topology.links) == 1
    assert any("Configuration files not found" in w for w in topology.warnings)
    by_name = {d.name: d for d in topology.devices}
    assert by_name["SW-CORE-01"].type == "Switch"
    assert by_name["RTR-GW-01"].type == "Router"
    print("OK — bare .gns3 JSON parsed with expected no-config warning")

    # Full project .zip with a startup-config for the switch.
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("lab.gns3", json.dumps(GNS3_JSON))
        zf.writestr(
            f"project-files/ethernet_switch/{NODE_A}/configs/i1_startup-config.cfg",
            "hostname SW-CORE-01\n!\ninterface Ethernet0/0\n switchport mode trunk\n switchport trunk encapsulation dot1q\n!\nend",
        )
    topology2 = parse(buf.getvalue(), "lab-project.zip")
    assert not topology2.warnings, f"expected no warnings, got {topology2.warnings}"
    sw = next(d for d in topology2.devices if d.name == "SW-CORE-01")
    assert "hostname SW-CORE-01" in sw.config
    iface = next(i for i in sw.interfaces if i.name == "Ethernet0/0")
    assert "switchport mode trunk" in iface.config_lines
    print("OK — project .zip parsed with configs attached to the correct node")

    try:
        parse(b"{not valid json", "broken.gns3")
        raise SystemExit("expected ParseError for invalid JSON, got none")
    except ParseError as e:
        print(f"OK — invalid JSON correctly raised ParseError: {e}")


if __name__ == "__main__":
    main()
