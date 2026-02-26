#!/usr/bin/env bun
import { 
  VivimChainClient,
  DistributedContentClient,
  NetworkNode,
  KeyManager,
  DHTService,
  ChainEvent
} from '@vivim/network-engine';
import { 
  AcuProcessorApp,
  OmniFeedApp,
  CircleEngineApp,
  AiDocumentationApp,
  CryptoEngineApp,
  AssistantEngineApp,
  ToolEngineApp,
  PublicDashboardApp,
  PublishingAgentApp,
  RoadmapEngineApp
} from '../index.js';

// Memory Event Storage locally for node execution
class NodeStorage {
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

async function bootDecentralizedNode() {
  console.log('🔗=======================================🔗');
  console.log('  [VIVIM Omni-Node] Booting Edge Serverless');
  console.log('🔗=======================================🔗\n');

  // 1. Networking Foundation
  const networkNode = new NetworkNode({
    nodeType: 'edge',
    roles: ['storage', 'agent', 'bootstrap'],
    enableDHT: true,
    enableWebRTC: false, // Node runs TCP/WS
    enableGossipsub: true,
    listenAddresses: ['/ip4/0.0.0.0/tcp/9200/ws']
  });

  const keyManager = {
    getKeysByType: () => [{ publicKey: new Uint8Array([9,9,9]), privateKey: new Uint8Array([9,9,9]) }],
    generateKey: () => ({ publicKey: new Uint8Array([9,9,9]), privateKey: new Uint8Array([9,9,9]) })
  } as unknown as KeyManager;

  const storage = new NodeStorage();
  const dhtService = new DHTService({} as any);

  const chainClient = new VivimChainClient({
    keyManager,
    storage,
    dht: dhtService
  });

  const contentClient = new DistributedContentClient(chainClient, dhtService);

  // 2. Initialize VIVIM Applications (Replacing monolithic server modules)
  const acuApp = new AcuProcessorApp({ chainClient, contentClient, networkNode });
  const feedApp = new OmniFeedApp({ chainClient });
  const circleApp = new CircleEngineApp({ chainClient });
  const aiDocApp = new AiDocumentationApp({ chainClient, contentClient, networkNode });
  const cryptoApp = new CryptoEngineApp({ chainClient });
  const assistantApp = new AssistantEngineApp({ chainClient });
  const toolApp = new ToolEngineApp({ chainClient });
  const dashboardApp = new PublicDashboardApp({ chainClient });
  const agentApp = new PublishingAgentApp({ chainClient, contentClient });
  const roadmapApp = new RoadmapEngineApp({ chainClient, contentClient });

  // 3. Ignite Sequence
  await networkNode.start();
  
  // Ignite Applications concurrently
  await Promise.all([
    acuApp.start(),
    feedApp.start(),
    circleApp.start(),
    aiDocApp.start(),
    cryptoApp.start(),
    assistantApp.start(),
    toolApp.start(),
    dashboardApp.start(),
    agentApp.start(),
    roadmapApp.start()
  ]);

  const peerId = networkNode.getNodeInfo().peerId;
  console.log(`\n===========================================`);
  console.log(`✅  Omni-Node fully operational.`);
  console.log(`🌐  P2P Identity: ${peerId}`);
  console.log(`===========================================\n`);

  // Simple test stimulus to prove real-time integration
  setTimeout(() => {
    console.log('[Dev Test] Simulating raw text ingestion request to ACU Processor...\n');
    chainClient.emit('event:received', {
        id: crypto.randomUUID(),
        type: 'content:raw',
        payload: { text: "Explain how CRDTs maintain consistency in distributed topology." },
        authorId: 'test-user-did',
        timestamp: Date.now(),
        scope: 'public',
        tags: []
    } as unknown as ChainEvent);
  }, 5000);
}

bootDecentralizedNode().catch(console.error);
