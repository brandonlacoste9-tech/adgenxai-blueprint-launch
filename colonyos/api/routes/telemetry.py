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
    bee_id: str = Field(..., min_length=1, max_length=255)
    event: str = Field(..., min_length=1, max_length=255)
    data: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None


class TelemetryEventResponse(BaseModel):
    bee_id: str
    event: str
    data: Optional[Dict[str, Any]]
    timestamp: str


class TelemetryListResponse(BaseModel):
    events: List[TelemetryEventResponse]
    count: int


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

    return {"success": True, "message": f"Telemetry event '{request.event}' recorded"}


@router.get("", response_model=TelemetryListResponse)
async def get_telemetry(bee_id: Optional[str] = None, limit: int = 50) -> TelemetryListResponse:
    """Retrieve telemetry events."""
    # Get events in reverse order (most recent first)
    events_list = list(reversed(list(_telemetry_events)))

    # Filter by bee_id if provided
    if bee_id:
        events_list = [e for e in events_list if e["bee_id"] == bee_id]

    # Apply limit
    events_list = events_list[:limit]

    # Convert to response objects
    telemetry_events = [
        TelemetryEventResponse(
            bee_id=e["bee_id"],
            event=e["event"],
            data=e["data"],
            timestamp=e["timestamp"],
        )
        for e in events_list
    ]

    return TelemetryListResponse(events=telemetry_events, count=len(telemetry_events))
