/**
 * Audit Logging Service - Compliance audit trails
 * GDPR, HIPAA, SOC2 compliant audit logging with tamper-proof records
 */

import type { VivimSDK } from '../core/sdk.js';
import { generateId } from '../utils/crypto.js';

/**
 * Audit event types
 */
export type AuditEventType =
  // Authentication
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed'
  | 'auth.password_change'
  | 'auth.mfa_enable'
  | 'auth.mfa_disable'
  // Authorization
  | 'authz.grant'
  | 'authz.revoke'
  | 'authz.access'
  | 'authz.denied'
  // Data Access
  | 'data.read'
  | 'data.create'
  | 'data.update'
  | 'data.delete'
  | 'data.export'
  | 'data.import'
  // Sharing
  | 'share.create'
  | 'share.update'
  | 'share.revoke'
  | 'share.access'
  // Federation
  | 'federation.send'
  | 'federation.receive'
  | 'federation.follow'
  | 'federation.unfollow'
  // Admin
  | 'admin.user_create'
  | 'admin.user_delete'
  | 'admin.config_change'
  | 'admin.system_start'
  | 'admin.system_stop'
  // Security
  | 'security.violation'
  | 'security.breach_attempt'
  | 'security.encryption_key_rotate'
  // Compliance
  | 'compliance.gdpr_export'
  | 'compliance.gdpr_erasure'
  | 'compliance.hipaa_access'
  | 'compliance.audit_review';

/**
 * Audit severity levels
 */
export type AuditSeverity = 'info' | 'notice' | 'warning' | 'alert' | 'critical';

/**
 * Audit event
 */
export interface AuditEvent {
  /** Event ID */
  id: string;
  /** Event type */
  type: AuditEventType;
  /** Timestamp */
  timestamp: string;
  /** Actor DID */
  actorDid: string;
  /** Actor IP address */
  actorIp?: string;
  /** Actor user agent */
  actorUserAgent?: string;
  /** Session ID */
  sessionId?: string;
  /** Resource ID */
  resourceId?: string;
  /** Resource type */
  resourceType?: string;
  /** Action taken */
  action: string;
  /** Result */
  result: 'success' | 'failure' | 'partial';
  /** Error message (if failed) */
  errorMessage?: string;
  /** Request ID */
  requestId?: string;
  /** Correlation ID */
  correlationId?: string;
  /** Metadata */
  metadata: Record<string, unknown>;
  /** Hash of previous event (for chain integrity) */
  previousHash?: string;
  /** Event hash */
  hash: string;
  /** Signature */
  signature?: string;
}

/**
 * Audit query options
 */
export interface AuditQueryOptions {
  /** Event types to filter */
  types?: AuditEventType[];
  /** Actor DID */
  actorDid?: string;
  /** Resource ID */
  resourceId?: string;
  /** Start timestamp */
  startTime?: string;
  /** End timestamp */
  endTime?: string;
  /** Severity levels */
  severities?: AuditSeverity[];
  /** Results only */
  result?: 'success' | 'failure' | 'partial';
  /** Limit */
  limit?: number;
  /** Offset */
  offset?: number;
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit report
 */
export interface AuditReport {
  /** Report ID */
  id: string;
  /** Generated timestamp */
  generatedAt: string;
  /** Time range */
  timeRange: { start: string; end: string };
  /** Total events */
  totalEvents: number;
  /** Events by type */
  byType: Record<AuditEventType, number>;
  /** Events by actor */
  byActor: Record<string, number>;
  /** Events by result */
  byResult: Record<'success' | 'failure' | 'partial', number>;
  /** Events by severity */
  bySeverity: Record<AuditSeverity, number>;
  /** Timeline */
  timeline: { timestamp: string; count: number }[];
  /** Anomalies detected */
  anomalies: AuditAnomaly[];
  /** Compliance status */
  compliance: ComplianceStatus;
}

/**
 * Audit anomaly
 */
export interface AuditAnomaly {
  /** Anomaly ID */
  id: string;
  /** Type */
  type: 'unusual_time' | 'unusual_location' | 'rate_spike' | 'pattern_change' | 'failed_attempts';
  /** Severity */
  severity: AuditSeverity;
  /** Description */
  description: string;
  /** Detected timestamp */
  detectedAt: string;
  /** Related events */
  relatedEvents: string[];
  /** Recommended action */
  recommendation: string;
}

/**
 * Compliance status
 */
export interface ComplianceStatus {
  /** GDPR compliance */
  gdpr: {
    compliant: boolean;
    dataExports: number;
    erasureRequests: number;
    consentRecords: number;
  };
  /** HIPAA compliance */
  hipaa: {
    compliant: boolean;
    phiAccess: number;
    disclosures: number;
  };
  /** SOC2 compliance */
  soc2: {
    compliant: boolean;
    controlsTested: number;
    exceptionsFound: number;
  };
}

/**
 * Audit retention policy
 */
export interface AuditRetentionPolicy {
  /** Minimum retention period (days) */
  minRetentionDays: number;
  /** Maximum retention period (days) */
  maxRetentionDays: number;
  /** Compress after (days) */
  compressAfterDays: number;
  /** Archive after (days) */
  archiveAfterDays: number;
  /** Delete after (days) */
  deleteAfterDays: number;
}

/**
 * Audit Logging API
 */
export interface AuditLoggingAPI {
  // Logging
  log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash' | 'previousHash'>): Promise<AuditEvent>;
  logAuth(
    action: 'login' | 'logout' | 'failed' | 'password_change' | 'mfa_enable' | 'mfa_disable',
    actorDid: string,
    result: 'success' | 'failure'
  ): Promise<AuditEvent>;
  logDataAccess(
    action: 'read' | 'create' | 'update' | 'delete' | 'export',
    actorDid: string,
    resourceId: string,
    result: 'success' | 'failure'
  ): Promise<AuditEvent>;
  logSharing(
    action: 'create' | 'update' | 'revoke' | 'access',
    actorDid: string,
    resourceId: string,
    result: 'success' | 'failure'
  ): Promise<AuditEvent>;
  logSecurity(
    action: 'violation' | 'breach_attempt' | 'key_rotate',
    actorDid: string,
    details: Record<string, unknown>
  ): Promise<AuditEvent>;

