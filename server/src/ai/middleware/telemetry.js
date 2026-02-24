// apps/server/src/ai/middleware/telemetry.js
// ═══════════════════════════════════════════════════════════════════════════
// AI TELEMETRY & OBSERVABILITY - Token tracking, cost estimation, metrics
// ═══════════════════════════════════════════════════════════════════════════

import { logger } from '../../lib/logger.js';

/**
 * Token and cost tracking for AI operations
 */
class AITelemetry {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      totalTokens: { prompt: 0, completion: 0, total: 0 },
      totalCost: 0,
      byProvider: {},
      byUser: {},
      errors: 0,
      latencyMs: { total: 0, count: 0, p95: [] },
    };
    this.logger = logger.child({ module: 'AITelemetry' });
  }

  /**
   * Pricing per 1M tokens (USD) - Updated for 2026 models
   */
  static PRICING = {
    openai: { input: 1.75, output: 14.0 },
    xai: { input: 0.2, output: 1.0 },
    anthropic: { input: 15.0, output: 75.0 },
    gemini: { input: 0.1, output: 0.5 },
    qwen: { input: 0.1, output: 0.5 },
    moonshot: { input: 0.5, output: 2.5 },
    minimax: { input: 0.39, output: 1.56 },
    zai: { input: 0, output: 0 },
  };

  /**
   * Record an AI request completion
   */
  recordRequest({
    provider,
    model,
    userId,
    promptTokens = 0,
    completionTokens = 0,
    durationMs = 0,
    success = true,
    mode = 'chat',
    toolsUsed = [],
    steps = 1,
  }) {
    this.metrics.totalRequests++;

    if (!success) {
      this.metrics.errors++;
    }

    // Token tracking
    const totalTokens = promptTokens + completionTokens;
    this.metrics.totalTokens.prompt += promptTokens;
    this.metrics.totalTokens.completion += completionTokens;
    this.metrics.totalTokens.total += totalTokens;

    // Cost estimation
    const pricing = AITelemetry.PRICING[provider] || AITelemetry.PRICING.zai;
    const cost =
      (promptTokens * pricing.input) / 1_000_000 + (completionTokens * pricing.output) / 1_000_000;
    this.metrics.totalCost += cost;

    // Per-provider metrics
    if (!this.metrics.byProvider[provider]) {
      this.metrics.byProvider[provider] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        errors: 0,
        avgLatency: 0,
      };
    }
    const providerMetrics = this.metrics.byProvider[provider];
    providerMetrics.requests++;
    providerMetrics.tokens += totalTokens;
    providerMetrics.cost += cost;
    if (!success) {
      providerMetrics.errors++;
    }
    providerMetrics.avgLatency =
      (providerMetrics.avgLatency * (providerMetrics.requests - 1) + durationMs) /
      providerMetrics.requests;

    // Per-user metrics
    if (userId) {
      if (!this.metrics.byUser[userId]) {
        this.metrics.byUser[userId] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          lastActive: null,
          providers: {},
          tools: {},
        };
      }
      const userMetrics = this.metrics.byUser[userId];
      userMetrics.requests++;
      userMetrics.tokens += totalTokens;
      userMetrics.cost += cost;
      userMetrics.lastActive = new Date();
      userMetrics.providers[provider] = (userMetrics.providers[provider] || 0) + 1;

      for (const tool of toolsUsed) {
        userMetrics.tools[tool] = (userMetrics.tools[tool] || 0) + 1;
      }
    }

    // Latency tracking
    this.metrics.latencyMs.total += durationMs;
    this.metrics.latencyMs.count++;
    this.metrics.latencyMs.p95.push(durationMs);
    // Keep only last 100 for P95 calculation
    if (this.metrics.latencyMs.p95.length > 100) {
      this.metrics.latencyMs.p95.shift();
    }

    this.logger.info(
      {
        provider,
        model,
        userId,
        tokens: totalTokens,
        cost: cost.toFixed(6),
        durationMs,
        mode,
        steps,
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
      },
      '📊 AI request recorded'
    );
  }

  /**
   * Estimate cost for a request before execution
   */
  estimateCost(provider, estimatedPromptTokens, estimatedCompletionTokens) {
    const pricing = AITelemetry.PRICING[provider] || AITelemetry.PRICING.zai;
    return {
      inputCost: (estimatedPromptTokens * pricing.input) / 1_000_000,
      outputCost: (estimatedCompletionTokens * pricing.output) / 1_000_000,
      totalCost:
        (estimatedPromptTokens * pricing.input) / 1_000_000 +
        (estimatedCompletionTokens * pricing.output) / 1_000_000,
      isFree: pricing.input === 0 && pricing.output === 0,
    };
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics() {
    const p95 = [...this.metrics.latencyMs.p95].sort((a, b) => a - b);
    const p95Value = p95.length > 0 ? p95[Math.floor(p95.length * 0.95)] : 0;

    return {
      ...this.metrics,
      latencyMs: {
        average:
          this.metrics.latencyMs.count > 0
            ? Math.round(this.metrics.latencyMs.total / this.metrics.latencyMs.count)
            : 0,
        p95: Math.round(p95Value),
        count: this.metrics.latencyMs.count,
      },
      totalCost: parseFloat(this.metrics.totalCost.toFixed(6)),
      successRate:
        this.metrics.totalRequests > 0
          ? `${(((this.metrics.totalRequests - this.metrics.errors) / this.metrics.totalRequests) * 100).toFixed(1)}%`
          : 'N/A',
    };
  }

  /**
   * Get user-specific metrics
   */
  getUserMetrics(userId) {
    const userMetrics = this.metrics.byUser[userId];
    if (!userMetrics) {
      return {
        requests: 0,
        tokens: 0,
        cost: 0,
        favoriteProvider: null,
        mostUsedTool: null,
      };
    }

    const favoriteProvider =
      Object.entries(userMetrics.providers).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    const mostUsedTool =
      Object.entries(userMetrics.tools).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    return {
      ...userMetrics,
      cost: parseFloat(userMetrics.cost.toFixed(6)),
      favoriteProvider,
      mostUsedTool,
    };
  }

  /**
   * Reset metrics (for testing or periodic cleanup)
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      totalTokens: { prompt: 0, completion: 0, total: 0 },
      totalCost: 0,
      byProvider: {},
      byUser: {},
      errors: 0,
      latencyMs: { total: 0, count: 0, p95: [] },
    };
  }
}

// Singleton
export const aiTelemetry = new AITelemetry();
export default aiTelemetry;
