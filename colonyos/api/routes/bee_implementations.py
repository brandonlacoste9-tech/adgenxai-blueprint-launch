"""
API Routes for Bee Type Implementations
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from .bee_types import (
    AnalyticsBee,
    SocialMediaBee,
    OrchestratorBee,
    MetricPoint,
    SocialPost,
    WorkflowStep,
)

router = APIRouter(prefix="/api/v1/bee-types", tags=["bee-types"])

# Global instances
analytics_bee = AnalyticsBee()
social_media_bee = SocialMediaBee()
orchestrator_bee = OrchestratorBee()


# ============================================================================
# ANALYTICS BEE ROUTES
# ============================================================================

class MetricRequest(BaseModel):
    name: str
    value: float
    labels: Optional[Dict[str, str]] = None


@router.post("/analytics/metrics", tags=["analytics"])
async def collect_metric(metric: MetricRequest):
    """Record a metric in Analytics Bee"""
    metric_point = MetricPoint(
        timestamp=__import__("datetime").datetime.utcnow().isoformat(),
        name=metric.name,
        value=metric.value,
        labels=metric.labels
    )
    success = analytics_bee.collect_metric(metric_point)
    return {
        "success": success,
        "metric": metric.name,
        "value": metric.value
    }


@router.get("/analytics/metrics/{metric_name}", tags=["analytics"])
async def get_metric_aggregates(metric_name: str, period_minutes: int = 60):
    """Get aggregated metrics"""
    aggregates = analytics_bee.aggregate_metrics(metric_name, period_minutes)
    return {
        "metric_name": metric_name,
        "period_minutes": period_minutes,
        "aggregates": aggregates
    }


@router.post("/analytics/report", tags=["analytics"])
async def generate_analytics_report(report_type: str = "daily"):
    """Generate an analytics report"""
    report = analytics_bee.generate_report(report_type)
    return report.dict()


@router.get("/analytics/report/{report_id}", tags=["analytics"])
async def get_analytics_report(report_id: str):
    """Retrieve a previously generated report"""
    report = analytics_bee.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report.dict()


@router.get("/analytics/anomalies/{metric_name}", tags=["analytics"])
async def detect_metric_anomalies(metric_name: str, threshold: float = 2.0):
    """Detect anomalies in metric data"""
    anomalies = analytics_bee.detect_anomalies(metric_name, threshold)
    return {
        "metric_name": metric_name,
        "threshold": threshold,
        "anomalies": anomalies,
        "count": len(anomalies)
    }


@router.get("/analytics/export/{metric_name}", tags=["analytics"])
async def export_metric_csv(metric_name: str):
    """Export metric as CSV"""
    csv_data = analytics_bee.export_as_csv(metric_name)
    if not csv_data:
        raise HTTPException(status_code=404, detail="Metric not found")
    return {
        "metric_name": metric_name,
        "format": "csv",
        "data": csv_data
    }


@router.get("/analytics/metrics", tags=["analytics"])
async def list_all_metrics():
    """List all available metrics"""
    return {
        "metrics": list(analytics_bee.metrics_store.keys()),
        "count": len(analytics_bee.metrics_store)
    }


# ============================================================================
# SOCIAL MEDIA BEE ROUTES
# ============================================================================

class TwitterPostRequest(BaseModel):
    content: str
    media_urls: Optional[List[str]] = None


class LinkedInPostRequest(BaseModel):
    content: str
    media_urls: Optional[List[str]] = None


class CrossPostRequest(BaseModel):
    content: str
    platforms: List[str] = ["twitter", "linkedin"]
    media_urls: Optional[List[str]] = None


class SchedulePostRequest(BaseModel):
    content: str
    platform: str
    scheduled_at: str
    hashtags: Optional[List[str]] = None
    media_urls: Optional[List[str]] = None


@router.post("/social/twitter", tags=["social-media"])
async def post_to_twitter(request: TwitterPostRequest):
    """Post content to Twitter"""
    result = social_media_bee.post_to_twitter(request.content, request.media_urls)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.post("/social/linkedin", tags=["social-media"])
async def post_to_linkedin(request: LinkedInPostRequest):
    """Post content to LinkedIn"""
    result = social_media_bee.post_to_linkedin(request.content, request.media_urls)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.post("/social/cross-post", tags=["social-media"])
async def cross_post(request: CrossPostRequest):
    """Post to multiple platforms simultaneously"""
    result = social_media_bee.cross_post(
        request.content,
        request.platforms,
        request.media_urls
    )
    return result


@router.post("/social/schedule", tags=["social-media"])
async def schedule_post(request: SchedulePostRequest):
    """Schedule a post for later publishing"""
    post = SocialPost(
        content=request.content,
        platform=request.platform,
        scheduled_at=request.scheduled_at,
        hashtags=request.hashtags,
        media_urls=request.media_urls
    )
    result = social_media_bee.schedule_post(post)
    return result


@router.get("/social/hashtags", tags=["social-media"])
async def optimize_hashtags(content: str):
    """Get optimized hashtag suggestions"""
    hashtags = social_media_bee.optimize_hashtags(content)
    return {
        "suggested_hashtags": hashtags,
        "count": len(hashtags)
    }


@router.get("/social/engagement/{post_id}", tags=["social-media"])
async def get_post_engagement(post_id: str):
    """Track engagement metrics for a post"""
    return social_media_bee.track_engagement(post_id)


@router.post("/social/publish-scheduled", tags=["social-media"])
async def publish_scheduled_posts():
    """Publish all scheduled posts that are due"""
    published = social_media_bee.publish_scheduled_posts()
    return {
        "published_count": len(published),
        "posts": published
    }


# ============================================================================
# ORCHESTRATOR BEE ROUTES
# ============================================================================

class WorkflowRequest(BaseModel):
    name: str
    description: str
    steps: List[Dict[str, Any]]


class ExecuteWorkflowRequest(BaseModel):
    workflow_id: str
    input_data: Optional[Dict[str, Any]] = None


class ConditionalRouteRequest(BaseModel):
    condition: Dict[str, Any]
    true_bee_id: str
    false_bee_id: str


@router.post("/orchestrator/workflows", tags=["orchestrator"])
async def create_workflow(request: WorkflowRequest):
    """Create a new workflow definition"""
    # Convert dicts to WorkflowStep objects
    steps = []
    for step_dict in request.steps:
        step = WorkflowStep(
            step_id=step_dict.get("step_id"),
            name=step_dict.get("name"),
            bee_id=step_dict.get("bee_id"),
            task_type=step_dict.get("task_type"),
            payload=step_dict.get("payload", {}),
            timeout=step_dict.get("timeout", 300),
            retry_count=step_dict.get("retry_count", 3),
            dependencies=step_dict.get("dependencies")
        )
        steps.append(step)

    workflow = orchestrator_bee.create_workflow(
        request.name,
        request.description,
        steps
    )
    return workflow.dict()


@router.get("/orchestrator/workflows/{workflow_id}", tags=["orchestrator"])
async def get_workflow(workflow_id: str):
    """Get workflow definition"""
    if workflow_id not in orchestrator_bee.workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return orchestrator_bee.workflows[workflow_id].dict()


@router.get("/orchestrator/workflows", tags=["orchestrator"])
async def list_workflows():
    """List all workflows"""
    return {
        "workflows": [w.dict() for w in orchestrator_bee.workflows.values()],
        "count": len(orchestrator_bee.workflows)
    }


@router.post("/orchestrator/execute", tags=["orchestrator"])
async def execute_workflow(request: ExecuteWorkflowRequest):
    """Execute a workflow"""
    result = orchestrator_bee.execute_workflow(
        request.workflow_id,
        request.input_data
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/orchestrator/execution/{execution_id}", tags=["orchestrator"])
async def get_execution(execution_id: str):
    """Get execution details"""
    execution = orchestrator_bee.get_execution(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution


@router.get("/orchestrator/results/{execution_id}", tags=["orchestrator"])
async def get_aggregated_results(execution_id: str):
    """Get aggregated results from an execution"""
    results = orchestrator_bee.aggregate_results(execution_id)
    if "error" in results:
        raise HTTPException(status_code=404, detail=results["error"])
    return results


@router.post("/orchestrator/conditional-route", tags=["orchestrator"])
async def get_conditional_route(request: ConditionalRouteRequest):
    """Determine which bee to route to based on condition"""
    bee_id = orchestrator_bee.conditional_route(
        request.condition,
        request.true_bee_id,
        request.false_bee_id
    )
    return {
        "selected_bee_id": bee_id,
        "condition": request.condition
    }


@router.post("/orchestrator/execution/{execution_id}/cancel", tags=["orchestrator"])
async def cancel_execution(execution_id: str):
    """Cancel a running execution"""
    success = orchestrator_bee.cancel_execution(execution_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to cancel execution")
    return {
        "execution_id": execution_id,
        "status": "cancelled"
    }


@router.post("/orchestrator/execution/{execution_id}/retry", tags=["orchestrator"])
async def retry_failed_steps(execution_id: str):
    """Retry failed steps in an execution"""
    result = orchestrator_bee.retry_failed_steps(execution_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ============================================================================
# BEE TYPE INFO ROUTES
# ============================================================================

@router.get("/info/analytics", tags=["info"])
async def get_analytics_bee_info():
    """Get Analytics Bee information"""
    return analytics_bee.config.dict()


@router.get("/info/social-media", tags=["info"])
async def get_social_media_bee_info():
    """Get Social Media Bee information"""
    return social_media_bee.config.dict()


@router.get("/info/orchestrator", tags=["info"])
async def get_orchestrator_bee_info():
    """Get Orchestrator Bee information"""
    return orchestrator_bee.config.dict()


@router.get("/info", tags=["info"])
async def get_all_bee_types_info():
    """Get all available bee types"""
    return {
        "bee_types": [
            analytics_bee.config.dict(),
            social_media_bee.config.dict(),
            orchestrator_bee.config.dict()
        ],
        "count": 3
    }
