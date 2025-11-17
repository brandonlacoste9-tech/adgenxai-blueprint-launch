"""Priority queue and scheduler for ColonyOS tasks."""

from __future__ import annotations

import heapq
import logging
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional

from colonyos.core.models import Task

logger = logging.getLogger(__name__)


@dataclass(order=True)
class QueuedTask:
    """Task wrapper with scheduling metadata."""

    priority: int = field(compare=True)
    task: Task = field(compare=False)
    task_id: Optional[str] = field(default=None, compare=False)
    deadline: Optional[datetime] = field(default=None, compare=False)
    enqueued_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc), compare=False
    )
    attempts: int = field(default=0, compare=False)

    def __post_init__(self) -> None:
        # Invert priority for min-heap (lower number == higher priority)
        object.__setattr__(self, "priority", -self.priority)

    def is_overdue(self) -> bool:
        """Check if task is past its scheduling deadline."""

        if self.deadline is None:
            return False
        return datetime.now(timezone.utc) > self.deadline


@dataclass
class QueueStats:
    """Aggregated queue statistics."""

    total_enqueued: int = 0
    total_completed: int = 0
    total_failed: int = 0
    total_retried: int = 0
    avg_wait_time: float = 0.0
    avg_execution_time: float = 0.0
    current_queue_size: int = 0


class PriorityTaskQueue:
    """Thread-safe priority queue with advanced scheduling."""

    def __init__(self, max_size: int = 10_000):
        self.max_size = max_size
        self._heap: List[QueuedTask] = []
        self._lock = threading.RLock()
        self._task_index: Dict[str, QueuedTask] = {}
        self._stats = QueueStats()
        self._worker_assignments: Dict[str, int] = {}

    def enqueue(
        self,
        task: Task,
        priority: Optional[int] = None,
        deadline: Optional[datetime] = None,
    ) -> bool:
        """Add a task to the queue."""

        with self._lock:
            if len(self._heap) >= self.max_size:
                logger.warning("Queue full (%s), rejecting task %s", self.max_size, task.id)
                return False

            if priority is None:
                priority = task.priority

            queued_task = QueuedTask(
                priority=priority,
                deadline=deadline,
                task_id=task.id,
                task=task,
            )

            heapq.heappush(self._heap, queued_task)
            self._task_index[task.id] = queued_task
            self._stats.total_enqueued += 1
            self._stats.current_queue_size = len(self._task_index)

            logger.debug("Enqueued task %s with priority %s", task.id, priority)
            return True

    def dequeue(self, worker_id: Optional[str] = None) -> Optional[Task]:
        """Remove and return the highest priority task."""

        with self._lock:
            if not self._heap:
                return None

            self._promote_overdue_tasks()

            while self._heap:
                queued_task = heapq.heappop(self._heap)
                if queued_task.task_id is None:
                    continue

                self._task_index.pop(queued_task.task_id, None)

                if worker_id:
                    self._worker_assignments[worker_id] = (
                        self._worker_assignments.get(worker_id, 0) + 1
                    )

                wait_time = (
                    datetime.now(timezone.utc) - queued_task.enqueued_at
                ).total_seconds()
                self._update_avg_wait_time(wait_time)
                self._stats.current_queue_size = len(self._task_index)

                logger.debug(
                    "Dequeued task %s (waited %.1fs)", queued_task.task_id, wait_time
                )
                return queued_task.task

            return None

    def peek(self) -> Optional[Task]:
        """View the next task without removing it."""

        with self._lock:
            while self._heap and self._heap[0].task_id is None:
                heapq.heappop(self._heap)
            if not self._heap:
                return None
            return self._heap[0].task

    def remove(self, task_id: str) -> bool:
        """Remove a specific task from the queue."""

        with self._lock:
            if task_id not in self._task_index:
                return False

            queued_task = self._task_index[task_id]
            queued_task.task_id = None
            del self._task_index[task_id]
            self._stats.current_queue_size = len(self._task_index)
            return True

    def get_task(self, task_id: str) -> Optional[Task]:
        """Fetch a queued task without removing it."""

        with self._lock:
            queued = self._task_index.get(task_id)
            return queued.task if queued else None

    def requeue(self, task: Task, increase_priority: bool = True) -> None:
        """Reinsert a task for another attempt."""

        with self._lock:
            if task.id in self._task_index:
                return

            priority = task.priority - 1 if increase_priority else task.priority
            self.enqueue(task, priority=priority)
            self._stats.total_retried += 1

    def _promote_overdue_tasks(self) -> None:
        """Boost priority of overdue tasks."""

        overdue = [qt for qt in self._heap if qt.task_id and qt.is_overdue()]
        if not overdue:
            return

        for qt in overdue:
            qt.priority = -1000

        heapq.heapify(self._heap)
        logger.info("Promoted %s overdue tasks", len(overdue))

    def _update_avg_wait_time(self, wait_time: float) -> None:
        """Update the exponential moving average for queue wait time."""

        alpha = 0.1
        self._stats.avg_wait_time = alpha * wait_time + (1 - alpha) * self._stats.avg_wait_time

    def get_stats(self) -> QueueStats:
        """Return a snapshot of queue statistics."""

        with self._lock:
            return QueueStats(
                total_enqueued=self._stats.total_enqueued,
                total_completed=self._stats.total_completed,
                total_failed=self._stats.total_failed,
                total_retried=self._stats.total_retried,
                avg_wait_time=self._stats.avg_wait_time,
                avg_execution_time=self._stats.avg_execution_time,
                current_queue_size=self._stats.current_queue_size,
            )

    def record_completion(self, execution_time: float, success: bool) -> None:
        """Record completion metrics."""

        with self._lock:
            if success:
                self._stats.total_completed += 1
            else:
                self._stats.total_failed += 1

            alpha = 0.1
            self._stats.avg_execution_time = (
                alpha * execution_time + (1 - alpha) * self._stats.avg_execution_time
            )

    def size(self) -> int:
        """Return the number of pending tasks."""

        with self._lock:
            return len(self._task_index)

    def clear(self) -> None:
        """Remove all tasks from the queue."""

        with self._lock:
            self._heap.clear()
            self._task_index.clear()
            self._stats.current_queue_size = 0


