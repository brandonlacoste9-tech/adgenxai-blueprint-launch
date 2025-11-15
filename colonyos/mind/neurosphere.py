"""Mind layer responsible for routing and planning."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional
from uuid import uuid4

from colonyos.core.types import ColonyConfig, Identity, Task, TaskRouting, WorkflowNode, WorkflowPlan, Worker
from colonyos.core.memory import HybridMemory
from colonyos.core.event_bus import EventBus


@dataclass
class RegisteredWorker:
    worker: Worker


class Neurosphere:
    """Routes tasks to workers and generates lightweight plans."""

    def __init__(self, config: ColonyConfig, memory: HybridMemory, event_bus: EventBus) -> None:
        self.config = config
        self.memory = memory
        self.event_bus = event_bus
        self.identity: Optional[Identity] = None
        self._workers: Dict[str, RegisteredWorker] = {}

    def set_identity(self, identity: Identity) -> None:
        self.identity = identity

    def register_worker(self, worker: Worker) -> None:
        self._workers[worker.id] = RegisteredWorker(worker=worker)

    def route_task(self, task: Task) -> TaskRouting:
        category = task.requirements.get("category")
        for registered in self._workers.values():
            worker = registered.worker
            if not worker.is_available():
                continue
            if not category:
                return TaskRouting(worker_id=worker.id)
            if any(cap.category == category for cap in worker.capabilities):
                return TaskRouting(worker_id=worker.id)
        # fallback: pick any worker
        worker_ids = list(self._workers.keys())
        if not worker_ids:
            raise RuntimeError("No workers registered")
        return TaskRouting(worker_id=worker_ids[0])

    def plan_goal(self, goal: str, context: Optional[Dict[str, str]] = None) -> WorkflowPlan:
        created_by = self.identity.id if self.identity else "system"
        task = Task.create(description=goal, created_by=created_by, requirements={"category": "planning"})
        node_id = task.id
        plan = WorkflowPlan(id=str(uuid4()), goal=goal, nodes={node_id: WorkflowNode(task=task)})
        return plan
