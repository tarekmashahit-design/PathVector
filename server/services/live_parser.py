"""Regex-based parsers for standard Cisco IOS show-command output.

No textfsm/genie dependency — these patterns target the output format
common across IOS/IOS-XE releases. Real device output varies slightly by
version; each parser degrades gracefully (returns partial/empty results)
rather than raising, since a live poll should never crash on one odd line.
"""
from __future__ import annotations

import re

_IFACE_LINE = re.compile(
    r"^(?P<iface>\S+)\s+(?P<ip>\S+)\s+\S+\s+\S+\s+(?P<status>up|down|administratively down)\s+(?P<protocol>up|down)\s*$",
    re.MULTILINE,
)


def parse_ip_interface_brief(text: str) -> list[dict]:
    rows = []
    for m in _IFACE_LINE.finditer(text):
        rows.append(
            {
                "interface": m.group("iface"),
                "ip": m.group("ip"),
                "status": m.group("status"),
                "protocol": m.group("protocol"),
            }
        )
    return rows


def parse_version(text: str) -> dict:
    model = ""
    m = re.search(r"[Mm]odel [Nn]umber\s*:\s*(\S+)", text)
    if m:
        model = m.group(1)
    else:
        m = re.search(r"[Cc]isco\s+(WS-\S+|C\S+|CISCO\S+)\s*\(", text)
        if m:
            model = m.group(1)

    serial = ""
    m = re.search(r"[Ss]ystem [Ss]erial [Nn]umber\s*:\s*(\S+)", text) or re.search(r"Processor board ID (\S+)", text)
    if m:
        serial = m.group(1)

    firmware = ""
    m = re.search(r"[Vv]ersion\s+([\w().]+),", text)
    if m:
        firmware = m.group(1)

    uptime = ""
    m = re.search(r"uptime is (.+)", text)
    if m:
        uptime = m.group(1).strip()

    return {"model": model, "serial": serial, "firmware": firmware, "uptime": uptime}


def hostname_from_config(running_config: str) -> str:
    m = re.search(r"^hostname\s+(\S+)", running_config, re.MULTILINE)
    return m.group(1) if m else ""


_IFACE_BLOCK_HEADER = re.compile(
    r"^(?P<iface>\S+) is (?P<status>up|down|administratively down), line protocol is (?P<protocol>up|down)",
)


def parse_interfaces(text: str) -> dict[str, dict]:
    """Splits `show interfaces` into per-interface blocks and extracts the
    fields the frontend's InterfaceRow shape needs: status, speed, in/out
    traffic rate, and error counts."""
    blocks: dict[str, list[str]] = {}
    current: str | None = None
    for line in text.splitlines():
        m = _IFACE_BLOCK_HEADER.match(line)
        if m:
            current = m.group("iface")
            blocks[current] = [line]
        elif current:
            blocks[current].append(line)

    parsed: dict[str, dict] = {}
    for iface, lines in blocks.items():
        block = "\n".join(lines)
        header = _IFACE_BLOCK_HEADER.match(lines[0])
        status = header.group("status") if header else "down"

        speed = ""
        m = re.search(r"(\d+)\s*Mb/s|(\d+)\s*Gb/s", block)
        if m:
            speed = m.group(0).replace(" ", "")
        else:
            m = re.search(r"BW (\d+) Kbit/sec", block)
            if m:
                kbit = int(m.group(1))
                speed = f"{kbit // 1000}Mb/s" if kbit >= 1000 else f"{kbit}Kb/s"

        in_rate = out_rate = "0 Mb/s"
        m = re.search(r"input rate (\d+) bits/sec", block)
        if m:
            in_rate = _fmt_bps(int(m.group(1)))
        m = re.search(r"output rate (\d+) bits/sec", block)
        if m:
            out_rate = _fmt_bps(int(m.group(1)))

        in_errors = 0
        m = re.search(r"(\d+) input errors", block)
        if m:
            in_errors = int(m.group(1))
        out_errors = 0
        m = re.search(r"(\d+) output errors", block)
        if m:
            out_errors = int(m.group(1))

        parsed[iface] = {
            "status": "up" if status == "up" else "down",
            "speed": speed or "—",
            "inTraffic": in_rate,
            "outTraffic": out_rate,
            "errors": in_errors + out_errors,
        }
    return parsed


