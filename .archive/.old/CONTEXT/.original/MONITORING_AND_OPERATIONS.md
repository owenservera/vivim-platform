# Monitoring and Operations Guide

**Document Version:** 1.0.0
**Date:** February 11, 2026
**Related:** `IMPLEMENTATION_GUIDE_MASTER.md`, `MIGRATION_AND_DEPLOYMENT.md`

---

## Table of Contents

1. [Monitoring Architecture](#monitoring-architecture)
2. [Key Metrics](#key-metrics)
3. [Monitoring Setup](#monitoring-setup)
4. [Alerting](#alerting)
5. [Operations Procedures](#operations-procedures)
6. [Troubleshooting Guide](#troubleshooting-guide)

---

## Monitoring Architecture

### Monitoring Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVATION LAYER                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Application Metrics (Node.js + Custom)    │    │
│  │  - Custom Metrics Exporter              │    │
│  │  - Health Check Endpoint                 │    │
│  │  └──────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Prometheus Server                         │    │
│  │  - Metrics Scraping                      │    │
│  │  - AlertManager (for PagerDuty integration) │    │
│  │  └──────────────────────────────────────────┘    │
│                                                                   │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  Grafana Dashboard                        │    │
│  │  - Real-time Visualization                 │    │
│  │  - Alert Dashboard                         │    │
│  │  └───────────────────────────────────────────    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Application (Node.js)
    ↓ (Prometheus Push)
Prometheus Server
    ↓ (Scrape)
Metrics Database (TSDB)
    ↓ (Query)
Grafana Dashboard
    ↓ (Visualize)
```

---

## Key Metrics

### Context Engine Metrics

| Metric | Type | Description | Target | Alert Threshold |
|--------|------|-------------|--------|-----------------|
| `context_assembly_time_ms` | Histogram | Time to assemble context | P95 < 150ms | > 200ms |
| `context_assembly_success_rate` | Counter | Success / total requests | > 99.5% | < 98% |
| `context_cache_hit_rate` | Gauge | Fresh bundles / total bundles | > 85% | < 75% |
| `cache_misses_total` | Counter | Total cache misses | < 10/min (per 1000 users) | > 30/min |
| `bundle_compilation_time_ms` | Histogram | Time to compile bundle | P95 < 200ms | > 300ms |
| `invalidation_queue_length` | Gauge | Pending invalidation events | < 20 | > 50 |
| `profile_rollup_acus_processed` | Counter | ACUs processed per rollup | Monitored (trend analysis) |
| `profile_rollup_topics_created` | Counter | Topics created per rollup | Monitored (trend analysis) |
| `embedding_api_calls_total` | Counter | Embedding API requests | < 1000/min | > 2000/min |
| `embedding_api_errors` | Counter | Embedding API errors | < 1/min | > 10/min |
| `new_engine_requests_total` | Counter | Requests using new engine | Monitored (traffic share) |
| `legacy_fallbacks_total` | Counter | Fallbacks to legacy engine | < 5% | > 15% |
| `llm_api_latency_ms` | Histogram | LLM API latency | P95 < 2000ms | > 3000ms |
| `database_query_latency_ms` | Histogram | Database query latency | P95 < 50ms | > 100ms |
| `database_connection_pool_size` | Gauge | Active database connections | < 10 (per instance) | 5-20 (per instance) |
| `cpu_usage_percent` | Gauge | CPU usage | < 70% | > 90% |
| `memory_usage_percent` | Gauge | Memory usage | < 80% | < 95% |
| `active_sessions` | Gauge | Currently active users | Monitored (capacity planning) |

### Metrics Definitions (Prometheus Format)

```yaml
# server/src/monitoring/metrics.ts
import { register, Counter, Histogram, Gauge, Summary } from 'prom-client';

// 1. Context Assembly Metrics
export const contextAssemblyTime = new Histogram({
  name: 'context_assembly_time_ms',
  help: 'Time taken to assemble context (L0-L7 layers)',
  labelNames: ['layer'],
  buckets: [50, 100, 150, 200, 300, 500, 1000, 5000]
});

export const contextAssemblySuccess = new Counter({
  name: 'context_assembly_success_total',
  help: 'Total context assembly requests'
});

export const contextAssemblyFailures = new Counter({
  name: 'context_assembly_failures_total',
  help: 'Total context assembly failures'
});

export const cacheHits = new Counter({
  name: 'context_cache_hits_total',
  help: 'Total cache hits (fresh bundles served)'
});

export const cacheMisses = new Counter({
  name: 'context_cache_misses_total',
  help: 'Total cache misses (stale or missing bundles)'
});

export const newEngineRequests = new Counter({
  name: 'new_engine_requests_total',
  help: 'Total requests using new dynamic context engine'
});

export const legacyFallbacks = new Counter({
  name: 'legacy_fallbacks_total',
  help: 'Total fallbacks to legacy context engine'
});

// 2. Bundle Compilation Metrics
export const bundleCompilationTime = new Histogram({
  name: 'bundle_compilation_time_ms',
  help: 'Time taken to compile context bundle',
  buckets: [100, 200, 300, 500, 1000, 5000],
  labelNames: ['bundle_type']
});

// 3. Invalidation Metrics
export const invalidationQueueLength = new Gauge({
  name: 'invalidation_queue_length',
  help: 'Current number of pending invalidation events'
});

export const invalidationProcessed = new Counter({
  name: 'invalidation_processed_total',
  help: 'Total invalidation events processed'
});

// 4. Profile Rollup Metrics
export const rollupAcusProcessed = new Counter({
  name: 'profile_rollup_acus_processed_total',
  help: 'Total ACUs processed during rollup'
});

export const topicsCreated = new Counter({
  name: 'profile_rollup_topics_created',
  help: 'Total topic profiles created'
});

export const entitiesCreated = new Counter({
  name: 'profile_rollup_entities_created',
  help: 'Total entity profiles created'
});

// 5. API Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration',
  buckets: [50, 100, 200, 500, 1000, 5000]
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests'
});

export const httpErrors = new Counter({
  name: 'http_errors_total',
  help: 'Total HTTP errors (5xx status codes)'
});

// 6. Database Metrics
export const dbQueryDuration = new Histogram({
  name: 'database_query_duration_ms',
  help: 'Database query duration',
  buckets: [10, 25, 50, 100, 200, 500]
});

export const dbConnectionsActive = new Gauge({
  name: 'database_connections_active',
  help: 'Active database connections'
});

export const dbConnectionsIdle = new Gauge({
  name: 'database_connections_idle',
  help: 'Idle database connections'
});

export const dbQueryErrors = new Counter({
  name: 'database_query_errors_total',
  help: 'Database query errors'
});

// 7. System Metrics
export const cpuUsagePercent = new Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage'
});

export const memoryUsagePercent = new Gauge({
  name: 'memory_usage_percent',
  help: 'Memory usage percentage'
});

export const activeSessions = new Gauge({
  name: 'active_sessions',
  help: 'Currently active user sessions'
});

// Export all metrics
export const registry = new Registry();
registry.setDefaultMetrics({
  contextAssemblyTime,
  contextAssemblySuccess,
  contextAssemblyFailures,
  cacheHits,
  cacheMisses,
  bundleCompilationTime,
  invalidationQueueLength,
  invalidationProcessed,
  rollupAcusProcessed,
  topicsCreated,
  entitiesCreated,
  newEngineRequests,
  legacyFallbacks,
  httpRequestDuration,
  httpRequestsTotal,
  httpErrors,
  dbQueryDuration,
  dbConnectionsActive,
  dbConnectionsIdle,
  dbQueryErrors,
  cpuUsagePercent,
  memoryUsagePercent,
  activeSessions
});
```

### Metrics Exporter Configuration

```typescript
// server/src/monitoring/metrics-exporter.ts

import express from 'express';
import { Registry } from 'prom-client';
import { registry } from './metrics';

const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'application/json');
  res.send(await registry.metrics());
});

