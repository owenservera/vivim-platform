/**
 * Error Reporting Service - Centralized error tracking and reporting
 * Integrates with health monitoring for proactive error detection
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
 * Error severity levels
 */
export type ErrorSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical' | 'fatal';

/**
 * Error categories
 */
export type ErrorCategory =
  | 'network'
  | 'database'
  | 'sync'
  | 'auth'
  | 'validation'
  | 'api'
  | 'encryption'
  | 'federation'
  | 'storage'
  | 'unknown';

/**
 * Error source
 */
export type ErrorSource = 'client' | 'server' | 'network' | 'third-party';

/**
 * Error component
 */
export type ErrorComponent =
  | 'sdk'
  | 'pwa'
  | 'network'
  | 'server'
  | 'federation'
  | 'sharing'
  | 'encryption'
  | 'health'
  | 'sync';

/**
 * Error fingerprint for grouping
 */
export interface ErrorFingerprint {
  /** Fingerprint hash */
  hash: string;
  /** Error message pattern */
  pattern: string;
  /** Stack trace pattern */
  stackPattern?: string;
}

/**
 * Error report
 */
export interface ErrorReport {
  /** Error ID */
  id: string;
  /** Error message */
  message: string;
  /** Error name */
  name: string;
  /** Stack trace */
  stack?: string;
  /** Severity */
  severity: ErrorSeverity;
  /** Category */
  category: ErrorCategory;
  /** Component */
  component: ErrorComponent;
  /** Source */
  source: ErrorSource;
  /** Timestamp */
  timestamp: number;
  /** User DID (if available) */
  userDid?: string;
  /** Session ID */
  sessionId?: string;
  /** Context data */
  context: Record<string, unknown>;
  /** Tags */
  tags: string[];
  /** Fingerprint */
  fingerprint: ErrorFingerprint;
  /** Metadata */
  metadata?: Record<string, unknown>;
  /** Resolved */
  resolved: boolean;
  /** Resolved at */
  resolvedAt?: number;
  /** Resolved by */
  resolvedBy?: string;
}

/**
 * Error group (aggregated errors)
 */
export interface ErrorGroup {
  /** Fingerprint hash */
  fingerprint: string;
  /** Error count */
  count: number;
  /** First occurrence */
  firstSeen: number;
  /** Last occurrence */
  lastSeen: number;
  /** Sample error */
  sample: ErrorReport;
  /** Severity */
  severity: ErrorSeverity;
  /** Category */
  category: ErrorCategory;
  /** Status */
  status: 'new' | 'investigating' | 'acknowledged' | 'resolved';
  /** Assigned to */
  assignedTo?: string;
}

/**
 * Error trend analysis
 */
export interface ErrorTrend {
  /** Fingerprint */
  fingerprint: string;
  /** Message pattern */
  message: string;
  /** Current count */
  currentCount: number;
  /** Previous count */
  previousCount: number;
  /** Growth rate */
  growthRate: number;
  /** Trend direction */
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Error summary
 */
export interface ErrorSummary {
  /** Total errors */
  totalErrors: number;
  /** Unique errors */
  uniqueErrors: number;
  /** By severity */
  bySeverity: Record<ErrorSeverity, number>;
  /** By category */
  byCategory: Record<ErrorCategory, number>;
  /** By component */
  byComponent: Record<ErrorComponent, number>;
  /** Error groups */
  groups: ErrorGroup[];
  /** Trends */
  trends: ErrorTrend[];
  /** Time range */
  timeRange: { start: number; end: number };
}

/**
 * Alert configuration
 */
export interface ErrorAlertConfig {
  /** Alert ID */
  id: string;
  /** Alert name */
  name: string;
  /** Conditions */
  conditions: {
    severity?: ErrorSeverity[];
    category?: ErrorCategory[];
    component?: ErrorComponent[];
    threshold?: number;
    timeWindowMs?: number;
  };
  /** Actions */
  actions: {
    channels: ('console' | 'webhook' | 'email' | 'slack')[];
    webhookUrl?: string;
    emailRecipients?: string[];
    messageTemplate?: string;
    rateLimitMs?: number;
  };
  /** Enabled */
  enabled: boolean;
  /** Last triggered */
  lastTriggered?: number;
}

/**
 * Error reporting events
 */
export interface ErrorReportingEvents {
  /** Error reported */
  'error:reported': ErrorReport;
  /** Error group created */
  'error:grouped': ErrorGroup;
  /** Alert triggered */
  'alert:triggered': { alert: ErrorAlertConfig; errors: ErrorReport[] };
  /** Error resolved */
  'error:resolved': { errorId: string };
  /** Summary updated */
  'summary:updated': ErrorSummary;
}

/**
 * Error Reporting API
 */
export interface ErrorReportingAPI {
  // Error reporting
  reportError(error: Error | ErrorReport, context?: Record<string, unknown>): Promise<ErrorReport>;
  reportNetworkError(error: Error, endpoint?: string): Promise<ErrorReport>;
  reportSyncError(error: Error, syncType: string): Promise<ErrorReport>;
  reportAuthError(error: Error, userId?: string): Promise<ErrorReport>;
  reportValidationError(error: Error, data?: unknown): Promise<ErrorReport>;
  reportEncryptionError(error: Error, operation: string): Promise<ErrorReport>;

