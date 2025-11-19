"""FastAPI application exposing ColonyOS capabilities."""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from colonyos.core.types import Identity
from colonyos.core.types import Task as ColonyTask
from colonyos.core.types import TaskStatus, WorkerCapability
from colonyos.api.routes import bees, telemetry

logger = logging.getLogger(__name__)


class TaskCreateRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=10_000)
    requirements: Dict[str, Any] = Field(default_factory=dict)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    priority: int = Field(default=5, ge=0, le=10)
    timeout_seconds: int = Field(default=300, ge=1, le=3_600)
    tags: List[str] = Field(default_factory=list)


class TaskResponse(BaseModel):
    id: str
    description: str
    status: str
    created_at: str
    created_by: str
    assigned_worker: Optional[str]
    result: Optional[Any]
    error: Optional[str]
    elapsed_seconds: Optional[float]


class WorkflowCreateRequest(BaseModel):
    goal: str = Field(..., min_length=1, max_length=5_000)
    context: Optional[Dict[str, Any]] = None


class WorkflowResponse(BaseModel):
    id: str
    goal: str
    total_tasks: int
    tasks: List[TaskResponse]


class WorkerRegisterRequest(BaseModel):
    name: str
    capabilities: List[Dict[str, Any]]


class WorkerResponse(BaseModel):
    id: str
    name: str
    status: str
    capabilities: List[Dict[str, Any]]
    current_task: Optional[str]


class ConsensusRequest(BaseModel):
    decision: Dict[str, Any]
    participants: List[str]


class SystemStatsResponse(BaseModel):
    kernel: Dict[str, Any]
    workers: Dict[str, Any]
    tasks: Dict[str, Any]
    uptime_seconds: float


security = HTTPBearer()


class AuthManager:
    """Very small token registry used for API authentication."""

    def __init__(self) -> None:
        self.tokens: Dict[str, Identity] = {}
        self.identity_manager = None

    def set_identity_manager(self, manager) -> None:
        self.identity_manager = manager

    def create_token(self, identity: Identity) -> str:
        token = uuid4().hex
        self.tokens[token] = identity
        return token

    def validate_token(self, token: str) -> Optional[Identity]:
        return self.tokens.get(token)

    def revoke_token(self, token: str) -> None:
        self.tokens.pop(token, None)


auth_manager = AuthManager()