def _fmt_bps(bits_per_sec: int) -> str:
    if bits_per_sec >= 1_000_000_000:
        return f"{bits_per_sec / 1_000_000_000:.1f} Gb/s"
    if bits_per_sec >= 1_000_000:
        return f"{bits_per_sec / 1_000_000:.0f} Mb/s"
    if bits_per_sec >= 1_000:
        return f"{bits_per_sec / 1_000:.0f} Kb/s"
    return f"{bits_per_sec} b/s"


_VLAN_LINE = re.compile(r"^(\d+)\s+(\S.*?)\s{2,}(active|suspended|act/unsup)\s*(.*)$", re.MULTILINE)


def parse_vlan_brief(text: str) -> dict[str, str]:
    """Returns interface -> vlan id, by expanding each VLAN row's port list."""
    port_to_vlan: dict[str, str] = {}
    for m in _VLAN_LINE.finditer(text):
        vlan_id, _name, _state, ports_first_line = m.groups()
        # VLAN rows can wrap onto continuation lines that are pure port lists
        # with no leading vlan id — collect those too.
        for port in [p.strip() for p in ports_first_line.split(",") if p.strip()]:
            port_to_vlan[_normalize_iface(port)] = vlan_id
    return port_to_vlan


def _normalize_iface(name: str) -> str:
    # `show vlan brief` abbreviates (Fa0/1); `show interfaces` spells it out
    # (FastEthernet0/1). Normalize to the abbreviated form for matching.
    repl = {
        "FastEthernet": "Fa",
        "GigabitEthernet": "Gi",
        "TenGigabitEthernet": "Te",
        "Vlan": "Vl",
    }
    for full, short in repl.items():
        if name.startswith(full):
            return short + name[len(full):]
    return name


_CDP_BLOCK_SPLIT = re.compile(r"-{5,}")


def parse_cdp_neighbors_detail(text: str) -> list[dict]:
    neighbors = []
    for block in _CDP_BLOCK_SPLIT.split(text):
        if "Device ID" not in block:
            continue
        device_id = _first_group(block, r"Device ID:\s*(\S+)")
        ip = _first_group(block, r"IP address:\s*(\S+)")
        platform = _first_group(block, r"Platform:\s*([^,]+),")
        capabilities = _first_group(block, r"Capabilities:\s*(.+)")
        local_iface = _first_group(block, r"Interface:\s*([^,]+),")
        remote_iface = _first_group(block, r"Port ID \(outgoing port\):\s*(\S+)")
        version = _first_group(block, r"Version\s*:?\s*\n?\s*(.+)")
        if not device_id:
            continue
        neighbors.append(
            {
                "device_id": device_id,
                "ip": ip or "",
                "platform": (platform or "").strip(),
                "capabilities": (capabilities or "").strip(),
                "local_interface": (local_iface or "").strip(),
                "remote_interface": remote_iface or "",
                "version": (version or "").strip()[:80],
            }
        )
    return neighbors


def _first_group(text: str, pattern: str) -> str | None:
    m = re.search(pattern, text)
    return m.group(1) if m else None


def parse_cpu_percent(text: str) -> int:
    m = re.search(r"five seconds:\s*(\d+)%", text) or re.search(r"CPU utilization for five seconds:\s*(\d+)%", text)
    return int(m.group(1)) if m else 0


def parse_memory_percent(text: str) -> int:
    # "Processor   2C4B7A0    58720256    22136544    36583712 ..." — the
    # second column is a hex pool address, so skip straight to the two
    # decimal byte counts (Total, Used) that follow it.
    m = re.search(r"Processor\s+\S+\s+(\d+)\s+(\d+)", text)
    if m:
        total, used = int(m.group(1)), int(m.group(2))
        if total:
            return round(used / total * 100)
    return 0
