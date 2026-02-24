/**
 * Context Telemetry - Metrics, Quality Scoring & Observability
 *
 * Comprehensive telemetry for the entire context pipeline.
 * Features:
 * - Per-assembly metrics (latency, tokens, cache, quality)
 * - Rolling window aggregation
 * - Quality scoring: relevance, efficiency, freshness
 * - Anomaly detection for performance regressions
 * - Export-ready format for dashboards
 *
 * Performance Impact: 0 (telemetry is append-only with circular buffer).
 * Value: Identifies bottlenecks, guides optimization, measures ROI.
 */

import { logger } from '../lib/logger.js';

// ============================================================================
// TYPES
// ============================================================================

export interface AssemblyTelemetry {
  timestamp: number;
  userId: string;
  conversationId: string;

  // Timing
  totalDurationMs: number;
  embeddingDurationMs: number;
  detectionDurationMs: number;
  retrievalDurationMs: number;
  compilationDurationMs: number;

  // Token metrics
  tokenBudget: number;
  tokenUsed: number;
  tokenEfficiency: number; // used/budget

  // Cache performance
  bundlesCacheHits: number;
  bundlesCacheMisses: number;
  cacheHitRate: number;

  // Context richness
  topicsDetected: number;
  entitiesDetected: number;
  acusRetrieved: number;
  memoriesRetrieved: number;
  bundlesUsed: number;

  // Quality signals
  avgSimilarityScore: number;
  coverageScore: number; // How many layers were populated
  freshnessScore: number; // How recent the context data is

  // Pipeline info
  engineUsed: 'parallel' | 'streaming' | 'legacy';
  parallelFactor: number;
  errors: string[];
}

export interface QualityReport {
  period: string;
  assemblyCount: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  avgTokenEfficiency: number;
  avgCacheHitRate: number;
  avgCoverageScore: number;
  avgFreshnessScore: number;
  errorRate: number;
  avgParallelFactor: number;
  topBottleneck: string;
  recommendations: string[];
}

export interface AnomalyAlert {
  type: 'latency_spike' | 'cache_degradation' | 'error_burst' | 'token_overflow';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  currentValue: number;
  baselineValue: number;
  timestamp: number;
}

// ============================================================================
// TELEMETRY COLLECTOR
// ============================================================================

export class ContextTelemetry {
  private entries: AssemblyTelemetry[] = [];
  private maxEntries: number;
  private anomalyCallbacks: Array<(alert: AnomalyAlert) => void> = [];

  // Running baselines for anomaly detection
  private baselineLatency = 0;
  private baselineCacheHitRate = 0;
  private baselineErrorRate = 0;
  private baselineUpdateCount = 0;

  constructor(maxEntries: number = 5000) {
    this.maxEntries = maxEntries;
  }

  /**
   * Record an assembly telemetry entry.
   */
  record(entry: AssemblyTelemetry): void {
    this.entries.push(entry);

    // Circular buffer
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // Update baselines
    this.updateBaselines(entry);

    // Check for anomalies
    this.detectAnomalies(entry);
  }

  /**
   * Create a telemetry entry from pipeline metrics.
   */
  static fromPipelineMetrics(
    userId: string,
    conversationId: string,
    metrics: any,
    context: {
      topicsDetected: number;
      entitiesDetected: number;
      acusRetrieved: number;
      memoriesRetrieved: number;
      bundlesUsed: number;
      avgSimilarityScore: number;
    }
  ): AssemblyTelemetry {
    const stages = metrics.stages ?? {};
    const tokenBudget = metrics.tokensBudgeted ?? 12000;
    const tokenUsed = metrics.tokensUsed ?? 0;

    // Calculate coverage: how many of the 6 possible layers are populated
    const possibleLayers = [
      'identity_core',
      'global_prefs',
      'topic',
      'entity',
      'conversation',
      'jit',
    ];
    const populatedLayers = Object.keys(stages).filter((s) => !stages[s].error);
    const coverageScore = Math.min(1, populatedLayers.length / possibleLayers.length);

    // Calculate freshness: average age of bundles (simulated as inverse of duration)
    const freshnessScore = Math.max(0, 1 - metrics.totalDurationMs / 5000);

    // Calculate cache stats
    const cacheHits = Object.values(stages as Record<string, any>).filter(
      (s: any) => s.source === 'cache'
    ).length;
    const totalStages = Object.keys(stages).length;

    return {
      timestamp: Date.now(),
      userId,
      conversationId,
      totalDurationMs: metrics.totalDurationMs ?? 0,
      embeddingDurationMs: stages.embedding?.durationMs ?? 0,
      detectionDurationMs: stages.detection?.durationMs ?? 0,
      retrievalDurationMs: stages.jitResult?.durationMs ?? stages.jit_retrieval?.durationMs ?? 0,
      compilationDurationMs: stages.identity_bundle?.durationMs ?? 0,
      tokenBudget,
      tokenUsed,
      tokenEfficiency: tokenBudget > 0 ? tokenUsed / tokenBudget : 0,
      bundlesCacheHits: cacheHits,
      bundlesCacheMisses: totalStages - cacheHits,
      cacheHitRate: totalStages > 0 ? cacheHits / totalStages : 0,
      topicsDetected: context.topicsDetected,
      entitiesDetected: context.entitiesDetected,
      acusRetrieved: context.acusRetrieved,
      memoriesRetrieved: context.memoriesRetrieved,
      bundlesUsed: context.bundlesUsed,
      avgSimilarityScore: context.avgSimilarityScore,
      coverageScore,
      freshnessScore,
      engineUsed: 'parallel',
      parallelFactor: metrics.parallelFactor ?? 1,
      errors: Object.entries(stages as Record<string, any>)
        .filter(([_, s]: [string, any]) => s.error)
        .map(([name, s]: [string, any]) => `${name}: ${s.error}`),
    };
  }

