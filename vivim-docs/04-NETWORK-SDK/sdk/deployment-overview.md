# Deployment Overview

## Executive Summary

Sovereign Memory/Context System supports three deployment models, giving organizations flexibility to choose the approach that best fits their security, compliance, and operational requirements.

## Deployment Models

### 1. Local-First Mode (Default)

**Use Cases:**
- Individual users focused on privacy
- Developers wanting complete control
- Offline-first workflows
- Data sovereignty requirements

**Architecture:**
```
User Device (Browser/Mobile/Desktop)
    │
    ├─► IndexedDB (DAG + Vector Store)
    ├─► Web Crypto API (Key Management)
    └─► Local LLM (Optional)

No cloud dependency
```

**Features:**
- ✅ Full offline capability
- ✅ No data leaves device
- ✅ Zero network dependency
- ✅ No subscription cost
- ✅ Complete data ownership

**Limitations:**
- ❌ No multi-device sync (manual export/import)
- ❌ No team collaboration
- ❌ No cloud backup
- ❌ Device-bound data

**Getting Started:**
```bash
# Install PWA
npm install @sovereign-memory/pwa

# Or use web version
open https://app.sovereign-memory.io
```

**Requirements:**
- Modern browser with Web Crypto API
- IndexedDB support (5GB quota)
- 2GB+ available storage

---

### 2. Self-Hosted Mode

**Use Cases:**
- Teams and small organizations
- Data governance requirements
- Custom integrations
- Compliance needs (GDPR, HIPAA, SOC 2)

**Architecture:**
```
User Devices (Browser/Mobile)
    │
    └─► Sync (WebRTC/WebSocket)
           │
           v
Self-Hosted Server
    │
    ├─► PostgreSQL 16+ with pgvector
    ├─► Redis 7+ (Cache)
    ├─► S3/MinIO (Storage)
    └─► Optional LLM APIs
```

**Features:**
- ✅ Multi-device sync
- ✅ Team collaboration
- ✅ Custom configurations
- ✅ Compliance ready
- ✅ Data control

**Limitations:**
- ⚠️ Requires infrastructure management
- ⚠️ Updates and maintenance
- ⚠️ Backup responsibility
- ⚠️ Monitoring setup

**Deployment Options:**

#### A. Docker Compose (Simplest)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: sovereign_memory
      POSTGRES_USER: sovereign_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  app:
    image: sovereign-memory/server:latest
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://sovereign_user:${POSTGRES_PASSWORD}@postgres:5432/sovereign_memory
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"
    volumes:
      - ./config:/app/config

volumes:
  postgres_data:
```

```bash
# Deploy
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

#### B. Kubernetes (Production)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sovereign-memory
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sovereign-memory
  template:
    metadata:
      labels:
        app: sovereign-memory
    spec:
      containers:
      - name: app
        image: sovereign-memory/server:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: sovereign-secrets
              key: database-url
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"

---
apiVersion: v1
kind: Service
metadata:
  name: sovereign-memory
spec:
  selector:
    app: sovereign-memory
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
```

```bash
# Deploy
kubectl apply -f k8s/

# Check status
kubectl get pods

# View logs
kubectl logs -f deployment/sovereign-memory
```

#### C. Bare Metal (Custom)

**Requirements:**
- Linux (Ubuntu 20.04+ recommended)
- Node.js 20+
- PostgreSQL 16+ with pgvector extension
- Redis 7+
- 4GB+ RAM (8GB+ recommended)
- 50GB+ storage (SSD recommended)

**Installation:**
```bash
# Clone repository
git clone https://github.com/sovereign-memory/server.git
cd server

# Install dependencies
npm install

# Setup database
createdb sovereign_memory
psql sovereign_memory < schema.sql

# Configure
cp .env.example .env
nano .env  # Edit configuration

# Run server
npm start
```

**Configuration:**
```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/sovereign_memory
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key
ALLOWED_ORIGINS=https://your-domain.com
```

---

### 3. Managed Cloud Mode

**Use Cases:**
- Enterprise organizations
- Zero-maintenance preference
- High availability requirements
- Scalability needs

**Architecture:**
```
User Devices (Browser/Mobile)
    │
    └─► HTTPS + WebSocket
           │
           v
Sovereign Cloud (Managed)
    │
    ├─► Managed PDS (Personal Data Server)
    ├─► Sync Service
    ├─► Backup Service
    └─► Support Team
