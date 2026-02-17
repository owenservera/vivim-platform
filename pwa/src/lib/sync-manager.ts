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
import { log } from './logger';

// Try to import UnifiedDebugService for centralized error reporting
let unifiedDebugService: any = null;
try {
  unifiedDebugService = require('./unified-debug-service').unifiedDebugService;
} catch (e) {
  // UnifiedDebugService not available yet
}

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
  private wsUrl: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  
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
    
    // Add timeout to prevent hanging forever
    const syncTimeout = setTimeout(() => {
      console.warn('⚠️ IndexedDB sync timeout after 5s');
      log.sync.warn('IndexedDB sync timeout after 5s');
    }, 5000);
    
    await Promise.race([
      new Promise<void>((resolve) => {
        this.persistence!.once('synced', () => {
          clearTimeout(syncTimeout);
          console.log('✅ Loaded from IndexedDB');
          resolve();
        });
      }),
      new Promise<void>((resolve) => 
        setTimeout(() => resolve(), 5000)
      )
    ]).catch(err => {
      console.warn('⚠️ IndexedDB sync error, continuing anyway:', err);
      log.sync.warn('IndexedDB sync error', err instanceof Error ? err : new Error(String(err)));
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
   * @param url - WebSocket URL
   * @param isReconnect - If true, don't reset reconnectAttempts (internal use)
   */
  connectWebSocket(url: string, isReconnect: boolean = false): void {
    if (!this.doc) {
      console.error('Document not initialized');
      log.sync.error('WebSocket: Document not initialized');
      return;
    }
    
    // Clean up existing provider before creating new one
    if (this.wsProvider) {
      console.log('🧹 Cleaning up existing WebSocket provider');
      this.wsProvider.disconnect();
      this.wsProvider.destroy();
      this.wsProvider = null;
    }
    
    // Store URL for potential reconnection
    this.wsUrl = url;
    // Only reset reconnect counter if not a reconnection attempt
    if (!isReconnect) {
      this.reconnectAttempts = 0;
    }
    
    const roomName = `openscroll-${this.peerId}`;
    log.sync.info(`WebSocket: Connecting to ${url} with room ${roomName}`);
    console.log('🔌 Creating WebSocketProvider:', { url, roomName });
    
    // Create WebSocket provider
    try {
      this.wsProvider = new WebsocketProvider(
        url,
        roomName,
        this.doc,
        {
          connect: true,
        }
      );
      console.log('✅ WebSocketProvider created');
    } catch (err) {
      console.error('❌ Failed to create WebSocketProvider:', err);
      log.sync.error('Failed to create WebSocketProvider', err instanceof Error ? err : new Error(String(err)), { url, roomName });
      return;
    }
    
    // Connection status
    this.wsProvider.on('status', ({ status }: { status: string }) => {
      console.log('🔌 WebSocket status:', status);
      log.sync.info(`WebSocket status changed: ${status}`);
      
      if (status === 'connected') {
        this.reconnectAttempts = 0; // Reset reconnect counter on success
        useSyncStore.getState().setStatus('idle');
      } else if (status === 'disconnected') {
        useSyncStore.getState().setStatus('offline');
      } else if (status === 'connecting') {
        useSyncStore.getState().setStatus('syncing');
      }
    });

    // Handle connection errors gracefully with better logging
    this.wsProvider.on('connection-error', (event: Event) => {
      const eventObj = event as any;
      const errorMsg = eventObj.message || eventObj.reason || `WebSocket connection error (type: ${event.type})`;
      const target = eventObj.target;
      const readyState = target?.readyState !== undefined ? `readyState: ${target.readyState}` : '';
      
      console.warn('⚠️ WebSocket connection error:', errorMsg, readyState);
      log.sync.error(`WebSocket connection error: ${errorMsg}`, new Error(errorMsg), { eventType: event.type, readyState: target?.readyState });
      
      // Report to UnifiedDebugService if available
      if (unifiedDebugService) {
        unifiedDebugService.error('WebSocket', `Connection error: ${errorMsg}`, new Error(errorMsg), { url, eventType: event.type, readyState: target?.readyState });
      }
      
      useSyncStore.getState().setStatus('offline');
    });

    // Handle WebSocket close events with reconnection logic
    this.wsProvider.on('close', (event: Event) => {
      const eventObj = event as any;
      const reason = eventObj.reason || 'No reason provided';
      const code = eventObj.code || 'Unknown code';
      console.warn('⚠️ WebSocket closed:', code, reason);
      log.sync.warn(`WebSocket closed: code=${code}, reason=${reason}, reconnectAttempts=${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      if (unifiedDebugService) {
        unifiedDebugService.warn('WebSocket', `Connection closed: ${code} - ${reason}`);
      }
      
      // Attempt reconnection if not maxed out
      if (this.reconnectAttempts < this.maxReconnectAttempts && this.wsUrl) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
        console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
        setTimeout(() => {
          if (this.wsUrl) {
            this.connectWebSocket(this.wsUrl, true); // Pass true to indicate reconnection
          }
        }, delay);
      }
    });
    
    // Handle WebSocket errors
    this.wsProvider.on('error', (event: Event) => {
      const eventObj = event as any;
      const errorMsg = eventObj.message || eventObj.reason || `WebSocket error (type: ${event.type})`;
      const target = eventObj.target;
      
      console.warn('⚠️ WebSocket error:', errorMsg);
      log.sync.error(`WebSocket error: ${errorMsg}`, new Error(errorMsg), { eventType: event.type, readyState: target?.readyState });
      
      if (unifiedDebugService) {
        unifiedDebugService.error('WebSocket', `Error: ${errorMsg}`, new Error(errorMsg), { url, eventType: event.type, readyState: target?.readyState });
      }
    });

    // Timeout to stop trying after 10 seconds - but allow for reconnections
    setTimeout(() => {
      if (this.wsProvider && this.reconnectAttempts >= this.maxReconnectAttempts) {
        if (this.wsProvider.wsconnected === false) {
          console.warn('⚠️ WebSocket max reconnection attempts reached. Running in offline mode.');
          log.sync.warn('WebSocket max reconnection attempts reached, falling back to offline mode');
          useSyncStore.getState().setStatus('offline');
        } else if (this.wsProvider.wsconnected === true) {
          console.log('✅ WebSocket connected successfully');
          log.sync.info('WebSocket connected successfully');
        }
      }
    }, 10000);
    
    // Sync events
    this.wsProvider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        console.log('✅ Synced with server');
        log.sync.info('WebSocket: Sync complete with server');
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
   * Disconnect from WebSocket and cleanup resources
   */
  disconnect(): void {
    if (this.wsProvider) {
      this.wsProvider.disconnect();
      this.wsProvider.destroy();
      this.wsProvider = null;
    }
    if (this.persistence) {
      this.persistence.destroy();
      this.persistence = null;
    }
    if (this.doc) {
      this.doc.destroy();
      this.doc = null;
    }
    this.conversations = null;
    this.messages = null;
    this.wsUrl = '';
    this.reconnectAttempts = 0;
    console.log('🧹 Sync manager disconnected and cleaned up');
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
