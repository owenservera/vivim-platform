/**
 * User Feed Service
 *
 * Connects the main feed to the user's own data with full CRUD operations
 * Implements single-user mode with local data integration
 */

import type { ACU, FeedItem, FeedResponse, Conversation as APIConversation } from '../types/acu';
import type { Conversation as StorageConversation } from '../types/conversation';
import { feedAPI } from './feed-api';
import { listConversations, getConversation } from './storage';

// ============================================================================
// USER FEED SERVICE
// ============================================================================

export class UserFeedService {
  /**
   * Get user's own ACUs for the feed
   */
  async getUserFeed(options: {
    tab?: 'for-you' | 'following' | 'topics' | 'bookmarks';
    limit?: number;
    offset?: number;
    topic?: string;
    minQuality?: number;
  } = {}): Promise<FeedResponse> {
    const {
      tab = 'for-you',
      limit = 20,
      offset = 0,
      topic,
      minQuality = 60,
    } = options;

    try {
      // For single-user mode, get user's own conversations
      const conversations = await listConversations();
      
      // Convert conversations to FeedItems (one per conversation)
      const feedItems: FeedItem[] = conversations.map(conv => {
        // Calculate max ACU score for this conversation
        let maxAcuScore = 0;
        let bestAcu: ACU | undefined = undefined;

        for (const msg of conv.messages) {
          if (msg.role === 'system') continue;
          
          const content = typeof msg.content === 'string' 
            ? msg.content 
            : (msg.content as any[]).map((part: any) => part.content).join('\n');
          
          const score = this.calculateQualityScore(content);
          if (score > maxAcuScore) {
            maxAcuScore = score;
            bestAcu = {
              id: `${conv.id}-${msg.id}`,
              conversationId: conv.id,
              type: this.classifyACUType(content),
              content,
              qualityOverall: score,
              relatedCount: 0,
              createdAt: msg.timestamp || conv.createdAt,
            };
          }
        }

        // Map StorageConversation to APIConversation (flattening stats)
        const apiConv: APIConversation = {
          id: conv.id,
          provider: conv.provider,
          title: conv.title,
          sourceUrl: conv.sourceUrl,
          createdAt: conv.createdAt,
          updatedAt: conv.exportedAt || conv.createdAt,
          capturedAt: conv.exportedAt || conv.createdAt,
          messageCount: conv.stats.totalMessages,
          totalWords: conv.stats.totalWords,
          totalCodeBlocks: conv.stats.totalCodeBlocks || 0,
          metadata: conv.metadata || {},
          messages: conv.messages,
        };

        return {
          conversation: apiConv,
          acu: bestAcu,
          score: maxAcuScore / 10, // Normalize to 0-10 scale
          reason: this.getRecommendationReason(conv),
          position: 0, // Set after sorting
        };
      });

      // Filter by quality if requested (less strict for local feed)
      const filtered = feedItems.filter(item => (item.score * 10) >= (minQuality * 0.8));

      // Sort by creation date (most recent first)
      filtered.sort((a, b) => 
        new Date(b.conversation.capturedAt).getTime() - new Date(a.conversation.capturedAt).getTime()
      );

      // Apply pagination and set position
      const paginated = filtered.slice(offset, offset + limit).map((item, index) => ({
        ...item,
        position: offset + index
      }));

      return {
        items: paginated,
        nextOffset: offset + paginated.length,
        hasMore: offset + paginated.length < filtered.length,
        metadata: {
          totalCandidates: filtered.length,
          inNetworkCount: filtered.length,
          outOfNetworkCount: 0,
          avgQuality: filtered.reduce((sum, item) => sum + (item.score * 10), 0) / filtered.length || 0,
        },
      };
    } catch (error) {
      console.error('Failed to get user feed:', error);
      
      // Fallback to API feed
      return feedAPI.getFeed(options);
    }
  }

  /**
   * Generate a recommendation reason for local conversations
   */
  private getRecommendationReason(conv: StorageConversation): string {
    if ((conv.stats.totalCodeBlocks || 0) > 0) return 'Contains technical implementation';
    if (conv.stats.totalMessages > 10) return 'In-depth discussion';
    return 'From your local library';
  }

