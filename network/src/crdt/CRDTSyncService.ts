import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';
import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
import type { SyncState } from '../types.js';

const log = createModuleLogger('crdt');

export interface CRDTSyncConfig {
  docId: string;
  docType: 'conversation' | 'circle' | 'profile' | 'settings';
  signalingServers?: string[];
  websocketUrl?: string;
  p2pEnabled?: boolean;
  awareness?: Map<number, unknown>;
}

export class CRDTSyncService extends EventEmitter {
  private docs: Map<string, Y.Doc> = new Map();
  private providers: Map<string, WebrtcProvider | WebsocketProvider> = new Map();
  private vectorClocks: Map<string, Record<string, number>> = new Map();
  private syncStates: Map<string, SyncState> = new Map();

  constructor() {
    super();
  }

  async createDocument(config: CRDTSyncConfig): Promise<Y.Doc> {
    if (this.docs.has(config.docId)) {
      log.warn({ docId: config.docId }, 'Document already exists');
      return this.docs.get(config.docId)!;
    }

    const doc = new Y.Doc();
    this.docs.set(config.docId, doc);
    this.vectorClocks.set(config.docId, {});
    this.syncStates.set(config.docId, {
      docId: config.docId,
      version: 0,
      vectorClock: {},
      status: 'offline',
    });

    if (config.p2pEnabled && config.signalingServers) {
      await this.setupWebRTCProvider(config, doc);
    } else if (config.websocketUrl) {
      await this.setupWebSocketProvider(config, doc);
    }

    this.setupDocumentHandlers(config.docId, doc);

    log.info({ docId: config.docId, type: config.docType }, 'CRDT document created');
    return doc;
  }

  private async setupWebRTCProvider(config: CRDTSyncConfig, doc: Y.Doc): Promise<void> {
    const provider = new WebrtcProvider(config.docId, doc, {
      signaling: config.signalingServers || ['wss://signaling.vivim.net'],
      password: undefined,
      awareness: undefined,
      maxConns: 20,
    });

    provider.on('synced', (syncData: { synced: boolean }) => {
      const isSynced = syncData.synced;
      log.debug({ docId: config.docId, isSynced }, 'WebRTC sync status changed');
      this.updateSyncState(config.docId, { status: isSynced ? 'synced' : 'syncing' });
      this.emit('sync:status', { docId: config.docId, synced: isSynced });
    });

    provider.on('peers', (peersData: { added: string[]; removed: string[]; webrtcPeers: string[]; bcPeers: string[] }) => {
      const allPeers = [...peersData.added, ...peersData.removed, ...peersData.webrtcPeers, ...peersData.bcPeers];
      log.debug({ docId: config.docId, peerCount: allPeers.length }, 'Peers updated');
      this.emit('sync:peers', { docId: config.docId, peers: allPeers });
    });

    this.providers.set(config.docId, provider);
  }

  private async setupWebSocketProvider(config: CRDTSyncConfig, doc: Y.Doc): Promise<void> {
    const url = config.websocketUrl!.replace('/ws', '/yjs');
    const provider = new WebsocketProvider(url, config.docId, doc, {
      connect: true,
      params: {},
      resyncInterval: 10000,
    });

    provider.on('synced', (isSynced: boolean) => {
      log.debug({ docId: config.docId, isSynced }, 'WebSocket sync status changed');
      this.updateSyncState(config.docId, { status: isSynced ? 'synced' : 'syncing' });
      this.emit('sync:status', { docId: config.docId, synced: isSynced });
    });

    provider.on('status', (event: { status: string }) => {
      log.debug({ docId: config.docId, status: event.status }, 'Connection status changed');
      this.emit('connection:status', { docId: config.docId, status: event.status });
    });

    this.providers.set(config.docId, provider);
  }

  private setupDocumentHandlers(docId: string, doc: Y.Doc): void {
    doc.on('update', (update: Uint8Array, origin: unknown, doc: Y.Doc, transaction: Y.Transaction) => {
      if (origin === 'remote') return;

      const vectorClock = this.vectorClocks.get(docId) || {};
      vectorClock[doc.clientID] = (vectorClock[doc.clientID] || 0) + 1;
      this.vectorClocks.set(docId, vectorClock);

      const state = this.syncStates.get(docId);
      if (state) {
        state.version++;
        state.vectorClock = { ...vectorClock };
        state.lastSyncedAt = new Date();
      }

      this.emit('document:update', { docId, update, origin, doc, transaction });
    });
  }

  getDocument(docId: string): Y.Doc | undefined {
    return this.docs.get(docId);
  }

  getSyncState(docId: string): SyncState | undefined {
    return this.syncStates.get(docId);
  }

  getVectorClock(docId: string): Record<string, number> | undefined {
    return this.vectorClocks.get(docId);
  }

  private updateSyncState(docId: string, update: Partial<SyncState>): void {
    const state = this.syncStates.get(docId);
    if (state) {
      Object.assign(state, update);
      this.syncStates.set(docId, state);
      this.emit('sync:state', { docId, state });
    }
  }

  async encodeStateAsUpdate(docId: string): Promise<Uint8Array> {
    const doc = this.docs.get(docId);
    if (!doc) {
      throw new Error(`Document ${docId} not found`);
    }
    return Y.encodeStateAsUpdate(doc);
  }

  async encodeStateAsVector(docId: string): Promise<Uint8Array> {
    const doc = this.docs.get(docId);
    if (!doc) {
      throw new Error(`Document ${docId} not found`);
    }
    return Y.encodeStateVector(doc);
  }

  async applyUpdate(docId: string, update: Uint8Array): Promise<void> {
    const doc = this.docs.get(docId);
    if (!doc) {
      throw new Error(`Document ${docId} not found`);
    }
    Y.applyUpdate(doc, update, 'remote');
  }

  async mergeDocument(sourceDocId: string, targetDocId: string): Promise<void> {
    const sourceDoc = this.docs.get(sourceDocId);
    const targetDoc = this.docs.get(targetDocId);
    if (!sourceDoc || !targetDoc) {
      throw new Error('Source or target document not found');
    }
    const update = Y.encodeStateAsUpdate(sourceDoc);
    Y.applyUpdate(targetDoc, update);
  }

  getSharedType<T extends Y.AbstractType<unknown>>(docId: string, key: string): T | undefined {
    const doc = this.docs.get(docId);
    if (!doc) return undefined;
    return doc.get(key) as T;
  }

  getConnectedPeers(docId: string): string[] {
    const provider = this.providers.get(docId);
    if (!provider) return [];
    if (provider instanceof WebrtcProvider) {
      return Array.from((provider as any).awareness?.getStates()?.keys() || []);
    }
    return [];
  }

  destroyDocument(docId: string): void {
    const provider = this.providers.get(docId);
    if (provider) {
      provider.destroy();
      this.providers.delete(docId);
    }

    const doc = this.docs.get(docId);
    if (doc) {
      doc.destroy();
      this.docs.delete(docId);
    }

    this.vectorClocks.delete(docId);
    this.syncStates.delete(docId);

    log.info({ docId }, 'Document destroyed');
  }

  destroy(): void {
    for (const docId of this.docs.keys()) {
      this.destroyDocument(docId);
    }
    this.removeAllListeners();
  }
}

export const crdtSyncService = new CRDTSyncService();
