"""Run: python tests/test_live_parser.py (from the server/ directory).

No live switch available in this environment, so these tests run the
parsers against representative real Cisco IOS show-command output instead
(the same style of validation pkt_parser.py got before a real .pkt file
was available) — every regex is checked against text shaped like what a
2960/2900-series switch actually prints.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services import live_builder, live_parser

SHOW_VERSION = """Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE11, RELEASE SOFTWARE (fc3)
Technical Support: http://www.cisco.com/techsupport
Copyright (c) 1986-2017 by Cisco Systems, Inc.
Compiled Mon 10-Jul-17 13:34 by prod_rel_team

ROM: Bootstrap program is C2960 boot loader

SWITCH uptime is 3 weeks, 2 days, 4 hours, 12 minutes
System returned to ROM by power-on
System restarted at 09:14:22 UTC Mon Jan 1 2024
System image file is "flash:c2960-lanbasek9-mz.150-2.SE11.bin"

cisco WS-C2960-24TT-L (PowerPC405) processor (revision B0) with 65536K bytes of memory.
Processor board ID FOC1234X5YZ
Last reset from power-on
1 Virtual Ethernet interface
24 FastEthernet interfaces
2 Gigabit Ethernet interfaces
The password-recovery mechanism is enabled.

64K bytes of flash-simulated non-volatile configuration memory.
Base ethernet MAC Address       : 00:1A:2B:3C:4D:5E
Model number             : WS-C2960-24TT-L
System serial number     : FOC1234X5YZ
"""

SHOW_IP_INT_BRIEF = """Interface              IP-Address      OK? Method Status                Protocol
Vlan1                  10.0.0.2        YES NVRAM  up                    up
FastEthernet0/1        unassigned      YES unset  up                    up
FastEthernet0/2        unassigned      YES unset  down                  down
GigabitEthernet0/1     unassigned      YES unset  up                    up
"""

SHOW_INTERFACES = """FastEthernet0/1 is up, line protocol is up (connected)
  Hardware is Fast Ethernet, address is 001a.2b3c.4d01 (bia 001a.2b3c.4d01)
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
     reliability 255/255, txload 1/255, rxload 1/255
  Encapsulation ARPA, loopback not set
  Full-duplex, 100Mb/s, media type is 10/100BaseTX
  input flow-control is off, output flow-control is unsupported
     5 minute input rate 128000 bits/sec, 40 packets/sec
     5 minute output rate 64000 bits/sec, 30 packets/sec
     10921 packets input, 3821921 bytes
     0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored
     8213 packets output, 2921813 bytes
     0 output errors, 0 collisions, 0 interface resets
FastEthernet0/2 is down, line protocol is down (notconnect)
  Hardware is Fast Ethernet, address is 001a.2b3c.4d02 (bia 001a.2b3c.4d02)
  MTU 1500 bytes, BW 100000 Kbit/sec, DLY 100 usec,
     reliability 255/255, txload 1/255, rxload 1/255
  Full-duplex, 100Mb/s, media type is 10/100BaseTX
     5 minute input rate 0 bits/sec, 0 packets/sec
     5 minute output rate 0 bits/sec, 0 packets/sec
     0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored
     0 output errors, 0 collisions, 0 interface resets
GigabitEthernet0/1 is up, line protocol is up (connected)
  Hardware is Gigabit Ethernet, address is 001a.2b3c.4d03 (bia 001a.2b3c.4d03)
  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec,
  Full-duplex, 1000Mb/s, media type is 10/100/1000BaseTX
     5 minute input rate 512000 bits/sec, 300 packets/sec
     5 minute output rate 256000 bits/sec, 200 packets/sec
     42 input errors, 12 CRC, 30 frame, 0 overrun, 0 ignored
     0 output errors, 0 collisions, 0 interface resets
"""

SHOW_VLAN_BRIEF = """VLAN Name                             Status    Ports
---- -------------------------------- --------- -------------------------------
1    default                          active    Gi0/1
10   Data                             active    Fa0/1
20   Voice                            active    Fa0/2
"""

SHOW_CDP_NEIGHBORS_DETAIL = """-------------------------
Device ID: RTR-EDGE-01.local
Entry address(es):
  IP address: 10.0.0.1
Platform: cisco ISR4331/K9,  Capabilities: Router Switch IGMP
Interface: GigabitEthernet0/1,  Port ID (outgoing port): GigabitEthernet0/0/0
Version :
Cisco IOS Software [Fuji], ISR Software (X86_64_LINUX_IOSD-UNIVERSALK9-M), Version 16.9.4
advertisement version: 2
-------------------------
"""

SHOW_RUNNING_CONFIG = """Building configuration...