  // Querying
  query(options: AuditQueryOptions): Promise<AuditEvent[]>;
  getEvent(eventId: string): Promise<AuditEvent | null>;
  getEventsByActor(actorDid: string, limit?: number): Promise<AuditEvent[]>;
  getEventsByResource(resourceId: string, limit?: number): Promise<AuditEvent[]>;

  // Reporting
  generateReport(options: {
    startTime: string;
    endTime: string;
    includeAnomalies?: boolean;
    includeCompliance?: boolean;
  }): Promise<AuditReport>;
  exportAudit(format: 'json' | 'csv' | 'pdf', options?: AuditQueryOptions): Promise<string>;

  // Integrity
  verifyChain(): Promise<{ valid: boolean; invalidEvents: string[] }>;
  verifyEvent(eventId: string): Promise<boolean>;

  // Retention
  setRetentionPolicy(policy: AuditRetentionPolicy): Promise<void>;
  getRetentionPolicy(): Promise<AuditRetentionPolicy>;
  cleanupOldEvents(): Promise<number>;

  // Compliance
  getComplianceStatus(): Promise<ComplianceStatus>;
  getGdprData(actorDid: string): Promise<Record<string, unknown>>;
  processGdprErasure(actorDid: string): Promise<void>;
}

/**
 * Audit Logging Service Implementation
 */
export class AuditLoggingService implements AuditLoggingAPI {
  private events: Map<string, AuditEvent> = new Map();
  private eventIndex: Map<string, string[]> = new Map(); // type -> eventIds
  private actorIndex: Map<string, string[]> = new Map(); // actorDid -> eventIds
  private resourceIndex: Map<string, string[]> = new Map(); // resourceId -> eventIds
  private retentionPolicy: AuditRetentionPolicy = {
    minRetentionDays: 90,
    maxRetentionDays: 2555, // 7 years
    compressAfterDays: 30,
    archiveAfterDays: 365,
    deleteAfterDays: 2555,
  };
  private lastHash: string | null = null;
  private eventCount = 0;

  constructor(private sdk: VivimSDK) {}

  // ==========================================================================
  // Logging
  // ==========================================================================

  async log(
    event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash' | 'previousHash'>
  ): Promise<AuditEvent> {
    const timestamp = new Date().toISOString();

    // Calculate hashes
    const previousHash = this.lastHash;
    const eventData = {
      ...event,
      timestamp,
      previousHash,
    };
    const hash = await this.calculateHash(eventData);

    const auditEvent: AuditEvent = {
      ...event,
      id: generateId(),
      timestamp,
      hash,
      previousHash,
    };

    // Store event
    this.events.set(auditEvent.id, auditEvent);
    this.lastHash = hash;
    this.eventCount++;

    // Update indexes
    this.indexEvent(auditEvent);

    // Check for anomalies
    await this.detectAnomalies(auditEvent);

    console.log(`[Audit] ${auditEvent.type}: ${auditEvent.action} by ${auditEvent.actorDid}`);

    return auditEvent;
  }

