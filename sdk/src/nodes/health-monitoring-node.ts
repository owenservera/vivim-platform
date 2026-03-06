/**
 * Health Monitoring Node - System health checks and performance monitoring
 * Monitors network, database, CRDT sync, and overall system health
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
 * Health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Component health
 */
export interface ComponentHealth {
  /** Component name */
  name: string;
  /** Health status */
  status: HealthStatus;
  /** Last check timestamp */
  lastCheck: number;
  /** Response time (ms) */
  responseTime?: number;
  /** Error message (if unhealthy) */
  error?: string;
  /** Additional metrics */
  metrics?: Record<string, unknown>;
}

/**
 * System health report
 */
export interface SystemHealthReport {
  /** Overall health status */
  overallStatus: HealthStatus;
  /** Timestamp */
  timestamp: number;
  /** Component health */
  components: Map<string, ComponentHealth>;
  /** Performance metrics */
  performance: PerformanceMetrics;
  /** Network metrics */
  network: NetworkMetrics;
  /** Recommendations */
  recommendations: HealthRecommendation[];
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Memory usage (MB) */
  memoryUsage: number;
  /** Memory limit (MB) */
  memoryLimit?: number;
  /** CPU usage (0-100) */
  cpuUsage?: number;
  /** Event loop lag (ms) */
  eventLoopLag?: number;
  /** Active connections */
  activeConnections: number;
  /** Requests per second */
  requestsPerSecond?: number;
  /** Average response time (ms) */
  avgResponseTime: number;
}

/**
 * Network metrics
 */
export interface NetworkMetrics {
  /** Connected peers */
  connectedPeers: number;
  /** Pending messages */
  pendingMessages: number;
  /** Average latency (ms) */
  avgLatency: number;
  /** Bytes sent */
  bytesSent: number;
  /** Bytes received */
  bytesReceived: number;
  /** Sync status */
  syncStatus: 'synced' | 'syncing' | 'offline';
  /** Last sync timestamp */
  lastSync?: number;
  /** Pending sync operations */
  pendingSyncOps: number;
}

/**
 * Health recommendation
 */
export interface HealthRecommendation {
  /** Recommendation ID */
  id: string;
  /** Priority */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Category */
  category: 'performance' | 'security' | 'reliability' | 'capacity';
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Suggested action */
  action: string;
  /** Created timestamp */
  createdAt: number;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  /** Alert ID */
  id: string;
  /** Alert name */
  name: string;
  /** Component to monitor */
  component: string;
  /** Metric to check */
  metric: string;
  /** Condition operator */
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  /** Threshold value */
  threshold: number;
  /** Alert status */
  status: 'active' | 'triggered' | 'disabled';
  /** Last triggered timestamp */
  lastTriggered?: number;
  /** Cooldown period (ms) */
  cooldown?: number;
}

/**
 * Health monitoring events
 */
export interface HealthMonitoringEvents {
  /** Health check completed */
  'health:check': SystemHealthReport;
  /** Component status changed */
  'component:status': { component: string; status: HealthStatus };
  /** Alert triggered */
  'alert:triggered': AlertConfig;
  /** Performance threshold exceeded */
  'performance:threshold': { metric: string; value: number; threshold: number };
  /** Health error */
  'health:error': { error: Error };
}

/**
 * Health Monitoring API
 */
export interface HealthMonitoringAPI {
  // Health checks
  checkHealth(): Promise<SystemHealthReport>;
  checkComponentHealth(componentName: string): Promise<ComponentHealth>;
  startHealthChecks(intervalMs?: number): void;
  stopHealthChecks(): void;

  // Component registration
  registerComponent(name: string, checkFn: () => Promise<ComponentHealth>): void;
  unregisterComponent(name: string): void;
  getComponentHealth(name: string): ComponentHealth | null;
  getAllComponents(): string[];

  // Metrics
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
  getNetworkMetrics(): Promise<NetworkMetrics>;
  getMemoryUsage(): number;
  getUptime(): number;

  // Alerts
  createAlert(config: Omit<AlertConfig, 'id' | 'status'>): Promise<AlertConfig>;
  updateAlert(alertId: string, updates: Partial<AlertConfig>): Promise<AlertConfig>;
  deleteAlert(alertId: string): Promise<void>;
  getAlerts(): Promise<AlertConfig[]>;
  getTriggeredAlerts(): Promise<AlertConfig[]>;

