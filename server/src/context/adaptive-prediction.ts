/**
 * Adaptive Prediction Engine - Self-Improving Interaction Prediction
 *
 * Enhanced prediction engine that learns from actual usage patterns.
 * Features:
 * - Temporal patterns (time-of-day, day-of-week)
 * - Topic momentum scoring
 * - Conversation flow analysis
 * - Collaborative filtering signals
 * - Prediction accuracy feedback loop
 * - Topic graph adjacency hints
 *
 * Performance Impact: More accurate predictions → fewer cache misses
 * → faster context assembly → better UX.
 */

import type { PrismaClient } from '@prisma/client';
import type {
  PredictedInteraction,
  InteractionType,
  BundleType,
  ClientPresenceState,
} from './types';
import { ContextCache, getContextCache } from './context-cache';
import { logger } from '../lib/logger.js';

// ============================================================================
// TYPES
// ============================================================================

interface TemporalPattern {
  hourOfDay: number;
  dayOfWeek: number;
  topicSlug: string;
  frequency: number;
  avgSessionDepth: number;
}

interface TopicMomentum {
  slug: string;
  recentEngagements: number;
  lastEngagedAt: Date;
  velocity: number; // Rate of engagement increase
  acceleration: number; // Change in velocity
}

interface PredictionScore {
  predictionId: string;
  predictedType: InteractionType;
  predictedTarget: string;
  probability: number;
  actuallyUsed: boolean;
  scoredAt: Date;
}

interface AdaptivePredictionConfig {
  prisma: PrismaClient;
  cache?: ContextCache;
  /** How many temporal patterns to analyze */
  temporalWindowDays?: number;
  /** Minimum engagement count to consider a pattern */
  minPatternFrequency?: number;
  /** Weight for temporal signal (0-1) */
  temporalWeight?: number;
  /** Weight for momentum signal (0-1) */
  momentumWeight?: number;
  /** Weight for presence signal (0-1) */
  presenceWeight?: number;
  /** Weight for historical accuracy (0-1) */
  accuracyWeight?: number;
}

// ============================================================================
// ADAPTIVE PREDICTION ENGINE
// ============================================================================

export class AdaptivePredictionEngine {
  private prisma: PrismaClient;
  private cache: ContextCache;
  private config: Required<Omit<AdaptivePredictionConfig, 'prisma' | 'cache'>>;

  // In-memory prediction accuracy tracking
  private predictionScores: PredictionScore[] = [];
  private maxScoreHistory = 1000;

  constructor(config: AdaptivePredictionConfig) {
    this.prisma = config.prisma;
    this.cache = config.cache ?? getContextCache();
    this.config = {
      temporalWindowDays: config.temporalWindowDays ?? 30,
      minPatternFrequency: config.minPatternFrequency ?? 3,
      temporalWeight: config.temporalWeight ?? 0.25,
      momentumWeight: config.momentumWeight ?? 0.3,
      presenceWeight: config.presenceWeight ?? 0.3,
      accuracyWeight: config.accuracyWeight ?? 0.15,
    };
  }

  /**
   * Enhanced prediction with multiple signal sources.
   * Returns predictions sorted by probability.
   */
  async predictNextInteractions(
    userId: string,
    presence: ClientPresenceState
  ): Promise<PredictedInteraction[]> {
    const cacheKey = `${userId}:${presence.deviceId}`;
    const cached = this.cache.get<PredictedInteraction[]>('prediction', cacheKey);
    if (cached) return cached;

    const predictions: Map<string, PredictedInteraction & { signals: Record<string, number> }> =
      new Map();

    // 1. Presence-based predictions (current state)
    await this.addPresenceSignals(userId, presence, predictions);

    // 2. Temporal pattern predictions (time-of-day + day-of-week)
    await this.addTemporalSignals(userId, predictions);

    // 3. Topic momentum predictions (what's hot)
    await this.addMomentumSignals(userId, predictions);

    // 4. Conversation flow predictions (what comes next in a conversation)
    if (presence.activeConversationId) {
      await this.addConversationFlowSignals(userId, presence.activeConversationId, predictions);
    }

    // 5. Apply historical accuracy weighting
    this.applyAccuracyWeighting(predictions);

    // Convert to array and sort
    const result = Array.from(predictions.values())
      .map((p) => {
        // Combine signals with weights
        const weightedProbability =
          (p.signals.presence ?? 0) * this.config.presenceWeight +
          (p.signals.temporal ?? 0) * this.config.temporalWeight +
          (p.signals.momentum ?? 0) * this.config.momentumWeight +
          (p.signals.accuracy ?? 1) * this.config.accuracyWeight;

        return {
          type: p.type,
          conversationId: p.conversationId,
          topicSlug: p.topicSlug,
          entityId: p.entityId,
          personaId: p.personaId,
          probability: Math.min(1, Math.max(0, weightedProbability)),
          requiredBundles: p.requiredBundles,
        };
      })
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10);