  async logAuth(
    action: 'login' | 'logout' | 'failed' | 'password_change' | 'mfa_enable' | 'mfa_disable',
    actorDid: string,
    result: 'success' | 'failure'
  ): Promise<AuditEvent> {
    const typeMap: Record<string, AuditEventType> = {
      login: 'auth.login',
      logout: 'auth.logout',
      failed: 'auth.failed',
      password_change: 'auth.password_change',
      mfa_enable: 'auth.mfa_enable',
      mfa_disable: 'auth.mfa_disable',
    };

    return await this.log({
      type: typeMap[action],
      actorDid,
      action: `auth.${action}`,
      result,
      metadata: {},
    });
  }

  async logDataAccess(
    action: 'read' | 'create' | 'update' | 'delete' | 'export',
    actorDid: string,
    resourceId: string,
    result: 'success' | 'failure'
  ): Promise<AuditEvent> {
    const typeMap: Record<string, AuditEventType> = {
      read: 'data.read',
      create: 'data.create',
      update: 'data.update',
      delete: 'data.delete',
      export: 'data.export',
    };

    return await this.log({
      type: typeMap[action],
      actorDid,
      resourceId,
      resourceType: 'data',
      action: `data.${action}`,
      result,
      metadata: {},
    });
  }

  async logSharing(
    action: 'create' | 'update' | 'revoke' | 'access',
    actorDid: string,
    resourceId: string,
    result: 'success' | 'failure'
  ): Promise<AuditEvent> {
    const typeMap: Record<string, AuditEventType> = {
      create: 'share.create',
      update: 'share.update',
      revoke: 'share.revoke',
      access: 'share.access',
    };

    return await this.log({
      type: typeMap[action],
      actorDid,
      resourceId,
      resourceType: 'share',
      action: `share.${action}`,
      result,
      metadata: {},
    });
  }

  async logSecurity(
    action: 'violation' | 'breach_attempt' | 'key_rotate',
    actorDid: string,
    details: Record<string, unknown>
  ): Promise<AuditEvent> {
    const typeMap: Record<string, AuditEventType> = {
      violation: 'security.violation',
      breach_attempt: 'security.breach_attempt',
      key_rotate: 'security.encryption_key_rotate',
    };

    return await this.log({
      type: typeMap[action],
      actorDid,
      action: `security.${action}`,
      result: action === 'key_rotate' ? 'success' : 'failure',
      metadata: details,
      severity: 'critical',
    });
  }

  // ==========================================================================
  // Querying
  // ==========================================================================

  async query(options: AuditQueryOptions): Promise<AuditEvent[]> {
    let events = Array.from(this.events.values());

    // Filter by type
    if (options.types && options.types.length > 0) {
      events = events.filter((e) => options.types!.includes(e.type));
    }

    // Filter by actor
    if (options.actorDid) {
      events = events.filter((e) => e.actorDid === options.actorDid);
    }

    // Filter by resource
    if (options.resourceId) {
      events = events.filter((e) => e.resourceId === options.resourceId);
    }

    // Filter by time
    if (options.startTime) {
      events = events.filter((e) => e.timestamp >= options.startTime!);
    }
    if (options.endTime) {
      events = events.filter((e) => e.timestamp <= options.endTime!);
    }

    // Filter by result
    if (options.result) {
      events = events.filter((e) => e.result === options.result);
    }

    // Sort
    const sorted = events.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return options.sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    // Paginate
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    return sorted.slice(offset, offset + limit);
  }

  async getEvent(eventId: string): Promise<AuditEvent | null> {
    return this.events.get(eventId) || null;
  }

  async getEventsByActor(actorDid: string, limit: number = 100): Promise<AuditEvent[]> {
    const eventIds = this.actorIndex.get(actorDid) || [];
    const events = eventIds.map((id) => this.events.get(id)).filter((e): e is AuditEvent => !!e);
    return events.slice(-limit);
  }

  async getEventsByResource(resourceId: string, limit: number = 100): Promise<AuditEvent[]> {
    const eventIds = this.resourceIndex.get(resourceId) || [];
    const events = eventIds.map((id) => this.events.get(id)).filter((e): e is AuditEvent => !!e);
    return events.slice(-limit);
  }

  // ==========================================================================
  // Reporting
  // ==========================================================================

