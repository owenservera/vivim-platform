/**
 * Feed & Discovery Service - Phase 4
 *
 * Privacy-preserving recommendation engine with
 * algorithmic transparency and user control
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';

const log = logger.child({ module: 'feed-service' });

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FEED_LIMIT = 50;
const MAX_FEED_LIMIT = 200;
const FEED_ITEM_EXPIRY_HOURS = 24;

const RANKING_WEIGHTS = {
  recency: 0.3,
  relevance: 0.4,
  socialProof: 0.2,
  diversity: 0.1,
};

// ============================================================================
// Feed Generation
// ============================================================================

/**
 * Generate personalized feed for user
 */
export async function generateFeed(userId, options = {}) {
  try {
    const prisma = getPrismaClient();
    const { limit = DEFAULT_FEED_LIMIT, offset = 0, refresh = false } = options;

    // Get user preferences
    const preferences = await getFeedPreferences(userId);

    // Check if we have cached feed items
    if (!refresh) {
      const cachedItems = await prisma.feedItem.findMany({
        where: {
          userId,
          status: 'active',
          expiresAt: { gt: new Date() },
        },
        orderBy: { score: 'desc' },
        take: limit,
        skip: offset,
      });

      if (cachedItems.length >= limit * 0.8) {
        return {
          success: true,
          items: cachedItems,
          fromCache: true,
        };
      }
    }

    // Generate new feed
    const candidates = await gatherFeedCandidates(userId, preferences);
    const ranked = await rankFeedItems(candidates, userId, preferences);
    const diversified = applyDiversity(ranked, preferences);

    // Save to database
    await saveFeedItems(userId, diversified);

    const items = diversified.slice(offset, offset + limit);

    return {
      success: true,
      items,
      fromCache: false,
      totalCandidates: candidates.length,
    };
  } catch (error) {
    log.error({ userId, error: error.message }, 'Feed generation failed');
    return { success: false, error: 'Failed to generate feed' };
  }
}

/**
 * Gather candidate content for feed
 */
async function gatherFeedCandidates(userId, preferences) {
  const prisma = getPrismaClient();
  const candidates = [];
  const since = new Date(Date.now() - preferences.timeRangeHours * 60 * 60 * 1000);

  // 1. Content from circles
  if (preferences.showFromCircles) {
    const circleContent = await prisma.$queryRaw`
      SELECT 
        cc.content_id as "contentId",
        cc.content_type as "contentType",
        c.owner_id as "authorId",
        'circle' as source,
        json_build_object('circleId', cc.circle_id) as "sourceDetails",
        acu.created_at as "createdAt"
      FROM circle_content cc
      JOIN circle_members cm ON cc.circle_id = cm.circle_id
      JOIN atomic_chat_units acu ON cc.content_id = acu.id
      JOIN conversations c ON acu.conversation_id = c.id
      WHERE cm.user_id = ${userId}
        AND cm.status = 'active'
        AND acu.created_at > ${since}
        AND acu.quality_overall > ${preferences.minQualityScore}
      ORDER BY acu.created_at DESC
      LIMIT 100
    `;
    candidates.push(...circleContent);
  }

  // 2. Content from network (friends-of-friends)
  if (preferences.showFromNetwork) {
    const networkContent = await prisma.$queryRaw`
      SELECT 
        acu.id as "contentId",
        'acu' as "contentType",
        acu.author_did as "authorId",
        'network' as source,
        json_build_object('degree', 2) as "sourceDetails",
        acu.created_at as "createdAt"
      FROM atomic_chat_units acu
      JOIN social_connections sc ON acu.author_did = sc.following_id
      WHERE sc.follower_id = ${userId}
        AND sc.status = 'active'
        AND acu.created_at > ${since}
        AND acu.sharing_policy IN ('public', 'network')
        AND acu.quality_overall > ${preferences.minQualityScore}
      ORDER BY acu.created_at DESC
      LIMIT 50
    `;
    candidates.push(...networkContent);
  }

  // 3. Trending content
  if (preferences.showTrending) {
    const trending = await prisma.trendingContent.findMany({
      where: {
        expiresAt: { gt: new Date() },
        trendScore: { gt: 0.5 },
      },
      orderBy: { trendScore: 'desc' },
      take: 30,
    });

    candidates.push(
      ...trending.map((t) => ({
        contentId: t.contentId,
        contentType: t.contentType,
        authorId: null,
        source: 'trending',
        sourceDetails: { trendScore: t.trendScore },
        createdAt: t.lastCalculatedAt,
      }))
    );
  }

  // 4. Topic-based recommendations
  if (preferences.showFromTopics) {
    // getTopicBasedContent is missing from the file. Fallback to empty array for now.
    const topicContent = []; // await getTopicBasedContent(userId, preferences, since);
    candidates.push(...topicContent);
  }

  // Remove duplicates
  const seen = new Set();
  return candidates.filter((c) => {
    if (seen.has(c.contentId)) {
      return false;
    }
    seen.add(c.contentId);
    return true;
  });
}

