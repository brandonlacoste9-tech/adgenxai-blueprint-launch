"""Security and safety rule tests for ColonyOS."""

from __future__ import annotations

from colonyos.core.memory import SQLiteMemory
from colonyos.core.types import SafetyLevel, Task
from colonyos.guardian.safety import AuditLog, ProhibitedPatternRule, ResourceLimitRule, SafetyLevelRule


def test_prohibited_patterns() -> None:
    rule = ProhibitedPatternRule([r"rm\s+-rf", r"DROP\s+TABLE"])
    safe_task = Task.create(description="List files", created_by="tester")
    passed, reason = rule.check(safe_task)
    assert passed
    bad_task = Task.create(description="Run rm -rf /", created_by="tester")
    passed, reason = rule.check(bad_task)
    assert not passed
    assert "prohibited" in reason.lower()


def test_resource_limits() -> None:
    rule = ResourceLimitRule(max_tokens=1000, max_timeout=300)
    safe_task = Task.create(description="safe", created_by="tester", constraints={"max_tokens": 500}, timeout_seconds=120)
    passed, _ = rule.check(safe_task)
    assert passed
    unsafe_task = Task.create(description="unsafe", created_by="tester", constraints={"max_tokens": 2000}, timeout_seconds=400)
    passed, reason = rule.check(unsafe_task)
    assert not passed
    assert "limit" in reason.lower()


def test_safety_level_enforcement() -> None:
    rule = SafetyLevelRule()
    critical_task = Task.create(description="critical", created_by="tester", constraints={"safety_level": SafetyLevel.CRITICAL.value})
    passed, reason = rule.check(critical_task)
    assert not passed
    critical_task.metadata["consensus_approved"] = True
    critical_task.metadata["reviewed_by"] = "admin"
    passed, _ = rule.check(critical_task)
    assert passed


def test_audit_log(tmp_path) -> None:
    db_path = tmp_path / "audit.db"
    memory = SQLiteMemory(str(db_path))
    audit = AuditLog(memory)
    for idx in range(5):
        audit.log_event("test", "actor", {"idx": idx})
    valid, errors = audit.verify_integrity()
    assert valid
    assert not errors
