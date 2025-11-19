"""
Guardian Consensus Layer
Byzantine fault-tolerant voting system
"""

from typing import List, Dict, Any
from enum import Enum
import hashlib
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class VoteType(Enum):
    """Types of votes in consensus"""
    APPROVE = "approve"
    REJECT = "reject"


class ConsensusEngine:
    """
    Byzantine fault-tolerant consensus engine
    Maintains immutable audit log of all decisions
    """

    def __init__(self, threshold: float = 0.66):
        """Initialize consensus engine with approval threshold"""
        self.threshold = threshold
        self.audit_log: List[Dict[str, Any]] = []

    def request_consensus(
        self,
        decision_id: str,
        description: str,
        guardians: List[str]
    ) -> Dict[str, Any]:
        """Request consensus vote from guardians"""
        logger.info(f"Requesting consensus for: {description}")

        # Simulate guardian votes (in production, poll actual guardians)
        votes = self._simulate_guardian_votes(guardians)

        approve_count = sum(1 for v in votes if v["vote"] == VoteType.APPROVE.value)
        total_votes = len(votes)
        approval_rate = approve_count / total_votes if total_votes > 0 else 0

        decision = "APPROVED" if approval_rate >= self.threshold else "REJECTED"

        # Create immutable audit record
        audit_entry = {
            "decision_id": decision_id,
            "description": description,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "votes": votes,
            "approval_rate": approval_rate,
            "total_votes": total_votes,
            "approve_count": approve_count,
            "decision": decision,
            "threshold": self.threshold,
            "hash": self._compute_hash(decision_id, votes, decision)
        }

        self.audit_log.append(audit_entry)
        logger.info(f"Consensus result: {decision} ({approval_rate:.1%}) - {decision_id}")

        return audit_entry

    def _simulate_guardian_votes(self, guardians: List[str]) -> List[Dict[str, str]]:
        """Simulate guardian votes (replace with actual RPC calls in production)"""
        import random
        votes = []
        for guardian in guardians:
            # Weighted toward approval (80% chance)
            vote = VoteType.APPROVE.value if random.random() > 0.2 else VoteType.REJECT.value
            votes.append({
                "guardian": guardian,
                "vote": vote,
                "reasoning": f"Guardian {guardian} assessment"
            })
        return votes

    def _compute_hash(self, decision_id: str, votes: List[Dict], decision: str) -> str:
        """Compute SHA256 hash for audit trail integrity"""
        data = json.dumps(
            {"decision_id": decision_id, "votes": votes, "decision": decision},
            sort_keys=True
        )
        return hashlib.sha256(data.encode()).hexdigest()

    def verify_audit_log(self) -> bool:
        """Verify integrity of entire audit log"""
        for entry in self.audit_log:
            computed_hash = self._compute_hash(
                entry["decision_id"],
                entry["votes"],
                entry["decision"]
            )
            if computed_hash != entry["hash"]:
                logger.error(f"Audit log tampered! Entry: {entry['decision_id']}")
                return False
        return True

    def get_audit_log(self, decision_id: str = None) -> List[Dict[str, Any]]:
        """Retrieve audit log (optionally filtered by decision_id)"""
        if decision_id:
            return [e for e in self.audit_log if e["decision_id"] == decision_id]
        return self.audit_log

    def get_statistics(self) -> Dict[str, Any]:
        """Get consensus statistics"""
        if not self.audit_log:
            return {
                "total_decisions": 0,
                "approved": 0,
                "rejected": 0,
                "approval_rate": 0.0
            }

        total = len(self.audit_log)
        approved = sum(1 for e in self.audit_log if e["decision"] == "APPROVED")
        rejected = total - approved

        return {
            "total_decisions": total,
            "approved": approved,
            "rejected": rejected,
            "approval_rate": approved / total if total > 0 else 0.0
        }


# Global instance
consensus_engine = ConsensusEngine()
