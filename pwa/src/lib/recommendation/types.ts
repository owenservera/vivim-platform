/**
 * Core recommendation types for VIVIM
 * Based on X-algorithm architecture
 */

import type { MessageMetadata } from '../../types/conversation';

// ============================================================================
// Core Conversation Types
// ============================================================================

export interface Conversation {
  id: string;
  title: string;
  provider: 'chatgpt' | 'claude' | 'gemini' | 'grok' | 'deepseek' | 'qwen' | 'kimi';
  sourceUrl: string;
  createdAt: string;
  exportedAt: string;

  messages: Message[];
  metadata: ConversationMetadata;
  stats: ConversationStats;
  privacy: PrivacyState;

  // Algorithm fields (computed)
  embedding?: number[];
  entities?: string[];
  qualityScore?: number;
  interactionScore?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp?: string;
  metadata?: MessageMetadata;
}

export interface ContentBlock {
  type: 'text' | 'code' | 'image' | 'table' | 'quote' | 'math' | 'mermaid';
  content: string;
  language?: string;
}

export interface ConversationStats {
  totalMessages: number;
  totalWords: number;
  totalCharacters: number;
  totalCodeBlocks: number;
  totalMermaidDiagrams: number;
  totalImages: number;

  // Interaction signals
  timesViewed: number;
  lastViewedAt?: string;
  wasExported: boolean;
  wasShared: boolean;
  hasUserNotes: boolean;
}

export interface ConversationMetadata {
  model?: string;
  language?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface PrivacyState {
  level: 'local' | 'shared' | 'public';
  updatedAt: string;
}

// ============================================================================
// Recommendation Pipeline Types
// ============================================================================

export interface Candidate {
  conversation: Conversation;
  source: 'rediscovery' | 'semantic' | 'graph';
  score: number;
  features: RankingFeatures;
  reason?: {
    icon: string;
    text: string;
  };
}

export interface RankingFeatures {
  quality: number;
  recency: number;
  topicMatch: number;
  interaction: number;
  codeDensity: number;
  structuralDepth: number;
}

export interface UserPreferences {
  // Algorithm weights
  rankWeights: {
    quality: number;
    recency: number;
    topicMatch: number;
    interaction: number;
  };

  // Provider preferences
  providerBoost: Record<string, number>;

  // Content preferences
  codeBoost: boolean;
  longFormBoost: boolean;
  recentBoost: boolean;

  // Dismissed items
  dismissed: string[];
  dislikedTopics: string[];
}

export interface FeedbackSignal {
  conversationId: string;
  timestamp: string;
  signal: 'opened' | 'dismissed' | 'copied' | 'exported' | 'noted' | 'shared' | 'low_quality';
  context?: {
    timeSpent?: number;
    scrollDepth?: number;
  };
}

// ============================================================================
// Feed Types
// ============================================================================

export interface ForYouFeed {
  recommendations: RecommendationItem[];
  metadata: FeedMetadata;
}

export interface RecommendationItem {
  conversation: Conversation;
  score: number;
  reason: {
    icon: string;
    text: string;
  };
  source: string;
  featureContributions: Record<string, number>;
}

export interface FeedMetadata {
  generatedAt: string;
  totalCandidates: number;
  sources: {
    rediscovery: number;
    semantic: number;
    graph: number;
  };
  diversityMetrics: {
    topicSpread: number;
    timeSpread: number;
    providerSpread: number;
  };
}

// ============================================================================
// Quality Score Types
// ============================================================================

export interface QualityScoreBreakdown {
  overall: number;
  band: 'excellent' | 'good' | 'fair' | 'low';
  components: {
    contentRichness: number;
    structuralDepth: number;
    interaction: number;
    providerBoost: number;
  };
  color: string;
}

// ============================================================================
// API Types
// ============================================================================

export interface ForYouFeedRequest {
  limit?: number;
  context?: {
    conversationId?: string;
    searchQuery?: string;
  };
}

export interface ForYouFeedResponse {
  status: 'success' | 'error';
  data?: ForYouFeed;
  error?: string;
}

export interface SimilarConversationsRequest {
  conversationId: string;
  limit?: number;
}

export interface SimilarConversationsResponse {
  status: 'success' | 'error';
  data?: RecommendationItem[];
  error?: string;
}

export interface FeedbackRequest {
  conversationId: string;
  signal: string;
  context?: {
    timeSpent?: number;
    scrollDepth?: number;
  };
}

export interface FeedbackResponse {
  status: 'success' | 'error';
  error?: string;
}