export const port = process.env.METRICS_PORT || 9091;
app.listen(port, () => {
  console.log(`Metrics server listening on port ${port}`);
});
});
```

### Health Check Metrics Integration

```typescript
// server/src/services/unified-context-service.ts (enhancement)

export interface HealthMetrics {
  topicProfiles: number;
  entityProfiles: number;
  contextBundles: number;
  dirtyBundles: number;
  invalidationQueue: number;
  assemblyTimeMs?: {
    p50: number;
    p95: number;
    p99: number;
  };
  cacheHitRate?: number;
}

// Add to getHealth() method
async getHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  newEngineAvailable: boolean;
  oldEngineAvailable: boolean;
  stats?: HealthMetrics;
}> {
  // Get stats from metrics registry
  const contextAssemblyTime = registry.getMetricAs('histogram')('context_assembly_time_ms');

  const health: any = {
    status: 'healthy',
    newEngineAvailable: !!this.dynamicAssembler,
    oldEngineAvailable: true,
    stats: {
      topicProfiles: registry.getMetricAs('gauge')('topic_profiles_count')?.value || 0,
      entityProfiles: registry.getMetricAs('gauge')('entity_profiles_count')?.value || 0,
      contextBundles: registry.getMetricAs('gauge')('context_bundles_count')?.value || 0,
      dirtyBundles: registry.getMetricAs('gauge')('dirty_bundles_count')?.value || 0,
      invalidationQueue: registry.getMetricAs('gauge')('invalidation_queue_length')?.value || 0
    }
  };

  if (health.status !== 'healthy') {
    // Add degraded metrics
    health.assemblyTimeMs = {
      p50: contextAssemblyTime.get().values.reduce((sum, v) => sum + v.value, 0) / 2,
      p95: contextAssemblyTime.get().values.reduce((sum, v) => sum + v.value, 0) / 20,
      p99: contextAssemblyTime.get().values.reduce((sum, v) => sum + v.value, 0) / 100
    };
  }

  return health;
}
```

---

## Monitoring Setup

### Prometheus Configuration

```yaml
# prometheus/prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'openscroll-context-engine'
    environment: 'production'

