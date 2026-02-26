import { AiDocumentationApp } from '../sdk/src/apps/ai-documentation/index.js';
import { VivimChainClient } from '../network/src/chain/ChainClient.js';
import { DistributedContentClient } from '../network/src/storage/DistributedContentClient.js';
import { NetworkNode } from '../network/src/p2p/NetworkNode.js';
import { KeyManager } from '../network/src/security/KeyManager.js';
import { EventStore } from '../network/src/chain/EventStore.js';
import { DHTService } from '../network/src/dht/DHTService.js';
import { ChainEvent } from '../network/src/chain/types.js';

// Mock Memory Event Storage specifically for dev execution
class MemoryStorage {
  events = new Map<string, ChainEvent>();
  
  async saveEvent(event: ChainEvent): Promise<void> {
    this.events.set(event.id, event);
  }
  async getEvent(cid: string): Promise<ChainEvent | null> {
    return this.events.get(cid) || null;
  }
  async queryEvents(): Promise<ChainEvent[]> {
    return Array.from(this.events.values());
  }
  async getLatestEvent(): Promise<ChainEvent | null> {
    return null;
  }
}

async function startNode() {
  console.log('🤖 Setting up the autonomous AI Documentation Node...');

  // 1. Initialize P2P layer
  const networkNode = new NetworkNode({
    nodeType: 'agent',
    roles: ['storage', 'agent'],
    enableDHT: true,
    enableWebRTC: false,
    enableGossipsub: true,
    listenAddresses: ['/ip4/0.0.0.0/tcp/9100/ws'] // Dedicated WS port
  });

  // 2. Initialize Identity & Graph Storage Layer
  const keyManager = {
    getKeysByType: () => [{ publicKey: new Uint8Array([7,8,9]), privateKey: new Uint8Array([7,8,9]) }],
    generateKey: () => ({ publicKey: new Uint8Array([7,8,9]), privateKey: new Uint8Array([7,8,9]) })
  } as unknown as KeyManager;

  const storage = new MemoryStorage();
  const dhtService = new DHTService(networkNode);

  const chainClient = new VivimChainClient({
    keyManager,
    storage,
    dht: dhtService
  });

  const contentClient = new DistributedContentClient(chainClient, dhtService);

  // 3. Instantiate the App Provider Interface
  const aiDocProvider = new AiDocumentationApp({
    networkNode,
    chainClient,
    contentClient,
    model: 'gpt-4o-native'
  });

  // 4. Start operations
  await networkNode.start();
  await aiDocProvider.start();
  
  const peerId = networkNode.getNodeInfo().peerId;
  console.log(`\n🌐 Node Online! PeerID: ${peerId}`);
  console.log(`🤖 Application ready on VIVIM Network... sleeping into listener mode.\n`);

  // Force-Test the generation loop execution context
  setInterval(async () => {
    console.log('[Heartbeat Test] Sending local chain event triggering generation of module SDK doc...');
    // We send a mock request event across chain to test self-execution
    try {
      const mockEventId = crypto.randomUUID();
      const testEvent = {
        id: mockEventId,
        type: 'message:create',
        parentIds: [],
        timestamp: Date.now(),
        scope: 'public',
        tags: ['ai-documentation-request'],
        payload: {
          query: "Please explain the concept of GossipSub in the Vivim Architecture.",
          requestedModule: "@vivim/network-engine/pubsub"
        }
      } as any;
      
      chainClient.emit('event:received', testEvent);
    } catch (e) {}

  }, 10000); // Trigger test every 10 secs
}

startNode().catch(console.error);
