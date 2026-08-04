"""GNS3 project (.gns3 / project .zip) parser.

The .gns3 file itself is plain, documented JSON — this is the well-behaved
counterpart to the Packet Tracer parser. Device configs, when present, live
alongside it in project-files/<node_type>/<node_id>/configs/*.cfg, which is
only available if the user uploads the full project as a .zip rather than
the bare .gns3 file.
"""
from __future__ import annotations

import io
import json
import re
import zipfile

from models.schemas import Device, Interface, Link, Topology

_TYPE_MAP = {
    "qemu": "Router",
    "dynamips": "Router",
    "iou": "Router",
    "docker": "Server",
    "vpcs": "PC",
    "ethernet_switch": "Switch",
    "ethernet_hub": "Switch",
    "cloud": "Server",
    "nat": "Router",
}


class ParseError(Exception):
    """Raised when a .gns3 project cannot be understood."""


def _map_type(node_type: str) -> str:
    return _TYPE_MAP.get((node_type or "").strip().lower(), "Server")


def _adapter_port_name(adapter_number: int | None, port_number: int | None) -> str:
    a = adapter_number if adapter_number is not None else 0
    p = port_number if port_number is not None else 0
    return f"Ethernet{a}/{p}"


def _parse_gns3_json(data: dict, configs: dict[str, str]) -> Topology:
    topology_block = data.get("topology", data)
    nodes = topology_block.get("nodes", [])
    links_raw = topology_block.get("links", [])

    if not nodes:
        raise ParseError("No devices found in this GNS3 project. The file may be empty or use an unsupported schema version.")

    devices: dict[str, Device] = {}
    for node in nodes:
        node_id = node.get("node_id") or node.get("id")
        if not node_id:
            continue
        name = node.get("name", f"Node-{node_id[:6]}")
        node_type = node.get("node_type", "")
        device_type = _map_type(node_type)

        x = float(node.get("x", 0))
        y = float(node.get("y", 0))

        properties = node.get("properties", {}) or {}
        model = properties.get("platform") or properties.get("image") or node_type

        config_text = configs.get(node_id, "")

        ports = node.get("ports", []) or []
        interfaces: list[Interface] = []
        for port in ports:
            iname = port.get("name") or _adapter_port_name(port.get("adapter_number"), port.get("port_number"))
            interfaces.append(Interface(name=iname, status="up", config_lines=_config_lines_for_interface(config_text, iname)))

        devices[node_id] = Device(
            id=node_id,
            name=name,
            type=device_type,
            model=model or "",
            position={"x": x, "y": y},
            config=config_text,
            interfaces=interfaces,
        )

    links: list[Link] = []
    for link in links_raw:
        endpoints = link.get("nodes", [])
        if len(endpoints) < 2:
            continue
        a, b = endpoints[0], endpoints[1]
        a_id, b_id = a.get("node_id"), b.get("node_id")
        if not a_id or not b_id or a_id not in devices or b_id not in devices:
            continue
        a_name = _adapter_port_name(a.get("adapter_number"), a.get("port_number"))
        b_name = _adapter_port_name(b.get("adapter_number"), b.get("port_number"))
        links.append(Link(source_device=a_id, source_interface=a_name, target_device=b_id, target_interface=b_name))

        # Ensure the interface exists on both devices even if the node's
        # "ports" list didn't enumerate it explicitly (common for vpcs/cloud).
        for dev_id, iname in ((a_id, a_name), (b_id, b_name)):
            dev = devices[dev_id]
            if not any(i.name == iname for i in dev.interfaces):
                dev.interfaces.append(Interface(name=iname, status="up", config_lines=_config_lines_for_interface(dev.config, iname)))

    warnings: list[str] = []
    if not configs:
        warnings.append("Configuration files not found — upload the full project folder (as a .zip) for config analysis.")

    return Topology(devices=list(devices.values()), links=links, warnings=warnings)


def _config_lines_for_interface(config: str, iface_name: str) -> list[str]:
    if not config:
        return []
    lines = config.splitlines()
    out: list[str] = []
    in_block = False
    for raw in lines:
        stripped = raw.strip()
        if stripped.startswith("interface ") and iface_name in stripped:
            in_block = True
            continue
        if in_block:
            if stripped == "!" or (not raw.startswith((" ", "\t")) and stripped):
                in_block = False
                continue
            if stripped:
                out.append(stripped)
    return out


def _load_configs_from_zip(zf: zipfile.ZipFile) -> dict[str, str]:
    """Map node_id -> startup config text, keyed by the node_id folder segment
    in project-files/<node_type>/<node_id>/configs/*.cfg."""
    configs: dict[str, str] = {}
    pattern = re.compile(r"project-files/[^/]+/([0-9a-fA-F-]{36})/configs/.*\.cfg$")
    for name in zf.namelist():
        m = pattern.search(name)
        if m:
            node_id = m.group(1)
            try:
                configs[node_id] = zf.read(name).decode("utf-8", errors="replace")
            except (KeyError, UnicodeDecodeError):
                continue
    return configs


def parse(file_bytes: bytes, filename: str) -> Topology:
    if filename.lower().endswith(".zip"):
        try:
            zf = zipfile.ZipFile(io.BytesIO(file_bytes))
        except zipfile.BadZipFile as exc:
            raise ParseError("This .zip file is corrupted or not a valid archive.") from exc

        gns3_names = [n for n in zf.namelist() if n.lower().endswith(".gns3")]
        if not gns3_names:
            raise ParseError("No .gns3 project file found inside this archive.")

        try:
            data = json.loads(zf.read(gns3_names[0]).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise ParseError("Unable to parse the .gns3 project file — it may be corrupted.") from exc

        configs = _load_configs_from_zip(zf)
        return _parse_gns3_json(data, configs)

    try:
        data = json.loads(file_bytes.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ParseError("Unable to parse this GNS3 file. It does not appear to be valid JSON.") from exc

    return _parse_gns3_json(data, configs={})
