"""
Semantic Router - Mind Layer
Routes tasks to best bee using vector similarity
"""

from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

# In-memory storage for bees and their capabilities
_bee_capabilities: Dict[str, List[str]] = {}

class SemanticRouter:
    def __init__(self):
        """Initialize semantic router (Qdrant optional for now)"""
        self.bees = _bee_capabilities
        self.encoder = None
        self._init_encoder()

    def _init_encoder(self):
        """Initialize sentence transformer for embeddings"""
        try:
            from sentence_transformers import SentenceTransformer
            self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Sentence transformer loaded")
        except Exception as e:
            logger.warning(f"Could not load encoder: {e}. Using text-based matching.")

    def register_bee_capabilities(self, bee_id: str, capabilities: List[str]) -> None:
        """Store bee capabilities"""
        self.bees[bee_id] = capabilities
        logger.info(f"Registered capabilities for bee {bee_id}: {capabilities}")

    def _text_similarity(self, text1: str, text2: str) -> float:
        """Simple text-based similarity fallback"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        if not words1 or not words2:
            return 0.0
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        return intersection / union if union > 0 else 0.0

    def route_task(self, task_description: str, top_k: int = 5) -> List[Dict]:
        """Find best bees for task using semantic/text matching"""
        if not self.bees:
            logger.warning("No bees registered for routing")
            return []

        candidates = []

        for bee_id, capabilities in self.bees.items():
            capabilities_text = ", ".join(capabilities)

            # Try vector similarity if encoder available
            if self.encoder:
                try:
                    task_embedding = self.encoder.encode(task_description)
                    cap_embedding = self.encoder.encode(capabilities_text)
                    from sklearn.metrics.pairwise import cosine_similarity
                    import numpy as np
                    similarity = cosine_similarity(
                        np.array([task_embedding]),
                        np.array([cap_embedding])
                    )[0][0]
                except Exception:
                    # Fallback to text matching
                    similarity = self._text_similarity(task_description, capabilities_text)
            else:
                # Use text-based matching
                similarity = self._text_similarity(task_description, capabilities_text)

            candidates.append({
                "bee_id": bee_id,
                "capabilities": capabilities,
                "similarity_score": float(similarity),
                "reasoning": f"Semantic match: {similarity:.2%}"
            })

        # Sort by similarity and return top_k
        candidates.sort(key=lambda x: x["similarity_score"], reverse=True)
        result = candidates[:top_k]
        logger.info(f"Found {len(result)} candidates for task")
        return result

    def get_best_bee(self, task_description: str) -> Optional[Dict]:
        """Get single best bee for task"""
        candidates = self.route_task(task_description, top_k=1)
        return candidates[0] if candidates else None


# Global instance
semantic_router = SemanticRouter()
