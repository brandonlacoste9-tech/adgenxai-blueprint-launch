"""
Temporal Workflow for Bee Task Execution
Provides durable, retryable task orchestration
"""

try:
    from temporalio import workflow
    from temporalio.common import RetryPolicy
    from datetime import timedelta
    import logging

    logger = logging.getLogger(__name__)

    @workflow.defn
    class BeeTaskWorkflow:
        """Main workflow for executing tasks on bees"""

        @workflow.run
        async def run(self, task_id: str, bee_id: str, task_type: str, payload: dict) -> dict:
            """Execute bee task with retry logic"""
            logger.info(f"Starting workflow for task {task_id}")

            # Step 1: Route task to best bee
            route_result = await workflow.execute_activity(
                "route_task",
                args=[payload.get("description", "")],
                start_to_close_timeout=timedelta(seconds=30),
                retry_policy=RetryPolicy(maximum_attempts=3)
            )

            # Step 2: Execute task on selected bee
            execution_result = await workflow.execute_activity(
                "execute_on_bee",
                args=[route_result["best_bee"], task_type, payload],
                start_to_close_timeout=timedelta(minutes=5),
                retry_policy=RetryPolicy(
                    maximum_attempts=5,
                    initial_interval=timedelta(seconds=1),
                    maximum_interval=timedelta(seconds=60),
                    backoff_coefficient=2.0
                )
            )

            # Step 3: Record completion telemetry
            await workflow.execute_activity(
                "record_telemetry",
                args=[{
                    "bee_id": route_result["best_bee"],
                    "event": "task.completed",
                    "data": {"task_id": task_id, "result": execution_result}
                }],
                start_to_close_timeout=timedelta(seconds=10)
            )

            return {
                "task_id": task_id,
                "bee_id": route_result["best_bee"],
                "status": "completed",
                "result": execution_result
            }

except ImportError:
    # Temporal not available, define stub
    class BeeTaskWorkflow:
        """Stub for when Temporal is not installed"""
        pass

    logger = None

__all__ = ["BeeTaskWorkflow"]
