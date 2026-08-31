"""Live Cisco IOS connection layer for Mode A ("Live Network").

Uses netmiko (device_type="cisco_ios") to pull raw show-command output from
a real switch. The test switch has no authentication configured, so empty
username/password/secret are valid and expected — netmiko is fine with that.

Netmiko's ConnectHandler is blocking, so every call here runs off the event
loop via asyncio.to_thread; nothing here should be awaited directly on the
socket.
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

from netmiko import ConnectHandler
from netmiko.exceptions import NetmikoAuthenticationException, NetmikoTimeoutException

# The six commands PathVector pulls from the device on every connect. Two
# extra read-only commands (CPU/memory) are included as well — without them
# there is no real source for the cpu/mem percentages the frontend's Device
# schema expects, and fabricating those numbers would defeat the point of
# wiring up a real backend.
COMMANDS = {
    "version": "show version",
    "ip_interface_brief": "show ip interface brief",
    "interfaces": "show interfaces",
    "vlan_brief": "show vlan brief",
    "cdp_neighbors_detail": "show cdp neighbors detail",
    "running_config": "show running-config",
    "cpu": "show processes cpu",
    "memory": "show memory statistics",
}


class LiveConnectError(Exception):
    """Raised when the switch can't be reached or authenticated against."""


@dataclass
class RawPull:
    ip: str
    outputs: dict[str, str] = field(default_factory=dict)


def _pull_sync(ip: str, username: str, password: str, secret: str) -> dict[str, str]:
    device = {
        "device_type": "cisco_ios",
        "host": ip,
        "username": username or "",
        "password": password or "",
        "secret": secret or "",
        "fast_cli": False,
        "timeout": 15,
        "conn_timeout": 10,
    }
    outputs: dict[str, str] = {}
    try:
        with ConnectHandler(**device) as conn:
            if secret:
                try:
                    conn.enable()
                except Exception:  # noqa: BLE001 — some no-auth labs have no enable secret either
                    pass
            for key, cmd in COMMANDS.items():
                try:
                    outputs[key] = conn.send_command(cmd, read_timeout=20) or ""
                except Exception as exc:  # noqa: BLE001 — a single unsupported command shouldn't kill the whole pull
                    outputs[key] = ""
                    outputs[f"{key}_error"] = str(exc)
    except NetmikoAuthenticationException as exc:
        raise LiveConnectError(f"Authentication failed connecting to {ip}: {exc}") from exc
    except NetmikoTimeoutException as exc:
        raise LiveConnectError(f"Timed out connecting to {ip}: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        raise LiveConnectError(f"Could not connect to {ip}: {exc}") from exc
    return outputs


async def pull(ip: str, username: str, password: str, secret: str = "") -> RawPull:
    outputs = await asyncio.to_thread(_pull_sync, ip, username, password, secret)
    return RawPull(ip=ip, outputs=outputs)