  // Error management
  getError(errorId: string): Promise<ErrorReport | null>;
  getErrors(options?: GetErrorsOptions): Promise<ErrorReport[]>;
  resolveError(errorId: string, resolvedBy?: string): Promise<void>;
  deleteError(errorId: string): Promise<void>;

  // Error groups
  getErrorGroups(): Promise<ErrorGroup[]>;
  getErrorGroup(fingerprint: string): Promise<ErrorGroup | null>;
  updateErrorGroup(fingerprint: string, updates: Partial<ErrorGroup>): Promise<void>;

  // Error summary
  getSummary(hours?: number): Promise<ErrorSummary>;
  getErrorTrends(hours?: number): Promise<ErrorTrend[]>;

  // Alerts
  createAlert(config: Omit<ErrorAlertConfig, 'id'>): Promise<ErrorAlertConfig>;
  updateAlert(alertId: string, updates: Partial<ErrorAlertConfig>): Promise<ErrorAlertConfig>;
  deleteAlert(alertId: string): Promise<void>;
  getAlerts(): Promise<ErrorAlertConfig[]>;

  // Utilities
  clearErrors(olderThan?: number): Promise<number>;
  exportErrors(format?: 'json' | 'csv'): Promise<string>;
  setUserId(userDid: string): void;
  setSessionId(sessionId: string): void;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

/**
 * Get errors options
 */
export interface GetErrorsOptions {
  severity?: ErrorSeverity[];
  category?: ErrorCategory[];
  component?: ErrorComponent[];
  since?: number;
  until?: number;
  limit?: number;
  unresolvedOnly?: boolean;
}

/**
 * Error Reporting Service Implementation
 */
export class ErrorReportingService implements ErrorReportingAPI {
  private errors: Map<string, ErrorReport> = new Map();
  private errorGroups: Map<string, ErrorGroup> = new Map();
  private alerts: Map<string, ErrorAlertConfig> = new Map();
  private userId?: string;
  private sessionId = generateId();
  private communication: ReturnType<typeof createCommunicationProtocol>;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK) {
    this.communication = createCommunicationProtocol('error-reporting');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[ErrorReporting] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    const unsubError = this.communication.onEvent('message_error', (event) => {
      console.error(`[ErrorReporting] Message error: ${event.error}`);
    });
    this.eventUnsubscribe.push(unsubError);
  }

  // ==========================================================================
  // Error Reporting
  // ==========================================================================

