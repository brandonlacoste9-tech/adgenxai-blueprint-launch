"""gRPC service definitions for ColonyOS."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import grpc

logger = logging.getLogger(__name__)


class ColonyGRPCService:  # pragma: no cover - placeholder implementation
    """Skeleton gRPC service to be fleshed out in production."""

    def __init__(self, colony_os) -> None:
        self.colony = colony_os

    async def SubmitTask(self, request, context):  # type: ignore[override]
        await context.abort(grpc.StatusCode.UNIMPLEMENTED, "SubmitTask not implemented")

    async def GetTask(self, request, context):  # type: ignore[override]
        await context.abort(grpc.StatusCode.UNIMPLEMENTED, "GetTask not implemented")

    async def StreamEvents(self, request, context):  # type: ignore[override]
        await context.abort(grpc.StatusCode.UNIMPLEMENTED, "StreamEvents not implemented")


async def serve_grpc(colony_os, port: int = 50_051) -> None:
    server = grpc.aio.server()
    server.add_insecure_port(f"[::]:{port}")
    await server.start()
    logger.info("gRPC server started on port %s", port)
    await server.wait_for_termination()