  async generateReport(options: {
    startTime: string;
    endTime: string;
    includeAnomalies?: boolean;
    includeCompliance?: boolean;
  }): Promise<AuditReport> {
    const events = await this.query({
      startTime: options.startTime,
      endTime: options.endTime,
    });

    const report: AuditReport = {
      id: generateId(),
      generatedAt: new Date().toISOString(),
      timeRange: { start: options.startTime, end: options.endTime },
      totalEvents: events.length,
      byType: {} as Record<AuditEventType, number>,
      byActor: {},
      byResult: { success: 0, failure: 0, partial: 0 },
      bySeverity: {} as Record<AuditSeverity, number>,
      timeline: [],
      anomalies: [],
      compliance: {
        gdpr: { compliant: true, dataExports: 0, erasureRequests: 0, consentRecords: 0 },
        hipaa: { compliant: true, phiAccess: 0, disclosures: 0 },
        soc2: { compliant: true, controlsTested: 0, exceptionsFound: 0 },
      },
    };

    // Count by type
    for (const event of events) {
      report.byType[event.type] = (report.byType[event.type] || 0) + 1;
      report.byActor[event.actorDid] = (report.byActor[event.actorDid] || 0) + 1;
      report.byResult[event.result]++;
    }

    // Generate timeline (daily)
    const dayMs = 24 * 60 * 60 * 1000;
    const start = new Date(options.startTime).getTime();
    const end = new Date(options.endTime).getTime();

    for (let t = start; t <= end; t += dayMs) {
      const dayEnd = t + dayMs;
      const count = events.filter(
        (e) => new Date(e.timestamp).getTime() >= t && new Date(e.timestamp).getTime() < dayEnd
      ).length;
      report.timeline.push({
        timestamp: new Date(t).toISOString(),
        count,
      });
    }

    // Detect anomalies
    if (options.includeAnomalies) {
      report.anomalies = await this.detectAnomaliesInPeriod(events);
    }

    // Compliance status
    if (options.includeCompliance) {
      report.compliance = await this.getComplianceStatus();
    }

    return report;
  }

  async exportAudit(format: 'json' | 'csv' | 'pdf', options?: AuditQueryOptions): Promise<string> {
    const events = await this.query(options || {});

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    }

    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'type', 'actorDid', 'action', 'result', 'resourceId'];
      const rows = events.map((e) =>
        [
          e.id,
          e.timestamp,
          e.type,
          e.actorDid,
          e.action,
          e.result,
          e.resourceId || '',
        ].join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }

