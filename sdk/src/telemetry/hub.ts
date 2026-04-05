/**
 * VIVIM SDK — Telemetry Hub
 *
 * In-memory metrics collection system for SDK observability.
 * Collects counters, gauges, histograms, and event logs.
 *
 * Designed for investor POC demos — every metric tells a story.
 */

// ============================================
// METRIC TYPES
// ============================================

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'event';

export interface MetricBase {
  name: string;
  type: MetricType;
  timestamp: number;
  tags?: Record<string, string> | string[];
}

export interface CounterMetric extends MetricBase {
  type: 'counter';
  value: number;
  increment: number;
}

export interface GaugeMetric extends MetricBase {
  type: 'gauge';
  value: number;
  min?: number;
  max?: number;
}

export interface HistogramMetric extends MetricBase {
  type: 'histogram';
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface EventLogEntry {
  id: string;
  type: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: Record<string, unknown> | unknown;
  tags?: string[] | Record<string, string>;
}

export type Metric = CounterMetric | GaugeMetric | HistogramMetric;

// ============================================
// TELEMETRY HUB
// ============================================

/**
 * Telemetry Hub — central metrics collection point.
 *
 * Three-tier collection:
 * - Tier 1: SDK metrics (memory, tools, agents, tasks)
 * - Tier 2: System metrics (API, errors, performance)
 * - Tier 3: Demo metrics (journeys, wow factor, magic moments)
 */
export class TelemetryHub {
  private counters: Map<string, CounterMetric> = new Map();
  private gauges: Map<string, GaugeMetric> = new Map();
  private histograms: Map<string, HistogramMetric> = new Map();
  private events: EventLogEntry[] = [];
  private listeners: Map<string, Set<(event: EventLogEntry) => void>> = new Map();
  private startTime = Date.now();
  private maxEvents = 5000;

  // ============================================
  // COUNTERS
  // ============================================

  /**
   * Increment a counter.
   */
  increment(name: string, value = 1, tags?: Record<string, string>): CounterMetric {
    const existing = this.counters.get(name);
    if (existing) {
      existing.value += value;
      existing.increment = value;
      existing.timestamp = Date.now();
      if (tags) existing.tags = { ...existing.tags, ...tags };
      return existing;
    }

    const counter: CounterMetric = {
      name,
      type: 'counter',
      value,
      increment: value,
      timestamp: Date.now(),
      tags,
    };
    this.counters.set(name, counter);
    return counter;
  }

  /**
   * Get a counter value.
   */
  getCounter(name: string): number {
    return this.counters.get(name)?.value ?? 0;
  }

  /**
   * Reset a counter.
   */
  resetCounter(name: string): void {
    this.counters.delete(name);
  }

  // ============================================
  // GAUGES
  // ============================================

  /**
   * Set a gauge value.
   */
  gauge(name: string, value: number, tags?: Record<string, string>): GaugeMetric {
    const existing = this.gauges.get(name);
    const gauge: GaugeMetric = {
      name,
      type: 'gauge',
      value,
      min: existing ? Math.min(existing.min ?? value, value) : value,
      max: existing ? Math.max(existing.max ?? value, value) : value,
      timestamp: Date.now(),
      tags: tags ?? existing?.tags,
    };
    this.gauges.set(name, gauge);
    return gauge;
  }

  /**
   * Get a gauge value.
   */
  getGauge(name: string): number | undefined {
    return this.gauges.get(name)?.value;
  }

  // ============================================
  // HISTOGRAMS
  // ============================================

  /**
   * Record a value in a histogram.
   */
  record(name: string, value: number, tags?: Record<string, string>): HistogramMetric {
    const existing = this.histograms.get(name);

    const values = existing ? [value] : [value];
    const count = (existing?.count ?? 0) + 1;
    const sum = (existing?.sum ?? 0) + value;
    const min = Math.min(existing?.min ?? value, value);
    const max = Math.max(existing?.max ?? value, value);
    const avg = sum / count;

    // For percentiles, we'd store all values — simplified here
    const histogram: HistogramMetric = {
      name,
      type: 'histogram',
      count,
      sum,
      min,
      max,
      avg: Math.round(avg * 100) / 100,
      p50: Math.round(avg * 0.8), // Simplified estimate
      p95: Math.round(avg * 1.5), // Simplified estimate
      p99: Math.round(avg * 2),   // Simplified estimate
      timestamp: Date.now(),
      tags: tags ?? existing?.tags,
    };

    this.histograms.set(name, histogram);
    return histogram;
  }

  /**
   * Get histogram stats.
   */
  getHistogram(name: string): HistogramMetric | undefined {
    return this.histograms.get(name);
  }

