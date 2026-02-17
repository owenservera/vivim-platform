/**
 * Recommendation API Client
 * 
 * Unified client that works in both development and production.
 * - Development: Uses client-side knowledge mixer
 * - Production: Calls server API with fallback to client-side
 */

import type {
  ForYouFeedRequest,
  ForYouFeedResponse,
  SimilarConversationsRequest,
  SimilarConversationsResponse,
  FeedbackRequest,
  FeedbackResponse,
  UserPreferences,
  Conversation
} from './types';
import { knowledgeMixer } from './mixer/KnowledgeMixer';
import { QualityScoreCalculator as QualityScore } from './scoring/QualityScore';
import { DEFAULT_USER_PREFERENCES, RECOMMENDATION_LIMITS } from './config';
import { listConversationsForRecommendation } from './storage-adapter';
import { log } from './logger';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';
const USE_SERVER_API = import.meta.env.VITE_USE_SERVER_FEED !== 'false';

const isDev = import.meta.env.DEV;

// ============================================================================
// For You Feed
// ============================================================================

export async function getForYouFeed(
  conversations: Conversation[],
  request?: ForYouFeedRequest
): Promise<ForYouFeedResponse> {
  if (isDev || !USE_SERVER_API) {
    return getForYouFeedLocal(conversations, request);
  }
  
  return getForYouFeedFromServer({
    limit: request?.limit,
    context: request?.context
  });
}

async function getForYouFeedLocal(
  conversations: Conversation[],
  request?: ForYouFeedRequest
): Promise<ForYouFeedResponse> {
  try {
    const recommendations = await knowledgeMixer.generateFeed(
      conversations,
      DEFAULT_USER_PREFERENCES as UserPreferences,
      request?.context
    );

    return {
      status: 'success',
      data: {
        recommendations,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalCandidates: recommendations.length,
          sources: {
            rediscovery: recommendations.filter(r => r.source === 'rediscovery').length,
            semantic: 0,
            graph: 0
          },
          diversityMetrics: {
            topicSpread: 0,
            timeSpread: 0,
            providerSpread: 0
          }
        }
      }
    };
  } catch (error) {
    log.api.error('Failed to generate feed:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to generate feed'
    };
  }
}

// ============================================================================
// Similar Conversations
// ============================================================================

export async function getSimilarConversations(
  request: SimilarConversationsRequest
): Promise<SimilarConversationsResponse> {
  if (!isDev && USE_SERVER_API) {
    return getSimilarConversationsFromServer(request);
  }
  
  return getSimilarConversationsLocal(request);
}

