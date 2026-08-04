"""Rule-based misconfiguration detection engine.

Each rule inspects the parsed topology (devices + interfaces + links) and
returns zero or more Finding objects. Rules never mutate the topology.
"""
from __future__ import annotations

from models.schemas import Device, Finding, Interface, Link, Topology

SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}


# ---------- helpers ----------


def _device_by_id(topology: Topology, device_id: str) -> Device | None:
    return next((d for d in topology.devices if d.id == device_id), None)


def _iface(device: Device, name: str) -> Interface | None:
    return next((i for i in device.interfaces if i.name == name), None)


def _iface_value(iface: Interface, prefix: str) -> str | None:
    for line in iface.config_lines:
        stripped = line.strip()
        if stripped.startswith(prefix):
            return stripped[len(prefix) :].strip()
    return None


def _iface_has(iface: Interface, substr: str) -> bool:
    return any(substr in line for line in iface.config_lines)


def _is_trunk(iface: Interface) -> bool:
    return _iface_has(iface, "switchport mode trunk")


def _is_access(iface: Interface) -> bool:
    return _iface_has(iface, "switchport mode access")


def _is_dynamic(iface: Interface) -> bool:
    return _iface_has(iface, "switchport mode dynamic auto") or _iface_has(iface, "switchport mode dynamic desirable")


def _global_lines(device: Device) -> list[str]:
    """Lines in the raw config that are not nested inside an `interface` or `line` block."""
    lines: list[str] = []
    in_block = False
    for raw in device.config.splitlines():
        if not raw.strip() or raw.strip() == "!":
            in_block = False
            continue
        if not raw.startswith(" ") and not raw.startswith("\t"):
            in_block = raw.strip().startswith("interface ") or raw.strip().startswith("line ")
            if not in_block:
                lines.append(raw.strip())
        elif not in_block:
            lines.append(raw.strip())
    return lines


def _vty_lines(device: Device) -> list[str]:
    lines: list[str] = []
    in_vty = False
    for raw in device.config.splitlines():
        stripped = raw.strip()
        if stripped.startswith("line vty"):
            in_vty = True
            continue
        if in_vty:
            if stripped == "!" or not raw.startswith((" ", "\t")):
                in_vty = False
                continue
            lines.append(stripped)
    return lines


def _trunk_links(topology: Topology) -> list[tuple[Link, Device, Interface, Device, Interface]]:
    out = []
    for link in topology.links:
        a = _device_by_id(topology, link.source_device)
        b = _device_by_id(topology, link.target_device)
        if not a or not b:
            continue
        ia = _iface(a, link.source_interface)
        ib = _iface(b, link.target_interface)
        if not ia or not ib:
            continue
        if _is_trunk(ia) and _is_trunk(ib):
            out.append((link, a, ia, b, ib))
    return out


# ---------- switching rules ----------


def sw_001_trunk_encapsulation_mismatch(topology: Topology) -> list[Finding]:
    findings = []
    for link, a, ia, b, ib in _trunk_links(topology):
        enc_a = (_iface_value(ia, "switchport trunk encapsulation") or "negotiate").lower()
        enc_b = (_iface_value(ib, "switchport trunk encapsulation") or "negotiate").lower()
        if enc_a != enc_b:
            findings.append(
                Finding(
                    rule_id="SW-001",
                    severity="high",
                    category="switching",
                    title="Trunk Encapsulation Mismatch",
                    affected_devices=[a.name, b.name],
                    affected_interfaces=[ia.name, ib.name],
                    description=f"Trunk encapsulation mismatch: {a.name} {ia.name} uses {enc_a}, {b.name} {ib.name} uses {enc_b}",
                    evidence=[
                        f"{a.name} {ia.name}: switchport trunk encapsulation {enc_a}",
                        f"{b.name} {ib.name}: switchport trunk encapsulation {enc_b}",
                    ],
                    fix_commands={
                        a.name: [f"interface {ia.name}", "switchport trunk encapsulation dot1q", "switchport mode trunk"],
                        b.name: [f"interface {ib.name}", "switchport trunk encapsulation dot1q", "switchport mode trunk"],
                    },
                )
            )
    return findings