/**
 * Rank feed items using multiple factors
 * Now uses dynamic weights from user preferences
 */
async function rankFeedItems(candidates, userId, preferences) {
  const prisma = getPrismaClient();
  const ranked = [];

  // Get dynamic weights from preferences
  const weights = {
    recency: (preferences.recencyWeight || 30) / 100,
    relevance: (preferences.relevanceWeight || 40) / 100,
    socialProof: (preferences.socialProofWeight || 20) / 100,
    diversity: (preferences.diversityWeight || 10) / 100,
  };

  for (const candidate of candidates) {
    const factors = await calculateRankingFactors(candidate, userId, preferences);

    // Weighted sum using dynamic weights
    const score =
      factors.recency * weights.recency +
      factors.relevance * weights.relevance +
      factors.socialProof * weights.socialProof +
      factors.diversity * weights.diversity;

    ranked.push({
      ...candidate,
      score,
      rankingFactors: factors,
      weightsUsed: weights,
    });
  }

  return ranked.sort((a, b) => b.score - a.score);
}

/**
 * Calculate ranking factors for content
 */
async function calculateRankingFactors(content, userId, preferences) {
  const prisma = getPrismaClient();

  // Recency (time decay)
  const age = Date.now() - new Date(content.createdAt).getTime();
  const hoursOld = age / (1000 * 60 * 60);
  const recency = Math.exp(-hoursOld / 24); // Exponential decay over 24 hours

  // Relevance (topic match)
  const relevance = await calculateRelevance(content, userId);

  // Social proof (friends who engaged)
  const socialProof = await calculateSocialProof(content, userId);

  // Diversity (placeholder - would track recent topics)
  const diversity = 0.5;

  return {
    recency,
    relevance,
    socialProof,
    diversity,
  };
}

/**
 * Calculate relevance score
 */
async function calculateRelevance(content, userId) {
  const prisma = getPrismaClient();

  // Get user topic preferences
  const userTopics = await prisma.userTopicPreference.findMany({
    where: { userId },
    select: { topicSlug: true, affinity: true },
  });

  // Get content topics
  const contentTopics = await prisma.topicConversation.findMany({
    where: { conversationId: content.contentId },
    select: { topicSlug: true },
  });

  if (contentTopics.length === 0) {
    return 0.5;
  }

  // Calculate overlap
  let relevance = 0;
  for (const ct of contentTopics) {
    const userPref = userTopics.find((ut) => ut.topicSlug === ct.topicSlug);
    if (userPref) {
      relevance += userPref.affinity;
    }
  }

  return Math.min(1, relevance / contentTopics.length);
}

/**
 * Calculate social proof score
 */
