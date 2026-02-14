/**
 * Yjs Sync Manager
 * 
 * High-performance CRDT-based synchronization using Yjs:
 * - Binary encoding (10x smaller than JSON)
 * - Delta sync (only sync what's missing)
 * - WebSocket provider with automatic reconnection
 * - IndexedDB persistence
 * - Awareness protocol for presence/cursors
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useSyncStore } from './stores';

// ============================================================================
// Types
// ============================================================================

export interface ConversationData {
  id: string;
  title: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
  messageIds: string[];
}

export interface MessageData {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// ============================================================================
// Yjs Sync Manager
// ============================================================================

class YjsSyncManager {
  private doc: Y.Doc | null = null;
  private wsProvider: WebsocketProvider | null = null;
  private persistence: IndexeddbPersistence | null = null;
  private peerId: string = '';
  
  // Shared types
  private conversations: Y.Map<ConversationData> | null = null;
  private messages: Y.Map<MessageData> | null = null;
  
  /**
   * Initialize Yjs document with persistence and sync
   */
  async initialize(peerId: string, wsUrl?: string): Promise<void> {
    this.peerId = peerId;
    this.doc = new Y.Doc();
    
    // Get shared types
    this.conversations = this.doc.getMap('conversations');
    this.messages = this.doc.getMap('messages');
    
    // Setup IndexedDB persistence
    this.persistence = new IndexeddbPersistence('openscroll-yjs', this.doc);
    
    await new Promise<void>((resolve) => {
      this.persistence!.once('synced', () => {
        console.log('✅ Loaded from IndexedDB');
        resolve();
      });
    });
    
    // Setup WebSocket provider if URL provided
    if (wsUrl) {
      this.connectWebSocket(wsUrl);
    }
    
    // Listen for changes
    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin !== this) {
        console.log('📥 Received update:', update.length, 'bytes');
        useSyncStore.getState().setLastSync(new Date().toISOString());
      }
    });
  }
  
  /**
   * Connect to WebSocket sync server
   */
  connectWebSocket(url: string): void {
    if (!this.doc) {
      console.error('Document not initialized');
      return;
    }
    
    // Create WebSocket provider
    this.wsProvider = new WebsocketProvider(
      url,
      `openscroll-${this.peerId}`,
      this.doc,
      {
        connect: true,
      }
    );
    
    // Connection status
    this.wsProvider.on('status', ({ status }: { status: string }) => {
      console.log('🔌 WebSocket status:', status);
      
      if (status === 'connected') {
        useSyncStore.getState().setStatus('idle');
      } else if (status === 'disconnected') {
        useSyncStore.getState().setStatus('offline');
      }
    });
    
    // Sync events
    this.wsProvider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        console.log('✅ Synced with server');
        useSyncStore.getState().setLastSync(new Date().toISOString());
      } else {
        useSyncStore.getState().setStatus('syncing');
      }
    });
    
    // Awareness (presence) - Check if awareness is properly available
    if (this.wsProvider.awareness) {
      // Set local state
      this.wsProvider.awareness.setLocalState({
        user: {
          id: this.peerId,
          name: 'User',
          color: this.generateColor(this.peerId),
        },
      });

      // Attach the event listener - check if the method exists before using it
      if (typeof this.wsProvider.awareness.on === 'function') {
        const awarenessHandler = () => {
          const states = Array.from(this.wsProvider!.awareness!.getStates().values());
          console.log('👥 Connected peers:', states.length);
        };
        
        try {
          this.wsProvider.awareness.on('change', awarenessHandler);
        } catch (error) {
          console.warn('Could not attach awareness change listener:', error);
        }
      } else {
        console.warn('awareness.on is not a function, skipping event listener setup');
      }
    }
  }
  
  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.wsProvider) {
      this.wsProvider.disconnect();
      this.wsProvider.destroy();
      this.wsProvider = null;
    }
  }
  
  /**
   * Add a conversation
   */
  addConversation(data: Omit<ConversationData, 'updatedAt'>): void {
    if (!this.conversations) return;
    
    this.doc!.transact(() => {
      this.conversations!.set(data.id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    }, this); // Pass 'this' as origin to identify local changes
    
    console.log('➕ Added conversation:', data.id);
  }
  
  /**
   * Update a conversation
   */
  updateConversation(id: string, updates: Partial<ConversationData>): void {
    if (!this.conversations) return;
    
    const existing = this.conversations.get(id);
    if (!existing) return;
    
    this.doc!.transact(() => {
      this.conversations!.set(id, {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }, this);
    
    console.log('✏️ Updated conversation:', id);
  }
  
  /**
   * Add a message
   */
  addMessage(data: MessageData): void {
    if (!this.messages || !this.conversations) return;
    
    this.doc!.transact(() => {
      // Add message
      this.messages!.set(data.id, data);
      
      // Update conversation's message list
      const conv = this.conversations!.get(data.conversationId);
      if (conv) {
        this.conversations!.set(data.conversationId, {
          ...conv,
          messageIds: [...conv.messageIds, data.id],
          updatedAt: new Date().toISOString(),
        });
      }
    }, this);
    
    console.log('💬 Added message:', data.id);
  }
  
  /**
   * Get all conversations
   */
  getConversations(): ConversationData[] {
    if (!this.conversations) return [];
    
    return Array.from(this.conversations.values());
  }
  
  /**
   * Get a single conversation
   */
  getConversation(id: string): ConversationData | null {
    if (!this.conversations) return null;
    
    return this.conversations.get(id) || null;
  }
  
  /**
   * Get messages for a conversation
   */
  getMessages(conversationId: string): MessageData[] {
    if (!this.messages || !this.conversations) return [];
    
    const conv = this.conversations.get(conversationId);
    if (!conv) return [];
    
    return conv.messageIds
      .map(id => this.messages!.get(id))
      .filter((m): m is MessageData => m !== undefined);
  }
  
  /**
   * Delete a conversation
   */
  deleteConversation(id: string): void {
    if (!this.conversations || !this.messages) return;
    
    this.doc!.transact(() => {
      const conv = this.conversations!.get(id);
      if (conv) {
        // Delete all messages
        conv.messageIds.forEach(msgId => {
          this.messages!.delete(msgId);
        });
        
        // Delete conversation
        this.conversations!.delete(id);
      }
    }, this);
    
    console.log('🗑️ Deleted conversation:', id);
  }
  
  /**
   * Get document for debugging
   */
  getDocument(): Y.Doc | null {
    return this.doc;
  }
  
  /**
   * Get awareness (presence) state
   */
  getAwareness() {
    return this.wsProvider?.awareness || null;
  }
  
  /**
   * Export document as binary
   */
  exportBinary(): Uint8Array | null {
    if (!this.doc) return null;
    return Y.encodeStateAsUpdate(this.doc);
  }
  
  /**
   * Import binary update
   */
  importBinary(update: Uint8Array): void {
    if (!this.doc) return;
    Y.applyUpdate(this.doc, update);
  }
  
  /**
   * Generate a color from peer ID
   */
  private generateColor(peerId: string): string {
    let hash = 0;
    for (let i = 0; i < peerId.length; i++) {
      hash = peerId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }
}

// Export singleton
export const syncManager = new YjsSyncManager();
export default syncManager;