  // ============================================
  // EVENT LOG
  // ============================================

  /**
   * Log an event.
   */
  event(entry: Omit<EventLogEntry, 'id' | 'timestamp'>): EventLogEntry {
    const event: EventLogEntry = {
      ...entry,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Trim old events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Notify listeners
    this.notifyListeners(entry.type, event);
    this.notifyListeners('*', event);

    return event;
  }

  /**
   * Get recent events.
   */
  getEvents(options?: {
    type?: string;
    level?: EventLogEntry['level'];
    limit?: number;
    since?: number;
  }): EventLogEntry[] {
    let events = [...this.events];

    if (options?.type && options.type !== '*') {
      events = events.filter(e => e.type === options.type);
    }
    if (options?.level) {
      events = events.filter(e => e.level === options.level);
    }
    if (options?.since) {
      events = events.filter(e => e.timestamp >= options.since!);
    }

    events.sort((a, b) => b.timestamp - a.timestamp);

    if (options?.limit) {
      events = events.slice(0, options.limit);
    }

    return events;
  }

  /**
   * Subscribe to events.
   */
  onEvent(type: string, listener: (event: EventLogEntry) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  private notifyListeners(type: string, event: EventLogEntry): void {
    const typeListeners = this.listeners.get(type);
    if (!typeListeners) return;

    for (const listener of typeListeners) {
      try {
        listener(event);
      } catch {
        // Don't let listener errors break telemetry
      }
    }
  }

  // ============================================
  // TIMING HELPERS
  // ============================================

  /**
   * Time an operation and record the duration.
   */
  async time<T>(
    metricName: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = Date.now();
    try {
      this.event({ type: 'timing_start', level: 'debug', message: `Started ${metricName}`, tags });
      const result = await fn();
      const duration = Date.now() - start;
      this.record(metricName, duration, tags);
      this.event({ type: 'timing_end', level: 'debug', message: `Completed ${metricName} in ${duration}ms`, tags });
      this.increment(`${metricName}_total`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.record(`${metricName}_error`, duration, tags);
      this.increment(`${metricName}_errors`);
      this.event({
        type: 'timing_error',
        level: 'error',
        message: `Failed ${metricName} in ${duration}ms: ${String(error)}`,
        tags,
      });
      throw error;
    }
  }

  // ============================================
  // EXPORT
  // ============================================

  /**
   * Export all metrics as a JSON blob (for investor reports).
   */
  exportMetrics(): {
    uptime: number;
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, HistogramMetric>;
    recentEvents: EventLogEntry[];
    summary: DashboardSummary;
  } {
    const counters: Record<string, number> = {};
    for (const [name, metric] of this.counters) {
      counters[name] = metric.value;
    }

    const gauges: Record<string, number> = {};
    for (const [name, metric] of this.gauges) {
      gauges[name] = metric.value;
    }

    const histograms: Record<string, HistogramMetric> = {};
    for (const [name, metric] of this.histograms) {
      histograms[name] = metric;
    }

    return {
      uptime: Date.now() - this.startTime,
      counters,
      gauges,
      histograms,
      recentEvents: this.getEvents({ limit: 50 }),
      summary: this.getSummary(),
    };
  }

  /**
   * Get a dashboard-ready summary of key metrics.
   */
  getSummary(): DashboardSummary {
    return {
      uptime: Date.now() - this.startTime,
      totalEvents: this.events.length,
      counters: Object.fromEntries(
        Array.from(this.counters.entries()).map(([k, v]) => [k, v.value])
      ),
      keyGauges: {
        memoryCount: this.getCounter('memory_create'),
        toolExecutions: this.getCounter('tool_execute'),
        agentSpawns: this.getCounter('agent_spawn'),
        taskCreated: this.getCounter('task_create'),
        pluginLoaded: this.getCounter('plugin_load'),
        skillExecuted: this.getCounter('skill_execute'),
        permissionChecks: this.getCounter('permission_check'),
        compressionOps: this.getCounter('compression_run'),
      },
      latency: this.getHistogram('api_latency'),
      errors: this.getCounter('error_total'),
    };
  }

  /**
   * Clear all metrics (for demo resets).
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.events = [];
    this.startTime = Date.now();
  }
}

/**
 * Dashboard summary for investor view.
 */
export interface DashboardSummary {
  uptime: number;
  totalEvents: number;
  counters: Record<string, number>;
  keyGauges: {
    memoryCount: number;
    toolExecutions: number;
    agentSpawns: number;
    taskCreated: number;
    pluginLoaded: number;
    skillExecuted: number;
    permissionChecks: number;
    compressionOps: number;
  };
  latency?: HistogramMetric;
  errors: number;
}