scrape_configs:
  - job_name: 'context-engine'
    scrape_interval: 15s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['up']
    scheme: http
      basic_auth:
        username: prometheus
        password: ${PROMETHEUS_PASSWORD}
```

### Application Metrics Endpoint

```typescript
// server/src/routes/metrics.js

const express = require('express');
const { registry } = require('../monitoring/metrics');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', 'application/json');
    res.send(await registry.metrics());
  } catch (error) {
    logger.error({ error: error.message }, 'Metrics route: Failed to export metrics');
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
```

### Dashboard Configuration (Grafana)

```json
{
  "dashboard": {
    "title": "OpenScroll Context Engine",
    "panels": [
      {
        "title": "Context Assembly Performance",
        "targets": [
          {
            "expr": "rate(context_assembly_success_total[5m]) / rate(context_assembly_requests_total[5m])",
            "legendFormat": "{{value}} reqs/s"
          },
          {
            "expr": "histogram_quantile(0.95, context_assembly_time_ms)",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, context_assembly_time_ms)",
            "legendFormat": "P99"
          }
        ]
      },
      {
        "title": "Cache Performance",
        "targets": [
          {
            "expr": "rate(cache_hits_total[5m])",
            "legendFormat": "{{value}} hits/min"
          },
          {
            "expr": "rate(cache_misses_total[5m])",
            "legendFormat": "{{value}} misses/min"
          },
          {
            "expr": "rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))",
            "legendFormat": "Hit rate"
          }
        ]
      },
      {
        "title": "Invalidation Queue",
        "targets": [
          {
            "expr": "invalidation_queue_length",
            "legendFormat": "Queue length"
          },
          {
            "expr": "rate(invalidation_processed_total[5m])",
            "legendFormat": "Processed/min"
          }
        ]
      },
      {
        "title": "Engine Usage",
        "targets": [
          {
            "expr": "rate(new_engine_requests_total[5m])",
            "legendFormat": "New engine reqs/min"
          },
          {
            "expr": "rate(legacy_fallbacks_total[5m])",
            "legendFormat": "Legacy fallbacks/min"
          },
          {
            "expr": "rate(legacy_fallbacks_total[5m]) / (rate(legacy_fallbacks_total[5m]) + rate(new_engine_requests_total[5m]))",
            "legendFormat": "Fallback rate"
          }
        ]
      },
      {
        "title": "API Performance",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_ms)",
            "legendFormat": "P95 latency"
          },
          {
            "expr": "histogram_quantile(0.99, http_request_duration_ms)",
            "legendFormat": "P99 latency"
          }
        ],
          {
            "expr": "rate(http_errors_total[5m])",
            "legendFormat": "Errors/min"
          },
          {
            "expr": "sum(rate(http_requests_total[5m]))",
            "legendFormat": "Total requests (5m)"
          }
        ]
      },
      {
        "title": "Database Performance",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, database_query_duration_ms)",
            "legendFormat": "P95 query latency"
          },
          {
            "expr": "histogram_quantile(0.99, database_query_duration_ms)",
            "legendFormat": "P99 query latency"
          },
          {
            "expr": "rate(db_query_errors_total[5m])",
            "legendFormat": "Errors/min"
          },
          {
            "expr": "database_connections_active",
            "legendFormat": "Active connections"
          },
          {
            "expr": "cpu_usage_percent",
            "legendFormat": "CPU %"
          },
          {
            "expr": "memory_usage_percent",
            "legendFormat": "Memory %"
          }
        ]
      },
      {
        "title": "System Resources",
        "targets": [
          {
            "expr": "active_sessions",
            "legendFormat": "Active sessions"
          }
        ]
      }
    ]
  }
}
```

---

## Alerting

### Alert Rules

| Alert | Metric | Condition | Severity | Action |
|-------|--------|-----------|----------|
| Low Cache Hit Rate | `cache_hit_rate` < 75% for 10 min | warning | Investigate topic/entity detection accuracy |
| High Invalidation Queue | `invalidation_queue_length` > 50 for 5 min | critical | Scale up invalidation processing workers |
| Slow Assembly Time | `context_assembly_time_ms` p95 > 300ms | warning | Investigate database query performance |
| High Error Rate | `http_errors_total` rate > 1% for 5 min | critical | Check API health, investigate root cause |
| Database Pool Exhaustion | `database_connections_active` > 18 of 20 (90%) | critical | Scale database or increase pool size |
| High CPU Usage | `cpu_usage_percent` > 90% for 5 min | critical | Scale up pods or investigate performance issue |
| High Memory Usage | `memory_usage_percent` > 90% for 5 min | critical | Scale up pods or investigate memory leak |
| New Engine Error Rate | `new_engine_requests_total` error rate > 10% | critical | Consider rollback to legacy engine |

### Alert Manager

```typescript
// server/src/monitoring/alert-manager.ts

