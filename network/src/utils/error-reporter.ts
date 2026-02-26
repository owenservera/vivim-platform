import { ErrorReporter, reportError, reportWarning, reportInfo, ErrorCategory, SyncIssueType, SyncResolution } from '../common/error-reporting';

// Map network component sub-types to valid ErrorCategory values
const NETWORK_ERROR_CATEGORIES = {
  network: 'NETWORK_TIMEOUT' as const,
  sync: 'SYNC_TIMEOUT' as const,
  dht: 'NETWORK_TIMEOUT' as const,
  p2p: 'CONNECTION_LOST' as const,
  pubsub: 'PROTOCOL_VIOLATION' as const,
  federation: 'SERVICE_UNAVAILABLE' as const,
  crdt: 'CRDT_CONFLICT' as const,
  security: 'PERMISSION_DENIED' as const,
  connection: 'CONNECTION_LOST' as const,
  discovery: 'NETWORK_TIMEOUT' as const,
  general: 'NETWORK_TIMEOUT' as const,
} as const;

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

export class NetworkErrorReporter {
  private reporter: ErrorReporter;
  private p2pHealth: P2PHealthMetrics = {
    connectedPeers: 0,
    pendingMessages: 0,
    latencies: {},
    lastHeartbeat: Date.now(),
    reconnectAttempts: 0
  };
  private syncState: SyncStateMetrics = {
    pendingOperations: 0,
    lastSyncTimestamp: 0,
    conflictCount: 0,
    offlineQueue: 0,
    localVersion: 0,
    remoteVersion: 0
  };
  private connectionState: 'connected' | 'disconnected' | 'connecting' = 'disconnected';

  constructor() {
    this.reporter = ErrorReporter.getInstance();
  }

  updateP2PHealth(health: Partial<P2PHealthMetrics>): void {
    this.p2pHealth = { ...this.p2pHealth, ...health };
    
    if (health.connectedPeers !== undefined && health.connectedPeers === 0 && this.connectionState === 'connected') {
      this.connectionState = 'disconnected';
      this.reportP2PError('All peers disconnected', null, { peerCount: 0 }, 'high');
    } else if (health.connectedPeers !== undefined && health.connectedPeers > 0 && this.connectionState === 'disconnected') {
      this.connectionState = 'connected';
      this.reportInfo('P2P connection restored', { peerCount: health.connectedPeers });
    }
  }

  getP2PHealth(): P2PHealthMetrics {
    return { ...this.p2pHealth };
  }

  updateSyncState(state: Partial<SyncStateMetrics>): void {
    const previousState = { ...this.syncState };
    this.syncState = { ...this.syncState, ...state };

    if (state.conflictCount !== undefined && state.conflictCount > previousState.conflictCount) {
      this.reportCRDTConflict(
        'sync',
        'unknown',
        { version: previousState.localVersion },
        { version: state.remoteVersion },
        { conflictCount: state.conflictCount - previousState.conflictCount },
        null
      );
    }

    if (state.pendingOperations !== undefined && state.pendingOperations > 10) {
      this.reportWarning(
        'High pending sync operations',
        { pendingOps: state.pendingOperations }
      );
    }
  }

  getSyncState(): SyncStateMetrics {
    return { ...this.syncState };
  }

  reportConnectionStateChange(
    state: 'connected' | 'disconnected' | 'connecting',
    peerId?: string,
    error?: Error | any
  ): void {
    this.connectionState = state;
    
    if (state === 'disconnected') {
      this.reportConnectionError(
        `P2P connection lost${peerId ? ` to ${peerId}` : ''}`,
        error,
        { peerId, timestamp: Date.now() },
        'high'
      );
    } else if (state === 'connected') {
      this.reportInfo(
        `P2P connection established${peerId ? ` with ${peerId}` : ''}`,
        { peerId, timestamp: Date.now() }
      );
    } else if (state === 'connecting') {
      this.reportInfo(
        `P2P connecting${peerId ? ` to ${peerId}` : ''}`,
        { peerId, timestamp: Date.now() }
      );
    }
  }