async function calculateSocialProof(content, userId) {
  const prisma = getPrismaClient();

  // Count friends who engaged
  const friendEngagements = await prisma.userInteraction.count({
    where: {
      contentId: content.contentId,
      userId: {
        in: prisma.socialConnection
          .findMany({
            where: { followerId: userId, status: 'active' },
            select: { followingId: true },
          })
          .then((cons) => cons.map((c) => c.followingId)),
      },
      action: { in: ['like', 'comment', 'share'] },
    },
  });

  // Normalize (assume max 10 friends engaging = full score)
  return Math.min(1, friendEngagements / 10);
}

/**
 * Apply diversity to prevent filter bubbles
 */
function applyDiversity(ranked, preferences) {
  // Simple diversity: interleave different sources
  const bySource = {};
  for (const item of ranked) {
    if (!bySource[item.source]) {
      bySource[item.source] = [];
    }
    bySource[item.source].push(item);
  }

  const diversified = [];
  const sources = Object.keys(bySource);
  let index = 0;

  while (diversified.length < ranked.length) {
    for (const source of sources) {
      if (bySource[source][index]) {
        diversified.push(bySource[source][index]);
      }
    }
    index++;
  }

  return diversified;
}

/**
 * Save generated feed items
 */
async function saveFeedItems(userId, items) {
  const prisma = getPrismaClient();
  const expiresAt = new Date(Date.now() + FEED_ITEM_EXPIRY_HOURS * 60 * 60 * 1000);

  // Clear old items
  await prisma.feedItem.deleteMany({
    where: { userId },
  });

  // Insert new items
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await prisma.feedItem.create({
      data: {
        userId,
        contentId: item.contentId,
        contentType: item.contentType,
        authorId: item.authorId,
        source: item.source,
        sourceDetails: item.sourceDetails,
        score: item.score,
        rankingFactors: item.rankingFactors,
        position: i,
        expiresAt,
      },
    });
  }
}

// ============================================================================
// Discovery Recommendations
// ============================================================================

/**
 * Generate discovery recommendations
 */
export async function generateDiscovery(userId, options = {}) {
  try {
    const { type = 'all', limit = 20 } = options;
    const recommendations = [];

    if (type === 'all' || type === 'content') {
      const contentRecs = await recommendContent(userId, limit / 2);
      recommendations.push(...contentRecs);
    }

    if (type === 'all' || type === 'users') {
      const userRecs = await recommendUsers(userId, limit / 3);
      recommendations.push(...userRecs);
    }

    if (type === 'all' || type === 'circles') {
      const circleRecs = await recommendCircles(userId, limit / 3);
      recommendations.push(...circleRecs);
    }

    // Save recommendations
    await saveDiscoveryItems(userId, recommendations);

    return {
      success: true,
      recommendations,
    };
  } catch (error) {
    log.error({ userId, error: error.message }, 'Discovery generation failed');
    return { success: false, error: 'Failed to generate recommendations' };
  }
}

/**
 * Recommend content
 */
