import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';
import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('crdt');
export class CRDTSyncService extends EventEmitter {
    docs = new Map();
    providers = new Map();
    vectorClocks = new Map();
    syncStates = new Map();
    constructor() {
        super();
    }
    async createDocument(config) {
        if (this.docs.has(config.docId)) {
            log.warn({ docId: config.docId }, 'Document already exists');
            return this.docs.get(config.docId);
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
        }
        else if (config.websocketUrl) {
            await this.setupWebSocketProvider(config, doc);
        }
        this.setupDocumentHandlers(config.docId, doc);
        log.info({ docId: config.docId, type: config.docType }, 'CRDT document created');
        return doc;
    }
    async setupWebRTCProvider(config, doc) {
        const provider = new WebrtcProvider(config.docId, doc, {
            signaling: config.signalingServers || ['wss://signaling.vivim.net'],
            password: undefined,
            awareness: undefined,
            maxConns: 20,
        });
        provider.on('synced', (syncData) => {
            const isSynced = syncData.synced;
            log.debug({ docId: config.docId, isSynced }, 'WebRTC sync status changed');
            this.updateSyncState(config.docId, { status: isSynced ? 'synced' : 'syncing' });
            this.emit('sync:status', { docId: config.docId, synced: isSynced });
        });
        provider.on('peers', (peersData) => {
            const allPeers = [...peersData.added, ...peersData.removed, ...peersData.webrtcPeers, ...peersData.bcPeers];
            log.debug({ docId: config.docId, peerCount: allPeers.length }, 'Peers updated');
            this.emit('sync:peers', { docId: config.docId, peers: allPeers });
        });
        this.providers.set(config.docId, provider);
    }
    async setupWebSocketProvider(config, doc) {
        const url = config.websocketUrl.replace('/ws', '/yjs');
        const provider = new WebsocketProvider(url, config.docId, doc, {
            connect: true,
            params: {},
            resyncInterval: 10000,
        });
        provider.on('synced', (isSynced) => {
            log.debug({ docId: config.docId, isSynced }, 'WebSocket sync status changed');
            this.updateSyncState(config.docId, { status: isSynced ? 'synced' : 'syncing' });
            this.emit('sync:status', { docId: config.docId, synced: isSynced });
        });
        provider.on('status', (event) => {
            log.debug({ docId: config.docId, status: event.status }, 'Connection status changed');
            this.emit('connection:status', { docId: config.docId, status: event.status });
        });
        this.providers.set(config.docId, provider);
    }
    setupDocumentHandlers(docId, doc) {
        doc.on('update', (update, origin, doc, transaction) => {
            if (origin === 'remote')
                return;
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
    getDocument(docId) {
        return this.docs.get(docId);
    }
    getSyncState(docId) {
        return this.syncStates.get(docId);
    }
    getVectorClock(docId) {
        return this.vectorClocks.get(docId);
    }
    updateSyncState(docId, update) {
        const state = this.syncStates.get(docId);
        if (state) {
            Object.assign(state, update);
            this.syncStates.set(docId, state);
            this.emit('sync:state', { docId, state });
        }
    }
    async encodeStateAsUpdate(docId) {
        const doc = this.docs.get(docId);
        if (!doc) {
            throw new Error(`Document ${docId} not found`);
        }
        return Y.encodeStateAsUpdate(doc);
    }
    async encodeStateAsVector(docId) {
        const doc = this.docs.get(docId);
        if (!doc) {
            throw new Error(`Document ${docId} not found`);
        }
        return Y.encodeStateVector(doc);
    }
    async applyUpdate(docId, update) {
        const doc = this.docs.get(docId);
        if (!doc) {
            throw new Error(`Document ${docId} not found`);
        }
        Y.applyUpdate(doc, update, 'remote');
    }
    async mergeDocument(sourceDocId, targetDocId) {
        const sourceDoc = this.docs.get(sourceDocId);
        const targetDoc = this.docs.get(targetDocId);
        if (!sourceDoc || !targetDoc) {
            throw new Error('Source or target document not found');
        }
        const update = Y.encodeStateAsUpdate(sourceDoc);
        Y.applyUpdate(targetDoc, update);
    }
    getSharedType(docId, key) {
        const doc = this.docs.get(docId);
        if (!doc)
            return undefined;
        return doc.get(key);
    }
    getConnectedPeers(docId) {
        const provider = this.providers.get(docId);
        if (!provider)
            return [];
        if (provider instanceof WebrtcProvider) {
            return Array.from(provider.awareness?.getStates()?.keys() || []);
        }
        return [];
    }
    destroyDocument(docId) {
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
    destroy() {
        for (const docId of this.docs.keys()) {
            this.destroyDocument(docId);
        }
        this.removeAllListeners();
    }
}
export const crdtSyncService = new CRDTSyncService();
//# sourceMappingURL=CRDTSyncService.js.map