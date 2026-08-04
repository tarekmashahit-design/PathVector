"""Run: python tests/test_pkt_parser.py (from the server/ directory).

Builds a synthetic .pkt-shaped ZIP+XML fixture in memory (real Packet Tracer
exports follow this structure for versions that use plain-ZIP storage) and
verifies the parser extracts devices, configs, and links correctly. Also
verifies that a corrupted/unsupported file produces a clean ParseError
instead of crashing.
"""
import io
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.pkt_parser import ParseError, parse

SAMPLE_XML = """<?xml version="1.0"?>
<PACKETTRACER5>
  <NETWORK>
    <DEVICES>
      <DEVICE id="d1">
        <SAVE_REF_NAME>SW-CORE-01</SAVE_REF_NAME>
        <TYPE>Switch</TYPE>
        <MODEL>2960</MODEL>
        <POSITION x="100" y="200"/>
        <ENGINE>
          <CONFIG>hostname SW-CORE-01
!
interface GigabitEthernet0/1
 switchport mode trunk
 switchport trunk encapsulation dot1q
!
end</CONFIG>
        </ENGINE>
        <PORTS>
          <PORT name="GigabitEthernet0/1" status="up"/>
        </PORTS>
      </DEVICE>
      <DEVICE id="d2">
        <SAVE_REF_NAME>RTR-GW-01</SAVE_REF_NAME>
        <TYPE>Router</TYPE>
        <MODEL>2911</MODEL>
        <POSITION x="300" y="100"/>
        <ENGINE>
          <CONFIG>hostname RTR-GW-01
!
interface GigabitEthernet0/0
 ip address 10.0.0.1 255.255.255.0
!
end</CONFIG>
        </ENGINE>
        <PORTS>
          <PORT name="GigabitEthernet0/0" status="up"/>
        </PORTS>
      </DEVICE>
    </DEVICES>
    <CONNECTIONS>
      <CONNECTION>
        <CABLE>
          <PORT device="d1" name="GigabitEthernet0/1"/>
          <PORT device="d2" name="GigabitEthernet0/0"/>
        </CABLE>
      </CONNECTION>
    </CONNECTIONS>
  </NETWORK>
</PACKETTRACER5>
"""


def build_fixture_pkt() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("topology.xml", SAMPLE_XML)
    return buf.getvalue()


def main() -> None:
    topology = parse(build_fixture_pkt())
    assert len(topology.devices) == 2, f"expected 2 devices, got {len(topology.devices)}"
    assert len(topology.links) == 1, f"expected 1 link, got {len(topology.links)}"

    by_name = {d.name: d for d in topology.devices}
    assert "SW-CORE-01" in by_name and "RTR-GW-01" in by_name
    sw = by_name["SW-CORE-01"]
    assert sw.type == "Switch"
    assert "hostname SW-CORE-01" in sw.config
    assert len(sw.interfaces) == 1
    assert "switchport mode trunk" in sw.interfaces[0].config_lines

    link = topology.links[0]
    assert link.source_device == "d1" and link.target_device == "d2"

    print(f"OK — parsed {len(topology.devices)} devices, {len(topology.links)} links from synthetic .pkt")

    # Corrupted file should raise a clean ParseError, not crash.
    try:
        parse(b"not a zip file at all")
        raise SystemExit("expected ParseError for corrupted input, got none")
    except ParseError as e:
        print(f"OK — corrupted file correctly raised ParseError: {e}")


if __name__ == "__main__":
    main()