def sw_002_native_vlan_mismatch(topology: Topology) -> list[Finding]:
    findings = []
    for link, a, ia, b, ib in _trunk_links(topology):
        vlan_a = _iface_value(ia, "switchport trunk native vlan") or "1"
        vlan_b = _iface_value(ib, "switchport trunk native vlan") or "1"
        if vlan_a != vlan_b:
            findings.append(
                Finding(
                    rule_id="SW-002",
                    severity="high",
                    category="switching",
                    title="Native VLAN Mismatch",
                    affected_devices=[a.name, b.name],
                    affected_interfaces=[ia.name, ib.name],
                    description=f"Native VLAN mismatch on trunk: {a.name} {ia.name} is VLAN {vlan_a}, {b.name} {ib.name} is VLAN {vlan_b}",
                    evidence=[
                        f"{a.name} {ia.name}: switchport trunk native vlan {vlan_a}",
                        f"{b.name} {ib.name}: switchport trunk native vlan {vlan_b}",
                    ],
                    fix_commands={
                        a.name: [f"interface {ia.name}", f"switchport trunk native vlan {vlan_b}"],
                        b.name: [f"interface {ib.name}", f"switchport trunk native vlan {vlan_b}"],
                    },
                )
            )
    return findings


def sw_003_vlan_not_allowed_on_trunk(topology: Topology) -> list[Finding]:
    findings = []
    for link, a, ia, b, ib in _trunk_links(topology):
        raw_a = _iface_value(ia, "switchport trunk allowed vlan")
        raw_b = _iface_value(ib, "switchport trunk allowed vlan")
        if raw_a is None and raw_b is None:
            continue
        set_a = set(raw_a.split(",")) if raw_a else None
        set_b = set(raw_b.split(",")) if raw_b else None
        if set_a is None or set_b is None:
            continue
        missing_on_b = set_a - set_b
        missing_on_a = set_b - set_a
        if missing_on_b or missing_on_a:
            findings.append(
                Finding(
                    rule_id="SW-003",
                    severity="medium",
                    category="switching",
                    title="VLAN Not Allowed on Trunk",
                    affected_devices=[a.name, b.name],
                    affected_interfaces=[ia.name, ib.name],
                    description=f"Allowed-VLAN list differs between {a.name} {ia.name} and {b.name} {ib.name}",
                    evidence=[
                        f"{a.name} {ia.name}: switchport trunk allowed vlan {raw_a}",
                        f"{b.name} {ib.name}: switchport trunk allowed vlan {raw_b}",
                    ],
                    fix_commands={
                        a.name: [f"interface {ia.name}", f"switchport trunk allowed vlan add {','.join(sorted(missing_on_a))}"] if missing_on_a else [],
                        b.name: [f"interface {ib.name}", f"switchport trunk allowed vlan add {','.join(sorted(missing_on_b))}"] if missing_on_b else [],
                    },
                )
            )
    return findings


def sw_004_stp_loop_risk(topology: Topology) -> list[Finding]:
    offenders: list[str] = []
    devices_affected: set[str] = set()
    for device in topology.devices:
        for iface in device.interfaces:
            if _is_access(iface) and not (_iface_has(iface, "spanning-tree portfast") and _iface_has(iface, "spanning-tree bpduguard enable")):
                offenders.append(f"{device.name} {iface.name}: missing portfast/bpduguard")
                devices_affected.add(device.name)
    if not offenders:
        return []
    return [
        Finding(
            rule_id="SW-004",
            severity="medium",
            category="switching",
            title="STP Loop Risk",
            affected_devices=sorted(devices_affected),
            affected_interfaces=[],
            description=f"{len(offenders)} access port(s) lack PortFast/BPDU Guard, increasing loop and rogue-switch risk.",
            evidence=offenders,
            fix_commands={dev: ["spanning-tree portfast", "spanning-tree bpduguard enable"] for dev in devices_affected},
        )
    ]


def sw_005_etherchannel_mismatch(topology: Topology) -> list[Finding]:
    findings = []
    groups: dict[tuple[str, str], list[tuple[Device, Interface]]] = {}
    for device in topology.devices:
        for iface in device.interfaces:
            channel = _iface_value(iface, "channel-group")
            if channel:
                groups.setdefault((device.name, channel.split()[0]), []).append((device, iface))
    for (dev_name, group_id), members in groups.items():
        if len(members) < 2:
            continue
        modes = {_iface_value(i, "switchport mode") for _, i in members}
        vlans = {_iface_value(i, "switchport trunk allowed vlan") for _, i in members}
        if len(modes) > 1 or len(vlans) > 1:
            device, _ = members[0]
            findings.append(
                Finding(
                    rule_id="SW-005",
                    severity="medium",
                    category="switching",
                    title="EtherChannel Mismatch",
                    affected_devices=[device.name],
                    affected_interfaces=[i.name for _, i in members],
                    description=f"Port-channel {group_id} on {dev_name} has mismatched member configuration.",
                    evidence=[f"{dev_name} {i.name}: mode={_iface_value(i, 'switchport mode')} vlans={_iface_value(i, 'switchport trunk allowed vlan')}" for _, i in members],
                    fix_commands={dev_name: ["! align switchport mode and allowed-vlan list across all channel-group members"]},
                )
            )
    return findings


