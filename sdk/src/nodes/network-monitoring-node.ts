/**
 * Network Monitoring Node - Enhanced P2P network monitoring
 * Detailed peer connection tracking, bandwidth monitoring, and network topology
 */

import type { VivimSDK } from '../core/sdk.js';
import { generateId } from '../utils/crypto.js';
import {
  createCommunicationProtocol,
  type MessageEnvelope,
  type CommunicationEvent,
  type NodeMetrics,
} from '../core/communication.js';

/**
 * Peer connection state
 */
export type PeerConnectionState =
  | 'connected'
  | 'connecting'
  | 'disconnecting'
  | 'disconnected'
  | 'error';

/**
 * Peer connection type
 */
export type PeerConnectionType = 'webrtc' | 'websocket' | 'tcp' | 'quic';

/**
 * Peer info
 */
export interface PeerInfo {
  /** Peer ID */
  peerId: string;
  /** Peer DID */
  did?: string;
  /** Connection state */
  state: PeerConnectionState;
  /** Connection type */
  connectionType: PeerConnectionType;
  /** Multiaddrs */
  multiaddrs: string[];
  /** Protocols supported */
  protocols: string[];
  /** Connection direction */
  direction: 'inbound' | 'outbound';
  /** Connected timestamp */
  connectedAt?: number;
  /** Last activity timestamp */
  lastActivity: number;
  /** Latency (ms) */
  latency?: number;
  /** Bytes sent */
  bytesSent: number;
  /** Bytes received */
  bytesReceived: number;
  /** Connection quality score (0-100) */
  qualityScore: number;
  /** Peer tags */
  tags: string[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Network topology
 */
export interface NetworkTopology {
  /** Total nodes */
  totalNodes: number;
  /** Connected nodes */
  connectedNodes: number;
  /** Network diameter */
  diameter?: number;
  /** Average degree */
  avgDegree?: number;
  /** Clustering coefficient */
  clusteringCoefficient?: number;
  /** Connected components */
  components: number;
  /** Network graph (adjacency list) */
  graph: Map<string, string[]>;
}

/**
 * Bandwidth metrics
 */
export interface BandwidthMetrics {
  /** Upload speed (bytes/sec) */
  uploadSpeed: number;
  /** Download speed (bytes/sec) */
  downloadSpeed: number;
  /** Total uploaded (bytes) */
  totalUploaded: number;
  /** Total downloaded (bytes) */
  totalDownloaded: number;
  /** Peak upload speed */
  peakUploadSpeed: number;
  /** Peak download speed */
  peakDownloadSpeed: number;
  /** Average latency (ms) */
  avgLatency: number;
  /** P95 latency (ms) */
  p95Latency: number;
  /** P99 latency (ms) */
  p99Latency: number;
  /** Packet loss (0-100%) */
  packetLoss: number;
  /** Jitter (ms) */
  jitter: number;
}

/**
 * Sync metrics
 */
export interface SyncMetrics {
  /** Sync status */
  status: 'idle' | 'syncing' | 'conflict' | 'error';
  /** Pending operations */
  pendingOps: number;
  /** Completed operations */
  completedOps: number;
  /** Failed operations */
  failedOps: number;
  /** Last sync timestamp */
  lastSync?: number;
  /** Sync duration (ms) */
  lastSyncDuration?: number;
  /** Bytes synced */
  bytesSynced: number;
  /** Conflicts detected */
  conflictsDetected: number;
  /** Conflicts resolved */
  conflictsResolved: number;
  /** Vector clock */
  vectorClock?: Record<string, number>;
}

/**
 * Network event
 */
export interface NetworkEvent {
  /** Event ID */
  id: string;
  /** Event type */
  type: NetworkEventType;
  /** Timestamp */
  timestamp: number;
  /** Peer ID (if applicable) */
  peerId?: string;
  /** Data */
  data?: unknown;
}

/**
 * Network event type
 */
export type NetworkEventType =
  | 'peer:discovered'
  | 'peer:connected'
  | 'peer:disconnected'
  | 'peer:error'
  | 'message:sent'
  | 'message:received'
  | 'message:error'
  | 'sync:start'
  | 'sync:complete'
  | 'sync:error'
  | 'connection:quality_change';

/**
 * Connection quality
 */
export interface ConnectionQuality {
  /** Peer ID */
  peerId: string;
  /** Quality score (0-100) */
  score: number;
  /** Latency score (0-100) */
  latencyScore: number;
  /** Stability score (0-100) */
  stabilityScore: number;
  /** Throughput score (0-100) */
  throughputScore: number;
  /** Issues */
  issues: string[];
  /** Recommendations */
  recommendations: string[];
}

/**
 * Network monitoring events
 */
export interface NetworkMonitoringEvents {
  /** Peer discovered */
  'peer:discovered': PeerInfo;
  /** Peer connected */
  'peer:connected': PeerInfo;
  /** Peer disconnected */
  'peer:disconnected': { peerId: string; reason?: string };
  /** Network event */
  'network:event': NetworkEvent;
  /** Bandwidth update */
  'bandwidth:update': BandwidthMetrics;
  /** Sync update */
  'sync:update': SyncMetrics;
  /** Quality change */
  'quality:change': { peerId: string; quality: ConnectionQuality };
  /** Network error */
  'network:error': { error: Error; peerId?: string };
}

/**
 * Network Monitoring API
 */
export interface NetworkMonitoringAPI {
  // Peer management
  getPeer(peerId: string): Promise<PeerInfo | null>;
  getAllPeers(): Promise<PeerInfo[]>;
  getConnectedPeers(): Promise<PeerInfo[]>;
  getPeerCount(): Promise<number>;
  addPeer(peer: PeerInfo): Promise<void>;
  removePeer(peerId: string): Promise<void>;
  updatePeer(peerId: string, updates: Partial<PeerInfo>): Promise<void>;

  // Connection quality
  getConnectionQuality(peerId: string): Promise<ConnectionQuality>;
  getAllConnectionQualities(): Promise<ConnectionQuality[]>;
  calculateQualityScore(peer: PeerInfo): number;

  // Bandwidth monitoring
  getBandwidthMetrics(): Promise<BandwidthMetrics>;
  resetBandwidthMetrics(): Promise<void>;
  startBandwidthMonitoring(intervalMs?: number): void;
  stopBandwidthMonitoring(): void;

  // Sync monitoring
  getSyncMetrics(): Promise<SyncMetrics>;
  startSync(): Promise<void>;
  completeSync(bytesSynced: number, duration: number): Promise<void>;
  reportSyncError(error: Error): Promise<void>;
  detectConflict(conflictData: unknown): Promise<void>;
  resolveConflict(): Promise<void>;

  // Topology
  getNetworkTopology(): Promise<NetworkTopology>;
  getNetworkStats(): Promise<NetworkStats>;

  // Events
  getEventHistory(hours?: number): Promise<NetworkEvent[]>;
  getEventCount(): Promise<number>;
  clearEventHistory(): Promise<void>;

  // Diagnostics
  runDiagnostics(): Promise<DiagnosticResult>;
  pingPeer(peerId: string): Promise<number>;
  testConnection(peerId: string): Promise<ConnectionTestResult>;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

/**
 * Network stats
 */
export interface NetworkStats {
  /** Uptime (ms) */
  uptime: number;
  /** Total peers discovered */
  totalPeersDiscovered: number;
  /** Total messages sent */
  messagesSent: number;
  /** Total messages received */
  messagesReceived: number;
  /** Total bytes sent */
  bytesSent: number;
  /** Total bytes received */
  bytesReceived: number;
  /** Average connection duration (ms) */
  avgConnectionDuration: number;
  /** Reconnection count */
  reconnectionCount: number;
  /** Error count */
  errorCount: number;
}

/**
 * Diagnostic result
 */
export interface DiagnosticResult {
  /** Overall status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Score (0-100) */
  score: number;
  /** Checks performed */
  checks: DiagnosticCheck[];
  /** Issues found */
  issues: string[];
  /** Recommendations */
  recommendations: string[];
}

/**
 * Diagnostic check
 */
export interface DiagnosticCheck {
  /** Check name */
  name: string;
  /** Status */
  status: 'pass' | 'warn' | 'fail';
  /** Message */
  message: string;
  /** Details */
  details?: unknown;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  /** Peer ID */
  peerId: string;
  /** Success */
  success: boolean;
  /** Latency (ms) */
  latency?: number;
  /** Bandwidth (bytes/sec) */
  bandwidth?: number;
  /** Error */
  error?: string;
  /** Timestamp */
  timestamp: number;
}

/**
 * Network Monitoring Node Implementation
 */
export class NetworkMonitoringNode implements NetworkMonitoringAPI {
  private peers: Map<string, PeerInfo> = new Map();
  private events: NetworkEvent[] = [];
  private bandwidthMetrics: BandwidthMetrics = {
    uploadSpeed: 0,
    downloadSpeed: 0,
    totalUploaded: 0,
    totalDownloaded: 0,
    peakUploadSpeed: 0,
    peakDownloadSpeed: 0,
    avgLatency: 0,
    p95Latency: 0,
    p99Latency: 0,
    packetLoss: 0,
    jitter: 0,
  };
  private syncMetrics: SyncMetrics = {
    status: 'idle',
    pendingOps: 0,
    completedOps: 0,
    failedOps: 0,
    bytesSynced: 0,
    conflictsDetected: 0,
    conflictsResolved: 0,
  };
  private stats: NetworkStats = {
    uptime: 0,
    totalPeersDiscovered: 0,
    messagesSent: 0,
    messagesReceived: 0,
    bytesSent: 0,
    bytesReceived: 0,
    avgConnectionDuration: 0,
    reconnectionCount: 0,
    errorCount: 0,
  };
  private startTime: number;
  private bandwidthInterval?: NodeJS.Timeout;
  private latencies: number[] = [];
  private communication: ReturnType<typeof createCommunicationProtocol>;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK) {
    this.startTime = Date.now();
    this.communication = createCommunicationProtocol('network-monitoring');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      this.stats.messagesSent++;
      this.addEvent({
        id: generateId(),
        type: 'message:sent',
        timestamp: Date.now(),
        data: { messageId: event.messageId },
      });
    });
    this.eventUnsubscribe.push(unsubSent);

    const unsubReceived = this.communication.onEvent('message_received', (event) => {
      this.stats.messagesReceived++;
      this.addEvent({
        id: generateId(),
        type: 'message:received',
        timestamp: Date.now(),
      });
    });
    this.eventUnsubscribe.push(unsubReceived);

    const unsubError = this.communication.onEvent('message_error', (event) => {
      this.stats.errorCount++;
      this.addEvent({
        id: generateId(),
        type: 'message:error',
        timestamp: Date.now(),
        data: { error: event.error },
      });
    });
    this.eventUnsubscribe.push(unsubError);
  }