async function getSimilarConversationsLocal(
  request: SimilarConversationsRequest
): Promise<SimilarConversationsResponse> {
  try {
    const allConversations = await listConversationsForRecommendation({ limit: RECOMMENDATION_LIMITS.MAX_CANDIDATES });

    // Find the current conversation
    const currentConvo = allConversations.find(c => c.id === request.conversationId);
    if (!currentConvo) {
      return {
        status: 'error',
        error: 'Conversation not found'
      };
    }

    // Calculate similarity scores
    const qualityScorer = new QualityScore();
    const currentQuality = qualityScorer.calculate(currentConvo);

    const scored = allConversations
      .filter(c => c.id !== request.conversationId) // Exclude current
      .map(convo => {
        // Similarity factors:
        // 1. Same provider (30%)
        // 2. Quality proximity (20%)
        // 3. Topic overlap from tags (30%)
        // 4. Message count proximity (10%)
        // 5. Recency (10%)

        const quality = qualityScorer.calculate(convo);
        const qualityDiff = 1 - Math.abs(currentQuality - quality) / 100;
        const providerMatch = convo.provider === currentConvo.provider ? 1 : 0.5;

        // Tag/topic overlap
        const currentTags = new Set(currentConvo.metadata.tags || []);
        const convoTags = new Set(convo.metadata.tags || []);
        const intersection = [...currentTags].filter(t => convoTags.has(t));
        const union = new Set([...currentTags, ...convoTags]);
        const topicOverlap = union.size > 0 ? intersection.length / union.size : 0;

        // Message count proximity
        const msgCountDiff = 1 - Math.abs(
          currentConvo.stats.totalMessages - convo.stats.totalMessages
        ) / Math.max(currentConvo.stats.totalMessages, convo.stats.totalMessages);

        // Recency boost
        const daysDiff = (Date.now() - new Date(convo.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const recency = Math.max(0, 1 - daysDiff / 30); // Decay over 30 days

        const score = (
          providerMatch * 0.30 +
          qualityDiff * 0.20 +
          topicOverlap * 0.30 +
          msgCountDiff * 0.10 +
          recency * 0.10
        ) * 100;

        return {
          conversation: convo,
          score,
          reason: {
            icon: getReasonIcon(providerMatch, topicOverlap, qualityDiff),
            text: getReasonText(providerMatch, topicOverlap, qualityDiff)
          },
          source: 'similar' as const,
          featureContributions: {
            providerMatch: providerMatch * 30,
            qualityDiff: qualityDiff * 20,
            topicOverlap: topicOverlap * 30,
            msgCountDiff: msgCountDiff * 10,
            recency: recency * 10
          }
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, request.limit || RECOMMENDATION_LIMITS.SIMILAR_CONVERSATIONS);

    return {
      status: 'success',
      data: scored
    };
  } catch (error) {
    log.api.error('[getSimilarConversations] Error:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to get similar conversations'
    };
  }
}

function getReasonIcon(providerMatch: number, topicOverlap: number, qualityDiff: number): string {
  if (providerMatch >= 0.8) return 'cpu';
  if (topicOverlap >= 0.3) return 'hash';
  if (qualityDiff >= 0.8) return 'star';
  return 'target';
}

function getReasonText(providerMatch: number, topicOverlap: number, qualityDiff: number): string {
  if (providerMatch >= 0.8) return 'Same AI provider';
  if (topicOverlap >= 0.3) return 'Related topics';
  if (qualityDiff >= 0.8) return 'Similar quality';
  return 'Related conversation';
}

// ============================================================================
// Feedback
// ============================================================================

export async function sendFeedback(
  request: FeedbackRequest
): Promise<FeedbackResponse> {
  try {
    const response = await fetch(`${API_BASE}/v2/feed/interact/${request.conversationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: request.action,
        duration: request.duration,
        completionRate: request.completionRate
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    log.api.info('[sendFeedback] Feedback sent successfully:', request);
    return { status: 'success' };
  } catch (error) {
    log.api.error('[sendFeedback] Failed to send feedback:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to send feedback'
    };
  }
}

// ============================================================================
// Server API (Production)
// ============================================================================

export async function getForYouFeedFromServer(
  request: ForYouFeedRequest
): Promise<ForYouFeedResponse> {
  try {
    const params = new URLSearchParams();
    if (request.limit) params.set('limit', request.limit.toString());
    if (request.context?.conversationId) {
      params.set('conversationId', request.context.conversationId);
    }
    if (request.context?.searchQuery) {
      params.set('query', request.context.searchQuery);
    }

    const response = await fetch(`${API_BASE}/v2/feed?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        status: 'success',
        data: {
          recommendations: data.data.items.map((item: any) => ({
            conversation: { id: item.contentId },
            score: item.score,
            reason: { icon: 'zap', text: item.source },
            source: item.source
          })),
          metadata: {
            generatedAt: new Date().toISOString(),
            totalCandidates: data.data.totalCandidates || data.data.items.length,
            sources: {},
            diversityMetrics: {}
          }
        }
      };
    }
    
    return {
      status: 'error',
      error: data.error || 'Failed to fetch feed'
    };
  } catch (error) {
    log.api.error('[getForYouFeedFromServer] Error:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to fetch feed'
    };
  }
}

async function getSimilarConversationsFromServer(
  request: SimilarConversationsRequest
): Promise<SimilarConversationsResponse> {
  try {
    const response = await fetch(`${API_BASE}/v2/feed/similar/${request.conversationId}?limit=${request.limit || 10}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return {
        status: 'success',
        data: data.data.recommendations || []
      };
    }
    
    return {
      status: 'error',
      error: data.error || 'Failed to get similar conversations'
    };
  } catch (error) {
    log.api.error('[getSimilarConversationsFromServer] Error:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to get similar conversations'
    };
  }
}