  async reportError(
    error: Error | ErrorReport,
    context: Record<string, unknown> = {}
  ): Promise<ErrorReport> {
    const isReport = this.isErrorReport(error);

    const fingerprint = this.calculateFingerprint(isReport ? error.message : error.message);

    const report: ErrorReport = isReport ? error : {
      id: generateId(),
      message: error.message,
      name: error.name,
      stack: error.stack,
      severity: this.determineSeverity(error),
      category: this.categorizeError(error),
      component: 'sdk',
      source: 'client',
      timestamp: Date.now(),
      userDid: this.userId,
      sessionId: this.sessionId,
      context: {
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
      tags: this.extractTags(error),
      fingerprint,
      resolved: false,
    };

    this.errors.set(report.id, report);

    // Group errors
    await this.groupError(report);

    // Check alerts
    await this.checkAlerts(report);

    // Log to console
    this.logToConsole(report);

    this.emit('error:reported', report);

    return report;
  }

  async reportNetworkError(error: Error, endpoint?: string): Promise<ErrorReport> {
    return await this.reportError(error, { endpoint, layer: 'network' });
  }

  async reportSyncError(error: Error, syncType: string): Promise<ErrorReport> {
    return await this.reportError(error, { syncType, layer: 'sync' });
  }

  async reportAuthError(error: Error, userId?: string): Promise<ErrorReport> {
    return await this.reportError(error, { userId, layer: 'auth' });
  }

  async reportValidationError(error: Error, data?: unknown): Promise<ErrorReport> {
    return await this.reportError(error, { data, layer: 'validation' });
  }

  async reportEncryptionError(error: Error, operation: string): Promise<ErrorReport> {
    return await this.reportError(error, { operation, layer: 'encryption' });
  }

  // ==========================================================================
  // Error Management
  // ==========================================================================

  async getError(errorId: string): Promise<ErrorReport | null> {
    return this.errors.get(errorId) || null;
  }

  async getErrors(options: GetErrorsOptions = {}): Promise<ErrorReport[]> {
    let errors = Array.from(this.errors.values());

    // Filter by severity
    if (options.severity && options.severity.length > 0) {
      errors = errors.filter((e) => options.severity!.includes(e.severity));
    }

    // Filter by category
    if (options.category && options.category.length > 0) {
      errors = errors.filter((e) => options.category!.includes(e.category));
    }

    // Filter by component
    if (options.component && options.component.length > 0) {
      errors = errors.filter((e) => options.component!.includes(e.component));
    }

    // Filter by time
    if (options.since) {
      errors = errors.filter((e) => e.timestamp >= options.since!);
    }
    if (options.until) {
      errors = errors.filter((e) => e.timestamp <= options.until!);
    }

    // Filter unresolved
    if (options.unresolvedOnly) {
      errors = errors.filter((e) => !e.resolved);
    }

    // Limit
    if (options.limit) {
      errors = errors.slice(0, options.limit);
    }

    return errors;
  }

  async resolveError(errorId: string, resolvedBy?: string): Promise<void> {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = Date.now();
      error.resolvedBy = resolvedBy || this.userId;
      this.emit('error:resolved', { errorId });
    }
  }

  async deleteError(errorId: string): Promise<void> {
    this.errors.delete(errorId);
  }

  // ==========================================================================
  // Error Groups
  // ==========================================================================

  async getErrorGroups(): Promise<ErrorGroup[]> {
    return Array.from(this.errorGroups.values());
  }

  async getErrorGroup(fingerprint: string): Promise<ErrorGroup | null> {
    return this.errorGroups.get(fingerprint) || null;
  }

  async updateErrorGroup(
    fingerprint: string,
    updates: Partial<ErrorGroup>
  ): Promise<void> {
    const group = this.errorGroups.get(fingerprint);
    if (group) {
      Object.assign(group, updates);
      this.errorGroups.set(fingerprint, group);
    }
  }

  private async groupError(report: ErrorReport): Promise<void> {
    const fingerprint = report.fingerprint.hash;
    let group = this.errorGroups.get(fingerprint);

    if (!group) {
      group = {
        fingerprint,
        count: 1,
        firstSeen: report.timestamp,
        lastSeen: report.timestamp,
        sample: report,
        severity: report.severity,
        category: report.category,
        status: 'new',
      };
      this.errorGroups.set(fingerprint, group);
      this.emit('error:grouped', group);
    } else {
      group.count++;
      group.lastSeen = report.timestamp;
      group.sample = report; // Update with latest
    }
  }

  // ==========================================================================
  // Error Summary
  // ==========================================================================

