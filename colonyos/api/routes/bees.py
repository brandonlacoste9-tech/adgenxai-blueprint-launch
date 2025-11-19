"""Bee Registry API routes."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/bees", tags=["bees"])

# In-memory bee registry
_bees_registry: Dict[str, Dict[str, Any]] = {}


class BeeRegistrationRequest(BaseModel):
    """Request to register a bee."""

    bee_id: str = Field(..., min_length=1, max_length=255)
    bee_type: str = Field(..., min_length=1, max_length=255)
    model_capabilities: List[str] = Field(default_factory=list)
    version: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BeeResponse(BaseModel):
    """Bee response."""

    bee_id: str
    bee_type: str
    status: str
    model_capabilities: List[str]
    version: Optional[str]
    metadata: Dict[str, Any]
    registered_at: str
    last_heartbeat: str


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_bee(request: BeeRegistrationRequest) -> Dict[str, Any]:
    """Register a new bee in the colony."""

    if request.bee_id in _bees_registry:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Bee {request.bee_id} already registered",
        )

    now = datetime.now(timezone.utc).isoformat()

    bee_data = {
        "bee_id": request.bee_id,
        "bee_type": request.bee_type,
        "status": "ACTIVE",
        "model_capabilities": request.model_capabilities,
        "version": request.version,
        "metadata": request.metadata,
        "registered_at": now,
        "last_heartbeat": now,
    }

    _bees_registry[request.bee_id] = bee_data

    return {
        "success": True,
        "bee_id": request.bee_id,
        "status": "ACTIVE",
        "message": f"Bee {request.bee_id} registered successfully",
    }


@router.get("")
async def list_bees() -> Dict[str, Any]:
    """List all registered bees."""

    bees = list(_bees_registry.values())
    return {
        "bees": bees,
        "count": len(bees),
    }


@router.get("/{bee_id}")
async def get_bee(bee_id: str) -> Dict[str, Any]:
    """Get specific bee details."""

    if bee_id not in _bees_registry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bee {bee_id} not found",
        )

    return _bees_registry[bee_id]


@router.post("/{bee_id}/heartbeat", status_code=status.HTTP_204_NO_CONTENT)
async def update_heartbeat(bee_id: str) -> None:
    """Update bee heartbeat."""

    if bee_id not in _bees_registry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bee {bee_id} not found",
        )

    now = datetime.now(timezone.utc).isoformat()
    _bees_registry[bee_id]["last_heartbeat"] = now
