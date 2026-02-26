import { describe, it, expect, beforeEach } from 'vitest';
import { VivimChainClient } from '../src/chain/ChainClient.js';
import { 
  EventType, 
  EventScope, 
  EntityType
} from '../src/chain/types.js';
import {
  calculateCID,
  publicKeyToDID,
  verifySignature
} from '../src/chain/utils.js';
import { KeyManager } from '../src/security/KeyManager.js';

// Mock storage
class MockStorage {
  private events: Map<string, any> = new Map();
  async saveEvent(event: any) { this.events.set(event.id, event); }
  async getEvent(cid: string) { return this.events.get(cid) || null; }
  async queryEvents(filter: any) { return Array.from(this.events.values()); }
  async getLatestEvent(entityId: string) { return null; }
}

describe('Vivim Blockchain Chain', () => {
  let keyManager: KeyManager;
  let chainClient: VivimChainClient;
  let storage: MockStorage;

  beforeEach(async () => {
    keyManager = new KeyManager();
    storage = new MockStorage();
    chainClient = new VivimChainClient({
      keyManager,
      storage: storage as any
    });
    await chainClient.initializeIdentity();
  });

  it('should generate a valid DID', async () => {
    const did = chainClient.getDID();
    expect(did).toBeDefined();
    expect(did?.startsWith('did:key:z')).toBe(true);
  });

  it('should create and sign an event', async () => {
    const payload = { hello: 'world' };
    const event = await chainClient.createEvent({
      type: EventType.CONVERSATION_CREATE,
      payload,
      scope: EventScope.PUBLIC
    });

    expect(event.id).toBeDefined();
    expect(event.signature).toBeDefined();
    expect(event.author).toBe(chainClient.getDID());
    expect(event.payload).toEqual(payload);

    // Verify signature
    const contentToVerify = { ...event };
    delete (contentToVerify as any).id;
    delete (contentToVerify as any).signature;
    
    const isValid = await verifySignature(contentToVerify, event.signature, event.author);
    expect(isValid).toBe(true);
  });

  it('should submit an event and store it', async () => {
    const event = await chainClient.createEvent({
      type: EventType.CONVERSATION_CREATE,
      payload: { title: 'Test Chat' },
      scope: EventScope.PUBLIC
    });

    const result = await chainClient.submitEvent(event);
    expect(result.accepted).toBe(true);

    const storedEvent = await chainClient.getEventStore().getEvent(event.id);
    expect(storedEvent).toEqual(event);
  });

  it('should derive state using StateMachine', async () => {
    const entityId = 'test-entity';
    const event1 = await chainClient.createEvent({
      type: EventType.CONVERSATION_CREATE,
      payload: { title: 'Initial Title' },
      entityId,
      scope: EventScope.PUBLIC
    });

    const event2 = await chainClient.createEvent({
      type: EventType.CONVERSATION_UPDATE,
      payload: { title: 'Updated Title' },
      entityId,
      scope: EventScope.PUBLIC
    });

    // Mock versioning for now
    (event2 as any).version = 2;

    const { StateMachine } = await import('../src/chain/StateMachine.js');
    const stateMachine = new StateMachine();
    
    const entityState = stateMachine.deriveState(entityId, EntityType.CONVERSATION, [event1, event2]);
    
    expect(entityState.state.title).toBe('Updated Title');
    expect(entityState.version).toBe(2);
    expect(entityState.eventLog).toHaveLength(2);
  });

  it('should announce and resolve events via ChainDHT', async () => {
    const { DHTService } = await import('../src/dht/DHTService.js');
    const { ChainDHT } = await import('../src/chain/ChainDHT.js');
    
    const dhtService = new DHTService({ enabled: true });
    const chainDht = new ChainDHT(dhtService);
    
    const event = await chainClient.createEvent({
      type: EventType.ACU_CREATE,
      payload: { content: 'Test ACU', contentHash: 'abc' },
      scope: EventScope.PUBLIC
    });
    
    await chainDht.announceEvent(event);
    
    const resolved = await chainDht.resolveEvent(event.id);
    expect(resolved).toEqual(event);
    
    const authorContent = await (chainDht as any).getValue(`/vivim/a/${event.author}/c`);
    expect(authorContent).toContain(event.id);
  });

  it('should broadcast events via GossipSync', async () => {
    const { PubSubService } = await import('../src/pubsub/PubSubService.js');
    const { GossipSync } = await import('../src/chain/GossipSync.js');
    
    const pubsub = new PubSubService();
    const gossipSync = new GossipSync(pubsub, chainClient.getDID()!);
    
    const event = await chainClient.createEvent({
      type: EventType.MESSAGE_CREATE,
      payload: { content: 'Hello' },
      scope: EventScope.PUBLIC
    });
    
    let receivedEvent: any = null;
    gossipSync.on('event:received', (e) => {
      receivedEvent = e;
    });
    
    await gossipSync.broadcastEvent(event);
    
    // Simulate receiving message on pubsub
    const topic = `/vivim/events/v1/global`;
    const otherDID = "did:key:z6Mkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk";
    const message = {
      type: 'event',
      data: event,
      sender: otherDID
    };
    
    // PubSubService normalizes topics by prepending /vivim/ if not present,
    // but GOSSIP_TOPICS already start with /vivim/
    
    pubsub.emit('message', {
      payload: JSON.stringify(message),
      topic: topic 
    });
    
    // Use canonical comparison to avoid issues with undefined properties
    expect(JSON.parse(JSON.stringify(receivedEvent))).toEqual(JSON.parse(JSON.stringify(event)));
  });
});