  async reportNetworkError(
    message: string,
    error?: Error | any,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ): Promise<void> {
    await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.network, error, context, severity);
  }

  async reportSyncError(
    message: string,
    error?: Error | any,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ): Promise<void> {
    await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.sync, error, context, severity);
  }

  async reportDHTError(
    message: string,
    error?: Error | any,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ): Promise<void> {
    await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.dht, error, context, severity);
  }

  async reportP2PError(
    message: string,
    error?: Error | any,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ): Promise<void> {
    await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.p2p, error, context, severity);
  }

  async reportPubSubError(
    message: string,
    error?: Error | any,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ): Promise<void> {
    await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.pubsub, error, context, severity);
  }

  async reportFederationError(
    message: string,
    error?: Error | any,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ): Promise<void> {
    await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.federation, error, context, severity);
  }

  async reportCRDTError(
    message: string,
    error?: Error | any,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ): Promise<void> {
    await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.crdt, error, context, severity);
  }

  async reportSecurityError(
    message: string,
    error?: Error | any,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ): Promise<void> {
    await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.security, error, context, severity);
  }

  async reportConnectionError(
    message: string,
    error?: Error | any,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ): Promise<void> {
    await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.connection, error, context, severity);
  }

  async reportPeerDiscoveryError(
    message: string,
    error?: Error | any,
    context?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ): Promise<void> {
    await reportError(message, 'network', NETWORK_ERROR_CATEGORIES.discovery, error, context, severity);
  }

  async reportWarning(
    message: string,
    context?: Record<string, any>
  ): Promise<void> {
    await reportWarning(message, 'network', NETWORK_ERROR_CATEGORIES.general, context);
  }

  async reportInfo(
    message: string,
    context?: Record<string, any>
  ): Promise<void> {
    await reportInfo(message, 'network', NETWORK_ERROR_CATEGORIES.general, context);
  }

  async reportCRDTConflict(
    entityType: string,
    entityId: string,
    localState: any,
    remoteState: any,
    conflictDetails?: {
      conflictingFields?: string[];
      conflictCount?: number;
    },
    resolution?: SyncResolution
  ): Promise<void> {
    const conflictCount = conflictDetails?.conflictCount || 1;
    this.syncState.conflictCount += conflictCount;
    
    await reportError(
      `CRDT Conflict: ${entityType}:${entityId}`,
      'network',
      'CRDT_CONFLICT' as const,
      null,
      {
        entityType,
        entityId,
        localVersion: localState?.version,
        remoteVersion: remoteState?.version,
        conflictingFields: conflictDetails?.conflictingFields,
        conflictCount,
        resolutionStrategy: resolution?.strategy
      },
      'medium'
    );

    this.reporter.trackSyncIssue({
      issueType: 'conflict' as SyncIssueType,
      source: 'network',
      target: 'server',
      entityType: entityType as any,
      entityId,
      details: {
        localState,
        remoteState,
        conflictingFields: conflictDetails?.conflictingFields
      }
    });
  }

  async reportSyncTimeout(
    entityType: string,
    entityId: string,
    operation: string,
    timeoutMs: number,
    context?: Record<string, any>
  ): Promise<void> {
    await reportError(
      `Sync timeout: ${operation} on ${entityType}:${entityId}`,
      'network',
      'SYNC_TIMEOUT' as const,
      null,
      {
        entityType,
        entityId,
        operation,
        timeoutMs,
        ...context
      },
      'medium'
    );

    this.reporter.trackSyncIssue({
      issueType: 'missing_data' as SyncIssueType,
      source: 'network',
      target: 'server',
      entityType: entityType as any,
      entityId,
      details: {
        operation,
        timeoutMs,
        reason: 'timeout'
      }
    });
  }

  async reportVersionMismatch(
    entityType: string,
    entityId: string,
    localVersion: number,
    remoteVersion: number,
    context?: Record<string, any>
  ): Promise<void> {
    await reportError(
      `Version mismatch: ${entityType}:${entityId} (local: ${localVersion}, remote: ${remoteVersion})`,
      'network',
      'VERSION_MISMATCH' as const,
      null,
      {
        entityType,
        entityId,
        localVersion,
        remoteVersion,
        versionDelta: remoteVersion - localVersion,
        ...context
      },
      'medium'
    );
  }

  trackOfflineOperation(operation: string, entityType: string, entityId: string): void {
    this.syncState.offlineQueue++;
    this.reportInfo(
      `Queued offline operation: ${operation} on ${entityType}:${entityId}`,
      { pendingQueueSize: this.syncState.offlineQueue }
    );
  }

  async reconcileSyncState(
    localVersion: number,
    remoteVersion: number,
    pendingOps: number
  ): Promise<void> {
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
      await this.reportWarning(
        `Sync reconciliation completed with ${pendingOps} pending operations`,
        { localVersion, remoteVersion, pendingOps }
      );
    }
  }

  emitDebugStreamEvent(eventType: string, data: any): void {
    this.reporter.emitDebugEvent({
      eventType: eventType as any,
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