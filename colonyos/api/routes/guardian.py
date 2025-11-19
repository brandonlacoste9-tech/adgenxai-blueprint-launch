"""
Guardian Consensus API
Consensus voting and audit logging endpoints
"""

from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any

from colonyos.guardian.consensus import consensus_engine

router = APIRouter(prefix="/api/v1/guardian", tags=["guardian"])


class ConsensusRequest(BaseModel):
    """Request for consensus voting"""
    decision_id: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1, max_length=2000)
    guardians: List[str] = Field(
        default_factory=lambda: ["guardian-1", "guardian-2", "guardian-3"]
    )


class AuditLogResponse(BaseModel):
    """Audit log response"""
    audit_log: List[Dict[str, Any]]
    valid: bool
    statistics: Dict[str, Any]


@router.post("/consensus", status_code=status.HTTP_201_CREATED)
async def request_consensus(request: ConsensusRequest) -> Dict[str, Any]:
    """Request guardian consensus vote"""
    result = consensus_engine.request_consensus(
        request.decision_id,
        request.description,
        request.guardians
    )
    return result


@router.get("/audit_log")
async def get_audit_log(decision_id: str = None) -> AuditLogResponse:
    """Retrieve guardian audit log"""
    audit_log = consensus_engine.get_audit_log(decision_id)
    is_valid = consensus_engine.verify_audit_log()
    statistics = consensus_engine.get_statistics()

    return AuditLogResponse(
        audit_log=audit_log,
        valid=is_valid,
        statistics=statistics
    )


@router.get("/statistics")
async def get_statistics() -> Dict[str, Any]:
    """Get consensus statistics"""
    return consensus_engine.get_statistics()