interface Alert {
  metricName: string;
  currentValue: number;
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  condition: string;
  recommendation?: string;
}

class AlertManager {
  private alertHistory: Alert[] = [];
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
    this.startAlertChecker();
  }

  async checkAlerts(): Promise<void> {
    // Get metrics from registry
    const cacheHits = registry.getMetricAs('counter')('cache_hits_total')?.value || 0;
    const cacheMisses = registry.getMetricAs('counter')('cache_misses_total')?.value || 0;
    const totalRequests = cacheHits + cacheMisses;
    const invalidationQueue = registry.getMetricAs('gauge')('invalidation_queue_length')?.value || 0;
    const assemblyTime = registry.getMetricAs('histogram')('context_assembly_time_ms');

    // Check cache hit rate
    if (totalRequests > 10) {
      const recentHits = cacheHits as number;
      const hitRate = recentHits / totalRequests;

      if (hitRate < 0.75) {
        this.sendAlert({
          metricName: 'cache_hit_rate',
          currentValue: hitRate,
          threshold: 0.75,
          severity: 'warning',
          condition: `cache_hit_rate < ${this.threshold} for 10 minutes`,
          recommendation: 'Investigate topic/entity detection accuracy in ProfileRollupService'
        });
      }
    }

    // Check invalidation queue
    if (invalidationQueue > 50) {
      this.sendAlert({
        metricName: 'invalidation_queue_length',
        currentValue: invalidationQueue,
        threshold: 50,
        severity: 'critical',
        condition: `invalidation_queue_length > ${this.threshold}`,
        recommendation: 'Invalidation queue backing up. Consider increasing INVALIDATION_PROCESS_INTERVAL_MS or batch size.'
      });
    }

    // Check assembly time
    if (assemblyTime.get().values.length > 0) {
      const p95 = this.calculatePercentile(assemblyTime, 95);
      const p99 = this.calculatePercentile(assemblingTime, 99);

      if (p95 > 300) {
        this.sendAlert({
          metricName: 'context_assembly_time_ms',
          currentValue: p95,
          threshold: 300,
          severity: 'warning',
          condition: `context_assembly_time_ms p95 > ${this.threshold}ms`,
          recommendation: 'Database queries may be slow. Check indexes and connection pooling.'
        });
      }
    }
  }

  private calculatePercentile(histogram: any, percentile: number): number {
    const values = histogram.get().values.sort((a, b) => a - b);
    const index = Math.floor((values.length * percentile) / 100);
    return values[index];
  }

  async sendAlert(alert: Alert): Promise<void> {
    // Add to history
    this.alertHistory.push(alert);

    // Send notification
    await this.notificationService.sendAlert({
      metricName: alert.metricName,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      severity: alert.severity,
      condition: alert.condition,
      recommendation: alert.recommendation
    });

    logger.warn({
      metricName: alert.metricName,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      condition: alert.condition
    }, 'AlertManager: Sending alert');
  }

  private startAlertChecker(): void {
    // Run alert checks every 30 seconds
    setInterval(() => {
      this.checkAlerts();
    }, 30000);  // 30 seconds
  }
}

  async getAlertHistory(): Promise<Alert[]> {
    return this.alertHistory;
  }
}