```

**Features:**
- ✅ Zero infrastructure management
- ✅ Automatic updates
- ✅ 99.9% uptime SLA
- ✅ 24/7 support
- ✅ Automatic backups
- ✅ Multi-region deployment

**Limitations:**
- ⚠️ Subscription cost
- ⚠️ Data in cloud
- ⚠️ Compliance requirements
- ⚠️ Vendor lock-in risk

**Plans:**

| Plan | Price | Users | Storage | Support |
|------|--------|---------|----------|----------|
| **Personal** | $9/month | 1 | 10GB | Email |
| **Team** | $49/month | 10 | 100GB | Email + Chat |
| **Business** | $199/month | 50 | 500GB | Priority Support |
| **Enterprise** | Custom | 100+ | 1TB+ | 24/7 Phone + Dedicated |

**Getting Started:**
1. Visit https://cloud.sovereign-memory.io
2. Create account
3. Configure organization
4. Invite team members
5. Connect devices

---

## Infrastructure Requirements

### Minimum Requirements (Self-Hosted)

| Component | Minimum | Recommended |
|-----------|----------|--------------|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 4GB | 8GB+ |
| **Storage** | 50GB (SSD) | 100GB+ (SSD) |
| **Network** | 10 Mbps | 100 Mbps+ |
| **Database** | PostgreSQL 16 | PostgreSQL 16+ |
| **Cache** | Redis 7 | Redis 7+ |

### Sizing Guide

| Users | Storage | RAM | CPU | Network |
|--------|---------|------|------|----------|
| **1-10** | 100GB | 4GB | 2 cores | 10 Mbps |
| **10-50** | 500GB | 8GB | 4 cores | 50 Mbps |
| **50-200** | 2TB | 16GB | 8 cores | 100 Mbps |
| **200-1000** | 10TB | 32GB+ | 16+ cores | 1 Gbps+ |

---

## Network Configuration

### Firewall Rules

```
# Inbound
Allow TCP 3000    # Application (HTTP)
Allow TCP 443     # Application (HTTPS)
Allow TCP 80      # Application (HTTP - redirect)
Allow TCP 5432    # PostgreSQL (if external DB)
Allow TCP 6379    # Redis (if external cache)

# Outbound
Allow TCP 443     # HTTPS (required for updates, LLM APIs)
Allow UDP 3478    # STUN (for WebRTC P2P)
Allow TCP 5228    # TURN (for WebRTC relay)
```

### DNS Configuration

```
# Example DNS records
A    app        your-domain.com        # Application server
A    api        api.your-domain.com   # API server
CNAME cdn        cdn.your-domain.com # CDN (if using)
TXT  _dmarc     your-domain.com        # DMARC record
TXT  _domainkey  your-domain.com        # DKIM record
```

### SSL/TLS Configuration

```nginx
# /etc/nginx/sites-available/sovereign-memory
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

---

## Monitoring & Observability

### Health Checks

```bash
# Application health
curl https://api.your-domain.com/health

# Database health
curl https://api.your-domain.com/health/db

# Cache health
curl https://api.your-domain.com/health/cache
```

### Metrics

**Prometheus Metrics (if enabled):**
- `sovereign_memory_requests_total`
- `sovereign_memory_request_duration_seconds`
- `sovereign_memory_sync_operations_total`
- `sovereign_memory_active_users`
- `sovereign_memory_storage_used_bytes`

### Logging

**Structured Logging:**
```json
{
  "timestamp": "2026-03-09T12:00:00Z",
  "level": "info",
  "service": "sovereign-memory",
  "user_id": "did:key:z...",
  "operation": "memory.create",
  "duration_ms": 45,
  "status": "success"
}
```

### Alerts

**Recommended Alerts:**
- High error rate (>5%)
- High latency (>2s p95)
- Disk usage >80%
- Database connection failures
- Sync operation failures

---

## Backup & Disaster Recovery

### Backup Strategy

**Daily Backups:**
- PostgreSQL database (full + WAL)
- Redis cache (snapshot)
- S3/MinIO storage (incremental)

**Weekly Archives:**
- Full database backup
- Complete storage export
- Configuration backup

**Monthly Offsite:**
- Encrypt and transfer to secondary location
- Test restore process
- Update disaster recovery plan

### Restore Procedure

```bash
# Stop application
docker-compose stop app

# Restore database
pg_restore -d sovereign_memory /backups/postgres/latest.sql

# Restore storage
rclone sync /backups/storage /data/storage

# Restart application
docker-compose start app

# Verify restore
curl https://api.your-domain.com/health
```

### Disaster Recovery Plan

