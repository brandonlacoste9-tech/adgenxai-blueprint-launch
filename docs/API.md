# Colony OS API Reference

## Overview

Colony OS provides a comprehensive REST API for managing bee orchestration, task submission, and real-time telemetry. All endpoints are built with FastAPI and support OpenAPI/Swagger documentation.

**Base URL:** `http://localhost:8000`

**API Version:** `v1`

**Authentication:** Bearer token (see `/auth` endpoint)

---

## Health Check

### GET /health

Check API server health status.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-19T09:00:00.000000+00:00",
  "version": "0.1.0"
}
```

---

## Bee Management

### POST /api/v1/bees/register

Register a new AI agent bee in the colony.

**Request Body:**
```json
{
  "bee_id": "koloni-001",
  "bee_type": "koloni_creator_studio",
  "model_capabilities": ["LongCat", "EMU"],
  "version": "1.0.0",
  "metadata": {
    "deployment": "netlify",
    "region": "us-east-1"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "bee_id": "koloni-001",
  "status": "ACTIVE",
  "message": "Bee koloni-001 registered successfully"
}
```

---

### GET /api/v1/bees

List all registered bees in the colony.

**Response (200):**
```json
{
  "bees": [
    {
      "bee_id": "koloni-001",
      "bee_type": "koloni_creator_studio",
      "status": "ACTIVE",
      "model_capabilities": ["LongCat", "EMU"],
      "version": "1.0.0",
      "registered_at": "2025-11-19T09:00:00.000000+00:00",
      "last_heartbeat": "2025-11-19T09:05:00.000000+00:00"
    }
  ],
  "count": 1
}
```

---

### GET /api/v1/bees/{bee_id}

Get details for a specific bee.

**Path Parameters:**
- `bee_id` (string): Unique bee identifier

**Response (200):**
```json
{
  "bee_id": "koloni-001",
  "bee_type": "koloni_creator_studio",
  "status": "ACTIVE",
  "model_capabilities": ["LongCat", "EMU"],
  "registered_at": "2025-11-19T09:00:00.000000+00:00",
  "last_heartbeat": "2025-11-19T09:05:00.000000+00:00"
}
```

**Response (404):** Bee not found

---

### POST /api/v1/bees/{bee_id}/heartbeat

Send a heartbeat from a bee to indicate it's alive.

**Path Parameters:**
- `bee_id` (string): Unique bee identifier

**Request Body:**
```json
{
  "status": "ACTIVE",
  "timestamp": "2025-11-19T09:05:00Z"
}
```

**Response (204):** No content

---

## Task Management

### POST /api/v1/tasks

Submit a task for execution by the best-matching bee.

**Request Body:**
```json
{
  "task_type": "generate_text",
  "description": "Write a blog post about AI trends",
  "payload": {
    "prompt": "The future of AI in 2025",
    "max_tokens": 2000
  },
  "callback_url": "https://example.com/webhook",
  "bee_id": "koloni-001"
}
```

**Response (201):**
```json
{
  "task_id": "abc123def456",
  "status": "pending",
  "message": "Task abc123def456 submitted successfully"
}
```

---

### GET /api/v1/tasks

List all submitted tasks.

**Query Parameters:**
- `status` (string, optional): Filter by status (pending, completed, failed)
- `bee_id` (string, optional): Filter by bee ID
- `limit` (integer, optional): Limit results (default: 100)

**Response (200):**
```json
{
  "tasks": [
    {
      "task_id": "abc123def456",
      "task_type": "generate_text",
      "description": "Write a blog post",
      "status": "completed",
      "submitted_at": "2025-11-19T09:00:00.000000+00:00",
      "completed_at": "2025-11-19T09:05:00.000000+00:00",
      "result": {"text": "..."}
    }
  ],
  "count": 1,
  "total": 10
}
```

---

### GET /api/v1/tasks/{task_id}/status

Get the status of a specific task.

**Path Parameters:**
- `task_id` (string): Unique task identifier

**Response (200):**
```json
{
  "task_id": "abc123def456",
  "task_type": "generate_text",
  "description": "Write a blog post",
  "status": "completed",
  "submitted_at": "2025-11-19T09:00:00.000000+00:00",
  "completed_at": "2025-11-19T09:05:00.000000+00:00",
  "result": {"text": "..."},
  "error": null
}
```

---

### POST /api/v1/tasks/{task_id}/status

Update task status (called by bee when task completes).

**Path Parameters:**
- `task_id` (string): Unique task identifier

**Request Body:**
```json
{
  "status": "success",
  "result": {
    "text": "Generated blog post content...",
    "tokens_used": 1234
  },
  "error": null
}
```

**Response (200):**
```json
{
  "success": true,
  "task_id": "abc123def456",
  "message": "Task abc123def456 status updated"
}
```

---

## Telemetry

### POST /api/v1/telemetry

Record a telemetry event from a bee.

**Request Body:**
```json
{
  "bee_id": "koloni-001",
  "event": "generation.started",
  "data": {
    "task_type": "text",
    "model": "gpt-4",
    "tokens": 1000
  },
  "timestamp": "2025-11-19T09:00:00Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Telemetry event 'generation.started' recorded"
}
```

---

### GET /api/v1/telemetry

Retrieve telemetry events.

**Query Parameters:**
- `bee_id` (string, optional): Filter by bee ID
- `limit` (integer, optional): Limit results (default: 50)

**Response (200):**
```json
{
  "events": [
    {
      "bee_id": "koloni-001",
      "event": "generation.started",
      "data": {"task_type": "text"},
      "timestamp": "2025-11-19T09:00:00.000000+00:00"
    }
  ],
  "count": 1
}
```

---

## Common Event Types

### Generation Events
- `generation.started` - Task execution began
- `generation.completed` - Task completed successfully
- `generation.failed` - Task failed

### Bee Events
- `bee.registered` - Bee joined the colony
- `bee.offline` - Bee went offline
- `bee.capacity_changed` - Bee capacity changed

### System Events
- `system.error` - System-level error
- `system.warning` - System warning
- `consensus.vote` - Consensus voting occurred

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request parameters"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 409 Conflict
```json
{
  "detail": "Bee already registered"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting

- Task submission: 1000 requests/minute per bee
- Telemetry: 10000 events/minute per bee
- Query operations: 5000 requests/minute

---

## Webhooks

When a task completes, if a `callback_url` was provided, Colony OS will POST the result:

```json
{
  "task_id": "abc123",
  "status": "completed",
  "result": {...}
}
```

---

## SDK Integration

### TypeScript/JavaScript
```typescript
import { createKoloniClient } from 'koloni-client-sdk';

const client = createKoloniClient('http://localhost:8000');
const { task_id } = await client.submitTask({
  task_type: 'generate_text',
  description: 'Write blog post'
});
```

### Python
```python
from colony_os_client import ColonyOSClient

client = ColonyOSClient('http://localhost:8000')
result = client.submit_task(
    task_type='generate_text',
    description='Write blog post'
)
```

---

## OpenAPI/Swagger

Full interactive API documentation available at:
`http://localhost:8000/docs`

Redoc alternative at:
`http://localhost:8000/redoc`
