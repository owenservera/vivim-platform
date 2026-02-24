import express from 'express';
import { getPrismaClient } from '../lib/database.js';

const router = express.Router();

function getUserId(req) {
  if (req.isAuthenticated() && req.user?.userId) {
    return req.user.userId;
  }
  return req.headers['x-user-id'] || null;
}

/**
 * GET /api/v1/feed
 *
 * Returns a personalized feed of conversations.
 */
router.get('/', async (req, res) => {
  try {
    const { tab = 'for-you', limit = 20, offset = 0, minQuality = 0 } = req.query;

    const userId = getUserId(req);
    const prisma = getPrismaClient();

    let conversations = [];

    // 1. Fetch conversations based on tab
    if (tab === 'for-you' || tab === 'following') {
      conversations = await prisma.conversation.findMany({
        take: parseInt(limit) * 2, // Fetch more for ranking
        orderBy: { capturedAt: 'desc' },
        include: {
          messages: {
            orderBy: { messageIndex: 'asc' },
          },
        },
      });
    } else if (tab === 'bookmarks') {
      // Logic for bookmarks (placeholder for now)
      conversations = [];
    }

    // 2. Score and Filter
    const scored = conversations.map((conv) => {
      const score = calculateConversationScore(conv);
      return {
        conversation: conv,
        score,
        reason: getRecommendationReason(conv),
      };
    });

    // 3. Filter by quality if needed
    const filtered = scored.filter((item) => {
      // Use messageCount and wordCount as proxy for quality if no specific score exists
      if (item.conversation.messageCount < 2) {
        return false;
      }
      return true;
    });

    // 4. Sort and Paginate
    // Primary sort: Recency (capturedAt)
    // Secondary sort: Score
    filtered.sort((a, b) => {
      const timeA = new Date(a.conversation.capturedAt).getTime();
      const timeB = new Date(b.conversation.capturedAt).getTime();
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return b.score - a.score;
    });

    const paginated = filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    const items = paginated.map((item, index) => ({
      ...item,
      position: parseInt(offset) + index,
    }));

    res.json({
      items,
      nextOffset: parseInt(offset) + items.length,
      hasMore: filtered.length > parseInt(offset) + items.length,
      metadata: {
        totalCandidates: filtered.length,
        avgQuality: 0, // Placeholder
      },
    });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

/**
 * Calculate a recommendation score for a conversation
 */
function calculateConversationScore(conv) {
  let score = 0;

  // Quality factors
  score += (conv.messageCount || 0) * 0.5;
  score += (conv.totalWords || 0) * 0.01;
  score += (conv.totalCodeBlocks || 0) * 2;

  // Recency bonus (5 days decay)
  const ageHours = (Date.now() - new Date(conv.capturedAt).getTime()) / (1000 * 60 * 60);
  const recencyBonus = Math.max(0, 10 - ageHours / 24);
  score += recencyBonus;

  return score;
}

/**
 * Generate a human-readable reason for the recommendation
 */
function getRecommendationReason(conv) {
  if (conv.totalCodeBlocks > 0) {
    return 'Contains technical implementation';
  }
  if (conv.messageCount > 10) {
    return 'In-depth discussion';
  }
  return 'Recent capture';
}

router.post('/engagement', async (req, res) => {
  const { acuId, action, metadata } = req.body;

  if (!acuId || !action) {
    return res.status(400).json({ error: 'Missing acuId or action' });
  }

  console.log(`[ENGAGEMENT] ${action} on ${acuId}`);

  res.json({ success: true });
});

export default router;