Current configuration : 1284 bytes
!
version 15.0
hostname SW-TEST-01
!
"""

SHOW_CPU = """CPU utilization for five seconds: 12%/0%; one minute: 10%; five minutes: 9%
"""

SHOW_MEMORY = """                Head    Total(b)     Used(b)     Free(b)   Lowest(b)  Largest(b)
Processor   2C4B7A0    58720256    22136544    36583712    36000000    36000000
"""


def main() -> None:
    version = live_parser.parse_version(SHOW_VERSION)
    assert version["model"] == "WS-C2960-24TT-L", version
    assert version["serial"] == "FOC1234X5YZ", version
    assert "15.0(2)SE11" in version["firmware"], version
    assert "3 weeks" in version["uptime"], version
    print("OK — parsed show version")

    ip_brief = live_parser.parse_ip_interface_brief(SHOW_IP_INT_BRIEF)
    assert len(ip_brief) == 4
    assert ip_brief[0]["ip"] == "10.0.0.2" and ip_brief[0]["status"] == "up"
    assert ip_brief[2]["status"] == "down"
    print("OK — parsed show ip interface brief")

    interfaces = live_parser.parse_interfaces(SHOW_INTERFACES)
    assert interfaces["FastEthernet0/1"]["status"] == "up"
    assert interfaces["FastEthernet0/2"]["status"] == "down"
    assert interfaces["GigabitEthernet0/1"]["errors"] == 42
    assert interfaces["FastEthernet0/1"]["inTraffic"] == "128 Kb/s"
    print("OK — parsed show interfaces:", {k: v["status"] for k, v in interfaces.items()})

    vlan_map = live_parser.parse_vlan_brief(SHOW_VLAN_BRIEF)
    assert vlan_map["Fa0/1"] == "10"
    assert vlan_map["Fa0/2"] == "20"
    assert vlan_map["Gi0/1"] == "1"
    print("OK — parsed show vlan brief:", vlan_map)

    neighbors = live_parser.parse_cdp_neighbors_detail(SHOW_CDP_NEIGHBORS_DETAIL)
    assert len(neighbors) == 1
    assert neighbors[0]["device_id"] == "RTR-EDGE-01.local"
    assert neighbors[0]["ip"] == "10.0.0.1"
    assert "Router" in neighbors[0]["capabilities"]
    print("OK — parsed show cdp neighbors detail:", neighbors)

    hostname = live_parser.hostname_from_config(SHOW_RUNNING_CONFIG)
    assert hostname == "SW-TEST-01"
    print("OK — parsed hostname from running-config")

    cpu = live_parser.parse_cpu_percent(SHOW_CPU)
    assert cpu == 12, cpu
    mem = live_parser.parse_memory_percent(SHOW_MEMORY)
    assert 30 <= mem <= 40, mem
    print(f"OK — parsed cpu={cpu}% mem={mem}%")

    # End-to-end: build a frontend-shaped Device from the raw outputs.
    raw = {
        "version": SHOW_VERSION,
        "ip_interface_brief": SHOW_IP_INT_BRIEF,
        "interfaces": SHOW_INTERFACES,
        "vlan_brief": SHOW_VLAN_BRIEF,
        "cdp_neighbors_detail": SHOW_CDP_NEIGHBORS_DETAIL,
        "running_config": SHOW_RUNNING_CONFIG,
        "cpu": SHOW_CPU,
        "memory": SHOW_MEMORY,
        "_connect_ip": "10.0.0.2",
    }
    device = live_builder.build_switch_device(raw, previous_config=None, actor="admin")
    assert device["id"] == "SW-TEST-01"
    assert device["ip"] == "10.0.0.2"
    assert device["model"] == "WS-C2960-24TT-L"
    assert device["cpu"] == 12
    assert len(device["interfaces"]) == 3
    fa1 = next(i for i in device["interfaces"] if i["port"] == "FastEthernet0/1")
    assert fa1["vlan"] == "10", fa1
    assert device["status"] == "warning"  # Gi0/1 has 42 errors
    print("OK — built full Device object matching frontend schema:", device["id"], device["status"])

    neighbor_devices = live_builder.build_neighbor_devices(neighbors)
    assert neighbor_devices[0]["type"] == "router"
    topology = live_builder.build_topology(device, neighbor_devices, neighbors)
    assert len(topology["nodes"]) == 2
    assert len(topology["edges"]) == 1
    print("OK — built topology:", [n["id"] for n in topology["nodes"]])

    alerts = live_builder.build_alerts(device)
    assert any("Gi0/1" in a["message"] or "GigabitEthernet0/1" in a["message"] for a in alerts)
    print("OK — built alerts from live interface state:", [a["message"] for a in alerts])

    stats = live_builder.build_dashboard_stats(device, neighbor_devices, alerts)
    assert stats["totalDevices"] == 2
    print("OK — built dashboard stats:", stats)


if __name__ == "__main__":
    main()
