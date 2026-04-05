/**
 * VIVIM Server — Metrics Endpoint
 *
 * Prometheus-compatible metrics endpoint for observability.
 * Exports SDK, server, and network metrics in Prometheus text format.
 *
 * GET /api/metrics — Prometheus-format metrics (requires API key)
 * GET /api/metrics/json — JSON format for dashboards
 * GET /api/health — Health check (public)
 */

import type { Request, Response } from 'express';

// ============================================
// METRICS COLLECTOR
// ============================================

/**
 * In-process metrics collector for the server.
 * Aggregates metrics from all subsystems.
 */
export class ServerMetricsCollector {
  private startTime = Date.now();
  private requestCounts: Map<string, number> = new Map(); // endpoint -> count
  private requestLatencies: Map<string, number[]> = new Map(); // endpoint -> [latencies]
  private errorCounts: Map<string, number> = new Map(); // endpoint -> error count
  private customMetrics: Map<string, number> = new Map();

  /**
   * Record an HTTP request.
   */
  recordRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    const key = `${method} ${this.simplifyPath(path)}`;

    // Request count
    this.requestCounts.set(key, (this.requestCounts.get(key) ?? 0) + 1);

    // Latency
    if (!this.requestLatencies.has(key)) {
      this.requestLatencies.set(key, []);
    }
    this.requestLatencies.get(key)!.push(durationMs);