export default AlertManager;
```

---

## Operations Procedures

### Daily Operations Checklist

#### Morning (09:00 UTC)

- [ ] Review overnight metrics for anomalies
- [ ] Check alert history from last 24 hours
- [ ] Review database performance (slow queries, connection issues)
- [ ] Check cache hit rate trends (declining indicates issues)
- [ ] Verify profile rollup jobs completed successfully

#### Weekly (Monday 09:00 UTC)

- [ ] Review weekly metrics report
- [ ] Analyze trends in cache hit rate, assembly time, error rate
- [ ] Review new vs legacy engine usage ratio
- [ ] Check database growth rates (Topic/EntityProfile table sizes)
- [ ] Review embedding API usage and costs
- [ ] Update capacity planning based on active sessions trend
- [ ] Generate performance optimization recommendations

#### Monthly (First Monday)

- [ ] Generate comprehensive performance report
- [ ] Analyze capacity needs for next 30 days
- [ ] Review alert effectiveness and reduce false positives
- [ ] Document any architecture decisions made
- [ ] Plan optimization initiatives (indexes, caching, query tuning)

---

## Troubleshooting Guide

### Issue: Context Assembly Time High (> 300ms p95)

**Symptoms:**
- Health check shows `assemblyTimeMs.p95 > 300ms`
- Dashboard shows high database query latency

**Investigation Steps:**

1. **Check Database Query Performance**
```sql
-- Find slow queries
SELECT query, mean_exec_time_ms, calls, mean_exec_time_ms
FROM pg_stat_statements
WHERE query ~ '%context%'
ORDER BY mean_exec_time_ms DESC
LIMIT 10;

