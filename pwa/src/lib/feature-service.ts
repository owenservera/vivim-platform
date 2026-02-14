import { getStorage } from './storage-v2';
import { logger } from './logger';
import { identityService } from './identity';
import type { ACUMetadata, ACUTag, ShareConfig, ShareLink, Circle, AIResult, AIAction, RelatedACU, ACULineage } from '../types/features';

interface FeatureCapabilities {
  aiActions: boolean;
  sharing: boolean;
  circles: boolean;
  offlineQueue: boolean;
  semanticSearch: boolean;
  lineage: boolean;
}

class FeatureService {
  private storage: ReturnType<typeof getStorage> | null = null;
  private capabilities: FeatureCapabilities = {
    aiActions: true,
    sharing: true,
    circles: true,
    offlineQueue: true,
    semanticSearch: false,
    lineage: true,
  };

  private offlineQueue: Array<() => Promise<void>> = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.storage = getStorage();
      this.setupOnlineListener();
      await this.detectCapabilities();
      logger.info('FeatureService initialized', { capabilities: this.capabilities });
    } catch (error) {
      logger.error('Failed to initialize FeatureService', { error });
      this.gracefulDegrade();
    }
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const did = identityService.getDID();
    if (did) {
      headers['X-DID'] = did;
    }
    return headers;
  }

  private async detectCapabilities() {
    try {
      const response = await fetch('/api/v1/capabilities');
      if (response.ok) {
        const serverCapabilities = await response.json();
        this.capabilities = { ...this.capabilities, ...serverCapabilities };
      }
    } catch {
      logger.warn('Could not detect server capabilities, using defaults');
    }
  }

  private gracefulDegrade() {
    this.capabilities = {
      aiActions: false,
      sharing: false,
      circles: false,
      offlineQueue: false,
      semanticSearch: false,
      lineage: false,
    };
  }

  private async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    
    logger.info(`Processing ${this.offlineQueue.length} offline operations`);
    
    for (const operation of this.offlineQueue) {
      try {
        await operation();
      } catch (error) {
        logger.error('Failed to process offline operation', { error });
      }
    }
    
    this.offlineQueue = [];
  }

  private queueOffline(operation: () => Promise<void>) {
    if (this.capabilities.offlineQueue) {
      this.offlineQueue.push(operation);
    }
  }

  getCapabilities(): FeatureCapabilities {
    return { ...this.capabilities };
  }

  async getMetadata(conversationId: string): Promise<ACUMetadata | null> {
    try {
      if (!this.storage) return null;
      const metadata = await this.storage.getMetadata?.(conversationId);
      return metadata || {
        tags: [],
        collectionIds: [],
        isPinned: false,
        isArchived: false,
        readStatus: 'unread',
        priority: 'medium',
      };
    } catch (error) {
      logger.error('Failed to get metadata', { conversationId, error });
      return null;
    }
  }

  async updateMetadata(conversationId: string, metadata: Partial<ACUMetadata>): Promise<boolean> {
    try {
      if (!this.storage) return false;
      
      const current = await this.getMetadata(conversationId);
      if (!current) return false;

      const updated = { ...current, ...metadata };
      
      if (!this.isOnline) {
        this.queueOffline(async () => {
          await this.storage?.setMetadata?.(conversationId, updated);
        });
        return true;
      }

      await this.storage.setMetadata?.(conversationId, updated);
      logger.info('Metadata updated', { conversationId, metadata });
      return true;
    } catch (error) {
      logger.error('Failed to update metadata', { conversationId, error });
      return false;
    }
  }

  async pin(conversationId: string): Promise<boolean> {
    const success = await this.updateMetadata(conversationId, { isPinned: true });
    if (success) {
      logger.info('Conversation pinned', { conversationId });
    }
    return success;
  }

  async unpin(conversationId: string): Promise<boolean> {
    const success = await this.updateMetadata(conversationId, { isPinned: false });
    if (success) {
      logger.info('Conversation unpinned', { conversationId });
    }
    return success;
  }

  async archive(conversationId: string): Promise<boolean> {
    const success = await this.updateMetadata(conversationId, { isArchived: true });
    if (success) {
      logger.info('Conversation archived', { conversationId });
    }
    return success;
  }

  async unarchive(conversationId: string): Promise<boolean> {
    const success = await this.updateMetadata(conversationId, { isArchived: false });
    if (success) {
      logger.info('Conversation unarchived', { conversationId });
    }
    return success;
  }

  async bookmark(conversationId: string): Promise<boolean> {
    if (!this.capabilities.sharing) {
      logger.warn('Bookmarking not available');
      return false;
    }

    try {
      const bookmarks = await this.getBookmarks();
      if (!bookmarks.includes(conversationId)) {
        bookmarks.push(conversationId);
        await this.storage?.setItem?.('bookmarks', JSON.stringify(bookmarks));
      }
      logger.info('Conversation bookmarked', { conversationId });
      return true;
    } catch (error) {
      logger.error('Failed to bookmark', { conversationId, error });
      return false;
    }
  }

  async removeBookmark(conversationId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      const index = bookmarks.indexOf(conversationId);
      if (index > -1) {
        bookmarks.splice(index, 1);
        await this.storage?.setItem?.('bookmarks', JSON.stringify(bookmarks));
      }
      logger.info('Bookmark removed', { conversationId });
      return true;
    } catch (error) {
      logger.error('Failed to remove bookmark', { conversationId, error });
      return false;
    }
  }

  async getBookmarks(): Promise<string[]> {
    try {
      const data = await this.storage?.getItem?.('bookmarks');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async fork(conversationId: string, title?: string): Promise<string | null> {
    if (!this.capabilities.lineage) {
      logger.warn('Forking not available');
      return null;
    }

    try {
      const conversation = await this.storage?.getConversation?.(conversationId);
      if (!conversation) return null;

      const forkedConversation = {
        ...conversation,
        id: crypto.randomUUID(),
        title: title || `Fork: ${conversation.title}`,
        createdAt: new Date().toISOString(),
        parentId: conversationId,
      };

      await this.storage?.saveConversation?.(forkedConversation);
      
      await this.trackLineage(conversationId, forkedConversation.id, 'fork');
      
      logger.info('Conversation forked', { originalId: conversationId, forkId: forkedConversation.id });
      return forkedConversation.id;
    } catch (error) {
      logger.error('Failed to fork conversation', { conversationId, error });
      return null;
    }
  }

  private async trackLineage(parentId: string, childId: string, type: 'fork' | 'remix'): Promise<void> {
    try {
      const lineageKey = `lineage:${childId}`;
      const lineage: ACULineage = {
        acuId: childId,
        authorId: await this.getCurrentUserId(),
        authorName: 'Anonymous',
        createdAt: new Date().toISOString(),
        parentId,
        forkChain: type === 'fork' ? [{
          forkId: childId,
          parentId,
          parentAuthorId: undefined,
          parentAuthorName: undefined,
          forkedAt: new Date().toISOString(),
          changes: 'minor',
          attribution: `Forked from ${parentId}`,
        }] : [],
        remixChain: [],
        contributors: [],
        version: 1,
      };
      
      await this.storage?.setItem?.(lineageKey, JSON.stringify(lineage));
    } catch (error) {
      logger.error('Failed to track lineage', { parentId, childId, error });
    }
  }

  async generateShareLink(conversationId: string, config: ShareConfig): Promise<ShareLink | null> {
    if (!this.capabilities.sharing) {
      logger.warn('Sharing not available');
      return null;
    }

    try {
      const response = await fetch('/api/v2/sharing/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, config }),
      });

      if (!response.ok) {
        if (!this.isOnline) {
          this.queueOffline(async () => {
            await this.generateShareLink(conversationId, config);
          });
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const shareLink: ShareLink = await response.json();
      logger.info('Share link generated', { conversationId, shareLink });
      return shareLink;
    } catch (error) {
      logger.error('Failed to generate share link', { conversationId, error });
      
      const localLink: ShareLink = {
        id: crypto.randomUUID(),
        url: `${window.location.origin}/share/${conversationId}?local=true`,
        shortCode: conversationId.slice(0, 8),
        visibility: config.visibility,
        createdAt: new Date().toISOString(),
        accessCount: 0,
      };
      
      return localLink;
    }
  }

  async executeAIAction(
    action: AIAction,
    conversationId: string,
    content: string
  ): Promise<AIResult | null> {
    if (!this.capabilities.aiActions) {
      logger.warn('AI actions not available');
      return null;
    }

    try {
      const response = await fetch('/api/v1/ai/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, conversationId, content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: AIResult = await response.json();
      logger.info('AI action executed', { action, conversationId });
      return result;
    } catch (error) {
      logger.error('AI action failed', { action, conversationId, error });
      
      const fallbackResult = this.generateFallbackAIResult(action, content);
      return fallbackResult;
    }
  }

  private generateFallbackAIResult(action: AIAction, content: string): AIResult {
    const fallbacks: Record<AIAction, string> = {
      summarize: `[Offline Mode] Summary unavailable. Original content preserved.`,
      expand: `[Offline Mode] Expansion requires online AI service.`,
      simplify: `[Offline Mode] Simplification unavailable.`,
      translate: `[Offline Mode] Translation requires online service.`,
      extract_insights: `[Offline Mode] Insight extraction unavailable.`,
      generate_title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      generate_questions: `[Offline Mode] Question generation unavailable.`,
      find_related: `[Offline Mode] Related conversations search requires online service.`,
      check_contradictions: `[Offline Mode] Fact checking unavailable.`,
      continue_chat: `[Offline Mode] Chat continuation requires online AI.`,
      switch_model: `[Offline Mode] Model switching unavailable.`,
      compare_models: `[Offline Mode] Model comparison unavailable.`,
    };

    return {
      action,
      content: fallbacks[action] || '[Offline Mode] This feature is currently unavailable.',
      metadata: {
        model: 'offline-fallback',
        tokens: 0,
        confidence: 0,
      },
      createdAt: new Date().toISOString(),
    };
  }

  async findRelated(conversationId: string): Promise<RelatedACU[]> {
    if (!this.capabilities.semanticSearch) {
      logger.warn('Semantic search not available');
      return [];
    }

    try {
      const response = await fetch(`/api/v1/conversations/${conversationId}/related`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const related: RelatedACU[] = await response.json();
      return related;
    } catch (error) {
      logger.error('Failed to find related conversations', { conversationId, error });
      return [];
    }
  }

  async getCircles(): Promise<Circle[]> {
    if (!this.capabilities.circles) {
      logger.warn('Circles not available');
      return [];
    }

    // Ensure identity is initialized and user has an identity
    if (!identityService.state.initialized) {
      await identityService.initialize();
    }
    if (!identityService.hasIdentity()) {
      logger.debug('No identity, skipping circles fetch');
      return [];
    }

    try {
      const response = await fetch('/api/v2/circles', {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const circles: Circle[] = await response.json();
      return circles;
    } catch (error) {
      logger.error('Failed to get circles', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  async createCircle(name: string, description: string, visibility: 'public' | 'private' | 'secret'): Promise<Circle | null> {
    if (!this.capabilities.circles) return null;

    try {
      const response = await fetch('/api/v2/circles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ name, description, visibility }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const circle: Circle = await response.json();
      logger.info('Circle created', { circleId: circle.id });
      return circle;
    } catch (error) {
      logger.error('Failed to create circle', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async shareToCircle(conversationId: string, circleId: string): Promise<boolean> {
    if (!this.capabilities.circles) return false;

    try {
      const response = await fetch(`/api/v2/circles/${circleId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ conversationId }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      logger.info('Shared to circle', { conversationId, circleId });
      return true;
    } catch (error) {
      logger.error('Failed to share to circle', error instanceof Error ? error : new Error(String(error)), { conversationId, circleId });
      return false;
    }
  }

  private async getCurrentUserId(): Promise<string> {
    try {
      const identity = await this.storage?.getIdentity?.();
      return identity || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  async duplicate(conversationId: string): Promise<string | null> {
    try {
      const conversation = await this.storage?.getConversation?.(conversationId);
      if (!conversation) return null;

      const duplicated = {
        ...conversation,
        id: crypto.randomUUID(),
        title: `Copy of ${conversation.title}`,
        createdAt: new Date().toISOString(),
      };

      await this.storage?.saveConversation?.(duplicated);
      logger.info('Conversation duplicated', { originalId: conversationId, newId: duplicated.id });
      return duplicated.id;
    } catch (error) {
      logger.error('Failed to duplicate', { conversationId, error });
      return null;
    }
  }

  async delete(conversationId: string): Promise<boolean> {
    try {
      await this.storage?.deleteConversation?.(conversationId);
      logger.info('Conversation deleted', { conversationId });
      return true;
    } catch (error) {
      logger.error('Failed to delete', { conversationId, error });
      return false;
    }
  }
}

export const featureService = new FeatureService();
export default featureService;
