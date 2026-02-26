import { DistributedContentClient } from '@vivim/network-engine';
import { getChainClient } from './chain-client';
import { p2pService } from './p2p-service';
import { logger } from './logger';

const log = logger.child({ module: 'content-client' });

let contentClient: DistributedContentClient | null = null;

/**
 * Initialize and get the DistributedContentClient instance.
 */
export async function getContentClient(): Promise<DistributedContentClient> {
  if (contentClient) return contentClient;

  log.info('Initializing Content Client...');

  const chain = await getChainClient();
  const node = p2pService.getNetworkNode();

  if (!node) {
    throw new Error('P2P Node not available');
  }

  contentClient = new DistributedContentClient(chain, node.dhtService);

  log.info('Content Client initialized successfully');
  return contentClient;
}

/**
 * Convenience export for synchronized access if already initialized
 */
export const getInitializedContentClient = () => {
  if (!contentClient) {
    throw new Error('Content Client not initialized. Call getContentClient() first.');
  }
  return contentClient;
};
