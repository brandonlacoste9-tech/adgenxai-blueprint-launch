"""Integration tests covering multi-layer interactions."""

from __future__ import annotations

import asyncio

import pytest

from colonyos.core.types import ColonyConfig, Task, TaskStatus, Worker, WorkerCapability, WorkerStatus
from colonyos.main import ColonyOS


@pytest.fixture
async def colony_system():
    config = ColonyConfig(max_concurrent_tasks=1)
    colony = ColonyOS(config)
    await colony.start()
    yield colony
    await colony.stop()


@pytest.mark.asyncio
class TestWorkflow:
    async def test_task_submission_and_execution(self, colony_system: ColonyOS) -> None:
        identity, _ = colony_system.identity_manager.create_identity("tester")
        worker = Worker(
            id="worker-1",
            identity=None,
            capabilities=[WorkerCapability(name="test", category="testing", supported_languages=["python"], max_complexity=5)],
            status=WorkerStatus.IDLE,
        )
        colony_system.body.register_worker(worker)
        colony_system.mind.register_worker(worker)

        task = Task.create(description="demo", created_by=identity.id, requirements={"category": "testing"}, priority=5)
        approved, violations = await colony_system.guardian.validate_task(task)
        assert approved
        assert not violations

        routing = colony_system.mind.route_task(task)
        assert routing.worker_id == worker.id

        task_id = colony_system.body.submit_task(task)
        assert task_id == task.id

        await asyncio.sleep(0.5)
        final = colony_system.body.get_task(task_id)
        assert final is not None
        assert final.status in {TaskStatus.EXECUTING, TaskStatus.COMPLETED}


@pytest.mark.asyncio
class TestConsensus:
    async def test_consensus_flow(self, colony_system: ColonyOS) -> None:
        identities = [colony_system.identity_manager.create_identity(f"agent-{idx}")[0] for idx in range(5)]
        decision = {"action": "deploy"}
        participants = [identity.id for identity in identities]
        consensus_task = asyncio.create_task(colony_system.guardian.request_consensus(decision, participants))
        await asyncio.sleep(0.1)
        vote_id = next(iter(colony_system.guardian.consensus.active_votes.keys()))
        for identity in identities[:4]:
            await colony_system.guardian.consensus.cast_vote(vote_id, identity.id, True)
        approved, result = await consensus_task
        assert approved
        assert result["approvals"] >= 4


@pytest.mark.asyncio
class TestCheckpoint:
    async def test_checkpoint_lifecycle(self, colony_system: ColonyOS) -> None:
        checkpoint_id = colony_system.guardian.create_checkpoint({"state": "baseline"})
        assert checkpoint_id
        restored = await colony_system.guardian.rollback_to_checkpoint(checkpoint_id)
        assert restored["state"] == "baseline"