async function recommendContent(userId, limit) {
  const prisma = getPrismaClient();

  // Get similar content to what user liked
  const likedContent = await prisma.userInteraction.findMany({
    where: {
      userId,
      action: { in: ['like', 'bookmark'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const contentIds = likedContent.map((i) => i.contentId);

  // Find similar content
  const similar = await prisma.contentSimilarity.findMany({
    where: {
      sourceId: { in: contentIds },
      similarityScore: { gt: 0.6 },
    },
    orderBy: { similarityScore: 'desc' },
    take: limit * 2,
  });

  // Filter out already seen
  const seen = new Set(contentIds);
  const recommendations = [];

  for (const sim of similar) {
    if (!seen.has(sim.targetId)) {
      recommendations.push({
        type: 'content',
        contentId: sim.targetId,
        confidence: sim.similarityScore,
        reasons: [
          {
            type: 'similarity',
            description: 'Similar to content you liked',
            weight: sim.similarityScore,
          },
        ],
      });
    }

    if (recommendations.length >= limit) {
      break;
    }
  }

  return recommendations;
}

/**
 * Recommend users to follow
 */
async function recommendUsers(userId, limit) {
  const prisma = getPrismaClient();

  // Get friends-of-friends not already following
  const recommendations = await prisma.$queryRaw`
    WITH user_friends AS (
      SELECT following_id
      FROM social_connections
      WHERE follower_id = ${userId} AND status = 'active'
    ),
    friends_of_friends AS (
      SELECT sc.following_id as user_id, COUNT(*) as mutual_count
      FROM social_connections sc
      JOIN user_friends uf ON sc.follower_id = uf.following_id
      WHERE sc.following_id != ${userId}
        AND sc.status = 'active'
        AND sc.following_id NOT IN (SELECT following_id FROM user_friends)
      GROUP BY sc.following_id
      HAVING COUNT(*) >= 2
    )
    SELECT 
      u.id,
      u.handle,
      u.display_name as "displayName",
      u.avatar_url as "avatarUrl",
      fof.mutual_count as "mutualCount"
    FROM friends_of_friends fof
    JOIN users u ON fof.user_id = u.id
    ORDER BY fof.mutual_count DESC
    LIMIT ${limit}
  `;

  return recommendations.map((r) => ({
    type: 'user',
    userId: r.id,
    confidence: Math.min(1, r.mutualCount / 5),
    reasons: [
      {
        type: 'social',
        description: `${r.mutualCount} mutual connections`,
        weight: r.mutualCount / 10,
      },
    ],
  }));
}

/**
 * Recommend circles to join
 */
async function recommendCircles(userId, limit) {
  const prisma = getPrismaClient();

  // Find circles with friends as members
  const recommendations = await prisma.$queryRaw`
    SELECT 
      c.id,
      c.name,
      c.description,
      c.type,
      COUNT(DISTINCT cm.user_id) as "friendCount"
    FROM circles c
    JOIN circle_members cm ON c.id = cm.circle_id
    JOIN social_connections sc ON cm.user_id = sc.following_id
    WHERE sc.follower_id = ${userId}
      AND sc.status = 'active'
      AND cm.status = 'active'
      AND c.visibility IN ('visible', 'private')
      AND c.id NOT IN (
        SELECT circle_id 
        FROM circle_members 
        WHERE user_id = ${userId}
      )
    GROUP BY c.id
    HAVING COUNT(DISTINCT cm.user_id) >= 2
    ORDER BY "friendCount" DESC
    LIMIT ${limit}
  `;

  return recommendations.map((r) => ({
    type: 'circle',
    circleId: r.id,
    confidence: Math.min(1, r.friendCount / 5),
    reasons: [
      {
        type: 'social',
        description: `${r.friendCount} friends are members`,
        weight: r.friendCount / 10,
      },
    ],
  }));
}

/**
 * Save discovery items
 */
async function saveDiscoveryItems(userId, items) {
  const prisma = getPrismaClient();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  for (const item of items) {
    await prisma.discoveryItem.create({
      data: {
        userId,
        contentId: item.contentId,
        userIdRecommended: item.userId,
        circleId: item.circleId,
        type: item.type,
        reasons: item.reasons,
        confidence: item.confidence,
        expiresAt,
      },
    });
  }
}

// ============================================================================
// Algorithmic Transparency
// ============================================================================

/**
 * Explain why content was recommended
 */
export async function explainRecommendation(userId, contentId) {
  try {
    const prisma = getPrismaClient();

    // Get feed item
    const feedItem = await prisma.feedItem.findFirst({
      where: { userId, contentId },
      select: {
        source: true,
        sourceDetails: true,
        rankingFactors: true,
        score: true,
      },
    });

    if (!feedItem) {
      return { success: false, error: 'Item not found in feed' };
    }

    // Build explanation
    const explanation = {
      summary: `This was shown because it matched your ${feedItem.source} preferences`,
      factors: [
        {
          name: 'Recency',
          description: 'How recently it was posted',
          weight: 0.3,
          value: feedItem.rankingFactors.recency,
          impact: feedItem.rankingFactors.recency > 0.7 ? 'high' : 'medium',
        },
        {
          name: 'Relevance',
          description: 'Match to your interests',
          weight: 0.4,
          value: feedItem.rankingFactors.relevance,
          impact: feedItem.rankingFactors.relevance > 0.7 ? 'high' : 'medium',
        },
        {
          name: 'Social Proof',
          description: 'Friends who engaged',
          weight: 0.2,
          value: feedItem.rankingFactors.socialProof,
          impact: feedItem.rankingFactors.socialProof > 0.5 ? 'high' : 'low',
        },
        {
          name: 'Diversity',
          description: 'Variety in your feed',
          weight: 0.1,
          value: feedItem.rankingFactors.diversity,
          impact: 'medium',
        },
      ],
      controls: {
        seeMoreLikeThis: true,
        seeLessLikeThis: true,
        adjustPreference: `/settings/feed?topic=${feedItem.sourceDetails?.topic}`,
        whyThis: `From your ${feedItem.source} network`,
      },
    };

    // Save decision for audit
    await prisma.algorithmicDecision.create({
      data: {
        userId,
        decisionType: 'feed_ranking',
        contentId,
        explanation,
        factors: explanation.factors,
        modelVersion: 'v1',
        privacyBudgetUsed: 0.1,
      },
    });

    return { success: true, explanation };
  } catch (error) {
    log.error({ userId, contentId, error: error.message }, 'Explanation failed');
    return { success: false, error: 'Failed to generate explanation' };
  }
}

/**
 * Get user's feed preferences
 */
export async function getFeedPreferences(userId) {
  const prisma = getPrismaClient();

  let prefs = await prisma.feedPreferences.findUnique({
    where: { userId },
  });

  if (!prefs) {
    // Create default preferences
    prefs = await prisma.feedPreferences.create({
      data: {
        userId,
        showFromCircles: true,
        showFromNetwork: true,
        showFromTopics: true,
        showTrending: true,
        showDiscoverable: true,
        recencyWeight: 30,
        relevanceWeight: 40,
        socialProofWeight: 20,
        diversityWeight: 10,
        privacyBudget: 50,
        timeRangeHours: 168,
      },
    });
  }

  return prefs;
}

/**
 * Update feed preferences
 */
export async function updateFeedPreferences(userId, updates) {
  const prisma = getPrismaClient();

  const allowedUpdates = [
    'showFromCircles',
    'showFromNetwork',
    'showFromTopics',
    'showTrending',
    'showDiscoverable',
    'recencyWeight',
    'relevanceWeight',
    'socialProofWeight',
    'diversityWeight',
    'privacyBudget',
    'minQualityScore',
    'timeRangeHours',
  ];

  const filteredUpdates = {};
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  const prefs = await prisma.feedPreferences.update({
    where: { userId },
    data: filteredUpdates,
  });

  return { success: true, preferences: prefs };
}

// ============================================================================
// Interaction Tracking
// ============================================================================

/**
 * Track user interaction
 */
export async function trackInteraction(userId, contentId, action, context = {}) {
  try {
    const prisma = getPrismaClient();

    await prisma.userInteraction.create({
      data: {
        userId,
        contentId,
        action,
        context,
        duration: context.duration,
        completionRate: context.completionRate,
      },
    });

    // Update feed item status
    if (['view', 'like', 'share'].includes(action)) {
      await prisma.feedItem.updateMany({
        where: { userId, contentId },
        data: {
          wasViewed: action === 'view' || undefined,
          wasEngaged: ['like', 'comment', 'share'].includes(action),
          wasShared: action === 'share',
        },
      });
    }

    return { success: true };
  } catch (error) {
    log.error({ userId, contentId, error: error.message }, 'Track interaction failed');
    return { success: false, error: 'Failed to track interaction' };
  }
}

// ============================================================================
// Similar Conversations
// ============================================================================

export async function getSimilarConversations(userId, conversationId, options = {}) {
  try {
    const prisma = getPrismaClient();
    const { limit = 10 } = options;

    const sourceConv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        topicConversations: { include: { topic: true } },
        atomicChatUnits: { take: 5, orderBy: { messageIndex: 'desc' } },
      },
    });

    if (!sourceConv) {
      return { success: false, error: 'Conversation not found' };
    }

    const sourceTopics = sourceConv.topicConversations.map((tc) => tc.topic.slug);

    const similar = await prisma.$queryRaw`
      SELECT 
        c.id, c.title, c.provider, c.owner_id as "ownerId",
        c."messageCount", c."totalWords", c."capturedAt",
        COUNT(DISTINCT tc.topic_id) as "topicOverlap"
      FROM conversations c
      LEFT JOIN topic_conversations tc ON c.id = tc.conversation_id
      WHERE c.id != ${conversationId}
        AND c.owner_id = ${userId}
      GROUP BY c.id, c.title, c.provider, c."ownerId", c."messageCount", c."totalWords", c."capturedAt"
      ORDER BY "topicOverlap" DESC, c."capturedAt" DESC
      LIMIT ${limit}
    `;

    const recommendations = similar.map((conv) => ({
      conversation: {
        id: conv.id,
        title: conv.title,
        provider: conv.provider,
        ownerId: conv.ownerId,
      },
      score: Math.min(100, Number(conv.topicOverlap) * 25),
      reason: { icon: 'hash', text: `${conv.topicOverlap} shared topics` },
      source: 'similar',
    }));

    return { success: true, recommendations };
  } catch (error) {
    log.error({ userId, conversationId, error: error.message }, 'Get similar conversations failed');
    return { success: false, error: 'Failed to get similar conversations' };
  }
}

// ============================================================================
// Privacy Budget Enforcement
// ============================================================================

export async function enforcePrivacyBudget(userId, preferences) {
  const budget = preferences.privacyBudget || 50;
  const personalizationRatio = budget / 100;

  return {
    allowTopicMatching: personalizationRatio > 0.2,
    allowSocialProof: personalizationRatio > 0.3,
    allowNetworkDiscovery: personalizationRatio > 0.4,
    allowTrending: personalizationRatio > 0.1,
    maxRecencyDays: Math.max(1, Math.floor(30 * personalizationRatio)),
    maxNetworkDegree: personalizationRatio > 0.5 ? 2 : 1,
  };
}

// ============================================================================
// Context-Aware Feed
// ============================================================================

export async function generateContextualFeed(userId, options = {}) {
  try {
    const prisma = getPrismaClient();
    const { limit = 20, activeTopics = [] } = options;

    const preferences = await getFeedPreferences(userId);
    const privacy = await enforcePrivacyBudget(userId, preferences);
    const candidates = await gatherFeedCandidates(userId, preferences);

    if (activeTopics.length > 0 && privacy.allowTopicMatching) {
      for (const candidate of candidates) {
        const matchCount = (candidate.topicSlugs || []).filter((t) =>
          activeTopics.includes(t)
        ).length;
        if (matchCount > 0) {
          candidate.topicBoost = Math.min(0.5, matchCount * 0.15);
          candidate.score = (candidate.score || 0) * (1 + candidate.topicBoost);
        }
      }
    }

    const ranked = await rankFeedItems(candidates, userId, preferences);
    const diversified = applyDiversity(ranked, preferences);

    return {
      success: true,
      items: diversified.slice(0, limit),
      contextBoost: {
        activeTopics,
        privacy,
        boosted: candidates.filter((c) => c.topicBoost).length,
      },
    };
  } catch (error) {
    log.error({ userId, error: error.message }, 'Contextual feed generation failed');
    return { success: false, error: 'Failed to generate contextual feed' };
  }
}

// ============================================================================
// Export Service
// ============================================================================

export const feedService = {
  generateFeed,
  generateContextualFeed,
  generateDiscovery,
  getSimilarConversations,
  explainRecommendation,
  getFeedPreferences,
  updateFeedPreferences,
  enforcePrivacyBudget,
  trackInteraction,
  DEFAULT_FEED_LIMIT,
  MAX_FEED_LIMIT,
};

export default feedService;
