"""Comprehensive test suite for Colony OS API endpoints."""

import pytest
from fastapi.testclient import TestClient
from colonyos.api.rest import ColonyAPI, _external_tasks_db
from colonyos.api.routes import bees, telemetry
from fastapi import FastAPI
from datetime import datetime, timezone


@pytest.fixture
def mock_colony_os():
    """Mock ColonyOS instance for testing."""
    class MockColonyOS:
        def __init__(self):
            self.start_time = __import__('time').time()
            self.guardian = None
            self.body = None
            self.mind = None
            self.event_bus = None
            self.identity_manager = None

    return MockColonyOS()


@pytest.fixture
def test_app(mock_colony_os):
    """Create test FastAPI app with bee and telemetry routers."""
    app = FastAPI(title="Colony OS Test")
    app.include_router(bees.router)
    app.include_router(telemetry.router)

    # Add external task endpoints
    @app.post("/api/v1/tasks", status_code=201)
    async def submit_external_task(
        task_type: str,
        description: str,
        payload: dict = None,
        callback_url: str = None,
        bee_id: str = None,
    ):
        task_id = __import__('uuid').uuid4().hex
        now = datetime.now(timezone.utc).isoformat()
        _external_tasks_db[task_id] = {
            "task_id": task_id,
            "task_type": task_type,
            "description": description,
            "payload": payload or {},
            "callback_url": callback_url,
            "bee_id": bee_id,
            "status": "pending",
            "submitted_at": now,
            "completed_at": None,
            "result": None,
            "error": None,
        }
        return {
            "task_id": task_id,
            "status": "pending",
            "message": f"Task {task_id} submitted successfully",
        }

    @app.get("/api/v1/tasks/{task_id}/status")
    async def get_external_task_status(task_id: str):
        if task_id not in _external_tasks_db:
            raise Exception(f"Task {task_id} not found")
        return _external_tasks_db[task_id]

    @app.post("/api/v1/tasks/{task_id}/status")
    async def update_external_task_status(
        task_id: str,
        status: str,
        result: dict = None,
        error: str = None,
    ):
        if task_id not in _external_tasks_db:
            raise Exception(f"Task {task_id} not found")

        now = datetime.now(timezone.utc).isoformat()
        task = _external_tasks_db[task_id]
        task["status"] = "completed" if status == "success" else "failed"
        task["completed_at"] = now
        task["result"] = result
        task["error"] = error
        return {"success": True, "task_id": task_id}

    @app.get("/api/v1/tasks")
    async def list_external_tasks(
        status: str = None,
        bee_id: str = None,
        limit: int = 100,
    ):
        tasks = list(_external_tasks_db.values())
        if status:
            tasks = [t for t in tasks if t["status"] == status]
        if bee_id:
            tasks = [t for t in tasks if t["bee_id"] == bee_id]
        return {"tasks": tasks[-limit:], "count": len(tasks), "total": len(_external_tasks_db)}

    return app


@pytest.fixture
def client(test_app):
    """FastAPI test client."""
    return TestClient(test_app)


# ======================== BEE REGISTRY TESTS ========================

