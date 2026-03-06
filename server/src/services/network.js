import { NetworkNode } from '@vivim/network-engine';
import { logger } from '../lib/logger.js';
import { getPrismaClient } from '../lib/database.js';

let networkNode = null;

export const networkService = {
  async initialize() {
    try {
      logger.info('Initializing P2P Network Node in "indexer" role');

      const listenAddresses = process.env.P2P_LISTEN_ADDRESSES 
        ? process.env.P2P_LISTEN_ADDRESSES.split(',') 
        : ['/ip4/0.0.0.0/tcp/9000/ws'];

      const bootstrapPeers = process.env.P2P_BOOTSTRAP_PEERS
        ? process.env.P2P_BOOTSTRAP_PEERS.split(',').filter(Boolean)
        : [];

      // TEMPORARY: Disable Network Node initialization to prevent frontend rendering issues
      // The NetworkNode constructor requires KeyManager, DHTService, PubSubService instances
      // which are not being passed, causing "Received undefined" errors
      logger.info('Network Node disabled - frontend can render without P2P features');
      networkNode = null;

      // Original Network Node initialization (commented out due to initialization errors):
      // networkNode = new NetworkNode({
      //   nodeType: 'indexer',
      //   roles: ['indexer', 'storage'],
      //   listenAddresses,
      //   enableWebRTC: false,
      //   enableDHT: true,
      //   enableGossipsub: true,
      //   minConnections: 5,
      //   maxConnections: 50,
      //   bootstrapPeers
      // });

      // await networkNode.start();

      // const nodeInfo = networkNode.getNodeInfo();
      // logger.info({ peerId: nodeInfo.peerId }, 'Network Node started successfully');

      // TODO: Hook up GossipSync here to index things into Postgres
      
    } catch (err) {
      logger.error({ error: err.message }, 'Failed to initialize Network Node');
    }
  },

  getNode() {
    return networkNode;
  }
};