async def get_current_identity(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Identity:
    identity = auth_manager.validate_token(credentials.credentials)
    if not identity:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")
    return identity


class ColonyAPI:
    """FastAPI wrapper around ColonyOS subsystems."""

    def __init__(self, colony_os) -> None:
        self.colony = colony_os
        self.app = FastAPI(title="ColonyOS API", version="0.1.0")
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        # Include external routers
        self.app.include_router(bees.router)
        self.app.include_router(telemetry.router)
        self.active_connections: List[WebSocket] = []
        self._setup_routes()

    def _setup_routes(self) -> None:
        @self.app.get("/health")
        async def health_check() -> Dict[str, Any]:
            return {
                "status": "healthy",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "0.1.0",
            }

        @self.app.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
        async def create_task(request: TaskCreateRequest, identity: Identity = Depends(get_current_identity)):
            task = ColonyTask.create(
                description=request.description,
                created_by=identity.id,
                requirements=request.requirements,
                constraints=request.constraints,
                priority=request.priority,
                timeout_seconds=request.timeout_seconds,
                tags=request.tags,
            )

            approved, violations = await self.colony.guardian.validate_task(task)
            if not approved:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"message": "Task rejected by safety checks", "violations": [v.message for v in violations]},
                )

            routing = self.colony.mind.route_task(task)
            task.metadata["preferred_worker"] = routing.worker_id
            self.colony.body.submit_task(task)

            return self._task_to_response(task)

        @self.app.get("/tasks/{task_id}", response_model=TaskResponse)
        async def get_task(task_id: str, identity: Identity = Depends(get_current_identity)):
            task = self.colony.body.get_task(task_id)
            if not task:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {task_id} not found")
            return self._task_to_response(task)

        @self.app.get("/tasks", response_model=List[TaskResponse])
        async def list_tasks(status: Optional[str] = None, limit: int = 100, identity: Identity = Depends(get_current_identity)):
            tasks = list(self.colony.body.tasks.values())
            if status:
                try:
                    desired = TaskStatus(status)
                    tasks = [task for task in tasks if task.status == desired]
                except ValueError:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {status}")
            tasks.sort(key=lambda task: task.created_at, reverse=True)
            return [self._task_to_response(task) for task in tasks[:limit]]

        @self.app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
        async def cancel_task(task_id: str, identity: Identity = Depends(get_current_identity)) -> None:
            success = self.colony.body.cancel_task(task_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Task cannot be cancelled (already executing or completed)",
                )

        @self.app.post("/workflows", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
        async def create_workflow(request: WorkflowCreateRequest, identity: Identity = Depends(get_current_identity)):
            workflow = self.colony.mind.plan_goal(request.goal, request.context)
            responses: List[TaskResponse] = []
            for node in workflow.nodes.values():
                task = node.task
                approved, violations = await self.colony.guardian.validate_task(task)
                if not approved:
                    logger.warning("Task %s rejected during workflow submission", task.id)
                    continue
                self.colony.body.submit_task(task)
                responses.append(self._task_to_response(task))
            return WorkflowResponse(id=workflow.id, goal=workflow.goal, total_tasks=len(workflow.nodes), tasks=responses)

        @self.app.post("/workers", response_model=WorkerResponse, status_code=status.HTTP_201_CREATED)
        async def register_worker(request: WorkerRegisterRequest, identity: Identity = Depends(get_current_identity)):
            capabilities = [WorkerCapability(**cap) for cap in request.capabilities]
            worker_id = uuid4().hex
            worker = self.colony.create_worker(worker_id, identity, capabilities)
            self.colony.mind.register_worker(worker)
            self.colony.body.register_worker(worker)
            return self._worker_to_response(worker)

        @self.app.get("/workers", response_model=List[WorkerResponse])
        async def list_workers(identity: Identity = Depends(get_current_identity)):
            return [self._worker_to_response(worker) for worker in self.colony.body.worker_pool.workers.values()]

        @self.app.get("/workers/{worker_id}", response_model=WorkerResponse)
        async def get_worker(worker_id: str, identity: Identity = Depends(get_current_identity)):
            worker = self.colony.body.worker_pool.get_worker(worker_id)
            if not worker:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Worker {worker_id} not found")
            return self._worker_to_response(worker)

        @self.app.post("/workers/{worker_id}/heartbeat", status_code=status.HTTP_204_NO_CONTENT)
        async def worker_heartbeat(worker_id: str, cpu_usage: float = 0.0, memory_usage: float = 0.0, identity: Identity = Depends(get_current_identity)):
            self.colony.body.worker_pool.update_heartbeat(worker_id)
            self.colony.body.worker_pool.update_resource_usage(worker_id, cpu_usage, memory_usage)

        @self.app.post("/consensus")
        async def request_consensus(request: ConsensusRequest, identity: Identity = Depends(get_current_identity)):
            approved, result = await self.colony.guardian.request_consensus(request.decision, request.participants)
            return {"approved": approved, "result": result, "timestamp": datetime.now(timezone.utc).isoformat()}

        @self.app.get("/system/stats", response_model=SystemStatsResponse)
        async def get_system_stats(identity: Identity = Depends(get_current_identity)):
            stats = self.colony.body.get_statistics()
            return SystemStatsResponse(
                kernel=stats,
                workers=self.colony.body.worker_pool.get_pool_stats(),
                tasks={"total": len(self.colony.body.tasks), "by_status": stats.get("task_counts", {})},
                uptime_seconds=time.time() - self.colony.start_time,
            )

        @self.app.get("/system/audit")
        async def get_audit_log(event_type: Optional[str] = None, limit: int = 100, identity: Identity = Depends(get_current_identity)):
            return {"entries": self.colony.guardian.get_audit_trail(event_type=event_type, limit=limit)}

        @self.app.post("/system/checkpoint")
        async def create_checkpoint(identity: Identity = Depends(get_current_identity)):
            state = {
                "tasks": {tid: task.to_wire_format() for tid, task in self.colony.body.tasks.items()},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            checkpoint_id = self.colony.guardian.create_checkpoint(state)
            return {"checkpoint_id": checkpoint_id, "timestamp": datetime.now(timezone.utc).isoformat()}

        @self.app.post("/system/rollback/{checkpoint_id}")
        async def rollback_system(checkpoint_id: str, identity: Identity = Depends(get_current_identity)):
            state = await self.colony.guardian.rollback_to_checkpoint(checkpoint_id)
            return {"status": "rolled_back", "checkpoint_id": checkpoint_id, "state": state}

        @self.app.websocket("/ws/events")
        async def websocket_events(websocket: WebSocket) -> None:
            await websocket.accept()
            self.active_connections.append(websocket)

            async def event_handler(event) -> None:
                try:
                    await websocket.send_json(
                        {
                            "type": event.event_type,
                            "data": event.data,
                            "timestamp": event.timestamp.isoformat(),
                            "source": event.source,
                        }
                    )
                except Exception as exc:  # pragma: no cover - websocket errors
                    logger.error("Failed to send WebSocket event: %s", exc)

            subscription_id = await self.colony.event_bus.subscribe("*", event_handler)

            try:
                while True:
                    try:
                        data = await websocket.receive_text()
                        if data == "ping":
                            await websocket.send_text("pong")
                    except WebSocketDisconnect:
                        break
            finally:
                self.active_connections.remove(websocket)
                await self.colony.event_bus.unsubscribe(subscription_id)

    def _task_to_response(self, task: ColonyTask) -> TaskResponse:
        return TaskResponse(
            id=task.id,
            description=task.description,
            status=task.status.value,
            created_at=task.created_at.isoformat(),
            created_by=task.created_by,
            assigned_worker=task.assigned_worker,
            result=task.result,
            error=task.error,
            elapsed_seconds=task.elapsed_seconds,
        )

    def _worker_to_response(self, worker) -> WorkerResponse:
        identity_name = worker.identity.name if worker.identity else "Unknown"
        return WorkerResponse(
            id=worker.id,
            name=identity_name,
            status=worker.status.value,
            capabilities=[cap.__dict__ for cap in worker.capabilities],
            current_task=worker.current_task_id,
        )


def create_api_server(colony_os, host: str = "0.0.0.0", port: int = 8000):
    api = ColonyAPI(colony_os)
    auth_manager.set_identity_manager(colony_os.identity_manager)
    return api, host, port


async def run_api_server(colony_os, host: str = "0.0.0.0", port: int = 8000) -> None:
    api, host, port = create_api_server(colony_os, host, port)
    import uvicorn

    config = uvicorn.Config(api.app, host=host, port=port, log_level="info", access_log=True)
    server = uvicorn.Server(config)
    logger.info("Starting API server on %s:%s", host, port)
    await server.serve()
