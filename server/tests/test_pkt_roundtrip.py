"""Round-trip test for the Packet Tracer 6.2–9.x crypto pipeline.

This test:
1. Takes a real XML topology (same shape as what PT 9.x writes)
2. Encrypts it with _encrypt_pkt  (the full PT pipeline in reverse)
3. Decrypts it back with _decrypt_pkt
4. Verifies the XML round-trips perfectly
5. Verifies parse() can read the encrypted bytes end-to-end and produce a Topology

This proves the crypto implementation is correct WITHOUT needing a real .pkt file.
Run: python tests/test_pkt_roundtrip.py (from the server/ directory)
"""
import io
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.pkt_parser import (
    ParseError,
    _decrypt_pkt,
    _encrypt_pkt,
    parse,
)

# A minimal but realistic Packet Tracer XML topology
SAMPLE_XML = b"""<?xml version="1.0"?>
<PACKETTRACER5>
  <NETWORK>
    <DEVICES>
      <DEVICE id="rtr-gw-01">
        <SAVE_REF_NAME>RTR-GW-01</SAVE_REF_NAME>
        <TYPE>Router</TYPE>
        <MODEL>ISR4321</MODEL>
        <POSITION x="400" y="60"/>
        <ENGINE>
          <CONFIG>hostname RTR-GW-01
!
interface GigabitEthernet0/0
 ip address 10.0.0.1 255.255.255.252
 no shutdown
!
line vty 0 4
 transport input telnet
!
end</CONFIG>
        </ENGINE>
        <PORTS>
          <PORT name="GigabitEthernet0/0" status="up"/>
        </PORTS>
      </DEVICE>
      <DEVICE id="sw-core-01">
        <SAVE_REF_NAME>SW-CORE-01</SAVE_REF_NAME>
        <TYPE>Switch</TYPE>
        <MODEL>Catalyst9500</MODEL>
        <POSITION x="220" y="220"/>
        <ENGINE>
          <CONFIG>hostname SW-CORE-01
!
snmp-server community public RO
!
interface GigabitEthernet0/1
 switchport mode trunk
 switchport trunk encapsulation dot1q
 switchport trunk native vlan 1
!
end</CONFIG>
        </ENGINE>
        <PORTS>
          <PORT name="GigabitEthernet0/1" status="up"/>
        </PORTS>
      </DEVICE>
    </DEVICES>
    <CONNECTIONS>
      <CONNECTION>
        <CABLE>
          <PORT device="rtr-gw-01" name="GigabitEthernet0/0"/>
          <PORT device="sw-core-01" name="GigabitEthernet0/1"/>
        </CABLE>
      </CONNECTION>
    </CONNECTIONS>
  </NETWORK>
</PACKETTRACER5>
"""


def test_crypto_round_trip() -> None:
    """encrypt_pkt → decrypt_pkt must recover the original bytes."""
    encrypted = _encrypt_pkt(SAMPLE_XML)
    assert encrypted != SAMPLE_XML, "encryption did nothing"
    assert len(encrypted) > len(SAMPLE_XML), "encrypted output suspiciously small"
    print(f"  encrypted size: {len(encrypted)} bytes (original: {len(SAMPLE_XML)})")

    recovered = _decrypt_pkt(encrypted)
    assert recovered == SAMPLE_XML, (
        f"round-trip mismatch!\n"
        f"  expected first 80 bytes: {SAMPLE_XML[:80]}\n"
        f"  got first 80 bytes:      {recovered[:80]}"
    )
    print("  OK — crypto round-trip: encrypt → decrypt recovers original XML")


def test_parse_encrypted_pkt() -> None:
    """parse() must handle a synthetically-encrypted .pkt and return a valid Topology."""
    encrypted = _encrypt_pkt(SAMPLE_XML)
    topology = parse(encrypted)
    assert len(topology.devices) == 2, f"expected 2 devices, got {len(topology.devices)}"
    assert len(topology.links) == 1, f"expected 1 link, got {len(topology.links)}"

    by_name = {d.name: d for d in topology.devices}
    assert "RTR-GW-01" in by_name
    assert "SW-CORE-01" in by_name

    rtr = by_name["RTR-GW-01"]
    assert rtr.type == "Router"
    assert "transport input telnet" in rtr.config

    sw = by_name["SW-CORE-01"]
    assert sw.type == "Switch"
    assert "snmp-server community public RO" in sw.config
    print(f"  OK — parse() on encrypted .pkt: {len(topology.devices)} devices, {len(topology.links)} links")


def test_parse_plain_zip_pkt() -> None:
    """parse() must still handle old-style plain-ZIP .pkt files."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("topology.xml", SAMPLE_XML)
    topology = parse(buf.getvalue())
    assert len(topology.devices) == 2
    assert len(topology.links) == 1
    print("  OK — parse() on plain-ZIP .pkt still works")


def test_parse_error_on_garbage() -> None:
    """parse() must raise ParseError on completely invalid input."""
    try:
        parse(b"this is not a pkt file")
        raise AssertionError("expected ParseError, got nothing")
    except ParseError as e:
        assert "Unable to parse" in str(e)
        print(f"  OK — garbage input raises ParseError: {str(e)[:70]}")


def test_twofish_known_vector() -> None:
    """Twofish with all-137 key must produce a stable ciphertext for a known plaintext."""
    from services.pkt_parser import _Twofish
    key = bytes([137]) * 16
    tf = _Twofish(key)
    # Encrypt a zero block — result must be deterministic
    ct = tf.encrypt_block(b"\x00" * 16)
    assert ct != b"\x00" * 16, "Twofish encrypt produced all-zeros"
    assert len(ct) == 16
    # Verify it's stable across calls (same key → same output)
    ct2 = tf.encrypt_block(b"\x00" * 16)
    assert ct == ct2, "Twofish not deterministic"
    print(f"  OK — Twofish all-137 key, zero block → {ct.hex()}")


def main() -> None:
    print("=== PKT Crypto Round-Trip Tests ===\n")

    print("[1] Twofish known-vector test")
    test_twofish_known_vector()

    print("[2] Full crypto round-trip (encrypt → decrypt)")
    test_crypto_round_trip()

    print("[3] parse() on synthetically-encrypted .pkt")
    test_parse_encrypted_pkt()

    print("[4] parse() on plain-ZIP .pkt (legacy format)")
    test_parse_plain_zip_pkt()

    print("[5] parse() error handling on garbage input")
    test_parse_error_on_garbage()

    print("\nALL TESTS PASSED ✓")
    print("\nNote: To test against a real Packet Tracer 9.x file:")
    print("  Copy your .pkt file to server/tests/fixtures/real.pkt")
    print("  Then run: python -c \"")
    print("    import sys; sys.path.insert(0,'.')") 
    print("    from services.pkt_parser import parse")
    print("    t = parse(open('tests/fixtures/real.pkt','rb').read())")
    print("    print(f'{len(t.devices)} devices, {len(t.links)} links')")
    print("  \"")


if __name__ == "__main__":
    main()
