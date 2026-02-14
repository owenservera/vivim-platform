/**
 * ACU API Client
 * 
 * Client-side API for interacting with Atomic Chat Units (ACUs)
 */

import { apiClient } from './api';

export interface ACU {
  id: string;
  authorDid: string;
  content: string;
  language?: string;
  type: string;
  category: string;
  embedding?: number[];
  embeddingModel?: string;
  conversationId: string;
  messageId: string;
  messageIndex: number;
  provider: string;
  model?: string;
  sourceTimestamp: string;
  qualityOverall?: number;
  contentRichness?: number;
  structuralIntegrity?: number;
  uniqueness?: number;
  sharingPolicy: string;
  sharingCircles: string[];
  createdAt: string;
  indexedAt: string;
  metadata: Record<string, any>;
}

export interface ACULink {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  weight: number;
  metadata: Record<string, any>;
}

export interface ACUGraph {
  center: string;
  nodes: Array<{
    id: string;
    content: string;
    type: string;
    category: string;
    qualityOverall?: number;
    isCenter: boolean;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    relation: string;
    weight: number;
  }>;
}

export interface ACUStats {
  total: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  avgQuality: {
    overall: string;
    richness: string;
    integrity: string;
    uniqueness: string;
  };
}

/**
 * List ACUs with filtering and pagination
 */
export async function listACUs(params: {
  conversationId?: string;
  type?: string;
  category?: string;
  minQuality?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const response = await apiClient.get(`/acus?${queryParams.toString()}`);
  return response.data as {
    success: boolean;
    data: ACU[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

/**
 * Get single ACU with full details
 */
export async function getACU(id: string) {
  const response = await apiClient.get(`/acus/${id}`);
  return response.data as {
    success: boolean;
    data: ACU & {
      conversation: {
        id: string;
        title: string;
        provider: string;
        model?: string;
        createdAt: string;
      };
      message: {
        id: string;
        role: string;
        author?: string;
        messageIndex: number;
        createdAt: string;
      };
      linksFrom: Array<{
        id: string;
        relation: string;
        weight: number;
        target: Partial<ACU>;
      }>;
      linksTo: Array<{
        id: string;
        relation: string;
        weight: number;
        source: Partial<ACU>;
      }>;
    };
  };
}

/**
 * Get ACU knowledge graph (relationships)
 */
export async function getACUGraph(id: string, depth: number = 1) {
  const response = await apiClient.get(`/acus/${id}/links?depth=${depth}`);
  return response.data as {
    success: boolean;
    data: ACUGraph;
  };
}

/**
 * Search ACUs semantically
 */
export async function searchACUs(params: {
  query: string;
  type?: string;
  category?: string;
  minQuality?: number;
  limit?: number;
}) {
  const response = await apiClient.post('/acus/search', params);
  return response.data as {
    success: boolean;
    data: ACU[];
    query: string;
    count: number;
  };
}

/**
 * Process a conversation into ACUs
 */
export async function processConversationToACUs(
  conversationId: string,
  options: {
    generateEmbeddings?: boolean;
    calculateQuality?: boolean;
    detectLinks?: boolean;
  } = {}
) {
  const response = await apiClient.post('/acus/process', {
    conversationId,
    ...options
  });
  return response.data as {
    success: boolean;
    data: {
      conversationId: string;
      acuCount: number;
      duration: number;
      acus: ACU[];
    };
  };
}

/**
 * Batch process all conversations
 */
export async function batchProcessACUs(options: {
  batchSize?: number;
  delayMs?: number;
  generateEmbeddings?: boolean;
  calculateQuality?: boolean;
  detectLinks?: boolean;
} = {}) {
  const response = await apiClient.post('/acus/batch', options);
  return response.data as {
    success: boolean;
    message: string;
    note: string;
  };
}

/**
 * Get ACU statistics
 */
export async function getACUStats() {
  const response = await apiClient.get('/acus/stats');
  return response.data as {
    success: boolean;
    data: ACUStats;
  };
}

/**
 * Get ACUs for a conversation
 */
export async function getConversationACUs(conversationId: string) {
  return listACUs({ conversationId, limit: 1000 });
}

/**
 * Get high-quality ACUs
 */
export async function getTopACUs(limit: number = 50) {
  return listACUs({
    minQuality: 80,
    limit,
    sortBy: 'qualityOverall',
    sortOrder: 'desc'
  });
}

/**
 * Get ACUs by type
 */
export async function getACUsByType(type: string, limit: number = 50) {
  return listACUs({ type, limit });
}

/**
 * Get code snippets
 */
export async function getCodeSnippets(limit: number = 50) {
  return getACUsByType('code_snippet', limit);
}

/**
 * Get questions
 */
export async function getQuestions(limit: number = 50) {
  return getACUsByType('question', limit);
}

/**
 * Get answers
 */
export async function getAnswers(limit: number = 50) {
  return getACUsByType('answer', limit);
}

export default {
  listACUs,
  getACU,
  getACUGraph,
  searchACUs,
  processConversationToACUs,
  batchProcessACUs,
  getACUStats,
  getConversationACUs,
  getTopACUs,
  getACUsByType,
  getCodeSnippets,
  getQuestions,
  getAnswers
};
