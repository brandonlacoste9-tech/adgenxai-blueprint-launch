# Colony OS Architecture Guide

## System Overview

Colony OS is a distributed AI orchestration platform that manages autonomous AI agents ("bees") with intelligent task routing, real-time telemetry, and fault-tolerant consensus mechanisms.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Colony OS Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   KOLONI     │  │   Analytics  │  │   Social     │          │
│  │   Studio     │  │   Bee        │  │   Media Bee  │          │
│  │   (Text Gen) │  │   (Metrics)  │  │   (Posts)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                    │
│                   ┌────────▼────────┐                          │
│                   │ REST API Server  │                         │
│                   │   (FastAPI)      │                         │
│                   └─────┬──────┬──┬──┘                         │
│                         │      │  │                            │
│         ┌───────────────┤      │  └──────────┐                │
│         │               │      │             │                │
│    ┌────▼────┐    ┌─────▼──┐ ┌─┴───────┐ ┌──▼────────┐      │
│    │   Bee   │    │  Task  │ │Telemetry│ │  Guardian │      │
│    │ Registry │    │  Queue │ │  Stream │ │ Consensus│      │
│    └─────────┘    └────────┘ └────────┘ └──────────┘      │
│         │               │           │           │           │
│         └───────────────┴───────────┴───────────┘           │
│                         │                                   │
│                   ┌─────▼──────┐                           │
│                   │  Database   │                          │
│                   │  (In-Memory)│                          │
│                   └─────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │   Home Page      │  │   HiveMind       │                   │
│  │  (Landing)       │  │  Dashboard       │                   │
│  │                  │  │                  │                   │
│  │  • Hero Section  │  │  • Active Bees   │                   │
│  │  • Live Stats    │  │  • Task Queue    │                   │
│  │  • Features      │  │  • Live Telemetry                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
│  ┌──────────────────────────────────────────┐                │
│  │  Design System (Glassmorphism, Neon)    │                │
│  │  • CSS Custom Properties                 │                │
│  │  • Animated Gradients & Glows           │                │
│  │  • Responsive Layouts                    │                │
│  └──────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Bee Registry (`colonyos/api/routes/bees.py`)

The registry maintains the list of active AI agents in the colony.

**Data Model:**
```python
Bee {
  bee_id: str              # Unique identifier
  bee_type: str            # Type of agent (e.g., koloni_creator_studio)
  status: str              # ACTIVE, INACTIVE, OFFLINE
  model_capabilities: List[str]  # Supported models/features
  version: str             # Agent version
  metadata: Dict           # Custom metadata
  registered_at: datetime  # Registration timestamp
  last_heartbeat: datetime # Latest heartbeat timestamp
}
```

**Endpoints:**
- `POST /api/v1/bees/register` - Register new bee
- `GET /api/v1/bees` - List all bees
- `GET /api/v1/bees/{bee_id}` - Get bee details
- `POST /api/v1/bees/{bee_id}/heartbeat` - Send heartbeat

**Heartbeat Mechanism:**
- Bees send heartbeats every 30 seconds (configurable)
- If no heartbeat for 2 minutes, bee marked as OFFLINE
- Prevents dead agents from accepting tasks

### 2. Task Management (`colonyos/api/routes/tasks.py`)

Task queue for distributing work to bees with status tracking.

**Data Model:**
```python
Task {
  task_id: str              # UUID
  task_type: str            # Type of task (generate_text, analyze, etc.)
  description: str          # Human-readable description
  payload: Dict             # Task-specific parameters
  status: str               # pending, completed, failed
  bee_id: Optional[str]     # Assigned bee
  submitted_at: datetime    # Submission time
  completed_at: Optional[datetime]  # Completion time
  result: Optional[Dict]    # Task output
  error: Optional[str]      # Error message if failed
  callback_url: Optional[str]  # Webhook URL for completion
}
```

**Endpoints:**
- `POST /api/v1/tasks` - Submit new task
- `GET /api/v1/tasks` - List tasks (with filtering)
- `GET /api/v1/tasks/{task_id}/status` - Get task status
- `POST /api/v1/tasks/{task_id}/status` - Update task status

