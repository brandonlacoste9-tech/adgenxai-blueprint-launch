"""
Temporal Worker
Listens for workflow tasks and executes them
"""

import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def run_worker():
    """Start the Temporal worker"""
    try:
        from temporalio.client import Client
        from temporalio.worker import Worker
        from colonyos.workflows.bee_task_workflow import BeeTaskWorkflow
        from colonyos.workflows import activities

        logger.info("Connecting to Temporal...")
        client = await Client.connect("localhost:7233")

        logger.info("Creating worker...")
        worker = Worker(
            client,
            task_queue="colony-tasks",
            workflows=[BeeTaskWorkflow],
            activities=[
                activities.route_task,
                activities.execute_on_bee,
                activities.record_telemetry
            ]
        )

        logger.info("🐝 Temporal worker started - listening for tasks on queue 'colony-tasks'...")
        await worker.run()
    except Exception as e:
        logger.error(f"Failed to start worker: {e}")
        logger.info("Falling back to polling mode (Temporal optional)")


if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        logger.info("Worker shut down")