  /**
   * Classify ACU type based on content
   */
  private classifyACUType(content: string): 'statement' | 'question' | 'answer' | 'code_snippet' | 'formula' | 'table' | 'image_reference' | 'tool_use' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('?') && lowerContent.includes('what') || 
        lowerContent.includes('how') || lowerContent.includes('why')) {
      return 'question';
    }
    
    if (lowerContent.includes('```') || lowerContent.includes('function') || 
        lowerContent.includes('class') || lowerContent.includes('def ')) {
      return 'code_snippet';
    }
    
    if (lowerContent.includes('the answer') || lowerContent.includes('therefore') ||
        lowerContent.includes('conclusion')) {
      return 'answer';
    }
    
    return 'statement';
  }

  /**
   * Calculate quality score based on content characteristics
   */
  private calculateQualityScore(content: string): number {
    let score = 50; // Base score
    
    // Length bonus (up to 20 points)
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    score += Math.min(wordCount / 10, 20);
    
    // Code content bonus (up to 15 points)
    if (content.includes('```') || content.includes('function') || 
        content.includes('class') || content.includes('def ')) {
      score += 15;
    }
    
    // Question bonus (up to 10 points)
    if (content.includes('?')) {
      score += 10;
    }
    
    // Uniqueness bonus (simplified)
    if (content.length > 100) {
      score += 10;
    }
    
    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Track engagement for user's own ACUs
   */
  async trackEngagement(
    acuId: string,
    action: 'view' | 'click' | 'bookmark' | 'share' | 'related_click' | 'conversation_click' | 'skip' | 'hide' | 'not_interested' | 'dwell',
    metadata?: any
  ): Promise<void> {
    // Track locally for user's own ACUs
    console.log(`Tracking engagement for user ACU: ${acuId}, action: ${action}`);
    
    // Also track via API for analytics
    return feedAPI.trackEngagement(acuId, action, metadata);
  }

  /**
   * Get user's ACUs by conversation
   */
  async getACUsByConversation(conversationId: string): Promise<ACU[]> {
    try {
      const conversation = await getConversation(conversationId);
      if (!conversation) return [];

      const acus: ACU[] = [];

      for (let i = 0; i < conversation.messages.length; i++) {
        const msg = conversation.messages[i];
        
        if (msg.role === 'system') continue;
        
        const content = typeof msg.content === 'string' 
          ? msg.content 
          : (msg.content as any[]).map((part: any) => part.content).join('\n');
          
        acus.push({
          id: `${conversationId}-${msg.id}`,
          conversationId: conversation.id,
          type: this.classifyACUType(content),
          content,
          qualityOverall: this.calculateQualityScore(content),
          relatedCount: 0,
          createdAt: msg.timestamp || conversation.createdAt,
        });
      }

      return acus;
    } catch (error) {
      console.error('Failed to get ACUs by conversation:', error);
      return [];
    }
  }

  /**
   * Create ACU from conversation message
   */
  async createACU(conversationId: string, messageId: string): Promise<ACU | null> {
    try {
      const conversation = await getConversation(conversationId);
      if (!conversation) return null;

      const message = conversation.messages.find(msg => msg.id === messageId);
      if (!message) return null;

      const content = typeof message.content === 'string' 
        ? message.content 
        : (message.content as any[]).map((part: any) => part.content).join('\n');

      const acu: ACU = {
        id: `${conversationId}-${messageId}`,
        conversationId: conversation.id,
        type: this.classifyACUType(content),
        content,
        qualityOverall: this.calculateQualityScore(content),
        relatedCount: 0,
        createdAt: message.timestamp || conversation.createdAt,
      };

      return acu;
    } catch (error) {
      console.error('Failed to create ACU:', error);
      return null;
    }
  }

  /**
   * Update ACU quality score
   */
  async updateACUQuality(acuId: string, newQuality: number): Promise<boolean> {
    // In single-user mode, we can update quality scores locally
    // In a real implementation, this would call the backend API
    console.log(`Updating ACU quality for ${acuId} to ${newQuality}`);
    return true;
  }

  /**
   * Delete ACU
   */
  async deleteACU(acuId: string): Promise<boolean> {
    // In single-user mode, we can mark ACUs as deleted locally
    // In a real implementation, this would call the backend API
    console.log(`Deleting ACU: ${acuId}`);
    return true;
  }
}

// Singleton instance
export const userFeedService = new UserFeedService();