-- Check for missing indexes
EXPLAIN ANALYZE
SELECT * FROM topic_profiles
WHERE "userId" = 'user-123';

-- Check for full table scans
SELECT schemaname, tablename, seq_scan, seq_tup_read
FROM pg_stat_user_tables
WHERE schemaname LIKE 'context%';
```

2. **Check Bundle Compilation Queries**

```sql
-- Analyze BundleCompiler queries
SELECT query, calls, mean_exec_time_ms, total_exec_time_ms
FROM pg_stat_statements
WHERE query ILIKE '%compile%bundle%'
ORDER BY mean_exec_time_ms DESC;
LIMIT 10;
```

3. **Optimization Actions**

```bash
# Add missing indexes if needed
# Check topic profiles
psql $DATABASE_URL -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS topic_profiles_optimization_idx ON topic_profiles(userId, lastEngagedAt DESC)"

# Create partial index for context bundles
psql $DATABASE_URL -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS context_bundles_optimization_idx ON context_bundles(userId, isDirty, bundleType) WHERE userId = 'user-123' AND isDirty = true"

# Vacuum analyze
psql $DATABASE_URL -c "VACUUM ANALYZE topic_profiles, entity_profiles"

# Update statistics targets
psql $DATABASE_URL -c "ALTER STATISTICS SET track_functions = 'all'"
```

### Issue: Cache Hit Rate Low (< 75%)

**Symptoms:**
- Health check shows `cacheHitRate < 0.75` for 10 minutes
- Dashboard shows increasing miss rate trend

**Investigation Steps:**

1. **Check Bundle Freshness**

```sql
-- Find bundles with stale compiledAt
SELECT bundleType, COUNT(*) as total,
       COUNT(*) FILTER (WHERE compiledAt < NOW() - INTERVAL '1 hour') as stale
FROM context_bundles
WHERE userId = 'user-123'
GROUP BY bundleType;
```

2. **Check Prediction Engine Accuracy**

```sql
-- Check if warmed bundles are being used
SELECT bundleType, COUNT(*) as hits,
       COUNT(*) as misses,
       AVG(hit_count) as avg_hit_rate
FROM context_bundles
WHERE userId = 'user-123'
GROUP BY bundleType;
```

3. **Optimization Actions**

```bash
# Trigger recompilation for stale bundles
# This will warmup bundles that are being used frequently
curl -X POST http://localhost:3000/api/v1/context/warmup/user-123 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"force": true}'

# Tune prediction thresholds
# WARMUP_PREDICTION_THRESHOLD may be too low. Adjust upward.
```

### Issue: Invalidation Queue Backlog (> 50)

**Symptoms:**
- Health check shows `invalidationQueueLength > 50`
- Alerts indicate critical backlog growing

**Investigation Steps:**

1. **Check Invalidation Processing Rate**

```sql
-- Check invalidation queue processing rate
SELECT AVG(EXTRACT(epoch FROM (completed_at) -
              EXTRACT(epoch FROM (created_at))) / 60 as rate_per_minute)
FROM system_action
WHERE trigger = 'invalidation-queue'
  AND created_at > NOW() - INTERVAL '1 hour';
```

2. **Identify Blockages**

```bash
# Check for stuck events
psql $DATABASE_URL -c "
SELECT sa.id, sa.trigger, sa.status, sa.created_at, sa.completed_at,
       sa.metadata
FROM system_action sa
LEFT JOIN system_action sa2 ON sa2.trigger = sa.trigger
WHERE sa.trigger = 'invalidation-queue'
  AND sa.status = 'processing'
  AND sa2.completed_at IS NULL
ORDER BY sa.created_at ASC
LIMIT 10
"
```

3. **Optimization Actions**

```bash
# Scale up invalidation processing
# Increase INVALIDATION_PROCESS_INTERVAL_MS from 5000 to 2500ms

# Increase batch size
# Update INVALIDATION_BATCH_SIZE from 10 to 20

