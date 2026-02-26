import * as Y from 'yjs';
import { EventEmitter } from 'events';
import type { SyncState } from '../types.js';
export interface CRDTSyncConfig {
    docId: string;
    docType: 'conversation' | 'circle' | 'profile' | 'settings';
    signalingServers?: string[];
    websocketUrl?: string;
    p2pEnabled?: boolean;
    awareness?: Map<number, unknown>;
}
export declare class CRDTSyncService extends EventEmitter {
    private docs;
    private providers;
    private vectorClocks;
    private syncStates;
    constructor();
    createDocument(config: CRDTSyncConfig): Promise<Y.Doc>;
    private setupWebRTCProvider;
    private setupWebSocketProvider;
    private setupDocumentHandlers;
    getDocument(docId: string): Y.Doc | undefined;
    getSyncState(docId: string): SyncState | undefined;
    getVectorClock(docId: string): Record<string, number> | undefined;
    private updateSyncState;
    encodeStateAsUpdate(docId: string): Promise<Uint8Array>;
    encodeStateAsVector(docId: string): Promise<Uint8Array>;
    applyUpdate(docId: string, update: Uint8Array): Promise<void>;
    mergeDocument(sourceDocId: string, targetDocId: string): Promise<void>;
    getSharedType<T extends Y.AbstractType<unknown>>(docId: string, key: string): T | undefined;
    getConnectedPeers(docId: string): string[];
    destroyDocument(docId: string): void;
    destroy(): void;
}
export declare const crdtSyncService: CRDTSyncService;
//# sourceMappingURL=CRDTSyncService.d.ts.map