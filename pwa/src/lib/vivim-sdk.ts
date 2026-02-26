import { VivimSDK } from '@vivim/sdk';
import { p2pService } from './p2p-service';
import { logger } from './logger';

const log = logger.child({ module: 'sdk-provider' });

let sdkInstance: VivimSDK | null = null;

/**
 * Initialize and get the VivimSDK singleton instance.
 */
export async function getSDK(): Promise<VivimSDK> {
  if (sdkInstance) return sdkInstance;

  log.info('Initializing VIVIM SDK...');

  // Ensure P2P service is initialized
  await p2pService.initialize();
  const node = p2pService.getNetworkNode();

  if (!node) {
    throw new Error('P2P Service not initialized');
  }

  // Initialize the SDK with existing network identity if possible
  const identityKeys = node.keyManager.getKeysByType('identity')[0];
  
  sdkInstance = new VivimSDK({
    identity: {
      did: node.getNodeInfo().peerId, // Simplified DID for now
      autoCreate: !identityKeys
    },
    storage: {
      encryption: true
    }
  });

  await sdkInstance.initialize();

  log.info('VIVIM SDK initialized successfully');
  return sdkInstance;
}

/**
 * Get the initialized SDK instance or throw.
 */
export function getInitializedSDK(): VivimSDK {
  if (!sdkInstance) {
    throw new Error('SDK not initialized. Call getSDK() first.');
  }
  return sdkInstance;
}
