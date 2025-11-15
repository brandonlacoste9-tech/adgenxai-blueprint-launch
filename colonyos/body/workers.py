"""Worker pool management for ColonyOS."""

from __future__ import annotations

import asyncio
import logging
import time
import traceback
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from colonyos.core.event_bus import EventBus
from colonyos.core.models import Task, TaskStatus, Worker, WorkerStatus

logger = logging.getLogger(__name__)


class WorkerMetrics:
    """Worker performance metrics."""

    def __init__(self) -> None:
        self.total_tasks: int = 0
        self.successful_tasks: int = 0
        self.failed_tasks: int = 0
        self.total_execution_time: float = 0.0
        self.avg_execution_time: float = 0.0
        self.cpu_usage: float = 0.0
        self.memory_usage: float = 0.0
        self.last_task_at: Optional[datetime] = None

    @property
    def success_rate(self) -> float:
        if self.total_tasks == 0:
            return 0.0
        return self.successful_tasks / self.total_tasks

    @property
    def failure_rate(self) -> float:
        return 1.0 - self.success_rate


class WorkerPool:
    """Manages worker lifecycle and assignment."""

    def __init__(
        self,
        event_bus: EventBus,
        max_workers: int = 10,
        heartbeat_interval: int = 30,
        heartbeat_timeout: int = 90,
    ):
        self.event_bus = event_bus
        self.max_workers = max_workers
        self.heartbeat_interval = heartbeat_interval
        self.heartbeat_timeout = heartbeat_timeout

        self.workers: Dict[str, Worker] = {}
        self.metrics: Dict[str, WorkerMetrics] = {}
        self.current_assignments: Dict[str, str] = {}

        self._monitor_task: Optional[asyncio.Task[Any]] = None
        self._running = False

        logger.info("Worker pool initialized (max_workers=%s)", max_workers)

    async def start(self) -> None:
        """Start worker monitoring."""

        if self._running:
            return

        self._running = True
        self._monitor_task = asyncio.create_task(self._monitor_workers())
        logger.info("Worker pool monitoring started")

    async def stop(self) -> None:
        """Stop worker monitoring."""

        self._running = False
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        logger.info("Worker pool stopped")

    def register_worker(self, worker: Worker) -> bool:
        """Add a worker to the pool."""

        if len(self.workers) >= self.max_workers:
            logger.warning("Worker pool full, rejecting worker %s", worker.id)
            return False

        self.workers[worker.id] = worker
        self.metrics[worker.id] = WorkerMetrics()

        logger.info(
            "Registered worker %s (%s capabilities)",
            worker.id,
            len(worker.capabilities),
        )
        return True

    def unregister_worker(self, worker_id: str) -> None:
        """Remove a worker from the pool."""

        if worker_id in self.workers:
            del self.workers[worker_id]
        if worker_id in self.metrics:
            del self.metrics[worker_id]
        if worker_id in self.current_assignments:
            del self.current_assignments[worker_id]

        logger.info("Unregistered worker %s", worker_id)

    def get_worker(self, worker_id: str) -> Optional[Worker]:
        """Return a worker by id."""

        return self.workers.get(worker_id)

    def get_available_workers(self) -> List[Worker]:
        """Return workers ready for assignments."""

        return [
            worker
            for worker in self.workers.values()
            if worker.is_available() and worker.is_healthy(self.heartbeat_timeout)
        ]

    def assign_task(self, worker_id: str, task_id: str) -> bool:
        """Assign a task to a worker."""

        worker = self.workers.get(worker_id)
        if not worker or not worker.is_available():
            return False

        worker.current_task_id = task_id
        worker.status = WorkerStatus.BUSY
        self.current_assignments[worker_id] = task_id

        logger.debug("Assigned task %s to worker %s", task_id, worker_id)
        return True

    def complete_task(
        self,
        worker_id: str,
        task_id: str,
        success: bool,
        execution_time: float,
    ) -> None:
        """Record task completion for worker metrics."""

        worker = self.workers.get(worker_id)
        if worker:
            worker.current_task_id = None
            worker.status = WorkerStatus.IDLE

        self.current_assignments.pop(worker_id, None)

        metrics = self.metrics.get(worker_id)
        if metrics:
            metrics.total_tasks += 1
            if success:
                metrics.successful_tasks += 1
            else:
                metrics.failed_tasks += 1
            metrics.total_execution_time += execution_time
            metrics.avg_execution_time = metrics.total_execution_time / metrics.total_tasks
            metrics.last_task_at = datetime.now(timezone.utc)

        logger.debug(
            "Worker %s completed task %s (%s, %.1fs)",
            worker_id,
            task_id,
            "success" if success else "failure",
            execution_time,
        )

    def update_heartbeat(self, worker_id: str) -> None:
        """Record a worker heartbeat."""

        worker = self.workers.get(worker_id)
        if worker:
            worker.last_heartbeat = datetime.now(timezone.utc)

    def update_resource_usage(self, worker_id: str, cpu: float, memory: float) -> None:
        """Update worker resource telemetry."""

        metrics = self.metrics.get(worker_id)
        if metrics:
            metrics.cpu_usage = cpu
            metrics.memory_usage = memory

    def get_worker_metrics(self, worker_id: str) -> Optional[WorkerMetrics]:
        """Return metrics for a worker."""

        return self.metrics.get(worker_id)

    def get_pool_stats(self) -> Dict[str, Any]:
        """Aggregate worker pool statistics."""

        total_workers = len(self.workers)
        available = len(self.get_available_workers())
        busy = sum(1 for worker in self.workers.values() if worker.status == WorkerStatus.BUSY)

        total_tasks = sum(metrics.total_tasks for metrics in self.metrics.values())
        total_success = sum(metrics.successful_tasks for metrics in self.metrics.values())

        return {
            "total_workers": total_workers,
            "available": available,
            "busy": busy,
            "total_tasks_executed": total_tasks,
            "overall_success_rate": total_success / max(total_tasks, 1),
            "current_assignments": len(self.current_assignments),
        }

    async def _monitor_workers(self) -> None:
        """Background task that monitors worker health."""

        while self._running:
            try:
                for worker_id, worker in list(self.workers.items()):
                    if not worker.is_healthy(self.heartbeat_timeout):
                        logger.warning("Worker %s heartbeat timeout", worker_id)
                        worker.status = WorkerStatus.ERROR

                        await self.event_bus.publish(
                            event_type="worker_timeout",
                            data={
                                "worker_id": worker_id,
                                "assigned_task": self.current_assignments.get(worker_id),
                            },
                            source="worker_pool",
                        )

                        if worker_id in self.current_assignments:
                            task_id = self.current_assignments[worker_id]
                            await self.event_bus.publish(
                                event_type="task_reassignment_needed",
                                data={"task_id": task_id, "failed_worker": worker_id},
                                source="worker_pool",
                            )

                await asyncio.sleep(10)
            except asyncio.CancelledError:
                break
            except Exception as exc:  # pragma: no cover - telemetry aid
                logger.error("Worker monitoring error: %s", exc)
                await asyncio.sleep(5)


