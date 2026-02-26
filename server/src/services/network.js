import { NetworkNode } from '@vivim/network-engine';
import { logger } from '../lib/logger.js';
import { getPrismaClient } from '../lib/database.js';

let networkNode = null;

export const networkService = {
  async initialize() {
    try {
      logger.info('Initializing P2P Network Node in "indexer" role');

      networkNode = new NetworkNode({
        nodeType: 'indexer',
        roles: ['indexer', 'storage'],
        listenAddresses: ['/ip4/0.0.0.0/tcp/9000/ws'],
        enableWebRTC: false, // Server uses WebSockets primarily
        enableDHT: true,
        enableGossipsub: true,
        minConnections: 5,
        maxConnections: 50,
        bootstrapPeers: []
      });

      await networkNode.start();
      
      const nodeInfo = networkNode.getNodeInfo();
      logger.info({ peerId: nodeInfo.peerId }, 'Network Node started successfully');

      // TODO: Hook up GossipSync here to index things into Postgres
      
    } catch (err) {
      logger.error({ error: err.message }, 'Failed to initialize Network Node');
    }
  },

  getNode() {
    return networkNode;
  }
};
