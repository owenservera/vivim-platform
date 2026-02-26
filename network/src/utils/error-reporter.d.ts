import { SyncResolution } from '../common/error-reporting';
export interface P2PHealthMetrics {
    connectedPeers: number;
    pendingMessages: number;
    latencies: Record<string, number>;
    lastHeartbeat: number;
    reconnectAttempts: number;
}
export interface SyncStateMetrics {
    pendingOperations: number;
    lastSyncTimestamp: number;
    conflictCount: number;
    offlineQueue: number;
    localVersion: number;
    remoteVersion: number;
}
export declare class NetworkErrorReporter {
    private reporter;
    private p2pHealth;
    private syncState;
    private connectionState;
    constructor();
    updateP2PHealth(health: Partial<P2PHealthMetrics>): void;
    getP2PHealth(): P2PHealthMetrics;
    updateSyncState(state: Partial<SyncStateMetrics>): void;
    getSyncState(): SyncStateMetrics;
    reportConnectionStateChange(state: 'connected' | 'disconnected' | 'connecting', peerId?: string, error?: Error | any): void;
    reportNetworkError(message: string, error?: Error | any, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    reportSyncError(message: string, error?: Error | any, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    reportDHTError(message: string, error?: Error | any, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    reportP2PError(message: string, error?: Error | any, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    reportPubSubError(message: string, error?: Error | any, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    reportFederationError(message: string, error?: Error | any, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    reportCRDTError(message: string, error?: Error | any, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    reportSecurityError(message: string, error?: Error | any, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    reportConnectionError(message: string, error?: Error | any, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    reportPeerDiscoveryError(message: string, error?: Error | any, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<void>;
    reportWarning(message: string, context?: Record<string, any>): Promise<void>;
    reportInfo(message: string, context?: Record<string, any>): Promise<void>;
    reportCRDTConflict(entityType: string, entityId: string, localState: any, remoteState: any, conflictDetails?: {
        conflictingFields?: string[];
        conflictCount?: number;
    }, resolution?: SyncResolution): Promise<void>;
    reportSyncTimeout(entityType: string, entityId: string, operation: string, timeoutMs: number, context?: Record<string, any>): Promise<void>;
    reportVersionMismatch(entityType: string, entityId: string, localVersion: number, remoteVersion: number, context?: Record<string, any>): Promise<void>;
    trackOfflineOperation(operation: string, entityType: string, entityId: string): void;
    reconcileSyncState(localVersion: number, remoteVersion: number, pendingOps: number): Promise<void>;
    emitDebugStreamEvent(eventType: string, data: any): void;
}
export declare const networkErrorReporter: NetworkErrorReporter;
//# sourceMappingURL=error-reporter.d.ts.map