def sw_006_errdisable_recovery(topology: Topology) -> list[Finding]:
    offenders = [d.name for d in topology.devices if d.type == "Switch" and not any("errdisable recovery" in ln for ln in _global_lines(d))]
    if not offenders:
        return []
    return [
        Finding(
            rule_id="SW-006",
            severity="info",
            category="switching",
            title="Err-Disable Recovery Not Configured",
            affected_devices=offenders,
            affected_interfaces=[],
            description=f"{len(offenders)} switch(es) do not auto-recover err-disabled ports, requiring manual intervention after a violation.",
            evidence=[f"{name}: no 'errdisable recovery' statement found" for name in offenders],
            fix_commands={name: ["errdisable recovery cause bpduguard", "errdisable recovery interval 300"] for name in offenders},
        )
    ]


# ---------- routing rules ----------


def rt_001_missing_default_route(topology: Topology) -> list[Finding]:
    offenders = [d.name for d in topology.devices if d.type in ("Router", "Firewall") and not any("ip route 0.0.0.0 0.0.0.0" in ln for ln in _global_lines(d))]
    if not offenders:
        return []
    return [
        Finding(
            rule_id="RT-001",
            severity="critical",
            category="routing",
            title="Missing Default Route",
            affected_devices=offenders,
            affected_interfaces=[],
            description=f"{len(offenders)} router(s) have no default route configured, risking total loss of upstream connectivity.",
            evidence=[f"{name}: no 'ip route 0.0.0.0 0.0.0.0' statement found" for name in offenders],
            fix_commands={name: ["ip route 0.0.0.0 0.0.0.0 <upstream-next-hop>"] for name in offenders},
        )
    ]


def rt_002_duplicate_ip(topology: Topology) -> list[Finding]:
    ip_owners: dict[str, list[str]] = {}
    for device in topology.devices:
        for iface in device.interfaces:
            ip = _iface_value(iface, "ip address")
            if ip:
                ip_addr = ip.split()[0]
                ip_owners.setdefault(ip_addr, []).append(f"{device.name} {iface.name}")
    findings = []
    for ip_addr, owners in ip_owners.items():
        if len(owners) > 1:
            findings.append(
                Finding(
                    rule_id="RT-002",
                    severity="high",
                    category="routing",
                    title="Duplicate IP Address",
                    affected_devices=sorted({o.split()[0] for o in owners}),
                    affected_interfaces=[o.split()[1] for o in owners],
                    description=f"IP address {ip_addr} is configured on more than one device: {', '.join(owners)}",
                    evidence=[f"{o}: ip address {ip_addr}" for o in owners],
                    fix_commands={},
                )
            )
    return findings


# ---------- security rules ----------


def sec_001_vlan_hopping(topology: Topology) -> list[Finding]:
    offenders = []
    devices_affected: set[str] = set()
    for device in topology.devices:
        for iface in device.interfaces:
            if _is_dynamic(iface):
                offenders.append(f"{device.name} {iface.name}")
                devices_affected.add(device.name)
    if not offenders:
        return []
    return [
        Finding(
            rule_id="SEC-001",
            severity="high",
            category="security",
            title="VLAN Hopping Vulnerable",
            affected_devices=sorted(devices_affected),
            affected_interfaces=offenders,
            description=f"{len(offenders)} port(s) use dynamic trunk negotiation, which can be exploited for VLAN hopping.",
            evidence=[f"{o}: switchport mode dynamic auto/desirable" for o in offenders],
            fix_commands={dev: ["switchport mode access"] for dev in devices_affected},
        )
    ]


def sec_002_default_snmp_community(topology: Topology) -> list[Finding]:
    offenders = []
    for device in topology.devices:
        for ln in _global_lines(device):
            if "snmp-server community public" in ln or "snmp-server community private" in ln:
                offenders.append((device.name, ln))
    if not offenders:
        return []
    return [
        Finding(
            rule_id="SEC-002",
            severity="critical",
            category="security",
            title="Default SNMP Community String",
            affected_devices=sorted({name for name, _ in offenders}),
            affected_interfaces=[],
            description=f"{len(offenders)} device(s) use the well-known default SNMP community string, allowing unauthorized read/write access.",
            evidence=[f"{name}: {ln}" for name, ln in offenders],
            fix_commands={name: ["no snmp-server community public", "no snmp-server community private", "snmp-server community <randomized-string> RO"] for name, _ in offenders},
        )
    ]