  async getSummary(hours: number = 24): Promise<ErrorSummary> {
    const now = Date.now();
    const cutoff = now - hours * 60 * 60 * 1000;

    const errors = Array.from(this.errors.values()).filter(
      (e) => e.timestamp >= cutoff
    );

    const summary: ErrorSummary = {
      totalErrors: errors.length,
      uniqueErrors: this.errorGroups.size,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byCategory: {} as Record<ErrorCategory, number>,
      byComponent: {} as Record<ErrorComponent, number>,
      groups: Array.from(this.errorGroups.values()),
      trends: await this.getErrorTrends(hours),
      timeRange: { start: cutoff, end: now },
    };

    // Count by severity
    for (const error of errors) {
      summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;
    }

    // Count by category
    for (const error of errors) {
      summary.byCategory[error.category] = (summary.byCategory[error.category] || 0) + 1;
    }

    // Count by component
    for (const error of errors) {
      summary.byComponent[error.component] = (summary.byComponent[error.component] || 0) + 1;
    }

    return summary;
  }

  async getErrorTrends(hours: number = 24): Promise<ErrorTrend[]> {
    const now = Date.now();
    const halfWay = now - (hours / 2) * 60 * 60 * 1000;
    const cutoff = now - hours * 60 * 60 * 1000;

    const errors = Array.from(this.errors.values()).filter(
      (e) => e.timestamp >= cutoff
    );

    const trends: ErrorTrend[] = [];

    for (const [fingerprint, group] of this.errorGroups.entries()) {
      const currentCount = errors.filter(
        (e) => e.fingerprint.hash === fingerprint && e.timestamp >= halfWay
      ).length;

      const previousCount = errors.filter(
        (e) => e.fingerprint.hash === fingerprint && e.timestamp < halfWay
      ).length;

      const growthRate = previousCount > 0
        ? ((currentCount - previousCount) / previousCount) * 100
        : currentCount > 0 ? 100 : 0;

      trends.push({
        fingerprint,
        message: group.sample.message,
        currentCount,
        previousCount,
        growthRate,
        trend: growthRate > 10 ? 'increasing' : growthRate < -10 ? 'decreasing' : 'stable',
      });
    }

    return trends.filter((t) => t.currentCount > 0);
  }

  // ==========================================================================
  // Alerts
  // ==========================================================================

  async createAlert(config: Omit<ErrorAlertConfig, 'id'>): Promise<ErrorAlertConfig> {
    const alert: ErrorAlertConfig = {
      ...config,
      id: generateId(),
    };
    this.alerts.set(alert.id, alert);
    return alert;
  }

