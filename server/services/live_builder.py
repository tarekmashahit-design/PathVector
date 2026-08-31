"""Builds frontend-shaped dashboard/topology/device JSON from parsed live
Cisco IOS data.

Every field name below matches the TypeScript interfaces in the existing
frontend exactly (src/data/devices.ts, topology.ts, metrics.ts, alerts.ts) —
camelCase, same keys, same nesting — so a future frontend swap-in needs no
schema translation. The frontend itself is not touched by this backend.
"""
from __future__ import annotations

import difflib
import time

from services import live_parser

_CAP_TYPE_MAP = [
    ("Router", "router"),
    ("Switch", "access-switch"),
    ("IGMP", "access-switch"),
    ("Trans-Bridge", "endpoint"),
    ("Host", "endpoint"),
    ("Phone", "endpoint"),
]


def _neighbor_type(capabilities: str) -> str:
    for token, dtype in _CAP_TYPE_MAP:
        if token.lower() in (capabilities or "").lower():
            return dtype
    return "endpoint"


def _interface_rows(interfaces: dict[str, dict], vlan_map: dict[str, str]) -> list[dict]:
    rows = []
    for iface, data in interfaces.items():
        rows.append(
            {
                "port": iface,
                "status": data["status"],
                "speed": data["speed"],
                "vlan": vlan_map.get(live_parser._normalize_iface(iface), "—"),
                "inTraffic": data["inTraffic"],
                "outTraffic": data["outTraffic"],
                "errors": data["errors"],
            }
        )
    return rows


def _device_status(interfaces: list[dict], reachable: bool) -> str:
    if not reachable:
        return "offline"
    if any(row["errors"] > 100 for row in interfaces):
        return "critical"
    if any(row["errors"] > 0 for row in interfaces):
        return "warning"
    return "healthy"


def _config_diff(session_id: str, running_config: str, previous_config: str | None, actor: str) -> dict:
    if not previous_config:
        return {"added": [], "removed": [], "changedBy": actor, "daysAgo": 0}
    diff = list(difflib.unified_diff(previous_config.splitlines(), running_config.splitlines(), lineterm=""))
    added = [l[1:].strip() for l in diff if l.startswith("+") and not l.startswith("+++")]
    removed = [l[1:].strip() for l in diff if l.startswith("-") and not l.startswith("---")]
    return {"added": added[:20], "removed": removed[:20], "changedBy": actor, "daysAgo": 0}


def build_switch_device(raw: dict, previous_config: str | None, actor: str) -> dict:
    version = live_parser.parse_version(raw.get("version", ""))
    hostname = live_parser.hostname_from_config(raw.get("running_config", "")) or "SWITCH"
    interfaces_raw = live_parser.parse_interfaces(raw.get("interfaces", ""))
    vlan_map = live_parser.parse_vlan_brief(raw.get("vlan_brief", ""))
    ip_brief = live_parser.parse_ip_interface_brief(raw.get("ip_interface_brief", ""))
    mgmt_ip = next((r["ip"] for r in ip_brief if r["ip"] not in ("unassigned",)), raw.get("_connect_ip", ""))
    cpu = live_parser.parse_cpu_percent(raw.get("cpu", ""))
    mem = live_parser.parse_memory_percent(raw.get("memory", ""))

    interfaces = _interface_rows(interfaces_raw, vlan_map)
    status = _device_status(interfaces, reachable=True)
    total_alerts = sum(1 for r in interfaces if r["errors"] > 0) + sum(1 for r in interfaces if r["status"] == "down")

    # A single live poll gives one data point, not 24h of history — rather
    # than fabricate a trend, every history array is the current reading
    # repeated. Honest about what a one-shot connect can actually know.
    cpu_history = [cpu] * 24
    mem_history = [mem] * 24
    throughput_history = [_dominant_throughput(interfaces)] * 24

    return {
        "id": hostname,
        "name": hostname,
        "type": "access-switch",
        "status": status,
        "ip": mgmt_ip or "unknown",
        "model": version["model"] or "unknown",
        "vendor": "Cisco",
        "firmware": version["firmware"] or "unknown",
        "serial": version["serial"] or "unknown",
        "mac": "",
        "location": "Live connection",
        "vlan": next(iter(vlan_map.values()), "1"),
        "uptime": version["uptime"] or "unknown",
        "cpu": cpu,
        "mem": mem,
        "alerts": total_alerts,
        "cpuHistory": cpu_history,
        "memHistory": mem_history,
        "throughputHistory": throughput_history,
        "interfaces": interfaces,
        "configDiff": _config_diff("live", raw.get("running_config", ""), previous_config, "netmiko@live"),
    }


def _dominant_throughput(interfaces: list[dict]) -> int:
    def to_mbps(s: str) -> float:
        try:
            if "Gb/s" in s:
                return float(s.split()[0]) * 1000
            if "Mb/s" in s:
                return float(s.split()[0])
            if "Kb/s" in s:
                return float(s.split()[0]) / 1000
        except (ValueError, IndexError):
            return 0.0
        return 0.0

    best = 0.0
    for row in interfaces:
        best = max(best, to_mbps(row["inTraffic"]), to_mbps(row["outTraffic"]))
    return round(best)