  // Recommendations
  getRecommendations(): Promise<HealthRecommendation[]>;
  dismissRecommendation(recommendationId: string): Promise<void>;

  // History
  getHealthHistory(hours?: number): Promise<SystemHealthReport[]>;
  getMetricsHistory(hours?: number): Promise<{ timestamp: number; metrics: PerformanceMetrics }[]>;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

/**
 * Health Monitoring Node Implementation
 */
export class HealthMonitoringNode implements HealthMonitoringAPI {
  private components: Map<string, () => Promise<ComponentHealth>> = new Map();
  private componentHealth: Map<string, ComponentHealth> = new Map();
  private alerts: Map<string, AlertConfig> = new Map();
  private healthHistory: SystemHealthReport[] = [];
  private metricsHistory: { timestamp: number; metrics: PerformanceMetrics }[] = [];
  private checkInterval?: NodeJS.Timeout;
  private startTime: number;
  private communication: ReturnType<typeof createCommunicationProtocol>;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK) {
    this.startTime = Date.now();
    this.communication = createCommunicationProtocol('health-monitoring');
    this.setupEventListeners();
    this.registerDefaultComponents();
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[HealthMonitoring] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    const unsubError = this.communication.onEvent('message_error', (event) => {
      console.error(`[HealthMonitoring] Message error: ${event.error}`);
    });
    this.eventUnsubscribe.push(unsubError);
  }

  private registerDefaultComponents(): void {
    // Register SDK health check
    this.registerComponent('sdk', async () => {
      const start = Date.now();
      try {
        const identity = await this.sdk.getIdentity();
        return {
          name: 'sdk',
          status: identity ? 'healthy' : 'degraded',
          lastCheck: Date.now(),
          responseTime: Date.now() - start,
          metrics: { hasIdentity: !!identity },
        };
      } catch (error) {
        return {
          name: 'sdk',
          status: 'unhealthy',
          lastCheck: Date.now(),
          responseTime: Date.now() - start,
          error: (error as Error).message,
        };
      }
    });

    // Register memory check
    this.registerComponent('memory', async () => {
      const start = Date.now();
      try {
        const memory = this.getMemoryUsage();
        const status = memory > 80 ? 'degraded' : memory > 90 ? 'unhealthy' : 'healthy';
        return {
          name: 'memory',
          status,
          lastCheck: Date.now(),
          responseTime: Date.now() - start,
          metrics: { usagePercent: memory },
        };
      } catch (error) {
        return {
          name: 'memory',
          status: 'unknown',
          lastCheck: Date.now(),
          responseTime: Date.now() - start,
          error: (error as Error).message,
        };
      }
    });

    // Register network check
    this.registerComponent('network', async () => {
      const start = Date.now();
      try {
        const metrics = await this.getNetworkMetrics();
        const status =
          metrics.connectedPeers === 0 ? 'degraded' : metrics.syncStatus === 'offline' ? 'unhealthy' : 'healthy';
        return {
          name: 'network',
          status,
          lastCheck: Date.now(),
          responseTime: Date.now() - start,
          metrics: {
            connectedPeers: metrics.connectedPeers,
            syncStatus: metrics.syncStatus,
            avgLatency: metrics.avgLatency,
          },
        };
      } catch (error) {
        return {
          name: 'network',
          status: 'unknown',
          lastCheck: Date.now(),
          responseTime: Date.now() - start,
          error: (error as Error).message,
        };
      }
    });
  }

  // ==========================================================================
  // Health Checks
  // ==========================================================================