# Manually clear stuck events
curl -X POST http://localhost:3000/admin/invalidation/clear-stuck \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Issue: High New Engine Error Rate (> 10%)

**Symptoms:**
- Alert manager shows `new_engine_requests_total` error rate > 10%
- Health check may show degraded status

**Investigation Steps:**

1. **Check Error Types**

```sql
-- Analyze error types
SELECT error_type, COUNT(*)
FROM context_error_log
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY error_type;

-- Error types: 'context_assembly_error', 'database_error', 'embedding_api_error', 'llm_api_error'
```

2. **Check Root Causes**

```bash
# Check recent error logs
journalctl -u app=openscroll-server --since "1 hour ago" | grep -i "context.*error"

# Look for specific patterns
# "Prisma upsert failed" → database constraint issue
# "Embedding API rate limit" → API throttling
# "LLM timeout" → performance or API issue
```

3. **Optimization Actions**

```bash
# If Prisma errors:
# Check for recent schema changes
# Review migration scripts

# If API throttling:
# Add rate limiting on context engine routes

# If LLM timeouts:
# Check LLM API status page
# Consider increasing timeout or using different model
# Implement retry logic with exponential backoff
```

### Issue: Database Connection Pool Exhaustion

**Symptoms:**
- `database_connections_active` > 18 of 20 (90%)
- Alerts indicate critical pool exhaustion

**Investigation Steps:**

1. **Check Connection Pool Configuration**

```bash
# Check pgBouncer configuration
kubectl get config -n pgbouncer | grep -A 5 "max_connections"

# Check current connection count
psql $DATABASE_URL -c "SELECT count(*), state FROM pg_stat_activity;"
```

2. **Optimization Actions**

```bash
# Increase connection pool size in Kubernetes deployment
# Update max_connections in pgBouncer config

# Add database connection pool to Prisma schema
# server/prisma/schema.prisma:
# datasources:
#   url: env("DATABASE_URL")
#   pool_timeout: 20
#   connection_limit: 20
```

### Issue: Memory Usage High (> 90%)

**Symptoms:**
- `memory_usage_percent` > 90% for 5 minutes
- Alerts indicate critical memory usage

**Investigation Steps:**

1. **Check Node.js Memory Usage**

```bash
# Get process memory info
kubectl top nodes -l openscroll-context --containers=true

# Check for memory leaks
# Use heapdump to analyze memory profile
node --heapsnapshot

# Check specific services
# Monitor memory usage per service
# Check ProfileRollupService for embedding batch size issues
```

2. **Optimization Actions**

```bash
# Reduce ProfileRollup batch size
# Update ROLLUP_BATCH_SIZE env var from 100 to 50

# Increase pod memory limits in Kubernetes
# Update memory limits in deployment YAML

# Implement caching to reduce memory pressure
# Reduce embedding batch size further
```

---

## Runbook: Incident Response

### Severity Levels

| Severity | Response Time | Escalation Path |
|-----------|---------------|---------------|
| **Critical** | < 15 minutes | On-call engineer → Engineering team → CTO |
| **Warning** | < 1 hour | Engineering team |
| **Info** | < 24 hours | Engineering team |

### Critical Incident: Context Engine Down

**Detection:**
- Health check returns `status: "down"` or `newEngineAvailable: false`
- Multiple alerts firing for critical metrics

**Response Procedure:**

1. **Assess Impact**
   - Are users experiencing errors?
   - Is any data being lost?
   - What percentage of users affected?

2. **Immediate Mitigation**
   - If cache hit rate < 50%, disable new engine via environment variable
   - Rollback to legacy context engine (feature flag)
   - Document incident in ticket

3. **Investigation**
   - Check logs for error patterns
   - Run diagnostics: database connections, API endpoints
   - Check system resources: CPU, memory, disk I/O
   - Review recent code deployments for changes

4. **Resolution**
   - Fix root cause (e.g., database issue, API rate limit)
   - Enable features back gradually
   - Update runbook with resolution