    this.cache.set('prediction', cacheKey, result, 2 * 60 * 1000); // 2 min TTL
    return result;
  }

  /**
   * Record whether a prediction was actually used.
   * This feeds the accuracy feedback loop.
   */
  recordPredictionOutcome(
    userId: string,
    predictedType: InteractionType,
    predictedTarget: string,
    actuallyUsed: boolean
  ): void {
    const score: PredictionScore = {
      predictionId: `${userId}:${predictedType}:${predictedTarget}`,
      predictedType,
      predictedTarget,
      probability: 0, // Will be filled from original prediction
      actuallyUsed,
      scoredAt: new Date(),
    };

    this.predictionScores.push(score);
    if (this.predictionScores.length > this.maxScoreHistory) {
      this.predictionScores.shift();
    }

    // Invalidate prediction cache for this user
    this.cache.delete('prediction', `${userId}:*`);

    logger.debug(
      { userId, type: predictedType, target: predictedTarget, used: actuallyUsed },
      'Prediction outcome recorded'
    );
  }

  /**
   * Get prediction accuracy stats.
   */
  getAccuracyStats(): {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    byType: Record<string, { total: number; correct: number; accuracy: number }>;
  } {
    const byType: Record<string, { total: number; correct: number }> = {};

    for (const score of this.predictionScores) {
      if (!byType[score.predictedType]) {
        byType[score.predictedType] = { total: 0, correct: 0 };
      }
      byType[score.predictedType].total++;
      if (score.actuallyUsed) {
        byType[score.predictedType].correct++;
      }
    }

    const total = this.predictionScores.length;
    const correct = this.predictionScores.filter((s) => s.actuallyUsed).length;

    return {
      totalPredictions: total,
      correctPredictions: correct,
      accuracy: total > 0 ? correct / total : 0,
      byType: Object.fromEntries(
        Object.entries(byType).map(([k, v]) => [
          k,
          {
            ...v,
            accuracy: v.total > 0 ? v.correct / v.total : 0,
          },
        ])
      ),
    };
  }

  // ============================================================================
  // SIGNAL SOURCES
  // ============================================================================

  private async addPresenceSignals(
    userId: string,
    presence: ClientPresenceState,
    predictions: Map<string, any>
  ): Promise<void> {
    // Active conversation → high probability of continuation
    if (presence.activeConversationId) {
      const key = `conv:${presence.activeConversationId}`;
      predictions.set(key, {
        type: 'continue_conversation' as InteractionType,
        conversationId: presence.activeConversationId,
        probability: 0,
        requiredBundles: ['identity_core', 'global_prefs', 'conversation'] as BundleType[],
        signals: { presence: 0.9 },
      });

      // Get topic for this conversation
      const topicConvs = await this.prisma.topicConversation.findMany({
        where: { conversationId: presence.activeConversationId },
        include: { topic: true },
        take: 3,
      });

      for (const tc of topicConvs) {
        const topicKey = `topic:${tc.topic.slug}`;
        if (!predictions.has(topicKey)) {
          predictions.set(topicKey, {
            type: 'new_on_topic' as InteractionType,
            topicSlug: tc.topic.slug,
            probability: 0,
            requiredBundles: ['identity_core', 'global_prefs', 'topic'] as BundleType[],
            signals: { presence: 0.6 },
          });
        }
      }
    }

    // Visible conversations → moderate probability
    for (const visibleId of (presence.visibleConversationIds ?? []).slice(0, 5)) {
      const key = `conv:${visibleId}`;
      if (!predictions.has(key)) {
        predictions.set(key, {
          type: 'continue_conversation' as InteractionType,
          conversationId: visibleId,
          probability: 0,
          requiredBundles: ['identity_core', 'global_prefs', 'conversation'] as BundleType[],
          signals: { presence: 0.4 },
        });
      }
    }

    // Active persona → boost persona-related topics
    if (presence.activePersonaId) {
      const persona = await this.prisma.aiPersona.findUnique({
        where: { id: presence.activePersonaId },
      });
      if (persona) {
        const key = `persona:${persona.id}`;
        predictions.set(key, {
          type: 'cold_start' as InteractionType,
          personaId: persona.id,
          probability: 0,
          requiredBundles: ['identity_core', 'global_prefs'] as BundleType[],
          signals: { presence: 0.5 },
        });
      }
    }
  }

  private async addTemporalSignals(userId: string, predictions: Map<string, any>): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    // Find topics that are typically engaged at this time
    const temporalPatterns = await this.prisma.topicProfile.findMany({
      where: {
        userId,
        peakHour: { not: null },
        totalConversations: { gte: this.config.minPatternFrequency },
      },
      select: {
        slug: true,
        id: true,
        peakHour: true,
        importanceScore: true,
        avgSessionDepth: true,
        lastEngagedAt: true,
      },
      orderBy: { importanceScore: 'desc' },
      take: 10,
    });

    for (const topic of temporalPatterns) {
      if (topic.peakHour === null) continue;

      // Calculate temporal affinity
      const hourDistance = Math.min(
        Math.abs(currentHour - topic.peakHour),
        24 - Math.abs(currentHour - topic.peakHour)
      );

      // Gaussian-like decay: strong within ±2 hours, weak beyond
      const temporalAffinity = Math.exp(-(hourDistance * hourDistance) / 8);

      if (temporalAffinity < 0.2) continue;

      const key = `topic:${topic.slug}`;
      if (predictions.has(key)) {
        predictions.get(key).signals.temporal = temporalAffinity * topic.importanceScore;
      } else {
        predictions.set(key, {
          type: 'new_on_topic' as InteractionType,
          topicSlug: topic.slug,
          probability: 0,
          requiredBundles: ['identity_core', 'global_prefs', 'topic'] as BundleType[],
          signals: { temporal: temporalAffinity * topic.importanceScore },
        });
      }
    }
  }

  private async addMomentumSignals(userId: string, predictions: Map<string, any>): Promise<void> {
    // Find topics with recent high engagement (momentum)
    const recentTopics = await this.prisma.topicProfile.findMany({
      where: {
        userId,
        lastEngagedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        slug: true,
        id: true,
        engagementStreak: true,
        totalConversations: true,
        lastEngagedAt: true,
        importanceScore: true,
      },
      orderBy: { lastEngagedAt: 'desc' },
      take: 10,
    });

    for (const topic of recentTopics) {
      // Calculate momentum: combination of streak and recency
      const hoursSinceEngagement = (Date.now() - topic.lastEngagedAt.getTime()) / (60 * 60 * 1000);

      const recencyScore = Math.exp(-hoursSinceEngagement / 48); // Decay over 2 days
      const streakScore = Math.min(1, topic.engagementStreak / 10);
      const momentum = (recencyScore * 0.6 + streakScore * 0.4) * topic.importanceScore;

      if (momentum < 0.1) continue;

      const key = `topic:${topic.slug}`;
      if (predictions.has(key)) {
        predictions.get(key).signals.momentum = momentum;
      } else {
        predictions.set(key, {
          type: 'new_on_topic' as InteractionType,
          topicSlug: topic.slug,
          probability: 0,
          requiredBundles: ['identity_core', 'global_prefs', 'topic'] as BundleType[],
          signals: { momentum },
        });
      }
    }
  }

  private async addConversationFlowSignals(
    userId: string,
    conversationId: string,
    predictions: Map<string, any>
  ): Promise<void> {
    // Get topics from this conversation to predict related topics
    const conversationTopics = await this.prisma.topicConversation.findMany({
      where: { conversationId },
      include: { topic: true },
    });

    for (const tc of conversationTopics) {
      // Find related topics (topics that co-occur with this one)
      const relatedTopics = await this.prisma.$queryRaw<
        Array<{
          slug: string;
          id: string;
          co_occurrence: number;
        }>
      >`
        SELECT tp.slug, tp.id,
          COUNT(DISTINCT tc2."conversationId") as co_occurrence
        FROM topic_conversations tc1
        JOIN topic_conversations tc2 ON tc1."conversationId" = tc2."conversationId"
        JOIN topic_profiles tp ON tc2."topicId" = tp.id
        WHERE tc1."topicId" = ${tc.topic.id}
          AND tc2."topicId" != ${tc.topic.id}
          AND tp."userId" = ${userId}
        GROUP BY tp.slug, tp.id
        HAVING COUNT(DISTINCT tc2."conversationId") >= 2
        ORDER BY co_occurrence DESC
        LIMIT 5
      `.catch(() => []);

      for (const related of relatedTopics) {
        const key = `topic:${related.slug}`;
        const flowScore = Math.min(1, Number(related.co_occurrence) / 10);

        if (predictions.has(key)) {
          predictions.get(key).signals.flow = flowScore;
        } else {
          predictions.set(key, {
            type: 'new_on_topic' as InteractionType,
            topicSlug: related.slug,
            probability: 0,
            requiredBundles: ['identity_core', 'global_prefs', 'topic'] as BundleType[],
            signals: { flow: flowScore },
          });
        }
      }
    }
  }

  private applyAccuracyWeighting(predictions: Map<string, any>): void {
    if (this.predictionScores.length < 10) return; // Not enough data

    // Calculate per-type accuracy
    const typeAccuracy: Record<string, number> = {};
    const typeCounts: Record<string, { total: number; correct: number }> = {};

    for (const score of this.predictionScores) {
      if (!typeCounts[score.predictedType]) {
        typeCounts[score.predictedType] = { total: 0, correct: 0 };
      }
      typeCounts[score.predictedType].total++;
      if (score.actuallyUsed) {
        typeCounts[score.predictedType].correct++;
      }
    }

    for (const [type, counts] of Object.entries(typeCounts)) {
      typeAccuracy[type] = counts.total > 5 ? counts.correct / counts.total : 0.5;
    }

    // Apply accuracy as a signal
    for (const prediction of predictions.values()) {
      const accuracy = typeAccuracy[prediction.type] ?? 0.5;
      prediction.signals.accuracy = accuracy;
    }
  }
}

export default AdaptivePredictionEngine;