class TestBeeRegistry:
    """Test bee registration, listing, and heartbeat."""

    def test_register_bee(self, client):
        """Test bee registration."""
        response = client.post(
            "/api/v1/bees/register",
            json={
                "bee_id": "test-bee-001",
                "bee_type": "test_type",
                "model_capabilities": ["capability_1", "capability_2"],
                "version": "1.0.0",
                "metadata": {"environment": "test"}
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["bee_id"] == "test-bee-001"
        assert data["status"] == "ACTIVE"

    def test_register_duplicate_bee(self, client):
        """Test registering duplicate bee fails."""
        client.post(
            "/api/v1/bees/register",
            json={"bee_id": "dup-bee", "bee_type": "test"}
        )
        response = client.post(
            "/api/v1/bees/register",
            json={"bee_id": "dup-bee", "bee_type": "test"}
        )
        assert response.status_code == 409

    def test_list_bees(self, client):
        """Test listing all bees."""
        client.post(
            "/api/v1/bees/register",
            json={"bee_id": "bee-1", "bee_type": "type1"}
        )
        response = client.get("/api/v1/bees")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1
        assert data["bees"][0]["bee_id"] == "bee-1"

    def test_get_bee_details(self, client):
        """Test getting specific bee details."""
        client.post(
            "/api/v1/bees/register",
            json={"bee_id": "detail-bee", "bee_type": "detail_type"}
        )
        response = client.get("/api/v1/bees/detail-bee")
        assert response.status_code == 200
        data = response.json()
        assert data["bee_id"] == "detail-bee"
        assert "registered_at" in data
        assert "last_heartbeat" in data

    def test_get_nonexistent_bee(self, client):
        """Test getting nonexistent bee returns 404."""
        response = client.get("/api/v1/bees/nonexistent")
        assert response.status_code == 404

    def test_heartbeat(self, client):
        """Test bee heartbeat."""
        client.post(
            "/api/v1/bees/register",
            json={"bee_id": "hb-bee", "bee_type": "type"}
        )
        response = client.post("/api/v1/bees/hb-bee/heartbeat")
        assert response.status_code == 204

    def test_heartbeat_nonexistent_bee(self, client):
        """Test heartbeat to nonexistent bee fails."""
        response = client.post("/api/v1/bees/nonexistent/heartbeat")
        assert response.status_code == 404


# ======================== TELEMETRY TESTS ========================

class TestTelemetry:
    """Test telemetry event recording and retrieval."""

    def test_record_event(self, client):
        """Test recording telemetry event."""
        response = client.post(
            "/api/v1/telemetry",
            json={
                "bee_id": "bee-1",
                "event": "test.event",
                "data": {"test_data": "value"}
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True

    def test_get_telemetry(self, client):
        """Test retrieving telemetry events."""
        client.post(
            "/api/v1/telemetry",
            json={"bee_id": "bee-1", "event": "event1", "data": {}}
        )
        response = client.get("/api/v1/telemetry")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1
        assert data["events"][0]["event"] == "event1"

    def test_filter_telemetry_by_bee(self, client):
        """Test filtering telemetry by bee_id."""
        client.post("/api/v1/telemetry", json={"bee_id": "bee-1", "event": "evt1", "data": {}})
        client.post("/api/v1/telemetry", json={"bee_id": "bee-2", "event": "evt2", "data": {}})

        response = client.get("/api/v1/telemetry?bee_id=bee-1")
        data = response.json()
        assert data["count"] == 1
        assert data["events"][0]["bee_id"] == "bee-1"

    def test_telemetry_limit(self, client):
        """Test telemetry limit parameter."""
        for i in range(5):
            client.post("/api/v1/telemetry", json={"bee_id": "bee", "event": f"evt{i}", "data": {}})

        response = client.get("/api/v1/telemetry?limit=2")
        data = response.json()
        assert len(data["events"]) == 2


# ======================== EXTERNAL TASK TESTS ========================

class TestExternalTasks:
    """Test task submission and tracking."""

    def test_submit_task(self, client):
        """Test submitting external task."""
        response = client.post(
            "/api/v1/tasks",
            json={
                "task_type": "generate_text",
                "description": "Write blog post",
                "payload": {"prompt": "AI trends"},
                "bee_id": "koloni-001"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "task_id" in data
        assert data["status"] == "pending"

    def test_get_task_status(self, client):
        """Test getting task status."""
        submit_resp = client.post(
            "/api/v1/tasks",
            json={"task_type": "test", "description": "test", "bee_id": "bee-1"}
        )
        task_id = submit_resp.json()["task_id"]

        response = client.get(f"/api/v1/tasks/{task_id}/status")
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == task_id
        assert data["status"] == "pending"

    def test_update_task_status(self, client):
        """Test updating task status."""
        submit_resp = client.post(
            "/api/v1/tasks",
            json={"task_type": "test", "description": "test"}
        )
        task_id = submit_resp.json()["task_id"]

        response = client.post(
            f"/api/v1/tasks/{task_id}/status",
            json={"status": "success", "result": {"output": "test"}}
        )
        assert response.status_code == 200

        # Verify status was updated
        status_resp = client.get(f"/api/v1/tasks/{task_id}/status")
        assert status_resp.json()["status"] == "completed"

    def test_list_tasks_filtered(self, client):
        """Test listing tasks with filters."""
        client.post("/api/v1/tasks", json={"task_type": "t1", "description": "d1", "bee_id": "bee-1"})
        client.post("/api/v1/tasks", json={"task_type": "t2", "description": "d2", "bee_id": "bee-2"})

        response = client.get("/api/v1/tasks?bee_id=bee-1")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
