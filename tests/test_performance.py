"""Lightweight performance checks for ColonyOS."""

from __future__ import annotations

import asyncio
import time

import pytest

from colonyos.core.types import ColonyConfig, Task, Worker, WorkerCapability, WorkerStatus
from colonyos.main import ColonyOS


@pytest.fixture
async def colony_system():
    config = ColonyConfig(max_concurrent_tasks=3)
    colony = ColonyOS(config)
    await colony.start()
    worker = Worker(
        id="perf-worker",
        identity=None,
        capabilities=[WorkerCapability(name="perf", category="testing", supported_languages=["python"], max_complexity=5)],
        status=WorkerStatus.IDLE,
    )
    colony.body.register_worker(worker)
    colony.mind.register_worker(worker)
    yield colony
    await colony.stop()


@pytest.mark.asyncio
async def test_task_throughput(colony_system: ColonyOS) -> None:
    num_tasks = 50
    start = time.time()
    for idx in range(num_tasks):
        task = Task.create(description=f"task-{idx}", created_by="tester", requirements={"category": "testing"})
        colony_system.body.submit_task(task)
    elapsed = time.time() - start
    throughput = num_tasks / max(elapsed, 0.001)
    assert throughput > 10


@pytest.mark.asyncio
async def test_routing_latency(colony_system: ColonyOS) -> None:
    worker = Worker(
        id="routing-worker",
        identity=None,
        capabilities=[WorkerCapability(name="routing", category="routing", supported_languages=["python"], max_complexity=5)],
        status=WorkerStatus.IDLE,
    )
    colony_system.body.register_worker(worker)
    colony_system.mind.register_worker(worker)
    latencies = []
    for idx in range(20):
        task = Task.create(description=f"route-{idx}", created_by="tester", requirements={"category": "routing"})
        start = time.time()
        colony_system.mind.route_task(task)
        latencies.append((time.time() - start) * 1000)
    avg_latency = sum(latencies) / len(latencies)
    assert avg_latency < 5


@pytest.mark.asyncio
async def test_concurrent_execution(colony_system: ColonyOS) -> None:
    for idx in range(2, 5):
        worker = Worker(
            id=f"worker-{idx}",
            identity=None,
            capabilities=[WorkerCapability(name="concurrent", category="testing", supported_languages=["python"], max_complexity=5)],
            status=WorkerStatus.IDLE,
        )
        colony_system.body.register_worker(worker)
        colony_system.mind.register_worker(worker)
    tasks = []
    for idx in range(30):
        task = Task.create(description=f"concurrent-{idx}", created_by="tester", requirements={"category": "testing"})
        colony_system.body.submit_task(task)
        tasks.append(task)
    await asyncio.sleep(2)
    completed = sum(1 for task in tasks if colony_system.body.get_task(task.id).is_terminal)
    assert completed >= 20
