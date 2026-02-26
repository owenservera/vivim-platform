/**
 * P2P Service for VIVIM PWA
 * 
 * Integrates @vivim/network-engine's NetworkNode into the React application.
 */

import * as Y from 'yjs';
import { NetworkNode, type NetworkNodeConfig, Libp2pYjsProvider } from '@vivim/network-engine';
import { useSyncStore } from './sync/sync-engine';
import { useIdentityStore } from './stores';
import { logger } from './logger';

const log = logger.child({ module: 'p2p-service' });

class P2PService {
  private node: NetworkNode | null = null;
  private providers: Map<string, Libp2pYjsProvider> = new Map();
  private static instance: P2PService;

  static getInstance(): P2PService {
    if (!P2PService.instance) {
      P2PService.instance = new P2PService();
    }
    return P2PService.instance;
  }

  /**
   * Initialize and start the P2P node
   */
  async initialize(): Promise<void> {
    if (this.node) return;

    try {
      log.info('Initializing P2P Service...');

      // Basic configuration for a client node
      const config: Partial<NetworkNodeConfig> = {
        nodeType: 'client',
        enableWebRTC: true,
        enableDHT: true,
        enableGossipsub: true,
        enableMDNS: false, // MDNS doesn't work in browser
        listenAddresses: [], // Browsers can't listen for incoming connections directly
        bootstrapPeers: [
          // Local development bootstrap node (if running)
          '/ip4/127.0.0.1/tcp/1235/ws/p2p/12D3KooWGatBqP8vQidpGfV8eC5m5XwZ8U8XQkYQkYQkYQkYQkYQ'
        ]
      };

      this.node = new NetworkNode(config);

      // Set up event listeners
      this.node.on('started', (info) => {
        log.info({ peerId: info.peerId }, 'P2P Node started');
        useSyncStore.getState().setConnected(true);
      });

      this.node.on('stopped', () => {
        log.info('P2P Node stopped');
        useSyncStore.getState().setConnected(false);
      });

      this.node.on('peer:connect', ({ peerId }) => {
        log.info({ peerId }, 'Connected to peer');
      });

      this.node.on('peer:disconnect', ({ peerId }) => {
        log.info({ peerId }, 'Disconnected from peer');
      });

      await this.node.start();
      log.info('P2P Service initialized successfully');
    } catch (error) {
      log.error({ error }, 'Failed to initialize P2P Service');
      // Don't throw here, allow the app to continue in offline/centralized mode
    }
  }

  /**
   * Create a synced Yjs document for a specific room
   */
  createSyncedDoc(roomName: string): Y.Doc {
    if (!this.node) {
      log.warn('P2P Node not initialized, returning standalone Y.Doc');
      return new Y.Doc();
    }

    const doc = new Y.Doc();
    
    // Create Libp2p provider for this doc
    const provider = new Libp2pYjsProvider({
      roomName,
      doc,
      node: this.node
    });

    this.providers.set(roomName, provider);
    
    return doc;
  }

  /**
   * Stop the P2P node
   */
  async shutdown(): Promise<void> {
    // Destroy all providers
    for (const provider of this.providers.values()) {
      provider.destroy();
    }
    this.providers.clear();

    if (!this.node) return;

    try {
      await this.node.stop();
      this.node = null;
    } catch (error) {
      log.error({ error }, 'Failed to shutdown P2P Service');
    }
  }

  /**
   * Get the underlying NetworkNode instance
   */
  getNetworkNode(): NetworkNode | null {
    return this.node;
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.node?.running ?? false;
  }

  /**
   * Get connected peers
   */
  getConnectedPeers(): string[] {
    return this.node?.getConnectedPeers() ?? [];
  }
}

export const p2pService = P2PService.getInstance();
export default p2pService;
