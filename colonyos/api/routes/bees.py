"""Bee Registry API routes."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4
import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from colonyos.mind.semantic_router import semantic_router

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/bees", tags=["bees"])

# In-memory bee registry
_bees_registry: Dict[str, Dict[str, Any]] = {}


class BeeRegistrationRequest(BaseModel):
    bee_id: str = Field(..., min_length=1, max_length=255)
    bee_type: str = Field(..., min_length=1, max_length=255)
    model_capabilities: List[str] = Field(default_factory=list)
    version: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class HeartbeatRequest(BaseModel):
    status: str = Field(default="ACTIVE", min_length=1, max_length=50)
    timestamp: Optional[str] = None


class BeeResponse(BaseModel):
    bee_id: str
    bee_type: str
    status: str
    model_capabilities: List[str]
    version: Optional[str]
    metadata: Optional[Dict[str, Any]]
    registered_at: str
    last_heartbeat: str


class BeesListResponse(BaseModel):
    bees: List[BeeResponse]
    count: int


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_bee(request: BeeRegistrationRequest) -> Dict[str, Any]:
    """Register a new bee in the colony."""
    if request.bee_id in _bees_registry:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Bee {request.bee_id} is already registered",
        )

    now = datetime.now(timezone.utc).isoformat()
    bee_data = {
        "bee_id": request.bee_id,
        "bee_type": request.bee_type,
        "status": "ACTIVE",
        "model_capabilities": request.model_capabilities,
        "version": request.version,
        "metadata": request.metadata or {},
        "registered_at": now,
        "last_heartbeat": now,
    }

    _bees_registry[request.bee_id] = bee_data

    # Auto-register capabilities in semantic router
    if request.model_capabilities:
        try:
            semantic_router.register_bee_capabilities(request.bee_id, request.model_capabilities)
            logger.info(f"Registered capabilities for {request.bee_id} in semantic router")
        except Exception as e:
            logger.warning(f"Failed to register capabilities in semantic router: {e}")

    return {"success": True, "bee_id": request.bee_id, "message": f"Bee {request.bee_id} registered successfully"}


@router.get("", response_model=BeesListResponse)
async def list_bees() -> BeesListResponse:
    """List all registered bees."""
    bees = [
        BeeResponse(
            bee_id=bee["bee_id"],
            bee_type=bee["bee_type"],
            status=bee["status"],
            model_capabilities=bee["model_capabilities"],
            version=bee["version"],
            metadata=bee["metadata"],
            registered_at=bee["registered_at"],
            last_heartbeat=bee["last_heartbeat"],
        )
        for bee in _bees_registry.values()
    ]
    return BeesListResponse(bees=bees, count=len(bees))


@router.get("/{bee_id}", response_model=BeeResponse)
async def get_bee(bee_id: str) -> BeeResponse:
    """Get details of a specific bee."""
    if bee_id not in _bees_registry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Bee {bee_id} not found")

    bee = _bees_registry[bee_id]
    return BeeResponse(
        bee_id=bee["bee_id"],
        bee_type=bee["bee_type"],
        status=bee["status"],
        model_capabilities=bee["model_capabilities"],
        version=bee["version"],
        metadata=bee["metadata"],
        registered_at=bee["registered_at"],
        last_heartbeat=bee["last_heartbeat"],
    )


@router.post("/{bee_id}/heartbeat", status_code=status.HTTP_204_NO_CONTENT)
async def bee_heartbeat(bee_id: str, request: HeartbeatRequest) -> None:
    """Update bee heartbeat."""
    if bee_id not in _bees_registry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Bee {bee_id} not found")

    now = datetime.now(timezone.utc).isoformat()
    _bees_registry[bee_id]["status"] = request.status
    _bees_registry[bee_id]["last_heartbeat"] = request.timestamp or now