class TaskScheduler:
    """Resource-aware task scheduler."""

    def __init__(self, queue: PriorityTaskQueue):
        self.queue = queue
        self.resource_limits = {"cpu": 1.0, "memory": 1.0, "gpu": 1.0}
        self.resource_usage = {"cpu": 0.0, "memory": 0.0, "gpu": 0.0}
        self._lock = threading.RLock()

    def can_schedule(self, task: Task) -> bool:
        """Check if sufficient resources remain for a task."""

        with self._lock:
            required = task.constraints.get("resources", {})
            for resource, amount in required.items():
                if resource not in self.resource_limits:
                    continue
                available = self.resource_limits[resource] - self.resource_usage[resource]
                if amount > available:
                    return False
            return True

    def allocate_resources(self, task: Task) -> None:
        """Reserve resources for the lifetime of a task."""

        with self._lock:
            required = task.constraints.get("resources", {})
            for resource, amount in required.items():
                if resource in self.resource_usage:
                    self.resource_usage[resource] += amount
            logger.debug("Allocated resources for task %s: %s", task.id, required)

    def release_resources(self, task: Task) -> None:
        """Release resources after execution."""

        with self._lock:
            required = task.constraints.get("resources", {})
            for resource, amount in required.items():
                if resource in self.resource_usage:
                    self.resource_usage[resource] = max(
                        0.0, self.resource_usage[resource] - amount
                    )
            logger.debug("Released resources for task %s", task.id)

    def get_next_schedulable_task(self, worker_id: str) -> Optional[Task]:
        """Return the next task that fits the resource envelope."""

        max_attempts = 10
        for _ in range(max_attempts):
            task = self.queue.peek()
            if task is None:
                return None
            if self.can_schedule(task):
                task = self.queue.dequeue(worker_id)
                if task:
                    self.allocate_resources(task)
                return task
            break
        return None
