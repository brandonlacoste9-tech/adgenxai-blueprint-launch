# Colony OS Deployment Guide

## Prerequisites

- **Python 3.9+** (for FastAPI backend)
- **Node.js 16+** (for React frontend)
- **Docker & Docker Compose** (for containerized deployment)
- **Git** (for version control)
- **curl or Postman** (for API testing)

## Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd adgenxai-blueprint-launch
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python -m uvicorn colonyos.api.rest:app --reload --host 0.0.0.0 --port 8000
```

**Verify backend:**
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-19T09:00:00.000000+00:00",
  "version": "0.1.0"
}
```

### 3. Frontend Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend available at `http://localhost:5173`

**Available NPM scripts:**
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Environment Configuration

### Backend Environment Variables

Create `.env` file in project root:

```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Security
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (future)
DATABASE_URL=postgresql://user:password@localhost:5432/colony_os
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# External APIs
KOLONI_API_KEY=your-koloni-api-key
QDRANT_URL=http://localhost:6333
```

### Frontend Environment Variables

Create `.env` file in project root (or `.env.local` for local overrides):

```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ENV=development
```

## Docker Deployment

### Single Container Build

```bash
# Build Docker image
docker build -t colony-os:latest .

# Run container
docker run -d \
  -p 8000:8000 \
  -p 5173:5173 \
  --name colony-os \
  colony-os:latest
```

### Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**docker-compose.yml structure:**
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - API_HOST=0.0.0.0
      - LOG_LEVEL=INFO
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

## Production Deployment

### AWS EC2 Deployment

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# 2. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Clone repository
git clone <repository-url>
cd adgenxai-blueprint-launch

# 6. Create environment file
nano .env
# Add production environment variables

# 7. Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 8. Setup SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d your-domain.com
```

### Kubernetes Deployment

```bash
# 1. Create namespace
kubectl create namespace colony-os

# 2. Apply configuration files
kubectl apply -f k8s/deployment.yaml -n colony-os
kubectl apply -f k8s/service.yaml -n colony-os
kubectl apply -f k8s/ingress.yaml -n colony-os

# 3. Check status
kubectl get pods -n colony-os
kubectl get services -n colony-os

# 4. View logs
kubectl logs -f deployment/colony-os-backend -n colony-os
```

**Example Kubernetes deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: colony-os-backend
  namespace: colony-os
spec:
  replicas: 3
  selector:
    matchLabels:
      app: colony-os-backend
  template:
    metadata:
      labels:
        app: colony-os-backend
    spec:
      containers:
      - name: backend
        image: colony-os:latest
        ports:
        - containerPort: 8000
        env:
        - name: API_HOST
          value: "0.0.0.0"
        - name: LOG_LEVEL
          value: "INFO"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Railway/Render Deployment

Railway or Render work well for simpler deployments:

**Railway:**
1. Connect GitHub repository
2. Create new project
3. Add environment variables
4. Deploy on push (automatic)

**Render:**
1. Create new web service
2. Connect Git repository
3. Set build command: `npm install && npm run build`
4. Set start command: `python -m uvicorn colonyos.api.rest:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Deploy

## Database Migration

### PostgreSQL Setup (Future)

```bash
# 1. Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# 2. Create database
sudo -u postgres createdb colony_os

# 3. Create user
sudo -u postgres psql
CREATE USER colony_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE colony_os TO colony_user;

# 4. Run migrations
alembic upgrade head
```

### Data Migration from In-Memory

```bash
# Backup current state
curl http://localhost:8000/api/v1/bees > bees_backup.json
curl http://localhost:8000/api/v1/telemetry > telemetry_backup.json

# After migration, restore data
python scripts/restore_from_backup.py bees_backup.json telemetry_backup.json
```

## Monitoring & Logging

### Application Health

Check health endpoint regularly:
```bash
# Manual health check
curl http://localhost:8000/health

# Automated monitoring with cron
(crontab -l 2>/dev/null; echo "*/5 * * * * curl -f http://localhost:8000/health || alert") | crontab -
```

### Log Management

**Application logs directory:**
```
./logs/
├── app.log          # Application logs
├── access.log       # API access logs
└── error.log        # Error logs
```

**View logs:**
```bash
# Follow logs in real-time
tail -f logs/app.log

# Search logs
grep "ERROR" logs/app.log

# Parse JSON logs
cat logs/app.log | jq '.'
```

### Monitoring Stack

**Prometheus + Grafana setup:**

```bash
# 1. Add Prometheus metrics endpoint
# In colonyos/api/rest.py:
from prometheus_client import Counter, Histogram

task_counter = Counter('tasks_submitted', 'Total tasks submitted')
task_duration = Histogram('task_duration_seconds', 'Task execution duration')

@app.post("/api/v1/tasks")
async def submit_task(task: TaskSubmitRequest):
    task_counter.inc()
    # ... rest of code

# 2. Install monitoring stack
docker-compose -f monitoring/docker-compose.yml up -d

# 3. Access Grafana at http://localhost:3000
# Default credentials: admin/admin
```

### Log Aggregation with ELK Stack

```bash
# docker-compose-elk.yml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:8.5.0
    ports:
      - "9200:9200"

  logstash:
    image: logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: kibana:8.5.0
    ports:
      - "5601:5601"

# Start stack
docker-compose -f docker-compose-elk.yml up -d

# Access Kibana at http://localhost:5601
```

