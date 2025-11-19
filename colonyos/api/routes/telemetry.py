"""Telemetry API routes."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from collections import deque

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/telemetry", tags=["telemetry"])

# In-memory circular buffer for telemetry events (max 10,000 events)
_telemetry_events: deque = deque(maxlen=10000)


class TelemetryEventRequest(BaseModel):
    """Telemetry event from a bee."""

    bee_id: str = Field(..., min_length=1, max_length=255)
    event: str = Field(..., min_length=1, max_length=255)
    data: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_telemetry_event(request: TelemetryEventRequest) -> Dict[str, Any]:
    """Record a telemetry event from a bee."""

    now = datetime.now(timezone.utc).isoformat()

    event_data = {
        "bee_id": request.bee_id,
        "event": request.event,
        "data": request.data or {},
        "timestamp": request.timestamp or now,
    }

    _telemetry_events.append(event_data)

    return {
        "success": True,
        "message": f"Telemetry event '{request.event}' recorded",
    }


@router.get("")
async def get_telemetry(
    bee_id: Optional[str] = None,
    limit: int = 50,
) -> Dict[str, Any]:
    """Get telemetry events."""

    events = list(_telemetry_events)

    # Filter by bee_id if provided
    if bee_id:
        events = [e for e in events if e["bee_id"] == bee_id]

    # Return most recent events up to limit
    events = events[-limit:]

    return {
        "events": events,
        "count": len(events),
    }