def build_neighbor_devices(neighbors: list[dict]) -> list[dict]:
    devices = []
    for n in neighbors:
        devices.append(
            {
                "id": n["device_id"],
                "name": n["device_id"],
                "type": _neighbor_type(n["capabilities"]),
                "status": "healthy",
                "ip": n["ip"] or "unknown",
                "model": n["platform"] or "unknown",
                "vendor": "Cisco" if "cisco" in (n["platform"] or "").lower() else "Cisco",
                "firmware": n["version"] or "unknown",
                "serial": "unknown",
                "mac": "",
                "location": "CDP neighbor",
                "vlan": "—",
                "uptime": "unknown",
                "cpu": 0,
                "mem": 0,
                "alerts": 0,
                "cpuHistory": [0] * 24,
                "memHistory": [0] * 24,
                "throughputHistory": [0] * 24,
                "interfaces": [
                    {
                        "port": n["remote_interface"] or "unknown",
                        "status": "up",
                        "speed": "—",
                        "vlan": "—",
                        "inTraffic": "—",
                        "outTraffic": "—",
                        "errors": 0,
                    }
                ],
                "configDiff": {"added": [], "removed": [], "changedBy": "unknown", "daysAgo": 0},
            }
        )
    return devices


def build_topology(switch_device: dict, neighbor_devices: list[dict], neighbors_raw: list[dict]) -> dict:
    nodes = [
        {
            "id": switch_device["id"],
            "label": switch_device["name"],
            "type": switch_device["type"],
            "status": switch_device["status"],
            "floor": 0,
            "x": 500,
            "y": 120,
            "ip": switch_device["ip"],
            "model": switch_device["model"],
            "cpu": switch_device["cpu"],
            "mem": switch_device["mem"],
            "uptime": switch_device["uptime"],
            "alerts": switch_device["alerts"],
        }
    ]
    edges = []
    ring_count = max(len(neighbor_devices), 1)
    for i, (dev, raw) in enumerate(zip(neighbor_devices, neighbors_raw)):
        angle_x = 200 + (800 * i / max(ring_count - 1, 1)) if ring_count > 1 else 500
        nodes.append(
            {
                "id": dev["id"],
                "label": dev["name"],
                "type": dev["type"],
                "status": dev["status"],
                "floor": 0,
                "x": angle_x,
                "y": 360,
                "ip": dev["ip"],
                "model": dev["model"],
                "cpu": dev["cpu"],
                "mem": dev["mem"],
                "uptime": dev["uptime"],
                "alerts": dev["alerts"],
            }
        )
        edges.append(
            {
                "id": f"live-{i}",
                "source": switch_device["id"],
                "target": dev["id"],
                "status": "healthy",
                "bandwidth": 3,
            }
        )
    return {"nodes": nodes, "edges": edges}


def build_alerts(switch_device: dict) -> list[dict]:
    """Rule-based, from real interface state — same spirit as the demo
    mode's config_analyzer, just against live counters instead of a
    parsed config file."""
    alerts = []
    now = time.time()
    for row in switch_device["interfaces"]:
        if row["status"] == "down":
            alerts.append(
                {
                    "id": f"LIVE-{row['port']}-down",
                    "severity": "critical",
                    "message": f"Interface `{row['port']}` on `{switch_device['name']}` is down",
                    "devices": [switch_device["name"]],
                    "confidence": 100,
                    "timestamp": _iso(now),
                }
            )
        elif row["errors"] > 0:
            alerts.append(
                {
                    "id": f"LIVE-{row['port']}-errors",
                    "severity": "warning" if row["errors"] < 100 else "critical",
                    "message": f"Interface `{row['port']}` on `{switch_device['name']}` reporting {row['errors']} errors",
                    "devices": [switch_device["name"]],
                    "confidence": 100,
                    "timestamp": _iso(now),
                }
            )
    if switch_device["cpu"] >= 80:
        alerts.append(
            {
                "id": f"LIVE-{switch_device['name']}-cpu",
                "severity": "warning",
                "message": f"CPU on `{switch_device['name']}` at {switch_device['cpu']}%",
                "devices": [switch_device["name"]],
                "confidence": 100,
                "timestamp": _iso(now),
            }
        )
    return alerts


def _iso(epoch: float) -> str:
    import datetime

    return datetime.datetime.utcfromtimestamp(epoch).isoformat() + "Z"


def build_dashboard_stats(switch_device: dict, neighbor_devices: list[dict], alerts: list[dict]) -> dict:
    total_devices = 1 + len(neighbor_devices)
    critical_or_warning = sum(1 for d in [switch_device, *neighbor_devices] if d["status"] in ("warning", "critical"))
    health_score = max(0, 100 - critical_or_warning * 15 - len(alerts) * 5)
    avg_latency = 0.0  # not derivable from these six commands without ICMP probing

    return {
        "healthScore": health_score,
        "healthTrend": 0,
        "totalDevices": total_devices,
        "activeAlerts": len(alerts),
        "uptime": 100.0 if switch_device["status"] != "offline" else 0.0,
        "avgLatency": avg_latency,
    }
