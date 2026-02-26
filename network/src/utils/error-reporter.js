import { ErrorReporter, reportError, reportWarning, reportInfo } from '../common/error-reporting';
// Map network component sub-types to valid ErrorCategory values
const NETWORK_ERROR_CATEGORIES = {
    network: 'NETWORK_TIMEOUT',
    sync: 'SYNC_TIMEOUT',
    dht: 'NETWORK_TIMEOUT',
    p2p: 'CONNECTION_LOST',
    pubsub: 'PROTOCOL_VIOLATION',
    federation: 'SERVICE_UNAVAILABLE',
    crdt: 'CRDT_CONFLICT',
    security: 'PERMISSION_DENIED',
    connection: 'CONNECTION_LOST',
    discovery: 'NETWORK_TIMEOUT',
    general: 'NETWORK_TIMEOUT',
};
export class NetworkErrorReporter {
    reporter;
    p2pHealth = {
        connectedPeers: 0,
        pendingMessages: 0,
        latencies: {},
        lastHeartbeat: Date.now(),
        reconnectAttempts: 0
    };
    syncState = {
        pendingOperations: 0,
        lastSyncTimestamp: 0,
        conflictCount: 0,
        offlineQueue: 0,
        localVersion: 0,
        remoteVersion: 0
    };
    connectionState = 'disconnected';
    constructor() {
        this.reporter = ErrorReporter.getInstance();
    }
    updateP2PHealth(health) {
        this.p2pHealth = { ...this.p2pHealth, ...health };
        if (health.connectedPeers !== undefined && health.connectedPeers === 0 && this.connectionState === 'connected') {
            this.connectionState = 'disconnected';
            this.reportP2PError('All peers disconnected', null, { peerCount: 0 }, 'high');
        }
        else if (health.connectedPeers !== undefined && health.connectedPeers > 0 && this.connectionState === 'disconnected') {
            this.connectionState = 'connected';
            this.reportInfo('P2P connection restored', { peerCount: health.connectedPeers });
        }
    }
    getP2PHealth() {
        return { ...this.p2pHealth };
    }
    updateSyncState(state) {
        const previousState = { ...this.syncState };
        this.syncState = { ...this.syncState, ...state };
        if (state.conflictCount !== undefined && state.conflictCount > previousState.conflictCount) {
            this.reportCRDTConflict('sync', 'unknown', { version: previousState.localVersion }, { version: state.remoteVersion }, { conflictCount: state.conflictCount - previousState.conflictCount }, null);
        }
        if (state.pendingOperations !== undefined && state.pendingOperations > 10) {
            this.reportWarning('High pending sync operations', { pendingOps: state.pendingOperations });
        }
    }
    getSyncState() {
        return { ...this.syncState };
    }
    reportConnectionStateChange(state, peerId, error) {
        this.connectionState = state;
        if (state === 'disconnected') {
            this.reportConnectionError(`P2P connection lost${peerId ? ` to ${peerId}` : ''}`, error, { peerId, timestamp: Date.now() }, 'high');
        }
        else if (state === 'connected') {
            this.reportInfo(`P2P connection established${peerId ? ` with ${peerId}` : ''}`, { peerId, timestamp: Date.now() });
        }
        else if (state === 'connecting') {
            this.reportInfo(`P2P connecting${peerId ? ` to ${peerId}` : ''}`, { peerId, timestamp: Date.now() });
        }
    }
    async reportNetworkError(message, error, context, severity = 'high') {
        await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.network, error, context, severity);
    }
    async reportSyncError(message, error, context, severity = 'high') {
        await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.sync, error, context, severity);
    }
    async reportDHTError(message, error, context, severity = 'high') {
        await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.dht, error, context, severity);
    }
    async reportP2PError(message, error, context, severity = 'high') {
        await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.p2p, error, context, severity);
    }
    async reportPubSubError(message, error, context, severity = 'high') {
        await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.pubsub, error, context, severity);
    }
    async reportFederationError(message, error, context, severity = 'high') {
        await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.federation, error, context, severity);
    }
    async reportCRDTError(message, error, context, severity = 'high') {
        await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.crdt, error, context, severity);
    }
    async reportSecurityError(message, error, context, severity = 'high') {
        await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.security, error, context, severity);
    }
    async reportConnectionError(message, error, context, severity = 'high') {
        await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.connection, error, context, severity);
    }
    async reportPeerDiscoveryError(message, error, context, severity = 'high') {
        await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.discovery, error, context, severity);
    }
    async reportWarning(message, context) {
        await reportWarning(message, 'network', NETWORK_ERROR_CATEGORIES.general, context);
    }
    async reportInfo(message, context) {
        await reportInfo(message, 'network', NETWORK_ERROR_CATEGORIES.general, context);
    }
    async reportCRDTConflict(entityType, entityId, localState, remoteState, conflictDetails, resolution) {
        const conflictCount = conflictDetails?.conflictCount || 1;
        this.syncState.conflictCount += conflictCount;
        await reportError(`CRDT Conflict: ${entityType}:${entityId}`, 'network', 'CRDT_CONFLICT', null, {
            entityType,
            entityId,
            localVersion: localState?.version,
            remoteVersion: remoteState?.version,
            conflictingFields: conflictDetails?.conflictingFields,
            conflictCount,
            resolutionStrategy: resolution?.strategy
        }, 'medium');
        this.reporter.trackSyncIssue({
            issueType: 'conflict',
            source: 'network',
            target: 'server',
            entityType: entityType,
            entityId,
            details: {
                localState,
                remoteState,
                conflictingFields: conflictDetails?.conflictingFields
            }
        });
    }
    async reportSyncTimeout(entityType, entityId, operation, timeoutMs, context) {
        await reportError(`Sync timeout: ${operation} on ${entityType}:${entityId}`, 'network', 'SYNC_TIMEOUT', null, {
            entityType,
            entityId,
            operation,
            timeoutMs,
            ...context
        }, 'medium');
        this.reporter.trackSyncIssue({
            issueType: 'missing_data',
            source: 'network',
            target: 'server',
            entityType: entityType,
            entityId,
            details: {
                operation,
                timeoutMs,
                reason: 'timeout'
            }
        });
    }
    async reportVersionMismatch(entityType, entityId, localVersion, remoteVersion, context) {
        await reportError(`Version mismatch: ${entityType}:${entityId} (local: ${localVersion}, remote: ${remoteVersion})`, 'network', 'VERSION_MISMATCH', null, {
            entityType,
            entityId,
            localVersion,
            remoteVersion,
            versionDelta: remoteVersion - localVersion,
            ...context
        }, 'medium');
    }
    trackOfflineOperation(operation, entityType, entityId) {
        this.syncState.offlineQueue++;
        this.reportInfo(`Queued offline operation: ${operation} on ${entityType}:${entityId}`, { pendingQueueSize: this.syncState.offlineQueue });
    }
    async reconcileSyncState(localVersion, remoteVersion, pendingOps) {
        this.syncState.localVersion = localVersion;
        this.syncState.remoteVersion = remoteVersion;
        this.syncState.pendingOperations = pendingOps;
        this.syncState.lastSyncTimestamp = Date.now();
        if (localVersion !== remoteVersion) {
            await this.reportVersionMismatch('sync', 'state', localVersion, remoteVersion, {
                operation: 'reconciliation'
            });
        }
        if (pendingOps > 0) {
            await this.reportWarning(`Sync reconciliation completed with ${pendingOps} pending operations`, { localVersion, remoteVersion, pendingOps });
        }
    }
    emitDebugStreamEvent(eventType, data) {
        this.reporter.emitDebugEvent({
            eventType: eventType,
            timestamp: Date.now(),
            service: 'network',
            data,
            syncState: {
                pendingOperations: this.syncState.pendingOperations,
                lastSyncTimestamp: this.syncState.lastSyncTimestamp,
                conflictCount: this.syncState.conflictCount,
                offlineQueue: this.syncState.offlineQueue
            }
        });
    }
}
// Singleton instance
export const networkErrorReporter = new NetworkErrorReporter();
//# sourceMappingURL=error-reporter.js.map