### Warning Incident: Cache Performance Degradation

**Detection:**
- Cache hit rate declining from 90% → 70% over several hours
- Assembly time increasing from 100ms → 250ms

**Response Procedure:**

1. **Assess Impact**
   - Users may notice slower responses
   - Increased latency on context assembly

2. **Investigation**
   - Check bundle compilation performance
   - Check for database query changes
   - Review recent code changes

3. **Resolution**
   - Identify and optimize slow queries
- Add missing indexes
- Tune bundle compilation
- Document improvements in knowledge base

### Info Incident: Weekly Performance Report

**Purpose:** Proactive monitoring and optimization

**Response Procedure:**

1. **Generate Report**
   - Compile weekly metrics summary
   - Identify trends: improving or degrading
   - Compare new vs legacy engine performance
   - Document any optimization opportunities

2. **Share with Team**
   - Post to engineering channel
   - Present in team meeting
   - Add to knowledge base

3. **Implementation**
   - Implement approved optimizations
   - Schedule validation tests for changes
   - Update runbook

---

## Operations Tools

### Log Analysis

```bash
# Search for context engine errors
journalctl -u app=openscroll-server --since "1 hour" | grep -i "context.*error\|invalidation.*error"

# Extract error patterns
# "Prisma upsert failed"
# "Embedding API 503 rate limit"
# "Context assembly timeout"
```

### Metrics Querying

```bash
# Get current metrics via curl
curl http://localhost:9091/metrics | jq '.'

# Query specific metric
curl 'http://localhost:9091/metrics?query[]=cache_hit_rate,assembly_time_ms'

# Get Prometheus raw data for custom analysis
curl 'http://localhost:9091/api/v1/metrics?format=json'
```

### Health Check Scripts

```bash
#!/bin/bash
# health-check.sh

echo "=== Context Engine Health Check ==="
echo "Date: $(date)"
echo ""

# Check health endpoint
HEALTH=$(curl -s http://localhost:3000/api/v1/context/health)
STATUS=$(echo "$HEALTH" | jq -r '.status')
echo "Status: $STATUS"

# Check each health indicator
echo ""
echo "New Engine Available: $(echo "$HEALTH" | jq -r '.newEngineAvailable')"
echo "Topic Profiles: $(echo "$HEALTH" | jq -r '.stats.topicProfiles // null')"
echo "Entity Profiles: $(echo "$HEALTH" | jq -r '.stats.entityProfiles // null')"
echo "Context Bundles: $(echo "$HEALTH" | jq -r '.stats.contextBundles // null')"
echo "Dirty Bundles: $(echo "$HEALTH" | jq -r '.stats.dirtyBundles // null')"
echo "Invalidation Queue: $(echo "$HEALTH" | jq -r '.stats.invalidationQueue // null')"

echo ""
echo "=== Critical Thresholds ==="
echo "Cache Hit Rate Threshold: < 75%"
echo "Assembly Time Threshold (P95): > 300ms"
echo "Invalidation Queue Threshold: > 50"
echo "DB Connections Critical: > 18 of 20 (90%)"
```

### Emergency Rollback Script

```bash
#!/bin/bash
# emergency-rollback.sh

echo "=== EMERGENCY ROLLBACK ==="
echo "Date: $(date)"
echo ""

# Stop all context engine background jobs
kubectl scale deployment/context-engine --replicas=0

# Switch to legacy engine
curl -X PATCH https://your-api.com/admin/config \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "feature": "DYNAMIC_CONTEXT_ENGINE",
    "enabled": false,
    "reason": "Emergency rollback"
  }'

# Verify rollback
sleep 5
HEALTH_AFTER=$(curl -s http://localhost:3000/api/v1/context/health)
echo ""
echo "Status after rollback:"
echo "$HEALTH_AFTER" | jq '.'

# Notify team
# Send Slack message or PagerDuty notification
```

---

**Document End**

Refer to `IMPLEMENTATION_GUIDE_MASTER.md` for overview and other implementation documents.
