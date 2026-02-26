import fs from 'fs';
import path from 'path';
import { KeyManager } from '../network/src/security/KeyManager.js';
import { VivimChainClient } from '../network/src/chain/ChainClient.js';
import { DistributedContentClient, ContentType } from '../network/src/storage/DistributedContentClient.js';
import { DHTService } from '../network/src/dht/DHTService.js';
import { EventEmitter } from 'events';
import { ChainEvent } from '../network/src/chain/types.js';

// 1. Mock Storage
class MemoryEventStorage {
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

// 2. Mock DHT
class MockDHTService extends EventEmitter {
  async provideContent() {}
}

async function run() {
  console.log('🔗 Initializing VIVIM Genesis Upload...');

  // Initialize Network Mocks
  const keyManager = {
    getKeysByType: () => [{ publicKey: new Uint8Array([1,2,3]), privateKey: new Uint8Array([1,2,3]) }],
    generateKey: () => ({ publicKey: new Uint8Array([1,2,3]), privateKey: new Uint8Array([1,2,3]) })
  } as unknown as KeyManager;

  const storage = new MemoryEventStorage();
  const dht = new MockDHTService() as unknown as DHTService;
  
  const chainClient = new VivimChainClient({
    keyManager,
    storage,
    dht
  });

  const did = await chainClient.initializeIdentity();
  console.log(`✅ Identity Initialized: ${did}`);

  const contentClient = new DistributedContentClient(chainClient, dht);

  // Files from the editor context
  const filesToUpload = [
    'pwa/.env.example',
    'pwa/src/lib/content-storage.ts',
    'GITHUB repo update request.txt',
    'package.json',
    'pwa/src/lib/data-sync-service.ts'
  ];

  const rootDir = process.cwd();

  for (const relativePath of filesToUpload) {
    const fullPath = path.join(rootDir, relativePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ File not found: ${fullPath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    console.log(`\n📤 Uploading ${relativePath} (${content.length} bytes)...`);

    try {
      const result = await contentClient.createContent({
        type: ContentType.ARTICLE,
        text: content,
        visibility: 'public',
        tags: ['system-docs', 'genesis']
      });

      console.log(`✅ Success! Data anchored on-chain.`);
      console.log(`   CID: ${result.cid}`);
      console.log(`   Entity ID: ${result.id}`);
    } catch (err: any) {
      console.error(`❌ Failed to upload ${relativePath}:`, err.message);
    }
  }

  console.log('\n🎉 Genesis Upload Complete!');
}

run().catch(console.error);
