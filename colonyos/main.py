"""Main ColonyOS application entrypoint."""

from __future__ import annotations

import asyncio
import logging
import signal
import sys
import time
from typing import List

from colonyos.api.rest import run_api_server
from colonyos.body import ColonyKernel
from colonyos.core.event_bus import EventBus, InMemoryEventBus, RedisEventBus
from colonyos.core.memory import HybridMemory, RedisMemory, SQLiteMemory, VectorMemory
from colonyos.core.types import ColonyConfig, Identity, IdentityManager, Worker, WorkerCapability, WorkerStatus
from colonyos.guardian.neurasphere import Neurasphere
from colonyos.mind.neurosphere import Neurosphere

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class ColonyOS:
    """Top-level orchestrator wiring together all ColonyOS layers."""

    def __init__(self, config: ColonyConfig) -> None:
        self.config = config
        self.start_time = time.time()
        self.identity_manager = IdentityManager()
        self.system_identity, _ = self.identity_manager.create_identity("ColonyOS-System")

        if config.event_bus_type == "redis" and config.message_queue_url:
            backend = RedisEventBus(config.message_queue_url)
        else:
            backend = InMemoryEventBus()
        self.event_bus = EventBus(backend)

        if config.memory_backend == "redis" and config.message_queue_url:
            relational = RedisMemory(config.message_queue_url)
        else:
            relational = SQLiteMemory(config.memory_connection_string)
        vector = VectorMemory() if config.vector_db_backend == "chromadb" else None
        self.memory = HybridMemory(relational, vector)

        self.mind = Neurosphere(config, self.memory, self.event_bus)
        self.mind.set_identity(self.system_identity)
        self.guardian = Neurasphere(config, self.memory, self.event_bus, self.identity_manager)
        self.guardian.set_identity(self.system_identity)
        self.body = ColonyKernel(config, self.memory, self.event_bus)

    async def start(self) -> None:
        logger.info("Starting ColonyOS")
        await self.event_bus.start()
        await self.body.start()
        initial_state = {"initialized": True, "timestamp": time.time()}
        self.guardian.create_checkpoint(initial_state)
        logger.info("ColonyOS started")

    async def stop(self) -> None:
        logger.info("Stopping ColonyOS")
        await self.body.stop()
        await self.event_bus.stop()
        logger.info("ColonyOS stopped")

    def create_worker(self, worker_id: str, identity: Identity, capabilities: List[WorkerCapability]) -> Worker:
        return Worker(id=worker_id, identity=identity, capabilities=capabilities, status=WorkerStatus.IDLE)

    def get_status(self) -> dict:
        return {
            "status": "running",
            "uptime_seconds": time.time() - self.start_time,
            "system_id": self.config.system_id,
        }


async def main() -> None:
    config = ColonyConfig()
    colony = ColonyOS(config)

    async def shutdown_handler():
        await colony.stop()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda s=sig: asyncio.create_task(shutdown_handler()))

    await colony.start()
    try:
        await run_api_server(colony)
    finally:
        await colony.stop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
