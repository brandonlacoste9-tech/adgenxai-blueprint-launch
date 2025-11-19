"""Task Management API - Handle task submission and tracking."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])

# In-memory task storage (TODO: migrate to database)
_tasks_db: Dict[str, Dict[str, Any]] = {}


class TaskSubmissionRequest(BaseModel):
    """Task submission from external bee (e.g., KOLONI Studio)."""

    task_type: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1, max_length=2000)
    payload: Dict[str, Any] = Field(default_factory=dict)
    callback_url: Optional[str] = Field(None, max_length=2000)
    bee_id: Optional[str] = Field(None, min_length=1, max_length=255)


class TaskCompletionRequest(BaseModel):
    """Task completion report from bee."""

    result: Optional[Dict[str, Any]] = Field(None)
    status: str = Field(..., regex="^(success|failed)$")
    error: Optional[str] = Field(None, max_length=2000)


class TaskResponse(BaseModel):
    """Task response."""

    task_id: str
    status: str
    message: str


class TaskStatusResponse(BaseModel):
    """Task status response."""

    task_id: str
    task_type: str
    description: str
    status: str
    submitted_at: str
    completed_at: Optional[str] = None
    assigned_bee: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    callback_url: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TaskResponse)
async def submit_task(request: TaskSubmissionRequest) -> Dict[str, Any]:
    """Submit task to ColonyOS for routing to best bee."""

    task_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat()

    task_data = {
        "task_id": task_id,
        "task_type": request.task_type,
        "description": request.description,
        "payload": request.payload,
        "callback_url": request.callback_url,
        "bee_id": request.bee_id,
        "status": "pending",
        "submitted_at": now,
        "completed_at": None,
        "assigned_bee": None,
        "result": None,
        "error": None,
    }

    _tasks_db[task_id] = task_data

    logger.info(
        f"Task submitted: {task_id} (type: {request.task_type}, description: {request.description[:50]})"
    )

    return {
        "task_id": task_id,
        "status": "pending",
        "message": f"Task {task_id} submitted successfully",
    }


@router.get("/{task_id}/status", response_model=TaskStatusResponse)
async def get_task_status(task_id: str) -> Dict[str, Any]:
    """Get task status and result."""

    if task_id not in _tasks_db:
        logger.warning(f"Task not found: {task_id}")
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    return _tasks_db[task_id]


@router.post("/{task_id}/status", status_code=status.HTTP_200_OK)
async def update_task_status(task_id: str, update: TaskCompletionRequest) -> Dict[str, Any]:
    """Bee reports task completion status."""

    if task_id not in _tasks_db:
        logger.warning(f"Task not found for status update: {task_id}")
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    task = _tasks_db[task_id]
    now = datetime.now(timezone.utc).isoformat()

    # Update task status
    task["status"] = "completed" if update.status == "success" else "failed"
    task["completed_at"] = now
    task["result"] = update.result
    task["error"] = update.error

    logger.info(
        f"Task {task_id} completed with status: {update.status}"
    )

    # TODO: If callback_url exists, POST result to it
    if task.get("callback_url"):
        logger.info(f"TODO: Send callback to {task['callback_url']}")

    return {
        "success": True,
        "task_id": task_id,
        "message": f"Task {task_id} status updated",
    }


@router.get("", response_model=Dict[str, Any])
async def list_tasks(
    status: Optional[str] = None,
    bee_id: Optional[str] = None,
    limit: int = 100,
) -> Dict[str, Any]:
    """List all tasks with optional filtering."""

    tasks = list(_tasks_db.values())

    # Filter by status
    if status:
        tasks = [t for t in tasks if t["status"] == status]

    # Filter by bee_id
    if bee_id:
        tasks = [t for t in tasks if t["assigned_bee"] == bee_id]

    # Limit results
    tasks = tasks[-limit:]

    return {
        "tasks": tasks,
        "count": len(tasks),
        "total": len(_tasks_db),
    }


@router.get("/stats", response_model=Dict[str, Any])
async def get_task_stats() -> Dict[str, Any]:
    """Get task statistics."""

    tasks = list(_tasks_db.values())

    stats = {
        "total": len(tasks),
        "pending": len([t for t in tasks if t["status"] == "pending"]),
        "completed": len([t for t in tasks if t["status"] == "completed"]),
        "failed": len([t for t in tasks if t["status"] == "failed"]),
    }

    return stats