  // ============================================================================
  // AGGREGATION & REPORTING
  // ============================================================================

  /**
   * Generate a quality report for a time window.
   */
  getQualityReport(windowMs: number = 60 * 60 * 1000): QualityReport {
    const cutoff = Date.now() - windowMs;
    const window = this.entries.filter((e) => e.timestamp >= cutoff);

    if (window.length === 0) {
      return this.emptyReport(windowMs);
    }

    const durations = window.map((e) => e.totalDurationMs).sort((a, b) => a - b);
    const errorCount = window.filter((e) => e.errors.length > 0).length;

    // Find bottleneck
    const stageAvgs: Record<string, number[]> = {};
    for (const e of window) {
      for (const [stage, ms] of [
        ['embedding', e.embeddingDurationMs],
        ['detection', e.detectionDurationMs],
        ['retrieval', e.retrievalDurationMs],
        ['compilation', e.compilationDurationMs],
      ] as const) {
        if (!stageAvgs[stage]) stageAvgs[stage] = [];
        stageAvgs[stage].push(ms);
      }
    }

    let topBottleneck = 'none';
    let maxAvg = 0;
    for (const [stage, values] of Object.entries(stageAvgs)) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      if (avg > maxAvg) {
        maxAvg = avg;
        topBottleneck = stage;
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];
    const avgCacheHitRate = this.average(window.map((e) => e.cacheHitRate));
    const avgDuration = this.average(durations);
    const avgTokenEff = this.average(window.map((e) => e.tokenEfficiency));

    if (avgCacheHitRate < 0.5) {
      recommendations.push('Cache hit rate below 50% - consider increasing cache TTLs or capacity');
    }
    if (avgDuration > 2000) {
      recommendations.push(
        `Average latency ${avgDuration.toFixed(0)}ms - consider parallelizing more stages`
      );
    }
    if (avgTokenEff < 0.5) {
      recommendations.push('Token efficiency below 50% - context budget may be over-allocated');
    }
    if (avgTokenEff > 0.95) {
      recommendations.push('Token usage near 100% - increase maxContextTokens for richer context');
    }
    if (errorCount / window.length > 0.1) {
      recommendations.push(
        `Error rate ${((errorCount / window.length) * 100).toFixed(1)}% - investigate pipeline failures`
      );
    }

    const period =
      windowMs >= 86400000
        ? `${(windowMs / 86400000).toFixed(0)}d`
        : windowMs >= 3600000
          ? `${(windowMs / 3600000).toFixed(0)}h`
          : `${(windowMs / 60000).toFixed(0)}m`;

    return {
      period,
      assemblyCount: window.length,
      avgDurationMs: avgDuration,
      p50DurationMs: this.percentile(durations, 50),
      p95DurationMs: this.percentile(durations, 95),
      p99DurationMs: this.percentile(durations, 99),
      avgTokenEfficiency: avgTokenEff,
      avgCacheHitRate,
      avgCoverageScore: this.average(window.map((e) => e.coverageScore)),
      avgFreshnessScore: this.average(window.map((e) => e.freshnessScore)),
      errorRate: window.length > 0 ? errorCount / window.length : 0,
      avgParallelFactor: this.average(window.map((e) => e.parallelFactor)),
      topBottleneck,
      recommendations,
    };
  }

  /**
   * Get per-user telemetry summary.
   */
  getUserSummary(
    userId: string,
    windowMs: number = 24 * 60 * 60 * 1000
  ): {
    assemblies: number;
    avgLatencyMs: number;
    avgCacheHitRate: number;
    avgTokenEfficiency: number;
    topTopics: string[];
    topEntities: string[];
  } {
    const cutoff = Date.now() - windowMs;
    const userEntries = this.entries.filter((e) => e.userId === userId && e.timestamp >= cutoff);

    if (userEntries.length === 0) {
      return {
        assemblies: 0,
        avgLatencyMs: 0,
        avgCacheHitRate: 0,
        avgTokenEfficiency: 0,
        topTopics: [],
        topEntities: [],
      };
    }

    return {
      assemblies: userEntries.length,
      avgLatencyMs: this.average(userEntries.map((e) => e.totalDurationMs)),
      avgCacheHitRate: this.average(userEntries.map((e) => e.cacheHitRate)),
      avgTokenEfficiency: this.average(userEntries.map((e) => e.tokenEfficiency)),
      topTopics: [], // Would need to cross-reference with detection data
      topEntities: [],
    };
  }

