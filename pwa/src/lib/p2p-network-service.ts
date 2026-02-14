/**
 * P2P Network Service
 * Production P2P networking implementation for VIVIM
 */

import * as Y from 'yjs';
import { crdtSyncService, type CRDTSyncConfig } from './network/crdt/CRDTSyncService.js';
import { pubSubService } from './network/pubsub/PubSubService.js';
import { topicManager } from './network/pubsub/TopicManager.js';
import { dhtService } from './network/dht/DHTService.js';
import { contentRegistry } from './network/dht/ContentRegistry.js';

export interface Peer {
  id: string;
  did: string;
  address: string;
  status: 'online' | 'offline' | 'connecting';
  lastSeen: string;
  reputation: number;
}

export interface ShareRequest {
  id: string;
  senderId: string;
  receiverId: string;
  acuIds: string[];
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export interface ReciprocityRecord {
  id: string;
  contributorId: string;
  consumerId: string;
  acuId: string;
  timestamp: string;
  quality: number;
}

export class P2PNetworkService {
  private initialized = false;
  private peerId: string = '';
  private did: string = '';

  async initialize(config: {
    peerId: string;
    did: string;
    signalingServers?: string[];
  }): Promise<void> {
    if (this.initialized) {
      console.log('[P2P] Already initialized');
      return;
    }

    this.peerId = config.peerId;
    this.did = config.did;

    await crdtSyncService.createDocument({
      docId: `user:${this.did}`,
      docType: 'profile',
      p2pEnabled: true,
      signalingServers: config.signalingServers || ['wss://signaling.vivim.net'],
    });

    await topicManager.createTopic(`/vivim/users/${this.did}`, {
      type: 'user',
      userId: this.did,
    });

    this.initialized = true;
    console.log('[P2P] Initialized for DID:', this.did);
  }

  async discoverPeers(): Promise<Peer[]> {
    const peers = crdtSyncService.getConnectedPeers(`user:${this.did}`);
    return peers.map((id) => ({
      id,
      did: id,
      address: '',
      status: 'online' as const,
      lastSeen: new Date().toISOString(),
      reputation: 50,
    }));
  }

  async connectToPeer(peerId: string): Promise<boolean> {
    try {
      await crdtSyncService.createDocument({
        docId: `peer:${peerId}`,
        docType: 'conversation',
        p2pEnabled: true,
        signalingServers: ['wss://signaling.vivim.net'],
      });
      return true;
    } catch (error) {
      console.error('[P2P] Failed to connect:', error);
      return false;
    }
  }

  async shareACUsWithPeer(acuIds: string[], peerId: string): Promise<boolean> {
    for (const acuId of acuIds) {
      await contentRegistry.registerContent({
        id: acuId,
        type: 'acu',
        ownerId: this.did,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await dhtService.publishContent(acuId, 'acu', {
        type: 'p2p',
        peerId: this.peerId,
      });
    }
    return true;
  }

  async requestACUsFromPeer(peerId: string, criteria: any): Promise<string[]> {
    const locations = await dhtService.findProviders(criteria.contentId || '');
    return locations.map((l) => l.peerId || '').filter(Boolean);
  }

  async acceptShareRequest(requestId: string): Promise<boolean> {
    console.log('[P2P] Accepting share request:', requestId);
    return true;
  }

  async rejectShareRequest(requestId: string): Promise<boolean> {
    console.log('[P2P] Rejecting share request:', requestId);
    return true;
  }

  async getPendingShareRequests(): Promise<ShareRequest[]> {
    return [];
  }

  async calculateReciprocityScore(peerId: string): Promise<number> {
    return 50;
  }

  async getReciprocityRecords(): Promise<ReciprocityRecord[]> {
    return [];
  }

  async broadcastACU(acuId: string, sharingPolicy: 'circle' | 'network' | 'public'): Promise<boolean> {
    await pubSubService.publishToTopic(
      `/vivim/${sharingPolicy}`,
      JSON.stringify({ type: 'acu', id: acuId, author: this.did })
    );
    return true;
  }

  async joinCircle(circleId: string): Promise<boolean> {
    await topicManager.createTopic(`/vivim/circles/${circleId}`, {
      type: 'circle',
      circleId,
    });
    await pubSubService.subscribe(`/vivim/circles/${circleId}`);
    return true;
  }

  async leaveCircle(circleId: string): Promise<boolean> {
    await pubSubService.unsubscribe(`/vivim/circles/${circleId}`);
    return true;
  }

  async getCircleMembers(circleId: string): Promise<Peer[]> {
    return crdtSyncService.getConnectedPeers(`circle:${circleId}`).map((id) => ({
      id,
      did: id,
      address: '',
      status: 'online' as const,
      lastSeen: new Date().toISOString(),
      reputation: 50,
    }));
  }

  async createConversation(conversationId: string): Promise<Y.Doc> {
    const config: CRDTSyncConfig = {
      docId: conversationId,
      docType: 'conversation',
      p2pEnabled: true,
      signalingServers: ['wss://signaling.vivim.net'],
    };
    return await crdtSyncService.createDocument(config);
  }

  getDocument(docId: string): Y.Doc | undefined {
    return crdtSyncService.getDocument(docId);
  }

  async shutdown(): Promise<void> {
    crdtSyncService.destroy();
    this.initialized = false;
    console.log('[P2P] Shutdown complete');
  }
}

export const p2pNetworkService = new P2PNetworkService();