**Task Flow:**
1. External bee (e.g., KOLONI) submits task via API
2. Task enters PENDING state with UUID
3. Colony OS router selects best bee (semantic matching via embeddings)
4. Bee executes task, reports completion via webhook or polling
5. Task transitions to COMPLETED or FAILED
6. Results persisted and callback triggered

### 3. Telemetry System (`colonyos/api/routes/telemetry.py`)

Real-time event streaming from all bees for monitoring and debugging.

**Data Model:**
```python
Event {
  bee_id: str              # Source bee
  event: str               # Event type (generation.started, bee.offline, etc.)
  data: Dict               # Event-specific metadata
  timestamp: datetime      # When event occurred
}
```

**Event Types:**
- `generation.started` - Task execution began
- `generation.completed` - Task finished successfully
- `generation.failed` - Task failed with error
- `bee.registered` - New bee joined
- `bee.offline` - Bee went offline
- `bee.capacity_changed` - Bee capacity updated
- `system.error` - System-level error
- `system.warning` - Warning message
- `consensus.vote` - Byzantine consensus vote

**Endpoints:**
- `POST /api/v1/telemetry` - Record event
- `GET /api/v1/telemetry` - Retrieve events (circular buffer)

**Circular Buffer:**
- Max 10,000 events in memory
- FIFO removal when capacity exceeded
- Efficient storage using deque

### 4. Semantic Router (Future)

Intelligent task-to-bee matching using vector embeddings.

**Algorithm:**
1. Extract semantic features from task description
2. Query Qdrant vector DB for similar bee capabilities
3. Score bees by embedding similarity + current load
4. Select bee with highest score above threshold
5. Route task to selected bee

**Benefits:**
- Automatic load balancing
- Skill-based routing
- Fallback to random if no match

### 5. Guardian Consensus (Future)

Byzantine fault-tolerant voting for critical decisions.

**Mechanism:**
1. Three bees vote on decision (e.g., task approval)
2. Require 2/3 agreement (66% quorum)
3. If disagreement, escalate to human review
4. Prevents cascading failures

**Usage:**
- High-value task approval
- Security-sensitive operations
- Critical system state changes

### 6. Durable Workflows (Future)

Temporal framework integration for multi-step task execution.

**Features:**
- Automatic retries with exponential backoff
- Activity timeout handling
- Workflow versioning
- State persistence
- Long-running task support

## Data Flow

### Task Submission Flow
```
KOLONI Studio
    │
    ├─ POST /api/v1/bees/register
    │  └─→ Bee Registry (active status)
    │
    ├─ POST /api/v1/bees/{bee_id}/heartbeat
    │  └─→ Bee Registry (update last_heartbeat)
    │
    └─ POST /api/v1/tasks
       └─→ Task Queue (pending status)
           │
           ├─ Semantic Router selects best bee
           │
           └─→ POST /api/v1/tasks/{task_id}/status (from bee)
               └─→ Task updated to completed/failed
```

### Telemetry Flow
```
All Bees
    │
    ├─ POST /api/v1/telemetry (generation.started)
    │  └─→ Event Buffer
    │
    ├─ ... task execution ...
    │
    └─ POST /api/v1/telemetry (generation.completed/failed)
       └─→ Event Buffer
           │
           └─ GET /api/v1/telemetry
              └─→ Frontend (HiveMind Dashboard)
```

## API Architecture

**Framework:** FastAPI (async Python web framework)

**Routing:**
```
/api/v1/
├─ /bees                       (bee registry)
├─ /tasks                      (task management)
├─ /telemetry                  (event streaming)
└─ /health                     (health check)
```

**Authentication:** Bearer token (future: JWT)

**Rate Limiting:**
- Task submission: 1000 req/min per bee
- Telemetry: 10000 events/min per bee
- Queries: 5000 req/min

**Error Handling:**
- 400 Bad Request - Invalid parameters
- 404 Not Found - Resource doesn't exist
- 409 Conflict - Resource already exists
- 500 Internal Server Error

