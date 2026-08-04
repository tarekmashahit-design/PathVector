from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

DeviceType = Literal["Router", "Switch", "AP", "PC", "Server", "Firewall"]
Severity = Literal["critical", "high", "medium", "low", "info"]
Category = Literal["switching", "routing", "security", "infrastructure"]


class Position(BaseModel):
    x: float = 0
    y: float = 0


class Interface(BaseModel):
    name: str
    status: Literal["up", "down"] = "up"
    config_lines: list[str] = Field(default_factory=list)


class Device(BaseModel):
    id: str
    name: str
    type: DeviceType
    model: str = ""
    position: Position = Field(default_factory=Position)
    config: str = ""
    interfaces: list[Interface] = Field(default_factory=list)


class Link(BaseModel):
    source_device: str
    source_interface: str
    target_device: str
    target_interface: str
    status: Literal["healthy", "degraded", "down"] = "healthy"


class Topology(BaseModel):
    devices: list[Device] = Field(default_factory=list)
    links: list[Link] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class Finding(BaseModel):
    rule_id: str
    severity: Severity
    category: Category
    title: str
    affected_devices: list[str] = Field(default_factory=list)
    affected_interfaces: list[str] = Field(default_factory=list)
    description: str
    evidence: list[str] = Field(default_factory=list)
    fix_commands: dict[str, list[str]] = Field(default_factory=dict)
    ai_diagnosis: str | None = None
    confidence: int | None = None


class Scores(BaseModel):
    overall: int
    switching: int
    routing: int
    security: int
    infrastructure: int


class AnalysisSession(BaseModel):
    session_id: str
    filename: str
    status: Literal["pending", "parsing", "analyzing", "diagnosing", "complete", "error"] = "pending"
    topology: Topology | None = None
    findings: list[Finding] = Field(default_factory=list)
    scores: Scores | None = None
    summary: str | None = None
    error: str | None = None
    created_at: float = 0
