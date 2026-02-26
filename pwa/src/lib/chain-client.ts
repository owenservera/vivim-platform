import { VivimChainClient } from '@vivim/network-engine';
import { p2pService } from './p2p-service';
import { ChainEventStorage } from './db/chain-db';
import { useAppStore } from './stores/appStore';
import { logger } from './logger';

const log = logger.child({ module: 'chain-client' });

let chainClient: VivimChainClient | null = null;

/**
 * Initialize and get the VivimChainClient instance.
 */
export async function getChainClient(): Promise<VivimChainClient> {
  if (chainClient) return chainClient;

  log.info('Initializing Chain Client...');

  // Ensure P2P service is initialized
  await p2pService.initialize();
  const node = p2pService.getNetworkNode();

  if (!node) {
    throw new Error('Failed to get NetworkNode from P2PService');
  }

  const storage = new ChainEventStorage();

  chainClient = new VivimChainClient({
    keyManager: node.keyManager,
    storage,
    pubsub: node.pubSubService,
    dht: node.dhtService,
    nodeId: node.getNodeInfo().peerId
  });

  // Initialize identity
  const did = await chainClient.initializeIdentity();
  const identityKey = node.keyManager.getKeysByType('identity')[0];

  // Update app store with identity
  useAppStore.getState().actions.setIdentity({
    did,
    publicKey: identityKey ? Buffer.from(identityKey.publicKey).toString('base64') : null,
    createdAt: Date.now(),
    verified: true // Self-verified for now
  });

  // Sync network status
  useAppStore.getState().actions.setNetworkStatus(p2pService.isConnected() ? 'connected' : 'offline');
  useAppStore.getState().actions.updatePeerCount(p2pService.getConnectedPeers().length);

  // Subscribe to chain events
  chainClient.on('event:received', (event) => {
    log.debug({ cid: event.id, type: event.type }, 'Chain event received');
    // You could trigger notifications or store updates here
  });

  log.info({ did }, 'Chain Client initialized successfully');
  return chainClient;
}

/**
 * Convenience export for synchronized access if already initialized
 */
export const getInitializedChainClient = () => {
  if (!chainClient) {
    throw new Error('Chain Client not initialized. Call getChainClient() first.');
  }
  return chainClient;
};