1. **Detection**: Automated monitoring alerts
2. **Assessment**: Determine impact and scope
3. **Communication**: Notify stakeholders
4. **Recovery**: Execute restore procedure
5. **Verification**: Test and validate recovery
6. **Post-Mortem**: Document and improve

---

## Migration Between Deployments

### Local → Self-Hosted

1. **Export from local:**
   ```bash
   # In local PWA
   Settings → Export → sovereign-v1 format
   Download export file
   ```

2. **Import to self-hosted:**
   ```bash
   # On self-hosted server
   curl -X POST https://api.your-domain.com/api/v1/import \
     -F "file=@export.zip" \
     -F "format=sovereign-v1"
   ```

3. **Verify import:**
   ```bash
   curl https://api.your-domain.com/api/v1/verify-import/:importId
   ```

### Self-Hosted → Managed Cloud

1. **Export from self-hosted:**
   ```bash
   # On self-hosted server
   curl -X POST https://api.your-domain.com/api/v1/export \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"format": "sovereign-v1", "encrypted": true}'
   ```

2. **Import to cloud:**
   ```bash
   # In cloud dashboard
   Settings → Import → Upload export file
   ```

3. **Verify and sync devices**

### Managed Cloud → Self-Hosted

1. **Export from cloud:**
   ```bash
   # In cloud dashboard
   Settings → Export → sovereign-v1 format
   ```

2. **Import to self-hosted:**
   ```bash
   # On self-hosted server
   curl -X POST https://api.self-hosted.com/api/v1/import \
     -F "file=@export.zip" \
     -F "format=sovereign-v1"
   ```

---

## Security Hardening

### Operating System

```bash
# Update packages
apt update && apt upgrade -y

# Configure firewall
ufw default deny incoming
ufw allow 22/tcp    # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw enable

# Configure fail2ban
apt install fail2ban
systemctl enable fail2ban
```

### Application

```bash
# Run as non-root user
useradd -m -s /bin/bash sovereign

# Use process manager (systemd)
cat > /etc/systemd/system/sovereign-memory.service <<EOF
[Unit]
Description=Sovereign Memory Server
After=network.target

[Service]
Type=simple
User=sovereign
WorkingDirectory=/opt/sovereign-memory
ExecStart=/usr/bin/node /opt/sovereign-memory/server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl enable sovereign-memory
systemctl start sovereign-memory
```

### Database

```sql
-- Enable row-level security
ALTER TABLE memory_nodes ENABLE ROW LEVEL SECURITY;

-- Create policy for user isolation
CREATE POLICY user_isolation ON memory_nodes
  FOR ALL TO authenticated_user
  USING (author_did = current_user_did());

-- Enable encryption (if supported)
ALTER DATABASE sovereign_memory SET default_table_access_method = 'heap';
```

---

## Troubleshooting

### Common Issues

**Issue: Database connection failed**
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check connection
psql -U sovereign_user -d sovereign_memory -h localhost

# Verify pgvector extension
psql -U sovereign_user -d sovereign_memory -c "SELECT * FROM pg_extension;"
```

**Issue: Redis connection failed**
```bash
# Check Redis status
systemctl status redis

# Test connection
redis-cli ping
```

**Issue: High memory usage**
```bash
# Check memory usage
free -h

# Check process memory
ps aux | sort -rk %mem | head -10

# Adjust cache settings
# In .env
CACHE_MAX_SIZE=256000000  # 256MB
```

**Issue: Slow sync**
```bash
# Check network latency
ping api.your-domain.com

# Check sync queue size
curl https://api.your-domain.com/api/v1/sync/status

# Adjust sync batch size
# In .env
SYNC_BATCH_SIZE=100
```

---

## Support Resources

### Documentation
- [Deployment Guide](./self-hosted/)
- [Configuration Reference](./configuration/)
- [Troubleshooting Guide](./troubleshooting/)

### Community
- [GitHub Issues](https://github.com/sovereign-memory/issues)
- [Discord Community](https://discord.gg/sovereign-memory)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/sovereign-memory)

### Enterprise Support
- Email: enterprise@sovereign-memory.io
- Phone: +1 (555) 123-4567
- SLA: https://cloud.sovereign-memory.io/sla

---

**Document Version**: 1.0.0
**Last Updated**: 2026-03-09
**Related Documents**:
- [Configuration Reference](./configuration.md)
- [Security Hardening](./security-hardening.md)
- [Monitoring Setup](./monitoring.md)
- [Backup & Recovery](./backup-recovery.md)
