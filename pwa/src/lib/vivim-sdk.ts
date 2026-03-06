import { p2pService } from './p2p-service';
import { logger } from './logger';

const log = {
  info: (msg: string) => logger.info('sdk-provider', msg),
  warn: (msg: string) => logger.warn('sdk-provider', msg),
  error: (msg: string) => logger.error('sdk-provider', msg, new Error(msg)),
};

// We define a mock interface matching what the UI needs from VivimSDK to compile.
// It bypasses the Node.js backend dependencies to allow the Vite browser bundle to pass.
class MockVivimSDK {
  public assistant: any;

  constructor(options: any) {
    // The frontend transport or HTTP agent will proxy requests instead of running natively
    this.assistant = {
      // Stub required properties used by VivimSDKTransport for the Assistant Chat UI
      // Later this will use HTTP to talk to the actual local backend server
      id: options?.identity?.did || 'mock-did',
      isMock: true,
      sendMessage: async () => {
        log.warn('MockVivimSDK: sendMessage called but no backend proxy is connected yet.');
        return;
      }
    };
  }

  async initialize() {
    log.info('Mock VIVIM SDK initialized (browser proxy mode)');
  }
}

let sdkInstance: MockVivimSDK | null = null;

/**
 * Initialize and get the mock VivimSDK singleton instance.
 */
export async function getSDK(): Promise<any> {
  if (sdkInstance) return sdkInstance;

  log.info('Initializing VIVIM SDK Proxy Layer...');

  // Ensure P2P service is initialized for identity pulling
  await p2pService.initialize();
  const node = p2pService.getNetworkNode();

  if (!node) {
    throw new Error('P2P Service not initialized');
  }

  const identityKeys = node.keyManager.getKeysByType('identity')[0];
  
  sdkInstance = new MockVivimSDK({
    identity: {
      did: node.getNodeInfo().peerId,
      autoCreate: !identityKeys
    },
    storage: {
      encryption: true
    }
  });

  await sdkInstance.initialize();

  return sdkInstance;
}

/**
 * Get the initialized mock SDK instance or throw.
 */
export function getInitializedSDK(): any {
  if (!sdkInstance) {
    throw new Error('SDK proxy not initialized. Call getSDK() first.');
  }
  return sdkInstance;
}