## Performance Tuning

### Backend Optimization

```python
# In colonyos/api/rest.py

# 1. Enable response compression
from fastapi.middleware.gzip import GZIPMiddleware
app.add_middleware(GZIPMiddleware, minimum_size=1000)

# 2. Configure worker count
# Run with: uvicorn colonyos.api.rest:app --workers 4

# 3. Enable caching
from fastapi_cache2 import FastAPICache2
from fastapi_cache2.backends.redis import RedisBackend

@cached(expire=300)  # Cache for 5 minutes
@app.get("/api/v1/bees")
async def get_bees():
    # ...
```

### Frontend Optimization

```bash
# 1. Build with optimization
npm run build

# 2. Enable compression in web server
# Add to nginx.conf or similar:
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 3. Use Content Delivery Network (CDN)
# Deploy frontend to Vercel, Netlify, or CloudFlare
```

### Database Optimization

```sql
-- Index frequently queried columns
CREATE INDEX idx_bee_id ON bees(bee_id);
CREATE INDEX idx_task_status ON tasks(status);
CREATE INDEX idx_event_bee_id ON events(bee_id);
CREATE INDEX idx_event_timestamp ON events(timestamp DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM tasks WHERE status = 'pending';
```

## Backup & Recovery

### Automated Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/colony-os"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup PostgreSQL
pg_dump colony_os > "$BACKUP_DIR/colony_os_$DATE.sql.gz"

# Backup application data
tar -czf "$BACKUP_DIR/app_data_$DATE.tar.gz" ./data

# Upload to S3
aws s3 cp "$BACKUP_DIR/colony_os_$DATE.sql.gz" s3://colony-os-backups/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -mtime +30 -delete

# Add to crontab: 0 2 * * * /scripts/backup.sh
```

### Disaster Recovery

```bash
# 1. Restore from backup
pg_restore -d colony_os /backups/colony_os_backup.sql.gz

# 2. Verify data integrity
python scripts/verify_backup.py

# 3. Run integration tests
pytest tests/

# 4. Smoke test endpoints
bash tests/smoke_tests.sh

# 5. Gradually route traffic back
# Use load balancer percentage-based routing
```

## Troubleshooting

### Common Issues

**Issue: "Connection refused" to backend**
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check logs
docker logs colony-os-backend

# Restart service
docker-compose restart backend
```

**Issue: "CORS errors" in browser**
```bash
# Verify CORS settings in .env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Check backend logs for CORS middleware errors
```

**Issue: "Database connection failed"**
```bash
# Check database is running
docker-compose ps

# Test connection
psql -U colony_user -d colony_os -h localhost

# Check DATABASE_URL in .env
```

**Issue: "High memory usage"**
```bash
# Check telemetry buffer size
# Default: 10,000 events
# Reduce in config if needed

# Check active connections
docker stats
```

### Debug Mode

```bash
# Run backend with debug logging
LOG_LEVEL=DEBUG python -m uvicorn colonyos.api.rest:app --reload

# Open API docs for testing
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

## Scaling Considerations

### Horizontal Scaling

```bash
# With Docker Swarm
docker swarm init
docker service create \
  --name colony-os \
  --replicas 3 \
  -p 8000:8000 \
  colony-os:latest

# Or with Kubernetes (see K8s section above)
kubectl scale deployment colony-os-backend --replicas=5 -n colony-os
```

### Load Balancer Configuration

```nginx
# nginx.conf
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Rate Limiting

```python
# In colonyos/api/rest.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/v1/tasks")
@limiter.limit("1000/minute")
async def submit_task(request: Request, task: TaskSubmitRequest):
    # ...
```

## Security Hardening

### SSL/TLS Certificate

```bash
# Using Let's Encrypt (automated)
sudo certbot certonly --standalone -d colony-os.com

# In nginx config
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/colony-os.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/colony-os.com/privkey.pem;
}
```

### Firewall Rules

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Secret Management

```bash
# Use environment files (never commit secrets)
# Create .env.local (gitignored)
# Use secret manager in production (AWS Secrets Manager, HashiCorp Vault)

# Docker secrets (Swarm mode)
echo "my_secret" | docker secret create db_password -

# Kubernetes secrets
kubectl create secret generic db-credentials \
  --from-literal=username=colony_user \
  --from-literal=password=secure_password \
  -n colony-os
```

## Rollout & Rollback Procedures

### Blue-Green Deployment

```bash
# 1. Deploy new version to "green" environment
docker-compose -f docker-compose.green.yml up -d

# 2. Run smoke tests
bash tests/smoke_tests.sh

# 3. Switch traffic to green
# Update load balancer routing

# 4. Keep blue running for quick rollback
# If issues: switch traffic back to blue

# 5. After confidence period, tear down blue
docker-compose -f docker-compose.blue.yml down
```

### Canary Deployment

```bash
# Route 10% traffic to new version
# Monitor metrics and errors
# Gradually increase percentage (10% → 25% → 50% → 100%)
# Rollback if error rate exceeds threshold

# Using NGINX:
upstream new_version {
    server new-backend:8000;
}
upstream stable_version {
    server stable-backend:8000;
}

split_clients "${remote_addr}${request_id}" $backend {
    10%  "new_version";
    90%  "stable_version";
}
```

---

**Last Updated:** 2025-11-19
**Version:** 0.1.0
**Maintainer:** AdgenxAI Team
