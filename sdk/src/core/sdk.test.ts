import { describe, it, expect } from 'vitest';
import { VivimSDK } from './sdk.js';

describe('VivimSDK', () => {
  it('should initialize with default config', () => {
    const sdk = new VivimSDK({
      identity: {
        did: 'test-node'
      },
      storage: {
        encryption: true
      }
    });
    
    expect(sdk).toBeDefined();
    // Use type assertion to access private config for testing if needed, 
    // but better to test public behavior.
    expect((sdk as any).config.identity.did).toBe('test-node');
    expect((sdk as any).config.storage.encryption).toBe(true);
  });

  it('should have correct initial state', () => {
    const sdk = new VivimSDK({
      identity: {
        did: 'test-node'
      }
    });
    
    // Check if event emitter is working
    let eventFired = false;
    sdk.on('network:connected', () => {
      eventFired = true;
    });
    
    sdk.emit('network:connected', 'peer-1' as any);
    expect(eventFired).toBe(true);
  });

  it('should provide access to core modules', () => {
    const sdk = new VivimSDK({
      networkNodeId: 'test-node'
    } as any);
    
    expect(sdk.getRecordKeeper()).toBeDefined();
    expect(sdk.getAnchorProtocol()).toBeDefined();
    expect(sdk.getSelfDesign()).toBeDefined();
    expect(sdk.getSelfDesignGraph()).toBeDefined();
  });

  it('should initialize core modules correctly', async () => {
    const sdk = new VivimSDK({
      identity: {
        autoCreate: true
      }
    });
    
    await sdk.initialize();
    
    expect(sdk.getIdentity()).not.toBeNull();
    expect(sdk.getAnchorProtocol().getCurrentAnchor()).not.toBeNull();
  });
});