  async checkHealth(): Promise<SystemHealthReport> {
    const components = new Map<string, ComponentHealth>();
    let overallStatus: HealthStatus = 'healthy';

    // Check all registered components
    for (const [name, checkFn] of this.components.entries()) {
      try {
        const health = await checkFn();
        components.set(name, health);
        this.componentHealth.set(name, health);

        // Update overall status
        if (health.status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (health.status === 'degraded' && overallStatus !== 'unhealthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        const errorHealth: ComponentHealth = {
          name,
          status: 'unhealthy',
          lastCheck: Date.now(),
          error: (error as Error).message,
        };
        components.set(name, errorHealth);
        this.componentHealth.set(name, errorHealth);
        overallStatus = 'unhealthy';
      }
    }

    // Get performance and network metrics
    const [performance, network] = await Promise.all([
      this.getPerformanceMetrics(),
      this.getNetworkMetrics(),
    ]);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(components, performance, network);

    const report: SystemHealthReport = {
      overallStatus,
      timestamp: Date.now(),
      components,
      performance,
      network,
      recommendations,
    };

    // Store in history
    this.healthHistory.push(report);
    if (this.healthHistory.length > 100) {
      this.healthHistory.shift();
    }

    // Store metrics in history
    this.metricsHistory.push({ timestamp: Date.now(), metrics: performance });
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }

    // Check alerts
    await this.checkAlerts(report);

    this.emit('health:check', report);
    return report;
  }

  async checkComponentHealth(componentName: string): Promise<ComponentHealth> {
    const checkFn = this.components.get(componentName);
    if (!checkFn) {
      throw new Error(`Component not registered: ${componentName}`);
    }

    const health = await checkFn();
    this.componentHealth.set(componentName, health);
    return health;
  }

  startHealthChecks(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      this.stopHealthChecks();
    }

    this.checkInterval = setInterval(() => {
      this.checkHealth().catch(console.error);
    }, intervalMs);

