/**
 * Mock file to replace @vivim/network-engine during frontend development.
 */
import { EventEmitter } from 'eventemitter3';

export enum ContentType {
  POST = 'post',
  IMAGE = 'image',
  VIDEO = 'video',
  ACU = 'acu',
  MEMORY = 'memory',
  CONVERSATION = 'conversation'
}

export enum EventType {
  MESSAGE_CREATE = 'message:create'
}

export interface NetworkNodeConfig {
  nodeType?: string;
  enableWebRTC?: boolean;
  enableDHT?: boolean;
  enableGossipsub?: boolean;
  enableMDNS?: boolean;
  listenAddresses?: string[];
  bootstrapPeers?: string[];
}

export class NetworkNode extends EventEmitter {
  public running = false;
  public keyManager = {
    getKeysByType: (type: string) => []
  };
  public pubSubService = {};
  public dhtService = {};

  constructor(config: Partial<NetworkNodeConfig>) {
    super();
  }

  async start() {
    this.running = true;
    this.emit('started', { peerId: 'mock-peer-id' });
  }

  async stop() {
    this.running = false;
    this.emit('stopped');
  }

  getConnectedPeers() {
    return [];
  }

  getNodeInfo() {
    return { peerId: 'mock-peer-id' };
  }
}

export class Libp2pYjsProvider {
  constructor(config: any) {}
  destroy() {}
}

export interface IEventStorage {
  ready(): Promise<any>;
  saveEvent(event: ChainEvent): Promise<void>;
  getEvent(cid: string): Promise<ChainEvent | null>;
  queryEvents(filter: EventFilter): Promise<ChainEvent[]>;
  getLatestEvent(entityId: string): Promise<ChainEvent | null>;
}

export interface ChainEvent {
  id: string;
  entityId?: string;
  author: string;
  type: string;
  timestamp: string;
  payload?: any;
}

export interface EventFilter {
  types?: string[];
  authors?: string[];
  entityIds?: string[];
  since?: number;
  until?: number;
  limit?: number;
}

export class DistributedContentClient {
  constructor(chainClient: any, dhtService: any) {}

  async createContent(params: any): Promise<{ cid: string }> {
    return { cid: `mock-cid-${Date.now()}` };
  }
}

export class EventStore {
  async queryEvents(filter: any): Promise<ChainEvent[]> {
    return [];
  }
}

export class VivimChainClient extends EventEmitter {
  constructor(config: any) {
    super();
  }

  async initializeIdentity(): Promise<string> {
    return 'did:vivim:mock';
  }

  async createEntity(type: string, data: any): Promise<{ entityId: string }> {
    return { entityId: `mock-entity-${Date.now()}` };
  }
  
  getEventStore(): EventStore {
    return new EventStore();
  }
}
