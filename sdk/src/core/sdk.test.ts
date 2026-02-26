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
    sdk.on('peer:connected', () => {
      eventFired = true;
    });
    
    sdk.emit('peer:connected', 'peer-1');
    expect(eventFired).toBe(true);
  });
});
