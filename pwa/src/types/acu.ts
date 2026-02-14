/**
 * ACU Type Definitions
 */

export type ACUType =
  | 'statement'
  | 'question'
  | 'answer'
  | 'code_snippet'
  | 'formula'
  | 'table'
  | 'image_reference'
  | 'tool_use';

export interface ACU {
  id: string;
  conversationId: string;
  type: ACUType;
  content: string;
  language?: string;
  qualityOverall: number;
  qualityFactuality?: number;
  qualityRelevance?: number;
  qualityClarity?: number;
  qualityCompleteness?: number;
  relatedCount?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Conversation {
  id: string;
  provider: string;
  title: string;
  sourceUrl: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
  capturedAt: string;
  messageCount: number;
  totalWords: number;
  totalCodeBlocks: number;
  metadata: any;
  messages?: any[];
}

export interface FeedItem {
  conversation: Conversation;
  acu?: ACU; // ACU is now optional since feed is conversation-based
  score: number;
  reason?: string;
  position: number;
}

export interface FeedResponse {
  items: FeedItem[];
  nextOffset: number;
  hasMore: boolean;
  metadata: {
    totalCandidates: number;
    inNetworkCount: number;
    outOfNetworkCount: number;
    avgQuality: number;
  };
}

export interface EngagementEvent {
  userId: string;
  acuId: string;
  action: 
    | 'view'
    | 'click'
    | 'bookmark'
    | 'share'
    | 'related_click'
    | 'conversation_click'
    | 'skip'
    | 'hide'
    | 'not_interested'
    | 'dwell';
  timestamp: Date;
  metadata?: {
    dwellTime?: number;
    scrollDepth?: number;
    position?: number;
  };
}
