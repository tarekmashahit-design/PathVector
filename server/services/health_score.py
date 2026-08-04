from __future__ import annotations

from models.schemas import Finding, Scores

PENALTY = {"critical": 15, "high": 8, "medium": 4, "low": 2, "info": 1}


def _score_for(findings: list[Finding]) -> int:
    score = 100
    for f in findings:
        score -= PENALTY.get(f.severity, 0)
    return max(0, score)


def calculate(findings: list[Finding]) -> Scores:
    by_category = {"switching": [], "routing": [], "security": [], "infrastructure": []}
    for f in findings:
        by_category.setdefault(f.category, []).append(f)

    return Scores(
        overall=_score_for(findings),
        switching=_score_for(by_category["switching"]),
        routing=_score_for(by_category["routing"]),
        security=_score_for(by_category["security"]),
        infrastructure=_score_for(by_category["infrastructure"]),
    )
