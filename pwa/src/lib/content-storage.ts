import { DistributedContentClient, ContentType } from '@vivim/network-engine';
import { getChainClient } from './chain-client';
import { p2pService } from './p2p-service';
import { logger } from './logger';

const log = logger.child({ module: 'content-storage' });

let contentClient: DistributedContentClient | null = null;

export async function getContentClient(): Promise<DistributedContentClient> {
  if (contentClient) return contentClient;

  log.info('Initializing Distributed Content Client...');
  const chainClient = await getChainClient();
  
  // Wait for P2P service to be ready
  await p2pService.initialize();
  const node = p2pService.getNetworkNode();
  
  if (!node || !node.dhtService) {
    throw new Error('Failed to get NetworkNode DHT Service from P2PService');
  }

  contentClient = new DistributedContentClient(chainClient, node.dhtService);
  
  log.info('Distributed Content Client initialized successfully');
  return contentClient;
}

export { ContentType };
