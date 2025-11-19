"""
Real-time WebSocket Service
Publishes events to Centrifugo (optional, with graceful fallback)
"""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class RealtimeService:
    """
    Real-time event broadcasting service
    Supports Centrifugo for production, graceful degradation without it
    """

    def __init__(self, centrifugo_url: Optional[str] = None, api_key: Optional[str] = None):
        """Initialize realtime service"""
        self.centrifugo_url = centrifugo_url or "http://localhost:8000"
        self.api_key = api_key or "api_key"
        self.api_endpoint = f"{self.centrifugo_url}/api"
        self.connected = False
        self._test_connection()

    def _test_connection(self) -> None:
        """Test if Centrifugo is available"""
        try:
            import httpx
            with httpx.Client(timeout=2.0) as client:
                response = client.get(f"{self.centrifugo_url}/info")
                self.connected = response.status_code in [200, 401]
                if self.connected:
                    logger.info("Connected to Centrifugo")
                else:
                    logger.warning("Centrifugo returned unexpected status code")
        except Exception as e:
            logger.warning(f"Centrifugo not available: {e}. Running in degraded mode.")
            self.connected = False

    async def publish_event(self, channel: str, data: Dict[str, Any]) -> bool:
        """Publish event to Centrifugo channel"""
        if not self.connected:
            logger.debug(f"[OFFLINE MODE] Would publish to {channel}: {data}")
            return True  # Graceful degradation

        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_endpoint}/publish",
                    headers={"Authorization": f"apikey {self.api_key}"},
                    json={"channel": channel, "data": data},
                    timeout=5.0,
                )
                response.raise_for_status()
                logger.debug(f"Published to channel {channel}")
                return True
        except Exception as e:
            logger.error(f"Failed to publish to {channel}: {e}")
            return False

    def publish_event_sync(self, channel: str, data: Dict[str, Any]) -> bool:
        """Synchronous publish (for sync code paths)"""
        if not self.connected:
            logger.debug(f"[OFFLINE MODE] Would publish to {channel}: {data}")
            return True

        try:
            import httpx
            with httpx.Client() as client:
                response = client.post(
                    f"{self.api_endpoint}/publish",
                    headers={"Authorization": f"apikey {self.api_key}"},
                    json={"channel": channel, "data": data},
                    timeout=5.0,
                )
                response.raise_for_status()
                logger.debug(f"Published to channel {channel}")
                return True
        except Exception as e:
            logger.error(f"Failed to publish to {channel}: {e}")
            return False


# Global instance
realtime_service = RealtimeService()