  // ============================================================================
  // ANOMALY DETECTION
  // ============================================================================

  onAnomaly(callback: (alert: AnomalyAlert) => void): void {
    this.anomalyCallbacks.push(callback);
  }

  private detectAnomalies(entry: AssemblyTelemetry): void {
    if (this.baselineUpdateCount < 50) return; // Need baseline data

    // Latency spike detection (>3x baseline)
    if (entry.totalDurationMs > this.baselineLatency * 3 && this.baselineLatency > 0) {
      this.fireAnomaly({
        type: 'latency_spike',
        severity: entry.totalDurationMs > this.baselineLatency * 5 ? 'critical' : 'warning',
        message: `Assembly latency ${entry.totalDurationMs}ms (baseline: ${this.baselineLatency.toFixed(0)}ms)`,
        currentValue: entry.totalDurationMs,
        baselineValue: this.baselineLatency,
        timestamp: Date.now(),
      });
    }

    // Cache degradation (>30% drop from baseline)
    if (this.baselineCacheHitRate > 0.3 && entry.cacheHitRate < this.baselineCacheHitRate * 0.7) {
      this.fireAnomaly({
        type: 'cache_degradation',
        severity: 'warning',
        message: `Cache hit rate ${(entry.cacheHitRate * 100).toFixed(1)}% (baseline: ${(this.baselineCacheHitRate * 100).toFixed(1)}%)`,
        currentValue: entry.cacheHitRate,
        baselineValue: this.baselineCacheHitRate,
        timestamp: Date.now(),
      });
    }

    // Token overflow
    if (entry.tokenEfficiency > 0.98) {
      this.fireAnomaly({
        type: 'token_overflow',
        severity: 'info',
        message: `Token budget nearly exhausted: ${entry.tokenUsed}/${entry.tokenBudget}`,
        currentValue: entry.tokenUsed,
        baselineValue: entry.tokenBudget,
        timestamp: Date.now(),
      });
    }
  }

  private updateBaselines(entry: AssemblyTelemetry): void {
    this.baselineUpdateCount++;
    const alpha = 0.05; // Exponential moving average factor

    this.baselineLatency =
      this.baselineLatency === 0
        ? entry.totalDurationMs
        : this.baselineLatency * (1 - alpha) + entry.totalDurationMs * alpha;

    this.baselineCacheHitRate =
      this.baselineCacheHitRate === 0
        ? entry.cacheHitRate
        : this.baselineCacheHitRate * (1 - alpha) + entry.cacheHitRate * alpha;

    const hasError = entry.errors.length > 0 ? 1 : 0;
    this.baselineErrorRate = this.baselineErrorRate * (1 - alpha) + hasError * alpha;
  }

  private fireAnomaly(alert: AnomalyAlert): void {
    logger.warn({ alert }, `Context anomaly: ${alert.type}`);
    for (const cb of this.anomalyCallbacks) {
      try {
        cb(alert);
      } catch (error) {
        logger.error({ error }, 'Anomaly callback error');
      }
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private percentile(sorted: number[], pct: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((pct / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private emptyReport(windowMs: number): QualityReport {
    return {
      period: `${(windowMs / 60000).toFixed(0)}m`,
      assemblyCount: 0,
      avgDurationMs: 0,
      p50DurationMs: 0,
      p95DurationMs: 0,
      p99DurationMs: 0,
      avgTokenEfficiency: 0,
      avgCacheHitRate: 0,
      avgCoverageScore: 0,
      avgFreshnessScore: 0,
      errorRate: 0,
      avgParallelFactor: 0,
      topBottleneck: 'none',
      recommendations: ['No data available. Start using the context pipeline.'],
    };
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  /**
   * Export raw telemetry for external dashboards.
   */
  export(windowMs?: number): AssemblyTelemetry[] {
    if (!windowMs) return [...this.entries];
    const cutoff = Date.now() - windowMs;
    return this.entries.filter((e) => e.timestamp >= cutoff);
  }

  get entryCount(): number {
    return this.entries.length;
  }

  clear(): void {
    this.entries = [];
    this.baselineLatency = 0;
    this.baselineCacheHitRate = 0;
    this.baselineErrorRate = 0;
    this.baselineUpdateCount = 0;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _telemetryInstance: ContextTelemetry | null = null;

export function getContextTelemetry(): ContextTelemetry {
  if (!_telemetryInstance) {
    _telemetryInstance = new ContextTelemetry();
  }
  return _telemetryInstance;
}

export default ContextTelemetry;