def sec_003_telnet_enabled(topology: Topology) -> list[Finding]:
    offenders = []
    for device in topology.devices:
        if device.type in ("PC", "Server"):
            continue
        vty = _vty_lines(device)
        has_telnet = any("transport input telnet" in ln or ln == "transport input all" for ln in vty)
        has_ssh = any("transport input ssh" in ln for ln in vty)
        if has_telnet or not has_ssh:
            offenders.append(device.name)
    if not offenders:
        return []
    return [
        Finding(
            rule_id="SEC-003",
            severity="high",
            category="security",
            title="Telnet Enabled on Management Lines",
            affected_devices=offenders,
            affected_interfaces=[],
            description=f"{len(offenders)} device(s) allow unencrypted Telnet management access instead of SSH-only.",
            evidence=[f"{name}: VTY lines missing 'transport input ssh'" for name in offenders],
            fix_commands={name: ["line vty 0 4", "transport input ssh"] for name in offenders},
        )
    ]


def sec_004_no_enable_secret(topology: Topology) -> list[Finding]:
    offenders = []
    for device in topology.devices:
        if device.type in ("PC", "Server"):
            continue
        lines = _global_lines(device)
        has_secret = any(ln.startswith("enable secret") for ln in lines)
        has_plain = any(ln.startswith("enable password") for ln in lines)
        if not has_secret:
            offenders.append((device.name, has_plain))
    if not offenders:
        return []
    return [
        Finding(
            rule_id="SEC-004",
            severity="high",
            category="security",
            title="No Enable Secret Configured",
            affected_devices=[name for name, _ in offenders],
            affected_interfaces=[],
            description=f"{len(offenders)} device(s) rely on a weak or missing enable password instead of a hashed 'enable secret'.",
            evidence=[f"{name}: {'enable password (reversible) in use' if plain else 'no enable password/secret found'}" for name, plain in offenders],
            fix_commands={name: ["enable secret <strong-passphrase>"] for name, _ in offenders},
        )
    ]


# ---------- infrastructure rules ----------


def inf_001_no_logging(topology: Topology) -> list[Finding]:
    offenders = [d.name for d in topology.devices if d.type not in ("PC", "Server") and not any(ln.startswith("logging") for ln in _global_lines(d))]
    if not offenders:
        return []
    return [
        Finding(
            rule_id="INF-001",
            severity="medium",
            category="infrastructure",
            title="No Logging Configured",
            affected_devices=offenders,
            affected_interfaces=[],
            description=f"{len(offenders)} device(s) have no buffered or remote logging configured, limiting post-incident forensics.",
            evidence=[f"{name}: no 'logging' statement found" for name in offenders],
            fix_commands={name: ["logging buffered 16384", "logging host <syslog-server-ip>"] for name in offenders},
        )
    ]


def inf_002_no_ntp(topology: Topology) -> list[Finding]:
    offenders = [d.name for d in topology.devices if d.type not in ("PC", "Server") and not any(ln.startswith("ntp server") for ln in _global_lines(d))]
    if not offenders:
        return []
    return [
        Finding(
            rule_id="INF-002",
            severity="medium",
            category="infrastructure",
            title="No NTP Configured",
            affected_devices=offenders,
            affected_interfaces=[],
            description=f"{len(offenders)} device(s) have no NTP server configured. Unsynchronized clocks make correlating logs across devices unreliable.",
            evidence=[f"{name}: no 'ntp server' statement found" for name in offenders],
            fix_commands={name: ["ntp server 10.0.0.53"] for name in offenders},
        )
    ]


RULES = [
    sw_001_trunk_encapsulation_mismatch,
    sw_002_native_vlan_mismatch,
    sw_003_vlan_not_allowed_on_trunk,
    sw_004_stp_loop_risk,
    sw_005_etherchannel_mismatch,
    sw_006_errdisable_recovery,
    rt_001_missing_default_route,
    rt_002_duplicate_ip,
    sec_001_vlan_hopping,
    sec_002_default_snmp_community,
    sec_003_telnet_enabled,
    sec_004_no_enable_secret,
    inf_001_no_logging,
    inf_002_no_ntp,
]


def analyze(topology: Topology) -> list[Finding]:
    findings: list[Finding] = []
    for rule in RULES:
        findings.extend(rule(topology))
    findings.sort(key=lambda f: SEVERITY_ORDER.get(f.severity, 9))
    return findings