## Frontend Architecture

**Framework:** React 18 + TypeScript + Vite

**Pages:**
- `/` - Home (landing page with live stats)
- `/home` - Index (dashboard)
- `/hivemind` - HiveMind (real-time monitoring)
- `/creator` - Creator (KOLONI Studio integration)

**Components:**
- `ActiveBeesPanel` - Live bee registry display
- `TelemetryDashboard` - Real-time event stream
- Design system with glassmorphic UI

**State Management:** React Query (TanStack Query) for API calls

**Styling:** CSS custom properties + colony-design-system

## Storage Architecture

**Current:** In-memory dictionaries and deques
- Bee registry: `dict[str, BeeInfo]`
- Task queue: `dict[str, Task]`
- Telemetry: `deque[Event]` (max 10k)

**Future:** PostgreSQL + Redis
- Persistent bee registry
- Durable task queue
- Redis pub/sub for real-time events
- Distributed caching

## Deployment Architecture

**Development:**
```
Local machine
├─ Python FastAPI (localhost:8000)
└─ React dev server (localhost:5173)
```

**Production:**
```
Docker Container
├─ FastAPI application
├─ Port 8000 (REST API)
└─ Volumes: logs, data

Kubernetes Cluster
├─ Colony OS service (scaled)
├─ KOLONI services (bees)
└─ Monitoring (Prometheus + Grafana)
```

## Scalability Considerations

**Horizontal Scaling:**
- FastAPI behind load balancer
- Each instance has independent bee registry (sync via Redis)
- Task queue backed by Redis/RabbitMQ

**Vertical Scaling:**
- In-memory buffer size configurable
- Telemetry can be streamed to time-series DB (InfluxDB)
- Connection pooling for database

**Load Balancing:**
- Round-robin by default
- Weight-based for unequal bee capabilities
- Least-loaded bee preferred

## Monitoring & Observability

**Metrics:**
- Active bee count
- Task submission rate
- Task completion rate
- Average task latency
- Error rates

**Logging:**
- Structured logs (JSON format)
- Log levels: DEBUG, INFO, WARNING, ERROR
- Request tracing with unique IDs

**Dashboards:**
- Grafana for metrics visualization
- HiveMind dashboard for real-time monitoring
- API docs at `/docs` (Swagger UI)

## Security Considerations

**Authentication:**
- Bearer token validation on all endpoints
- Future: JWT with expiration

**Authorization:**
- Role-based access control (RBAC)
- Bee can only update own status
- Admin endpoints for registry management

**Data Protection:**
- HTTPS in production
- Payload encryption for sensitive tasks
- Rate limiting prevents abuse
- Input validation on all endpoints

**Bee Verification:**
- Cryptographic signature on registration
- Certificate-based mutual TLS (future)

## Testing Architecture

**Unit Tests:**
- Individual route handlers
- Data model validation
- Helper function tests

**Integration Tests:**
- API endpoint tests
- Bee registration flow
- Task submission flow
- Telemetry recording

**E2E Tests:**
- Frontend component tests
- Full workflow tests
- Load testing (k6)

**CI/CD Pipeline:**
- GitHub Actions on push
- Linting (Ruff, ESLint)
- Type checking (mypy)
- Test execution (pytest, vitest)
- Security scanning (Bandit, Safety)
- Docker image validation
- Code coverage reporting

## Future Architecture Enhancements

1. **Semantic Router v2** - GPT embeddings for intelligent routing
2. **Guardian Consensus** - Byzantine fault tolerance
3. **Temporal Workflows** - Long-running task orchestration
4. **Message Queue** - RabbitMQ/Kafka for async task processing
5. **Distributed Cache** - Redis for shared state
6. **Persistent Storage** - PostgreSQL for durability
7. **Service Mesh** - Istio for advanced networking
8. **Multi-region** - Geographic distribution and failover
9. **WebSocket** - Real-time dashboard updates
10. **GraphQL API** - Alternative query language

---

**Last Updated:** 2025-11-19
**Version:** 0.1.0
**Maintainer:** AdgenxAI Team
