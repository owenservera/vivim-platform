import { PrismaClient } from '@prisma/client';
import { PredictedInteraction, InteractionType, BundleType, ClientPresenceState } from './types';

export interface PredictionEngineConfig {
  prisma: PrismaClient;
}

export class PredictionEngine {
  private prisma: PrismaClient;

  constructor(config: PredictionEngineConfig) {
    this.prisma = config.prisma;
  }

  /**
   * Given what the user is currently doing, predict their
   * most likely next interactions and pre-build contexts for them.
   */
  async predictNextInteractions(
    userId: string,
    presence: ClientPresenceState
  ): Promise<PredictedInteraction[]> {
    const predictions: PredictedInteraction[] = [];

    // ═══════════════════════════════════════════════════════
    // SIGNAL 1: Active conversation continuation (highest prob)
    // ═══════════════════════════════════════════════════════
    if (presence.activeConversationId) {
      const conv = await this.prisma.conversation.findUnique({
        where: { id: presence.activeConversationId },
        include: {
          topicLinks: { include: { topic: true } },
          messages: { orderBy: { messageIndex: 'desc' }, take: 1 }
        }
      });

      if (conv) {
        predictions.push({
          type: 'continue_conversation',
          conversationId: conv.id,
          topicSlug: conv.topicLinks[0]?.topic?.slug,
          probability: 0.85,
          requiredBundles: ['conversation', 'topic']
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // SIGNAL 2: Visible sidebar conversations (medium prob)
    // ═══════════════════════════════════════════════════════
    for (const convId of presence.visibleConversationIds.slice(0, 3)) {
      if (convId === presence.activeConversationId) continue;

      predictions.push({
        type: 'continue_conversation',
        conversationId: convId,
        probability: 0.3,
        requiredBundles: ['conversation']
      });
    }

    // ═══════════════════════════════════════════════════════
    // SIGNAL 3: Time-of-day topic patterns
    // ═══════════════════════════════════════════════════════
    const localHour = presence.localTime ? new Date(presence.localTime).getHours() : new Date().getHours();

    const timeBasedTopics = await this.prisma.topicProfile.findMany({
      where: {
        userId,
        peakHour: localHour,
        importanceScore: { gte: 0.4 }
      },
      orderBy: { importanceScore: 'desc' },
      take: 3
    });

    for (const topic of timeBasedTopics) {
      predictions.push({
        type: 'new_on_topic',
        topicSlug: topic.slug,
        probability: 0.2 * topic.importanceScore,
        requiredBundles: ['topic']
      });
    }

    // ═══════════════════════════════════════════════════════
    // SIGNAL 4: Hot topics (recently & frequently engaged)
    // ═══════════════════════════════════════════════════════
    const hotTopics = await this.prisma.topicProfile.findMany({
      where: {
        userId,
        lastEngagedAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Last 48h
        }
      },
      orderBy: [
        { engagementStreak: 'desc' },
        { importanceScore: 'desc' }
      ],
      take: 5
    });

    for (const topic of hotTopics) {
      if (!predictions.find(p => p.topicSlug === topic.slug)) {
        predictions.push({
          type: 'new_on_topic',
          topicSlug: topic.slug,
          probability: 0.15 * topic.importanceScore,
          requiredBundles: ['topic']
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // SIGNAL 5: Active entities (people/projects mentioned recently)
    // ═══════════════════════════════════════════════════════
    const hotEntities = await this.prisma.entityProfile.findMany({
      where: {
        userId,
        lastMentionedAt: {
          gte: new Date(Date.now() - 72 * 60 * 60 * 1000)
        }
      },
      orderBy: { importanceScore: 'desc' },
      take: 5
    });

    for (const entity of hotEntities) {
      predictions.push({
        type: 'entity_related',
        entityId: entity.id,
        probability: 0.1 * entity.importanceScore,
        requiredBundles: ['entity']
      });
    }

    // ═══════════════════════════════════════════════════════
    // SIGNAL 6: Navigation pattern analysis
    // ═══════════════════════════════════════════════════════
    const navHistory = presence.navigationHistory;

    if (navHistory.length >= 3) {
      // Detect patterns like: user keeps bouncing between
      // notebook and chat → they're researching something
      const recentPaths = navHistory.slice(-5).map(n => n.path);
      const isResearching = recentPaths.some(p => p.includes('/notebook')) &&
                            recentPaths.some(p => p.includes('/chat'));

      if (isResearching) {
        // Boost knowledge retrieval depth for next interaction
        predictions.forEach(p => {
          if (p.requiredBundles) {
            // Add 'topic' bundle if not already there
            if (!p.requiredBundles.includes('topic')) {
              p.requiredBundles.push('topic');
            }
          }
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // SIGNAL 7: Cold start - first interaction of session
    // ═══════════════════════════════════════════════════════
    const sessionAge = Date.now() - presence.sessionStartedAt.getTime();
    if (sessionAge < 60000 && !presence.activeConversationId) {
      predictions.push({
        type: 'cold_start',
        probability: 0.7,
        requiredBundles: ['identity_core', 'global_prefs']
      });
    }

    // Sort by probability and return top N
    return predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 8);
  }

  /**
   * Calculate aggregate prediction confidence across all predictions.
   * Higher = more confident in the predictions.
   */
  calculateConfidence(predictions: PredictedInteraction[]): number {
    if (predictions.length === 0) return 0;

    const totalProbability = predictions.reduce((sum, p) => sum + p.probability, 0);
    return Math.min(totalProbability, 1.0);
  }

  /**
   * Get the top N predictions filtered by minimum probability.
   */
  filterByProbability(
    predictions: PredictedInteraction[],
    minProbability: number,
    limit: number = 5
  ): PredictedInteraction[] {
    return predictions
      .filter(p => p.probability >= minProbability)
      .slice(0, limit);
  }

  /**
   * Group predictions by the type of bundle they require.
   * Useful for batch pre-compilation.
   */
  groupByBundleType(predictions: PredictedInteraction[]): Map<BundleType, 
    PredictedInteraction[]> {
    const grouped = new Map<BundleType, PredictedInteraction[]>();

    for (const prediction of predictions) {
      for (const bundleType of prediction.requiredBundles) {
        if (!grouped.has(bundleType)) {
          grouped.set(bundleType, []);
        }
        grouped.get(bundleType)!.push(prediction);
      }
    }

    return grouped;
  }
}