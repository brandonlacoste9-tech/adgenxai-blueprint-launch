"""Colony Kernel orchestrating the body layer."""

from __future__ import annotations

import asyncio
import logging
import threading
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from colonyos.body.queue import PriorityTaskQueue, TaskScheduler
from colonyos.body.workers import WorkerExecutor, WorkerPool
from colonyos.core.event_bus import EventBus
from colonyos.core.models import ColonyConfig, Task, TaskStatus, Worker

logger = logging.getLogger(__name__)


class ColonyKernel:
    """Main execution engine coordinating queue, scheduler, and workers."""

    def __init__(
        self,
        config: ColonyConfig,
        memory_backend: Any,
        event_bus: EventBus,
    ) -> None:
        self.config = config
        self.memory = memory_backend
        self.event_bus = event_bus

        self.task_queue = PriorityTaskQueue(max_size=config.max_concurrent_tasks * 10)
        self.scheduler = TaskScheduler(self.task_queue)
        self.worker_pool = WorkerPool(
            event_bus,
            max_workers=config.max_concurrent_tasks,
            heartbeat_timeout=config.worker_heartbeat_timeout,
        )
        self.executor = WorkerExecutor(self.worker_pool, event_bus)

        self.tasks: Dict[str, Task] = {}
        self._lock = threading.RLock()
        self._execution_tasks: List[asyncio.Task[Any]] = []
        self._running = False

        logger.info("Colony Kernel initialized")

    async def start(self) -> None:
        """Start the kernel execution loops."""

        if self._running:
            return

        self._running = True
        await self.worker_pool.start()

        num_executors = self.config.max_concurrent_tasks
        for index in range(num_executors):
            task = asyncio.create_task(self._execution_loop(f"executor-{index}"))
            self._execution_tasks.append(task)

        logger.info("Colony Kernel started with %s executors", num_executors)

    async def stop(self) -> None:
        """Stop the kernel execution loops."""

        self._running = False

        for task in self._execution_tasks:
            task.cancel()

        await asyncio.gather(*self._execution_tasks, return_exceptions=True)
        self._execution_tasks.clear()

        await self.worker_pool.stop()
        logger.info("Colony Kernel stopped")

    def submit_task(self, task: Task) -> str:
        """Submit a task to the kernel queue."""

        with self._lock:
            self.tasks[task.id] = task

            deadline: Optional[datetime] = None
            if task.timeout_seconds:
                deadline = datetime.now(timezone.utc) + timedelta(seconds=task.timeout_seconds)

            success = self.task_queue.enqueue(task, priority=task.priority, deadline=deadline)
            if not success:
                task.status = TaskStatus.REJECTED
                task.error = "Queue full"
                return task.id

            task.status = TaskStatus.QUEUED
            logger.info("Submitted task %s to queue", task.id)
            return task.id

    def get_task(self, task_id: str) -> Optional[Task]:
        """Retrieve a task by id."""

        with self._lock:
            return self.tasks.get(task_id)

    def get_task_status(self, task_id: str) -> Optional[TaskStatus]:
        """Return the status of a task."""

        task = self.get_task(task_id)
        return task.status if task else None

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a pending task."""

        with self._lock:
            task = self.tasks.get(task_id)
            if not task:
                return False

            if task.status in {TaskStatus.PENDING, TaskStatus.QUEUED}:
                removed = self.task_queue.remove(task_id)
                if removed:
                    task.status = TaskStatus.CANCELLED
                    logger.info("Cancelled task %s", task_id)
                    return True
            return False

    def register_worker(self, worker: Worker) -> bool:
        """Register a worker with the pool."""

        return self.worker_pool.register_worker(worker)

    def unregister_worker(self, worker_id: str) -> None:
        """Remove a worker from the pool."""

        self.worker_pool.unregister_worker(worker_id)

    def get_statistics(self) -> Dict[str, Any]:
        """Return aggregated statistics for queue, pool, and tasks."""

        queue_stats = self.task_queue.get_stats()
        pool_stats = self.worker_pool.get_pool_stats()

        with self._lock:
            task_counts: Dict[str, int] = defaultdict(int)
            for task in self.tasks.values():
                task_counts[task.status.value] += 1

        return {
            "queue": queue_stats.__dict__,
            "worker_pool": pool_stats,
            "task_counts": dict(task_counts),
            "total_tasks": len(self.tasks),
        }

    async def _execution_loop(self, executor_id: str) -> None:
        """Background execution loop for dispatching tasks."""

        logger.info("Executor %s started", executor_id)

        while self._running:
            try:
                available_workers = self.worker_pool.get_available_workers()
                if not available_workers:
                    await asyncio.sleep(0.5)
                    continue

                worker = available_workers[0]
                task = self.scheduler.get_next_schedulable_task(worker.id)
                if not task:
                    await asyncio.sleep(0.5)
                    continue

                if self.worker_pool.assign_task(worker.id, task.id):
                    success, execution_time = await self.executor.execute_task(task, worker.id)
                    self.task_queue.record_completion(execution_time, success)
                    self.scheduler.release_resources(task)
            except asyncio.CancelledError:
                break
            except Exception as exc:  # pragma: no cover - guard for runtime errors
                logger.error("Execution loop error in %s: %s", executor_id, exc)
                await asyncio.sleep(1)

        logger.info("Executor %s stopped", executor_id)