    // Run initial check
    this.checkHealth().catch(console.error);
  }

  stopHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  // ==========================================================================
  // Component Registration
  // ==========================================================================

  registerComponent(name: string, checkFn: () => Promise<ComponentHealth>): void {
    this.components.set(name, checkFn);
  }

  unregisterComponent(name: string): void {
    this.components.delete(name);
    this.componentHealth.delete(name);
  }

  getComponentHealth(name: string): ComponentHealth | null {
    return this.componentHealth.get(name) || null;
  }

  getAllComponents(): string[] {
    return Array.from(this.components.keys());
  }

  // ==========================================================================
  // Metrics
  // ==========================================================================

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const memoryUsage = this.getMemoryUsage();

    // Get active connections from SDK nodes
    let activeConnections = 0;
    try {
      const socialNode = await this.sdk.getSocialNode();
      // Would get connection count from social node
    } catch {
      // Node not loaded
    }

    return {
      memoryUsage,
      memoryLimit: typeof process !== 'undefined' ? (process.memoryUsage?.() as any).heapLimit || process.memoryUsage?.().heapTotal / 1024 / 1024 : undefined,
      cpuUsage: undefined, // Would require OS integration
      eventLoopLag: undefined, // Would require event loop monitoring
      activeConnections,
      requestsPerSecond: undefined,
      avgResponseTime: 0,
    };
  }

  async getNetworkMetrics(): Promise<NetworkMetrics> {
    // Default metrics - would integrate with actual network layer
    return {
      connectedPeers: 0,
      pendingMessages: 0,
      avgLatency: 0,
      bytesSent: 0,
      bytesReceived: 0,
      syncStatus: 'offline',
      pendingSyncOps: 0,
    };
  }

  getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return Math.round((usage.heapUsed / ((usage as any).heapLimit || usage.heapTotal)) * 100);
    }
    // Browser fallback
    return 0;
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  // ==========================================================================
  // Alerts
  // ==========================================================================

  async createAlert(config: Omit<AlertConfig, 'id' | 'status'>): Promise<AlertConfig> {
    const alert: AlertConfig = {
      ...config,
      id: generateId(),
      status: 'active',
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  async updateAlert(alertId: string, updates: Partial<AlertConfig>): Promise<AlertConfig> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    const updated = { ...alert, ...updates };
    this.alerts.set(alertId, updated);
    return updated;
  }

  async deleteAlert(alertId: string): Promise<void> {
    this.alerts.delete(alertId);
  }

  async getAlerts(): Promise<AlertConfig[]> {
    return Array.from(this.alerts.values());
  }

  async getTriggeredAlerts(): Promise<AlertConfig[]> {
    return Array.from(this.alerts.values()).filter((a) => a.status === 'triggered');
  }

  private async checkAlerts(report: SystemHealthReport): Promise<void> {
    for (const alert of this.alerts.values()) {
      if (alert.status === 'disabled') continue;

      // Check cooldown
      if (alert.lastTriggered && alert.cooldown && Date.now() - alert.lastTriggered < alert.cooldown) {
        continue;
      }

      // Get metric value
      const component = report.components.get(alert.component);
      if (!component) continue;

      const value = component.metrics?.[alert.metric] as number;
      if (value === undefined) continue;

      // Check condition
      let triggered = false;
      switch (alert.operator) {
        case '>':
          triggered = value > alert.threshold;
          break;
        case '<':
          triggered = value < alert.threshold;
          break;
        case '>=':
          triggered = value >= alert.threshold;
          break;
        case '<=':
          triggered = value <= alert.threshold;
          break;
        case '==':
          triggered = value === alert.threshold;
          break;
        case '!=':
          triggered = value !== alert.threshold;
          break;
      }

      if (triggered) {
        alert.status = 'triggered';
        alert.lastTriggered = Date.now();
        this.emit('alert:triggered', alert);
      }
    }
  }

  // ==========================================================================
  // Recommendations
  // ==========================================================================

  private async generateRecommendations(
    components: Map<string, ComponentHealth>,
    performance: PerformanceMetrics,
    network: NetworkMetrics
  ): Promise<HealthRecommendation[]> {
    const recommendations: HealthRecommendation[] = [];

    // Memory recommendations
    if (performance.memoryUsage > 80) {
      recommendations.push({
        id: generateId(),
        priority: performance.memoryUsage > 90 ? 'critical' : 'high',
        category: 'performance',
        title: 'High Memory Usage',
        description: `Memory usage is at ${performance.memoryUsage}%`,
        action: 'Consider restarting the application or increasing memory limits',
        createdAt: Date.now(),
      });
    }

    // Network recommendations
    if (network.connectedPeers === 0) {
      recommendations.push({
        id: generateId(),
        priority: 'high',
        category: 'reliability',
        title: 'No Network Peers',
        description: 'Not connected to any network peers',
        action: 'Check network configuration and firewall settings',
        createdAt: Date.now(),
      });
    }

    if (network.syncStatus === 'offline') {
      recommendations.push({
        id: generateId(),
        priority: 'high',
        category: 'reliability',
        title: 'Sync Offline',
        description: 'Data synchronization is offline',
        action: 'Check network connectivity and sync configuration',
        createdAt: Date.now(),
      });
    }

    // Component health recommendations
    for (const [name, health] of components.entries()) {
      if (health.status === 'unhealthy') {
        recommendations.push({
          id: generateId(),
          priority: 'critical',
          category: 'reliability',
          title: `Component Unhealthy: ${name}`,
          description: health.error || `Component ${name} is unhealthy`,
          action: 'Check component logs and configuration',
          createdAt: Date.now(),
        });
      }
    }

    return recommendations;
  }

  async getRecommendations(): Promise<HealthRecommendation[]> {
    const report = await this.checkHealth();
    return report.recommendations;
  }

  async dismissRecommendation(recommendationId: string): Promise<void> {
    // In a real implementation, would store dismissed recommendations
    console.log(`[HealthMonitoring] Dismissed recommendation: ${recommendationId}`);
  }

  // ==========================================================================
  // History
  // ==========================================================================

  async getHealthHistory(hours: number = 24): Promise<SystemHealthReport[]> {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.healthHistory.filter((r) => r.timestamp >= cutoff);
  }

  async getMetricsHistory(
    hours: number = 24
  ): Promise<{ timestamp: number; metrics: PerformanceMetrics }[]> {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.metricsHistory.filter((r) => r.timestamp >= cutoff);
  }

  // ==========================================================================
  // Communication Protocol
  // ==========================================================================

  getNodeId(): string {
    return 'health-monitoring-node';
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
  private emit<K extends keyof HealthMonitoringEvents>(
    event: K,
    data: HealthMonitoringEvents[K]
  ): void {
    console.log(`[HealthMonitoring] Event: ${event}`, data);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopHealthChecks();
    this.eventUnsubscribe.forEach((unsub) => unsub());
    this.eventUnsubscribe = [];
    this.components.clear();
    this.componentHealth.clear();
    this.alerts.clear();
  }
}

/**
 * Create Health Monitoring Node instance
 */
export function createHealthMonitoringNode(sdk: VivimSDK): HealthMonitoringNode {
  return new HealthMonitoringNode(sdk);
}
