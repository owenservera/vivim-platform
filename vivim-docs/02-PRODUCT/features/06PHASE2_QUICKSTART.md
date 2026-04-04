# Phase 2 Quick Start Guide

## 🚀 Enable Phase 2 in 5 Minutes

### Step 1: Update Environment

Edit `server/.env`:

```bash
# Enable Phase 2 Features
ENABLE_IDLE_DETECTION=true
LIBRARIAN_ENABLED=true
USE_DYNAMIC_CONTEXT=true

# Token Estimation (more accurate)
TOKEN_ESTIMATOR_TYPE=gpt

# Compaction Model (Z.AI)
COMPACTION_MODEL=glm-4.7-flash
```

### Step 2: Restart Server

```bash
cd server
bun run dev
```

### Step 3: Verify Health

```bash
curl http://localhost:3000/api/v1/context/health
```

**Expected Response:**
```json
{
  "newEngineAvailable": true,
  "oldEngineAvailable": true,
  "topicProfiles": 0,
  "entityProfiles": 0,
  "contextBundles": 2,
  "dirtyBundles": 0,
  "invalidationQueue": 0
}
```

### Step 4: Run Initial Profile Rollup

```bash
curl -X POST http://localhost:3000/api/v1/context/rollup-all \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}'
```

---

## What Gets Enabled

| Feature | Description |
|---------|-------------|
| **Idle Detection** | Triggers librarian 5min after conversation inactivity |
| **Autonomous Librarian** | GLM-4.7 processes ACUs, creates topics/entities |
| **Dynamic Context** | Uses pre-built bundles with budget negotiation |
| **GPT Token Estimation** | 1.5x more accurate for technical content |
| **Progressive Compaction** | 4 strategies based on conversation length |

---

## What to Monitor

### Health Endpoint
```bash
# Check every 30 seconds during beta
watch -n 30 'curl -s http://localhost:3000/api/v1/context/health | jq .'
```

**Key Metrics:**
- `contextBundles`: Should increase over time
- `topicProfiles`: Should grow as librarian discovers topics
- `entityProfiles`: Should grow as librarian extracts entities

### Logs
```bash
# Watch for librarian triggers
tail -f logs/app.log | grep -i librarian

# Watch for bundle compilation
tail -f logs/app.log | grep -i "bundle\|context"
```

### Cache Hit Rate
Check AI response headers for `x-cache-hit-rate`:
```bash
curl -X POST http://localhost:3000/api/v1/ai/complete \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
```

**Target:** > 70% cache hit rate

---

## Rollback (If Issues)

### Immediate Rollback

```bash
# Option 1: Disable all Phase 2 features
ENABLE_IDLE_DETECTION=false
LIBRARIAN_ENABLED=false
USE_DYNAMIC_CONTEXT=false

# Option 2: Keep dynamic context, disable librarian only
LIBRARIAN_ENABLED=false

# Restart
bun run dev
```

### Verify Rollback
```bash
curl http://localhost:3000/api/v1/context/health
```

Should show:
```json
{
  "newEngineAvailable": true,  // Still true (ready)
  "oldEngineAvailable": true,  // Fallback active
  ...
}
```

---

## Troubleshooting

### Librarian Not Triggering
```bash
# Check if enabled
curl http://localhost:3000/api/v1/context/librarian/status

# Should show:
{
  "enabled": true,
  "lastRunTime": "2026-02-11T...",
  "cooldownMinutes": 30
}
```

**Fix:** Check `ENABLE_IDLE_DETECTION=true` in `.env`

### Zero Topic/Entity Profiles
```bash
# Check if ACUs exist
curl http://localhost:3000/api/v1/context/health | jq .topicProfiles

# Run manual rollup
curl -X POST http://localhost:3000/api/v1/context/rollup-all \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}'
```

### High Latency (> 200ms)
```bash
# Check assembly time in response
curl -X POST http://localhost:3000/api/v1/ai/complete ... | jq .contextStats.assemblyTimeMs

# Target: < 150ms
```

**If high:** Check database indexes and connection pooling.

---

## Phase 2 Success Criteria

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| Cache Hit Rate | > 70% | Review warmup triggers |
| Assembly Time | < 150ms | Check bundle freshness |
| Profile Growth | +5/day | Verify librarian triggers |
| Error Rate | < 1% | Check logs, consider rollback |

---

## Documentation

- **Full Status:** `VIVIM.docs/CONTEXT/IMPLEMENTATION_STATUS_COMPREHENSIVE.md`
- **Design Specs:** `VIVIM.docs/CONTEXT/*.md`
- **API Docs:** `/api-docs` (when running)