    // Errors
    if (statusCode >= 400) {
      this.errorCounts.set(key, (this.errorCounts.get(key) ?? 0) + 1);
    }
  }

  /**
   * Set a custom metric value.
   */
  setMetric(name: string, value: number): void {
    this.customMetrics.set(name, value);
  }

  /**
   * Increment a custom metric.
   */
  incrementMetric(name: string, value = 1): void {
    this.customMetrics.set(name, (this.customMetrics.get(name) ?? 0) + value);
  }

  /**
   * Get all metrics in JSON format.
   */
  getJSON(extraMetrics?: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {
      uptime_ms: Date.now() - this.startTime,
      uptime_human: this.humanUptime(),
      requests: Object.fromEntries(this.requestCounts),
      errors: Object.fromEntries(this.errorCounts),
      custom: Object.fromEntries(this.customMetrics),
      timestamp: new Date().toISOString(),
    };

    // Add latency percentiles
    const latencyMetrics: Record<string, unknown> = {};
    for (const [key, values] of this.requestLatencies) {
      latencyMetrics[key] = this.computePercentiles(values);
    }
    result.latency = latencyMetrics;

    // Merge extra metrics
    if (extraMetrics) {
      Object.assign(result, extraMetrics);
    }

    return result;
  }

  /**
   * Export in Prometheus text format.
   */
  getPrometheus(extraMetrics?: Record<string, unknown>): string {
    const lines: string[] = [];

    // Helper
    const metric = (name: string, help: string, type: 'counter' | 'gauge' | 'histogram', value: number, labels?: Record<string, string>) => {
      lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} ${type}`);
      const labelStr = labels ? `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : '';
      lines.push(`${name}${labelStr} ${value}`);
    };

    // Uptime
    metric('process_uptime_seconds', 'Process uptime in seconds', 'gauge', (Date.now() - this.startTime) / 1000);

    // Memory
    const mem = process.memoryUsage();
    metric('process_resident_memory_bytes', 'Resident set size', 'gauge', mem.rss);
    metric('process_heap_total_bytes', 'Total heap size', 'gauge', mem.heapTotal);
    metric('process_heap_used_bytes', 'Used heap size', 'gauge', mem.heapUsed);
    metric('process_external_bytes', 'External memory', 'gauge', mem.external);

    // Requests
    for (const [key, count] of this.requestCounts) {
      const [method, ...pathParts] = key.split(' ');
      metric('http_requests_total', 'Total HTTP requests', 'counter', count, {
        method: method || 'UNKNOWN',
        path: pathParts.join(' ') || 'unknown',
      });
    }

    // Errors
    for (const [key, count] of this.errorCounts) {
      const [method, ...pathParts] = key.split(' ');
      metric('http_errors_total', 'Total HTTP errors', 'counter', count, {
        method: method || 'UNKNOWN',
        path: pathParts.join(' ') || 'unknown',
      });
    }

    // Latency percentiles
    for (const [key, values] of this.requestLatencies) {
      const percentiles = this.computePercentiles(values);
      const [method, ...pathParts] = key.split(' ');
      metric('http_latency_ms', 'Request latency p50', 'gauge', percentiles.p50, {
        method: method || 'UNKNOWN',
        path: pathParts.join(' ') || 'unknown',
        quantile: '0.5',
      });
      metric('http_latency_ms', 'Request latency p95', 'gauge', percentiles.p95, {
        method: method || 'UNKNOWN',
        path: pathParts.join(' ') || 'unknown',
        quantile: '0.95',
      });
      metric('http_latency_ms', 'Request latency p99', 'gauge', percentiles.p99, {
        method: method || 'UNKNOWN',
        path: pathParts.join(' ') || 'unknown',
        quantile: '0.99',
      });
    }

    // Custom metrics
    for (const [name, value] of this.customMetrics) {
      metric(name, 'Custom metric', 'gauge', value);
    }

    // Extra metrics
    if (extraMetrics) {
      for (const [name, value] of Object.entries(extraMetrics)) {
        if (typeof value === 'number') {
          metric(name, 'Extra metric', 'gauge', value);
        }
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Compute latency percentiles.
   */
  private computePercentiles(values: number[]): { p50: number; p95: number; p99: number; avg: number; count: number } {
    if (values.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0, count: 0 };

    const sorted = [...values].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;

    return { p50: Math.round(p50), p95: Math.round(p95), p99: Math.round(p99), avg: Math.round(avg), count: sorted.length };
  }

  /**
   * Simplify a URL path for grouping (remove IDs, etc.).
   */
  private simplifyPath(path: string): string {
    return path
      .replace(/\/[0-9a-f]{8,}/g, '/:id')
      .replace(/\/[^/]+\.[a-z]+$/g, '/:file');
  }

  /**
   * Human-readable uptime.
   */
  private humanUptime(): string {
    const ms = Date.now() - this.startTime;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Reset all metrics (for demo resets).
   */
  reset(): void {
    this.requestCounts.clear();
    this.requestLatencies.clear();
    this.errorCounts.clear();
    this.customMetrics.clear();
    this.startTime = Date.now();
  }
}

// ============================================
// EXPRESS ROUTES
// ============================================

/**
 * Create metrics routes for Express.
 */
export function createMetricsRoutes(
  collector: ServerMetricsCollector,
  options: {
    apiKey?: string;
    getExtraMetrics?: () => Promise<Record<string, unknown>>;
  } = {}
) {
  const router = require('express').Router();

  /**
   * GET /api/health — Public health check
   */
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      uptime: collector.getJSON().uptime_ms,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/metrics — Prometheus-format metrics
   */
  router.get('/metrics', async (req: Request, res: Response) => {
    // API key check
    if (options.apiKey) {
      const providedKey = req.headers['x-api-key'] || req.query.key;
      if (providedKey !== options.apiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const extraMetrics = options.getExtraMetrics ? await options.getExtraMetrics() : undefined;
    const prometheus = collector.getPrometheus(extraMetrics);

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(prometheus);
  });

  /**
   * GET /api/metrics/json — JSON format metrics
   */
  router.get('/metrics/json', async (req: Request, res: Response) => {
    if (options.apiKey) {
      const providedKey = req.headers['x-api-key'] || req.query.key;
      if (providedKey !== options.apiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const extraMetrics = options.getExtraMetrics ? await options.getExtraMetrics() : undefined;
    const json = collector.getJSON(extraMetrics);

    res.json(json);
  });

  return router;
}

/**
 * Express middleware to auto-record request metrics.
 */
export function metricsMiddleware(collector: ServerMetricsCollector) {
  return (req: Request, res: Response, next: () => void) => {
    const start = Date.now();

    // Record after response
    res.on('finish', () => {
      const duration = Date.now() - start;
      collector.recordRequest(req.method, req.path, res.statusCode, duration);
    });

    next();
  };
}
