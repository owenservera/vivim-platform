/**
 * Federation SDK Tests
 * Tests for FederationClient, FederationServer, and InstanceDiscovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VivimSDK } from '../core/sdk.js';
import {
  FederationClient,
  type FederationConfig,
  type FederationMessage,
} from './federation-client-node.js';
import {
  FederationServer,
  type FederationServerConfig,
} from './federation-server-node.js';
import {
  InstanceDiscovery,
  type DiscoveryConfig,
} from './instance-discovery.js';

// Mock SDK
function createMockSDK(): VivimSDK {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    getIdentity: vi.fn().mockResolvedValue({
      did: 'did:key:z6Mktest123',
      publicKey: 'test-public-key',
    }),
    createIdentity: vi.fn().mockResolvedValue({
      did: 'did:key:z6Mktest123',
      publicKey: 'test-public-key',
      privateKey: 'test-private-key',
    }),
    sign: vi.fn().mockImplementation(async (data: Uint8Array) => {
      return btoa(String.fromCharCode(...data));
    }),
    verify: vi.fn().mockResolvedValue(true),
    loadNode: vi.fn(),
    registerNode: vi.fn(),
    unloadNode: vi.fn(),
    getLoadedNodes: vi.fn().mockResolvedValue({}),
    getStorageNode: vi.fn(),
    getContentNode: vi.fn(),
    getSocialNode: vi.fn(),
    getAIChatNode: vi.fn(),
    getMemoryNode: vi.fn(),
    destroy: vi.fn(),
  } as unknown as VivimSDK;
}

describe('FederationClient', () => {
  let sdk: VivimSDK;
  let client: FederationClient;

  const config: FederationConfig = {
    instanceUrl: 'https://instance1.vivim.live',
    did: 'did:key:z6Mktest123',
  };

  beforeEach(() => {
    sdk = createMockSDK();
    client = new FederationClient(sdk, config);
  });

  afterEach(() => {
    client.destroy();
  });

  describe('Initialization', () => {
    it('should create federation client with config', () => {
      expect(client).toBeDefined();
      expect(client.getNodeId()).toBe('federation-client');
    });

    it('should use default config values', () => {
      expect(client.getQueueSize()).toBe(0);
    });
  });

  describe('Message Queue', () => {
    it('should queue messages when delivery fails', async () => {
      // Mock fetch to fail
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await client.sendActivity('https://instance2.vivim.live', 'follow', {
        userDid: 'did:key:z6Mkuser456',
      });

      expect(client.getQueueSize()).toBeGreaterThan(0);
    });

    it('should process message queue', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

      await client.sendActivity('https://instance2.vivim.live', 'follow', {
        userDid: 'did:key:z6Mkuser456',
      });

      expect(client.getQueueSize()).toBe(1);

      await client.processQueue();

      expect(client.getQueueSize()).toBe(0);
    });

    it('should clear message queue', () => {
      client.clearQueue();
      expect(client.getQueueSize()).toBe(0);
    });
  });

  describe('Instance Management', () => {
    it('should discover instance via well-known', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            instanceUrl: 'https://instance2.vivim.live',
            software: 'vivim',
            version: '1.0.0',
          }),
      });

      const instance = await client.discoverInstance('instance2.vivim.live');

      expect(instance.domain).toBe('instance2.vivim.live');
      expect(instance.status).toBe('active');
    });

    it('should cache instance info', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.discoverInstance('instance2.vivim.live');
      const cached = client.getInstanceInfo('instance2.vivim.live');

      expect(cached).toBeDefined();
      expect(cached?.domain).toBe('instance2.vivim.live');
    });

    it('should update instance status', () => {
      client.updateInstanceStatus('instance2.vivim.live', 'active');
      const instance = client.getInstanceInfo('instance2.vivim.live');

      expect(instance?.status).toBe('active');
    });

    it('should get all instances', () => {
      client.updateInstanceStatus('instance1.vivim.live', 'active');
      client.updateInstanceStatus('instance2.vivim.live', 'offline');

      const instances = client.getAllInstances();

      expect(instances.length).toBe(2);
    });
  });

  describe('Message Signing', () => {
    it('should sign message', async () => {
      const message: FederationMessage = {
        id: 'test-123',
        type: 'follow',
        sourcePDS: 'https://instance1.vivim.live',
        sourceDID: 'did:key:z6Mktest123',
        payload: { userDid: 'did:key:z6Mkuser456' },
        timestamp: Date.now(),
      };

      const signature = await client.signMessage(message);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    it('should verify signature', async () => {
      const message: FederationMessage = {
        id: 'test-123',
        type: 'follow',
        sourcePDS: 'https://instance1.vivim.live',
        sourceDID: 'did:key:z6Mktest123',
        payload: { userDid: 'did:key:z6Mkuser456' },
        timestamp: Date.now(),
      };

      const signature = await client.signMessage(message);
      const isValid = await client.verifySignature(message, signature);

      expect(isValid).toBe(true);
    });
  });

  describe('Social Activities', () => {
    it('should send follow activity', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.followUser('https://instance2.vivim.live', 'did:key:z6Mkuser456');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/inbox'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should send unfollow activity', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.unfollowUser('https://instance2.vivim.live', 'did:key:z6Mkuser456');

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should send circle invite', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.inviteToCircle('https://instance2.vivim.live', {
        circleId: 'circle-123',
        userDid: 'did:key:z6Mkuser456',
        inviterDid: 'did:key:z6Mktest123',
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

describe('FederationServer', () => {
  let sdk: VivimSDK;
  let server: FederationServer;

  const config: FederationServerConfig = {
    did: 'did:key:z6Mktest123',
    instanceUrl: 'https://instance1.vivim.live',
  };

  beforeEach(() => {
    sdk = createMockSDK();
    server = new FederationServer(sdk, config);
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('Initialization', () => {
    it('should create federation server with config', () => {
      expect(server).toBeDefined();
      expect(server.getNodeId()).toBe('federation-server');
    });

    it('should start and stop', async () => {
      await server.start();
      expect(server.isRunning()).toBe(true);

      await server.stop();
      expect(server.isRunning()).toBe(false);
    });
  });

  describe('Message Validation', () => {
    it('should validate valid message', async () => {
      const message: FederationMessage = {
        id: 'test-123',
        type: 'follow',
        sourcePDS: 'https://instance2.vivim.live',
        sourceDID: 'did:key:z6Mkuser456',
        payload: {},
        timestamp: Date.now(),
      };

      const isValid = await server.validateMessage(message);

      expect(isValid).toBe(true);
    });

    it('should reject message with missing fields', async () => {
      const message = {
        id: 'test-123',
        // missing type and sourceDID
        timestamp: Date.now(),
      } as FederationMessage;

      const isValid = await server.validateMessage(message);

      expect(isValid).toBe(false);
    });

    it('should reject old messages', async () => {
      const message: FederationMessage = {
        id: 'test-123',
        type: 'follow',
        sourcePDS: 'https://instance2.vivim.live',
        sourceDID: 'did:key:z6Mkuser456',
        payload: {},
        timestamp: Date.now() - 48 * 60 * 60 * 1000, // 48 hours ago
      };

      const isValid = await server.validateMessage(message);

      expect(isValid).toBe(false);
    });
  });

  describe('Instance Permissions', () => {
    it('should allow instance', () => {
      server.allowInstance('instance2.vivim.live');
      expect(server.isInstanceAllowed('instance2.vivim.live')).toBe(true);
    });

    it('should block instance', () => {
      server.blockInstance('instance2.vivim.live');
      expect(server.isInstanceBlocked('instance2.vivim.live')).toBe(true);
    });

    it('should check instance permissions', () => {
      server.allowInstance('instance2.vivim.live');
      server.blockInstance('instance3.vivim.live');

      expect(server.isInstanceAllowed('instance2.vivim.live')).toBe(true);
      expect(server.isInstanceAllowed('instance3.vivim.live')).toBe(false);
    });
  });

  describe('Message Processing', () => {
    it('should process follow message', async () => {
      const message: FederationMessage = {
        id: 'test-123',
        type: 'follow',
        sourcePDS: 'https://instance2.vivim.live',
        sourceDID: 'did:key:z6Mkuser456',
        payload: { userDid: 'did:key:z6Mkuser456' },
        timestamp: Date.now(),
      };

      await expect(server.processMessage(message)).resolves.not.toThrow();
    });

    it('should reject blocked instance', async () => {
      server.blockInstance('instance2.vivim.live');

      const message: FederationMessage = {
        id: 'test-123',
        type: 'follow',
        sourcePDS: 'https://instance2.vivim.live',
        sourceDID: 'did:key:z6Mkuser456',
        payload: {},
        timestamp: Date.now(),
      };

      await expect(server.processMessage(message)).rejects.toThrow('Instance is blocked');
    });
  });

  describe('Well-Known Endpoint', () => {
    it('should return well-known info', () => {
      const wellKnown = server.getWellKnown();

      expect(wellKnown.domain).toBe('instance1.vivim.live');
      expect(wellKnown.did).toBe('did:key:z6Mktest123');
      expect(wellKnown.software).toBeDefined();
    });
  });

  describe('Actor Profile', () => {
    it('should return actor profile', () => {
      const profile = server.getActorProfile('testuser');

      expect(profile.id).toContain('/actor/testuser');
      expect(profile.type).toBe('Person');
      expect(profile.inbox).toContain('/inbox');
    });
  });
});

describe('InstanceDiscovery', () => {
  let discovery: InstanceDiscovery;

  const config: DiscoveryConfig = {
    cacheTtl: 60000, // 1 minute for tests
    autoRefresh: false,
  };

  beforeEach(() => {
    discovery = new InstanceDiscovery(config);
  });

  afterEach(() => {
    discovery.destroy();
  });

  describe('Initialization', () => () => {
    it('should create instance discovery', () => {
      expect(discovery).toBeDefined();
    });

    it('should use default config', () => {
      const defaultDiscovery = new InstanceDiscovery();
      expect(defaultDiscovery).toBeDefined();
    });
  });

  describe('Instance Discovery', () => {
    it('should discover instance via well-known', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            instanceUrl: 'https://instance.vivim.live',
            software: 'vivim',
            version: '1.0.0',
          }),
      });

      const instance = await discovery.discoverInstance('instance.vivim.live');

      expect(instance.domain).toBe('instance.vivim.live');
      expect(instance.discoveredVia).toBe('well-known');
    });

    it('should cache discovered instances', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await discovery.discoverInstance('instance.vivim.live');
      const cached = discovery.getInstance('instance.vivim.live');

      expect(cached).toBeDefined();
    });

    it('should get all instances', () => {
      discovery.updateInstanceStatus('instance1.vivim.live', 'active');
      discovery.updateInstanceStatus('instance2.vivim.live', 'offline');

      const instances = discovery.getAllInstances();

      expect(instances.length).toBe(2);
    });

    it('should get active instances only', () => {
      discovery.updateInstanceStatus('instance1.vivim.live', 'active');
      discovery.updateInstanceStatus('instance2.vivim.live', 'offline');

      const active = discovery.getActiveInstances();

      expect(active.length).toBe(1);
      expect(active[0].domain).toBe('instance1.vivim.live');
    });
  });

  describe('Instance Status', () => {
    it('should update instance status', () => {
      discovery.updateInstanceStatus('instance.vivim.live', 'active');
      const instance = discovery.getInstance('instance.vivim.live');

      expect(instance?.status).toBe('active');

      discovery.updateInstanceStatus('instance.vivim.live', 'offline');
      expect(discovery.getInstance('instance.vivim.live')?.status).toBe('offline');
    });

    it('should remove instance', () => {
      discovery.updateInstanceStatus('instance.vivim.live', 'active');
      discovery.removeInstance('instance.vivim.live');

      expect(discovery.getInstance('instance.vivim.live')).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should clear expired instances', async () => {
      // Set very short TTL
      const shortTtlDiscovery = new InstanceDiscovery({ cacheTtl: 10 });
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await shortTtlDiscovery.discoverInstance('instance.vivim.live');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));
      
      shortTtlDiscovery.clearExpiredInstances();
      expect(shortTtlDiscovery.getInstance('instance.vivim.live')).toBeNull();
      
      shortTtlDiscovery.destroy();
    });

    it('should get discovery stats', () => {
      discovery.updateInstanceStatus('instance1.vivim.live', 'active');
      discovery.updateInstanceStatus('instance2.vivim.live', 'offline');
      discovery.updateInstanceStatus('instance3.vivim.live', 'unknown');

      const stats = discovery.getStats();

      expect(stats.totalInstances).toBe(3);
      expect(stats.activeInstances).toBe(1);
      expect(stats.offlineInstances).toBe(1);
      expect(stats.unknownInstances).toBe(1);
    });
  });

  describe('Directory Discovery', () => {
    it('should discover from directory', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            instances: [
              {
                domain: 'instance1.vivim.live',
                instanceUrl: 'https://instance1.vivim.live',
                status: 'active',
              },
              {
                domain: 'instance2.vivim.live',
                instanceUrl: 'https://instance2.vivim.live',
                status: 'active',
              },
            ],
          }),
      });

      const instances = await discovery.discoverFromDirectory();

      expect(instances.length).toBe(2);
      expect(instances[0].domain).toBe('instance1.vivim.live');
    });
  });
});
