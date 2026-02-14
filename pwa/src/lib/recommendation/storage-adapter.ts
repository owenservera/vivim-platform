/**
 * Storage Adapter
 * Bridges storage-v2 format to recommendation system format
 */

import { getStorage } from '../storage-v2';
import type { Conversation } from './types';
import type { ConversationRoot } from '../storage-v2';

/**
 * List conversations in recommendation system format
 */
export async function listConversationsForRecommendation(options?: {
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  order?: 'asc' | 'desc';
}): Promise<Conversation[]> {
  const storage = await getStorage();
  const rawList = await storage.listConversations();

  // Convert to recommendation format
  const conversations: Conversation[] = rawList.map(item => {
    const root = item.root;
    const metadata = root.metadata || {};

    // Extract stats from DAG
    const stats = {
      totalMessages: item.messageCount,
      totalWords: extractWordCount(root),
      totalCharacters: extractCharCount(root),
      totalCodeBlocks: extractCodeBlockCount(root),
      totalMermaidDiagrams: extractMermaidCount(root),
      totalImages: extractImageCount(root),
      timesViewed: metadata.viewCount || 0,
      lastViewedAt: metadata.lastViewedAt,
      wasExported: metadata.exported || false,
      wasShared: metadata.shared || false,
      hasUserNotes: metadata.hasNotes || false
    };

    return {
      id: root.conversationId,
      title: root.title,
      provider: extractProvider(root),
      sourceUrl: metadata.sourceUrl || '',
      createdAt: root.timestamp,
      exportedAt: root.timestamp,
      messages: [], // Messages loaded separately when needed
      metadata: {
        model: metadata.model,
        language: metadata.language,
        tags: metadata.tags || []
      },
      stats,
      privacy: {
        level: metadata.privacy || 'local',
        updatedAt: metadata.privacyUpdatedAt || root.timestamp
      }
    };
  });

  // Sort
  if (options?.sortBy) {
    conversations.sort((a, b) => {
      let comparison = 0;

      if (options.sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (options.sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      }

      return options.order === 'desc' ? -comparison : comparison;
    });
  }

  // Limit
  if (options?.limit) {
    return conversations.slice(0, options.limit);
  }

  return conversations;
}

/**
 * Get single conversation by ID
 */
export async function getConversationForRecommendation(id: string): Promise<Conversation | null> {
  const storage = await getStorage();
  const rawList = await storage.listConversations();
  const found = rawList.find(item => item.root.conversationId === id);

  if (!found) return null;

  const conversations = await listConversationsForRecommendation({ limit: 1000 });
  return conversations.find(c => c.id === id) || null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractProvider(root: ConversationRoot): Conversation['provider'] {
  const sourceUrl = root.metadata?.sourceUrl;

  if (!sourceUrl) return 'other';

  if (sourceUrl.includes('chatgpt') || sourceUrl.includes('chat.openai')) {
    return 'chatgpt';
  } else if (sourceUrl.includes('claude') || sourceUrl.includes('anthropic')) {
    return 'claude';
  } else if (sourceUrl.includes('gemini') || sourceUrl.includes('google')) {
    return 'gemini';
  } else if (sourceUrl.includes('grok') || sourceUrl.includes('x.com')) {
    return 'grok';
  } else if (sourceUrl.includes('deepseek')) {
    return 'deepseek';
  } else if (sourceUrl.includes('qwen')) {
    return 'qwen';
  } else if (sourceUrl.includes('kimi')) {
    return 'kimi';
  }

  return 'other';
}

function extractWordCount(root: ConversationRoot): number {
  // Try to get from metadata
  if (root.metadata?.wordCount) {
    return root.metadata.wordCount;
  }

  // Fallback: estimate from title
  return root.title.split(' ').length * 10;
}

function extractCharCount(root: ConversationRoot): number {
  if (root.metadata?.charCount) {
    return root.metadata.charCount;
  }

  return root.title.length * 6;
}

function extractCodeBlockCount(root: ConversationRoot): number {
  if (root.metadata?.codeBlocks) {
    return root.metadata.codeBlocks;
  }

  return 0;
}

function extractMermaidCount(root: ConversationRoot): number {
  if (root.metadata?.mermaidDiagrams) {
    return root.metadata.mermaidDiagrams;
  }

  return 0;
}

function extractImageCount(root: ConversationRoot): number {
  if (root.metadata?.images) {
    return root.metadata.images;
  }

  return 0;
}