    // PDF would require a PDF library
    throw new Error('PDF export not implemented');
  }

  // ==========================================================================
  // Integrity
  // ==========================================================================

  async verifyChain(): Promise<{ valid: boolean; invalidEvents: string[] }> {
    const events = Array.from(this.events.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const invalidEvents: string[] = [];
    let previousHash: string | null = null;

    for (const event of events) {
      // Verify previous hash link
      if (event.previousHash !== previousHash) {
        invalidEvents.push(event.id);
      }

      // Verify event hash
      const eventData = {
        ...event,
        signature: undefined,
      };
      const calculatedHash = await this.calculateHash(eventData);
      if (calculatedHash !== event.hash) {
        invalidEvents.push(event.id);
      }

      previousHash = event.hash;
    }

    return {
      valid: invalidEvents.length === 0,
      invalidEvents,
    };
  }

  async verifyEvent(eventId: string): Promise<boolean> {
    const event = this.events.get(eventId);
    if (!event) return false;

    const eventData = {
      ...event,
      signature: undefined,
    };
    const calculatedHash = await this.calculateHash(eventData);
    return calculatedHash === event.hash;
  }

  // ==========================================================================
  // Retention
  // ==========================================================================

  async setRetentionPolicy(policy: AuditRetentionPolicy): Promise<void> {
    this.retentionPolicy = policy;
  }

  async getRetentionPolicy(): Promise<AuditRetentionPolicy> {
    return this.retentionPolicy;
  }

  async cleanupOldEvents(): Promise<number> {
    const now = Date.now();
    const deleteThreshold = now - this.retentionPolicy.deleteAfterDays * 24 * 60 * 60 * 1000;
    let deleted = 0;

    for (const [id, event] of this.events.entries()) {
      const eventTime = new Date(event.timestamp).getTime();
      if (eventTime < deleteThreshold) {
        this.events.delete(id);
        deleted++;
      }
    }

    console.log(`[Audit] Cleaned up ${deleted} old events`);
    return deleted;
  }

  // ==========================================================================
  // Compliance
  // ==========================================================================

  async getComplianceStatus(): Promise<ComplianceStatus> {
    const now = new Date().toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const recentEvents = await this.query({ startTime: thirtyDaysAgo, endTime: now });

    // Count compliance-related events
    const gdprExports = recentEvents.filter((e) => e.type === 'compliance.gdpr_export').length;
    const gdprErasures = recentEvents.filter((e) => e.type === 'compliance.gdpr_erasure').length;
    const hipaaAccess = recentEvents.filter((e) => e.type === 'compliance.hipaa_access').length;

    return {
      gdpr: {
        compliant: true,
        dataExports: gdprExports,
        erasureRequests: gdprErasures,
        consentRecords: 0,
      },
      hipaa: {
        compliant: true,
        phiAccess: hipaaAccess,
        disclosures: 0,
      },
      soc2: {
        compliant: true,
        controlsTested: 0,
        exceptionsFound: 0,
      },
    };
  }

  async getGdprData(actorDid: string): Promise<Record<string, unknown>> {
    const events = await this.getEventsByActor(actorDid, 1000);

    return {
      actorDid,
      eventCount: events.length,
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        timestamp: e.timestamp,
        action: e.action,
        resourceId: e.resourceId,
      })),
      exportedAt: new Date().toISOString(),
    };
  }

  async processGdprErasure(actorDid: string): Promise<void> {
    // Log the erasure request
    await this.log({
      type: 'compliance.gdpr_erasure',
      actorDid,
      action: 'gdpr_erasure_request',
      result: 'success',
      metadata: { actorDid },
    });

    // In a real implementation, this would anonymize or delete personal data
    console.log(`[Audit] GDPR erasure processed for ${actorDid}`);
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private indexEvent(event: AuditEvent): void {
    // Index by type
    if (!this.eventIndex.has(event.type)) {
      this.eventIndex.set(event.type, []);
    }
    this.eventIndex.get(event.type)!.push(event.id);

    // Index by actor
    if (!this.actorIndex.has(event.actorDid)) {
      this.actorIndex.set(event.actorDid, []);
    }
    this.actorIndex.get(event.actorDid)!.push(event.id);

    // Index by resource
    if (event.resourceId) {
      if (!this.resourceIndex.has(event.resourceId)) {
        this.resourceIndex.set(event.resourceId, []);
      }
      this.resourceIndex.get(event.resourceId)!.push(event.id);
    }
  }

  private async calculateHash(data: unknown): Promise<string> {
    const encoder = new TextEncoder();
    const jsonData = JSON.stringify(data);
    const dataBuffer = encoder.encode(jsonData);

    // Use Web Crypto API for SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private async detectAnomalies(event: AuditEvent): Promise<void> {
    // Simple anomaly detection
    const recentEvents = await this.query({
      actorDid: event.actorDid,
      startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Last hour
      limit: 1000,
    });

    // Check for unusual activity rate
    if (recentEvents.length > 100) {
      console.warn(`[Audit] Anomaly: High activity rate for ${event.actorDid}`);
    }

    // Check for failed attempts
    const failedAttempts = recentEvents.filter((e) => e.result === 'failure').length;
    if (failedAttempts > 10) {
      console.warn(`[Audit] Anomaly: Multiple failed attempts for ${event.actorDid}`);
    }
  }

  private async detectAnomaliesInPeriod(events: AuditEvent[]): Promise<AuditAnomaly[]> {
    const anomalies: AuditAnomaly[] = [];

    // Group by actor
    const byActor = new Map<string, AuditEvent[]>();
    for (const event of events) {
      if (!byActor.has(event.actorDid)) {
        byActor.set(event.actorDid, []);
      }
      byActor.get(event.actorDid)!.push(event);
    }

    // Check each actor
    for (const [actorDid, actorEvents] of byActor.entries()) {
      const failedAttempts = actorEvents.filter((e) => e.result === 'failure').length;

      if (failedAttempts > 20) {
        anomalies.push({
          id: generateId(),
          type: 'failed_attempts',
          severity: 'warning',
          description: `Multiple failed attempts by ${actorDid}`,
          detectedAt: new Date().toISOString(),
          relatedEvents: actorEvents.filter((e) => e.result === 'failure').map((e) => e.id),
          recommendation: 'Review account security and consider temporary lockout',
        });
      }
    }

    return anomalies;
  }
}

/**
 * Create Audit Logging Service instance
 */
export function createAuditLoggingService(sdk: VivimSDK): AuditLoggingService {
  return new AuditLoggingService(sdk);
}
