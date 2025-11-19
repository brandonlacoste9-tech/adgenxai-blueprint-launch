"""
Task Routing API
Uses semantic router to assign tasks to bees
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from colonyos.mind.semantic_router import semantic_router

router = APIRouter(prefix="/api/v1/routing", tags=["routing"])


class RouteTaskRequest(BaseModel):
    task_description: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=10)


class RouteTaskResponse(BaseModel):
    task_description: str
    best_bee: str
    candidates: List[Dict[str, Any]]


class RegisterCapabilitiesRequest(BaseModel):
    capabilities: List[str] = Field(default_factory=list)


@router.post("/route", response_model=RouteTaskResponse)
async def route_task(request: RouteTaskRequest) -> RouteTaskResponse:
    """Route task to best bee(s) using semantic matching"""
    try:
        candidates = semantic_router.route_task(
            request.task_description,
            request.top_k
        )

        if not candidates:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No suitable bees found for this task"
            )

        return RouteTaskResponse(
            task_description=request.task_description,
            best_bee=candidates[0]["bee_id"],
            candidates=candidates
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Routing failed: {str(e)}"
        )


@router.post("/register_capabilities/{bee_id}", status_code=status.HTTP_201_CREATED)
async def register_capabilities(bee_id: str, request: RegisterCapabilitiesRequest) -> Dict[str, Any]:
    """Register bee capabilities in semantic router"""
    try:
        if not request.capabilities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Capabilities list cannot be empty"
            )

        semantic_router.register_bee_capabilities(bee_id, request.capabilities)
        return {
            "success": True,
            "bee_id": bee_id,
            "capabilities": request.capabilities,
            "message": f"Capabilities registered for bee {bee_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register capabilities: {str(e)}"
        )