class WorkerExecutor:
    """Executes tasks on workers."""

    def __init__(self, worker_pool: WorkerPool, event_bus: EventBus) -> None:
        self.worker_pool = worker_pool
        self.event_bus = event_bus
        self.execution_callbacks: Dict[str, List[Callable[[Task], None]]] = defaultdict(list)

    async def execute_task(self, task: Task, worker_id: str) -> tuple[bool, float]:
        """Execute a task on a specific worker."""

        worker = self.worker_pool.get_worker(worker_id)
        if not worker:
            logger.error("Worker %s not found", worker_id)
            return False, 0.0

        task.status = TaskStatus.EXECUTING
        task.started_at = datetime.now(timezone.utc)
        task.assigned_worker = worker_id

        await self.event_bus.publish(
            event_type="task_started",
            data={"task_id": task.id, "worker_id": worker_id},
            source="worker_executor",
        )

        start_time = time.time()
        success = False

        try:
            result = await self._execute_on_worker(task, worker)
            task.result = result
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now(timezone.utc)
            success = True
            logger.info("Task %s completed successfully on worker %s", task.id, worker_id)
        except asyncio.TimeoutError:
            task.status = TaskStatus.TIMEOUT
            task.error = "Execution timeout"
            logger.warning("Task %s timed out on worker %s", task.id, worker_id)
        except Exception as exc:  # pragma: no cover - runtime safety
            task.status = TaskStatus.FAILED
            task.error = str(exc)
            task.error_trace = traceback.format_exc()
            logger.error("Task %s failed on worker %s: %s", task.id, worker_id, exc)
        finally:
            execution_time = time.time() - start_time
            self.worker_pool.complete_task(worker_id, task.id, success, execution_time)

            await self.event_bus.publish(
                event_type="task_completed",
                data={
                    "task_id": task.id,
                    "worker_id": worker_id,
                    "status": task.status.value,
                    "execution_time": execution_time,
                    "success": success,
                },
                source="worker_executor",
            )

            for callback in self.execution_callbacks.get(task.id, []):
                try:
                    callback(task)
                except Exception as exc:  # pragma: no cover - observer safety
                    logger.error("Execution callback failed: %s", exc)

        return success, execution_time

    async def _execute_on_worker(self, task: Task, worker: Worker) -> Any:
        """Internal execution hook, overridden per worker type."""

        await asyncio.sleep(0.1)
        return {"status": "completed", "worker": worker.id, "task": task.description}

    def add_execution_callback(self, task_id: str, callback: Callable[[Task], None]) -> None:
        """Register a callback invoked after execution."""

        self.execution_callbacks[task_id].append(callback)