  // ==========================================================================
  // Peer Management
  // ==========================================================================

  async getPeer(peerId: string): Promise<PeerInfo | null> {
    return this.peers.get(peerId) || null;
  }

  async getAllPeers(): Promise<PeerInfo[]> {
    return Array.from(this.peers.values());
  }

  async getConnectedPeers(): Promise<PeerInfo[]> {
    return Array.from(this.peers.values()).filter(
      (p) => p.state === 'connected'
    );
  }

  async getPeerCount(): Promise<number> {
    return this.peers.size;
  }

  async addPeer(peer: PeerInfo): Promise<void> {
    this.peers.set(peer.peerId, peer);
    this.stats.totalPeersDiscovered++;
    this.addEvent({
      id: generateId(),
      type: 'peer:discovered',
      timestamp: Date.now(),
      peerId: peer.peerId,
      data: peer,
    });
    this.emit('peer:discovered', peer);
  }

  async removePeer(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      this.peers.delete(peerId);
      this.addEvent({
        id: generateId(),
        type: 'peer:disconnected',
        timestamp: Date.now(),
        peerId,
      });
      this.emit('peer:disconnected', { peerId });
    }
  }

  async updatePeer(peerId: string, updates: Partial<PeerInfo>): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      const updated = { ...peer, ...updates };
      this.peers.set(peerId, updated);

      // Check for quality changes
      if (updates.qualityScore !== undefined && updates.qualityScore !== peer.qualityScore) {
        const quality = await this.getConnectionQuality(peerId);
        this.emit('quality:change', { peerId, quality });
      }
    }
  }

  // ==========================================================================
  // Connection Quality
  // ==========================================================================

  async getConnectionQuality(peerId: string): Promise<ConnectionQuality> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    const score = this.calculateQualityScore(peer);
    const latencyScore = peer.latency ? Math.max(0, 100 - peer.latency) : 50;
    const stabilityScore = peer.state === 'connected' ? 100 : 0;
    const throughputScore = Math.min(100, (peer.bytesSent + peer.bytesReceived) / 1000);

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (peer.latency && peer.latency > 200) {
      issues.push('High latency');
      recommendations.push('Consider using a closer relay node');
    }
    if (peer.state !== 'connected') {
      issues.push('Peer not connected');
      recommendations.push('Attempt reconnection');
    }
    if (throughputScore < 50) {
      issues.push('Low throughput');
      recommendations.push('Check network bandwidth');
    }

    return {
      peerId,
      score,
      latencyScore,
      stabilityScore,
      throughputScore,
      issues,
      recommendations,
    };
  }

  async getAllConnectionQualities(): Promise<ConnectionQuality[]> {
    const qualities: ConnectionQuality[] = [];
    for (const peer of this.peers.values()) {
      try {
        const quality = await this.getConnectionQuality(peer.peerId);
        qualities.push(quality);
      } catch {
        // Peer was removed
      }
    }
    return qualities;
  }

  calculateQualityScore(peer: PeerInfo): number {
    let score = 100;

    // Latency factor (40%)
    if (peer.latency) {
      if (peer.latency > 500) score -= 40;
      else if (peer.latency > 200) score -= 20;
      else if (peer.latency > 100) score -= 10;
    } else {
      score -= 20; // Unknown latency
    }

    // State factor (30%)
    if (peer.state !== 'connected') score -= 30;

    // Activity factor (20%)
    const inactiveTime = Date.now() - peer.lastActivity;
    if (inactiveTime > 60000) score -= 10;
    if (inactiveTime > 300000) score -= 20;

    // Throughput factor (10%)
    const totalBytes = peer.bytesSent + peer.bytesReceived;
    if (totalBytes < 1000) score -= 5;
    if (totalBytes < 100) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  // ==========================================================================
  // Bandwidth Monitoring
  // ==========================================================================

  async getBandwidthMetrics(): Promise<BandwidthMetrics> {
    // Calculate current speeds
    const now = Date.now();
    const timeDiff = (now - this.startTime) / 1000;

    if (timeDiff > 0) {
      this.bandwidthMetrics.uploadSpeed = this.bandwidthMetrics.totalUploaded / timeDiff;
      this.bandwidthMetrics.downloadSpeed = this.bandwidthMetrics.totalDownloaded / timeDiff;
    }

    // Calculate latency percentiles
    if (this.latencies.length > 0) {
      const sorted = [...this.latencies].sort((a, b) => a - b);
      this.bandwidthMetrics.avgLatency =
        sorted.reduce((a, b) => a + b, 0) / sorted.length;
      this.bandwidthMetrics.p95Latency = sorted[Math.floor(sorted.length * 0.95)] || 0;
      this.bandwidthMetrics.p99Latency = sorted[Math.floor(sorted.length * 0.99)] || 0;
    }

    return this.bandwidthMetrics;
  }

  async resetBandwidthMetrics(): Promise<void> {
    this.bandwidthMetrics = {
      uploadSpeed: 0,
      downloadSpeed: 0,
      totalUploaded: 0,
      totalDownloaded: 0,
      peakUploadSpeed: 0,
      peakDownloadSpeed: 0,
      avgLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      packetLoss: 0,
      jitter: 0,
    };
    this.latencies = [];
  }

  startBandwidthMonitoring(intervalMs: number = 5000): void {
    if (this.bandwidthInterval) {
      this.stopBandwidthMonitoring();
    }

    this.bandwidthInterval = setInterval(() => {
      this.getBandwidthMetrics().then((metrics) => {
        this.emit('bandwidth:update', metrics);
      });
    }, intervalMs);
  }

  stopBandwidthMonitoring(): void {
    if (this.bandwidthInterval) {
      clearInterval(this.bandwidthInterval);
      this.bandwidthInterval = undefined;
    }
  }

  // ==========================================================================
  // Sync Monitoring
  // ==========================================================================

  async getSyncMetrics(): Promise<SyncMetrics> {
    return this.syncMetrics;
  }

  async startSync(): Promise<void> {
    this.syncMetrics.status = 'syncing';
    this.addEvent({
      id: generateId(),
      type: 'sync:start',
      timestamp: Date.now(),
    });
    this.emit('sync:update', { ...this.syncMetrics });
  }

  async completeSync(bytesSynced: number, duration: number): Promise<void> {
    this.syncMetrics.status = 'idle';
    this.syncMetrics.completedOps++;
    this.syncMetrics.bytesSynced += bytesSynced;
    this.syncMetrics.lastSync = Date.now();
    this.syncMetrics.lastSyncDuration = duration;

    this.addEvent({
      id: generateId(),
      type: 'sync:complete',
      timestamp: Date.now(),
      data: { bytesSynced, duration },
    });
    this.emit('sync:update', { ...this.syncMetrics });
  }

  async reportSyncError(error: Error): Promise<void> {
    this.syncMetrics.status = 'error';
    this.syncMetrics.failedOps++;
    this.stats.errorCount++;

    this.addEvent({
      id: generateId(),
      type: 'sync:error',
      timestamp: Date.now(),
      data: { error: error.message },
    });
    this.emit('sync:update', { ...this.syncMetrics });
    this.emit('network:error', { error });
  }

  async detectConflict(conflictData: unknown): Promise<void> {
    this.syncMetrics.status = 'conflict';
    this.syncMetrics.conflictsDetected++;

    this.addEvent({
      id: generateId(),
      type: 'sync:start', // Reuse sync start event
      timestamp: Date.now(),
      data: { conflict: conflictData },
    });
    this.emit('sync:update', { ...this.syncMetrics });
  }

  async resolveConflict(): Promise<void> {
    this.syncMetrics.status = 'syncing';
    this.syncMetrics.conflictsResolved++;

    // Resume sync after conflict resolution
    setTimeout(() => {
      this.syncMetrics.status = 'idle';
      this.emit('sync:update', { ...this.syncMetrics });
    }, 1000);
  }

  // ==========================================================================
  // Topology
  // ==========================================================================

  async getNetworkTopology(): Promise<NetworkTopology> {
    const peers = Array.from(this.peers.values());
    const connected = peers.filter((p) => p.state === 'connected');

    // Build adjacency list
    const graph = new Map<string, string[]>();
    for (const peer of connected) {
      // In a real implementation, this would come from DHT routing table
      graph.set(peer.peerId, []);
    }

    return {
      totalNodes: peers.length,
      connectedNodes: connected.length,
      components: 1, // Simplified
      graph,
    };
  }

  async getNetworkStats(): Promise<NetworkStats> {
    this.stats.uptime = Date.now() - this.startTime;

    // Calculate average connection duration
    const connectedPeers = Array.from(this.peers.values()).filter(
      (p) => p.state === 'connected' && p.connectedAt
    );
    if (connectedPeers.length > 0) {
      const totalDuration = connectedPeers.reduce(
        (sum, p) => sum + (Date.now() - (p.connectedAt || Date.now())),
        0
      );
      this.stats.avgConnectionDuration = totalDuration / connectedPeers.length;
    }

    return this.stats;
  }

  // ==========================================================================
  // Events
  // ==========================================================================

  async getEventHistory(hours: number = 24): Promise<NetworkEvent[]> {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.events.filter((e) => e.timestamp >= cutoff);
  }

  async getEventCount(): Promise<number> {
    return this.events.length;
  }

  async clearEventHistory(): Promise<void> {
    this.events = [];
  }

  private addEvent(event: NetworkEvent): void {
    this.events.push(event);

    // Limit event history
    if (this.events.length > 10000) {
      this.events.shift();
    }

    this.emit('network:event', event);
  }

  // ==========================================================================
  // Diagnostics
  // ==========================================================================

  async runDiagnostics(): Promise<DiagnosticResult> {
    const checks: DiagnosticCheck[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check 1: Peer connectivity
    const connectedCount = await this.getPeerCount();
    if (connectedCount === 0) {
      checks.push({
        name: 'Peer Connectivity',
        status: 'fail',
        message: 'No peers connected',
      });
      issues.push('Not connected to any peers');
      recommendations.push('Check network configuration');
      score -= 30;
    } else if (connectedCount < 3) {
      checks.push({
        name: 'Peer Connectivity',
        status: 'warn',
        message: `Only ${connectedCount} peers connected`,
      });
      issues.push('Low peer count');
      recommendations.push('Wait for more peer discoveries');
      score -= 10;
    } else {
      checks.push({
        name: 'Peer Connectivity',
        status: 'pass',
        message: `${connectedCount} peers connected`,
      });
    }

    // Check 2: Latency
    const bandwidth = await this.getBandwidthMetrics();
    if (bandwidth.avgLatency > 500) {
      checks.push({
        name: 'Network Latency',
        status: 'fail',
        message: `High latency: ${bandwidth.avgLatency.toFixed(0)}ms`,
      });
      issues.push('Network latency is too high');
      recommendations.push('Check network connection');
      score -= 20;
    } else if (bandwidth.avgLatency > 200) {
      checks.push({
        name: 'Network Latency',
        status: 'warn',
        message: `Moderate latency: ${bandwidth.avgLatency.toFixed(0)}ms`,
      });
      score -= 10;
    } else {
      checks.push({
        name: 'Network Latency',
        status: 'pass',
        message: `Latency: ${bandwidth.avgLatency.toFixed(0)}ms`,
      });
    }

    // Check 3: Sync status
    const sync = await this.getSyncMetrics();
    if (sync.status === 'error') {
      checks.push({
        name: 'Sync Status',
        status: 'fail',
        message: 'Sync in error state',
      });
      issues.push('Sync has errors');
      recommendations.push('Check sync logs');
      score -= 20;
    } else if (sync.failedOps > 0) {
      checks.push({
        name: 'Sync Status',
        status: 'warn',
        message: `${sync.failedOps} failed sync operations`,
      });
      score -= 10;
    } else {
      checks.push({
        name: 'Sync Status',
        status: 'pass',
        message: 'Sync healthy',
      });
    }

    // Check 4: Error rate
    const stats = await this.getNetworkStats();
    const errorRate = stats.errorCount / Math.max(1, stats.messagesSent + stats.messagesReceived);
    if (errorRate > 0.1) {
      checks.push({
        name: 'Error Rate',
        status: 'fail',
        message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
      });
      issues.push('High message error rate');
      recommendations.push('Check network stability');
      score -= 20;
    } else if (errorRate > 0.05) {
      checks.push({
        name: 'Error Rate',
        status: 'warn',
        message: `Moderate error rate: ${(errorRate * 100).toFixed(1)}%`,
      });
      score -= 10;
    } else {
      checks.push({
        name: 'Error Rate',
        status: 'pass',
        message: `Error rate: ${(errorRate * 100).toFixed(1)}%`,
      });
    }

    const status = score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy';

    return {
      status,
      score: Math.max(0, score),
      checks,
      issues,
      recommendations,
    };
  }

  async pingPeer(peerId: string): Promise<number> {
    const start = Date.now();
    // In a real implementation, this would send a ping message
    const latency = Date.now() - start;
    this.latencies.push(latency);
    return latency;
  }

  async testConnection(peerId: string): Promise<ConnectionTestResult> {
    const peer = this.peers.get(peerId);

    if (!peer) {
      return {
        peerId,
        success: false,
        error: 'Peer not found',
        timestamp: Date.now(),
      };
    }

    if (peer.state !== 'connected') {
      return {
        peerId,
        success: false,
        error: `Peer not connected (state: ${peer.state})`,
        timestamp: Date.now(),
      };
    }

    try {
      const latency = await this.pingPeer(peerId);
      const bandwidth = peer.bytesSent + peer.bytesReceived;

      return {
        peerId,
        success: true,
        latency,
        bandwidth,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        peerId,
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };
    }
  }

  // ==========================================================================
  // Communication Protocol
  // ==========================================================================

  getNodeId(): string {
    return 'network-monitoring-node';
  }

  getMetrics(): NodeMetrics {
    return this.communication.getMetrics();
  }

  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void {
    return this.communication.onEvent('message_received', listener as any);
  }

  async sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope> {
    return this.communication.sendMessage(type, payload);
  }

  async processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    return this.communication.processMessage(envelope);
  }

  /**
   * Emit event (internal)
   */
  private emit<K extends keyof NetworkMonitoringEvents>(
    event: K,
    data: NetworkMonitoringEvents[K]
  ): void {
    console.log(`[NetworkMonitoring] Event: ${event}`, data);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopBandwidthMonitoring();
    this.eventUnsubscribe.forEach((unsub) => unsub());
    this.eventUnsubscribe = [];
    this.peers.clear();
    this.events = [];
  }
}

/**
 * Create Network Monitoring Node instance
 */
export function createNetworkMonitoringNode(sdk: VivimSDK): NetworkMonitoringNode {
  return new NetworkMonitoringNode(sdk);
}