  async updateAlert(
    alertId: string,
    updates: Partial<ErrorAlertConfig>
  ): Promise<ErrorAlertConfig> {
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

  async getAlerts(): Promise<ErrorAlertConfig[]> {
    return Array.from(this.alerts.values());
  }

  private async checkAlerts(report: ErrorReport): Promise<void> {
    for (const alert of this.alerts.values()) {
      if (!alert.enabled) continue;

      // Check rate limit
      if (alert.lastTriggered && alert.actions.rateLimitMs) {
        const elapsed = Date.now() - alert.lastTriggered;
        if (elapsed < alert.actions.rateLimitMs) continue;
      }

      // Check conditions
      const conditions = alert.conditions;
      let matches = true;

      if (conditions.severity && !conditions.severity.includes(report.severity)) {
        matches = false;
      }
      if (conditions.category && !conditions.category.includes(report.category)) {
        matches = false;
      }
      if (conditions.component && !conditions.component.includes(report.component)) {
        matches = false;
      }

      // Check threshold
      if (conditions.threshold && conditions.timeWindowMs) {
        const windowStart = Date.now() - conditions.timeWindowMs;
        const count = Array.from(this.errors.values()).filter(
          (e) => e.timestamp >= windowStart &&
            e.severity === report.severity &&
            e.category === report.category
        ).length;

        if (count < conditions.threshold) {
          matches = false;
        }
      }

      if (matches) {
        alert.lastTriggered = Date.now();
        this.emit('alert:triggered', { alert, errors: [report] });

        // Execute actions
        this.executeAlertActions(alert, report);
      }
    }
  }

  private executeAlertActions(alert: ErrorAlertConfig, error: ErrorReport): void {
    for (const channel of alert.actions.channels) {
      switch (channel) {
        case 'console':
          console.error(`[ALERT] ${alert.name}: ${error.message}`);
          break;
        case 'webhook':
          if (alert.actions.webhookUrl) {
            this.sendWebhook(alert.actions.webhookUrl, { alert, error }).catch(console.error);
          }
          break;
        case 'email':
        case 'slack':
          // Would require external service integration
          console.log(`[ALERT] Would send to ${channel}: ${error.message}`);
          break;
      }
    }
  }

  private async sendWebhook(url: string, data: unknown): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('[ErrorReporting] Webhook failed:', error);
    }
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  async clearErrors(olderThan?: number): Promise<number> {
    const cutoff = olderThan ? Date.now() - olderThan : 0;
    let cleared = 0;

    for (const [id, error] of this.errors.entries()) {
      if (error.timestamp < cutoff) {
        this.errors.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  async exportErrors(format: 'json' | 'csv' = 'json'): Promise<string> {
    const errors = Array.from(this.errors.values());

    if (format === 'json') {
      return JSON.stringify(errors, null, 2);
    }

    // CSV format
    const headers = ['id', 'message', 'severity', 'category', 'component', 'timestamp', 'resolved'];
    const rows = errors.map((e) =>
      [e.id, e.message, e.severity, e.category, e.component, e.timestamp, e.resolved].join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  setUserId(userDid: string): void {
    this.userId = userDid;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private isErrorReport(error: Error | ErrorReport): error is ErrorReport {
    return 'id' in error && 'fingerprint' in error;
  }

  private calculateFingerprint(message: string): ErrorFingerprint {
    // Simple fingerprinting - normalize message
    const normalized = message
      .replace(/at .*\n/g, '') // Remove stack trace lines
      .replace(/\d+/g, 'N') // Replace numbers
      .replace(/0x[a-f0-9]+/g, 'HEX'); // Replace hex

    const hash = this.simpleHash(normalized);

    return {
      hash,
      pattern: normalized,
    };
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes('fatal') || message.includes('crash')) return 'fatal';
    if (message.includes('critical') || message.includes('unrecoverable')) return 'critical';
    if (message.includes('error') || message.includes('failed')) return 'error';
    if (message.includes('warn') || message.includes('deprecated')) return 'warning';
    if (message.includes('info')) return 'info';
    return 'error';
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('database') || message.includes('sql') || message.includes('prisma')) {
      return 'database';
    }
    if (message.includes('sync') || message.includes('conflict')) {
      return 'sync';
    }
    if (message.includes('auth') || message.includes('permission') || message.includes('token')) {
      return 'auth';
    }
    if (message.includes('valid') || message.includes('schema') || message.includes('type')) {
      return 'validation';
    }
    if (message.includes('encrypt') || message.includes('decrypt') || message.includes('key')) {
      return 'encryption';
    }
    if (message.includes('federation') || message.includes('instance')) {
      return 'federation';
    }

    return 'unknown';
  }

  private extractTags(error: Error): string[] {
    const tags: string[] = [];
    const message = error.message.toLowerCase();

    if (message.includes('timeout')) tags.push('timeout');
    if (message.includes('retry')) tags.push('retry');
    if (message.includes('offline')) tags.push('offline');
    if (message.includes('corrupt')) tags.push('corruption');
    if (message.includes('memory')) tags.push('memory');

    return tags;
  }

  private logToConsole(report: ErrorReport): void {
    const logFn = report.severity === 'error' || report.severity === 'critical' || report.severity === 'fatal'
      ? console.error
      : report.severity === 'warning'
        ? console.warn
        : console.log;

    logFn(`[${report.severity.toUpperCase()}] ${report.name}: ${report.message}`, {
      component: report.component,
      category: report.category,
      timestamp: new Date(report.timestamp).toISOString(),
    });
  }

  // ==========================================================================
  // Communication Protocol
  // ==========================================================================

  getNodeId(): string {
    return 'error-reporting-service';
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
  private emit<K extends keyof ErrorReportingEvents>(
    event: K,
    data: ErrorReportingEvents[K]
  ): void {
    console.log(`[ErrorReporting] Event: ${event}`, data);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.eventUnsubscribe.forEach((unsub) => unsub());
    this.eventUnsubscribe = [];
    this.errors.clear();
    this.errorGroups.clear();
    this.alerts.clear();
  }
}

/**
 * Create Error Reporting Service instance
 */
export function createErrorReportingService(sdk: VivimSDK): ErrorReportingService {
  return new ErrorReportingService(sdk);
}
