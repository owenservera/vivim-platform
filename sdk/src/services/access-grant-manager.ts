/**
 * Access Grant Manager - Enhanced access grant tracking and management
 * Time-limited grants, revocable access, and audit logging
 */

import type { VivimSDK } from '../core/sdk.js';
import { generateId } from '../utils/crypto.js';
import type { PermissionType, AccessGrant, AccessCheckResult } from '../nodes/sharing-policy-node.js';

/**
 * Grant types
 */
export type GrantType =
  | 'direct'        // Directly granted
  | 'inherited'     // Inherited from circle/role
  | 'temporary'     // Time-limited
  | 'one-time'      // Single use
  | 'delegated';    // Delegated from another grant

/**
 * Grant status
 */
export type GrantStatus =
  | 'active'
  | 'revoked'
  | 'expired'
  | 'consumed'
  | 'suspended';

/**
 * Enhanced access grant
 */
export interface EnhancedAccessGrant extends AccessGrant {
  /** Grant type */
  grantType: GrantType;
  /** Current status */
  status: GrantStatus;
  /** Usage count (for one-time grants) */
  usageCount: number;
  /** Max usage (0 = unlimited) */
  maxUsage: number;
  /** Parent grant ID (for delegated grants) */
  parentGrantId?: string;
  /** Delegation chain depth */
  delegationDepth: number;
  /** Can redelegate */
  canRedelegate: boolean;
  /** Audit log */
  auditLog: GrantAuditEntry[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Audit log entry
 */
export interface GrantAuditEntry {
  /** Entry ID */
  id: string;
  /** Timestamp */
  timestamp: number;
  /** Action */
  action: 'created' | 'used' | 'revoked' | 'suspended' | 'resumed' | 'expired';
  /** Actor DID */
  actorDid: string;
  /** Reason */
  reason?: string;
  /** IP address (optional) */
  ipAddress?: string;
  /** User agent (optional) */
  userAgent?: string;
}

/**
 * Grant template for批量 creation
 */
export interface GrantTemplate {
  /** Template ID */
  id: string;
  /** Name */
  name: string;
  /** Default permissions */
  permissions: PermissionType[];
  /** Default duration (ms) */
  defaultDuration?: number;
  /** Max redelegation depth */
  maxRedelegationDepth?: number;
  /** Require approval for redelegation */
  requireApproval?: boolean;
  /** Allowed grantee DIDs (empty = anyone) */
  allowedGrantees?: string[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Grant request (for approval workflow)
 */
export interface GrantRequest {
  /** Request ID */
  id: string;
  /** Content ID */
  contentId: string;
  /** Requester DID */
  requesterDid: string;
  /** Requested permissions */
  requestedPermissions: PermissionType[];
  /** Reason for request */
  reason?: string;
  /** Requested duration (ms) */
  requestedDuration?: number;
  /** Status */
  status: 'pending' | 'approved' | 'rejected';
  /** Created timestamp */
  createdAt: number;
  /** Responded timestamp */
  respondedAt?: number;
  /** Responded by DID */
  respondedBy?: string;
  /** Response reason */
  responseReason?: string;
}

/**
 * Grant analytics
 */
export interface GrantAnalytics {
  /** Total grants */
  totalGrants: number;
  /** Active grants */
  activeGrants: number;
  /** Revoked grants */
  revokedGrants: number;
  /** Expired grants */
  expiredGrants: number;
  /** Grants by type */
  byType: Record<GrantType, number>;
  /** Grants by status */
  byStatus: Record<GrantStatus, number>;
  /** Most granted permissions */
  topPermissions: Record<PermissionType, number>;
  /** Grant usage over time */
  usageOverTime: { timestamp: number; count: number }[];
}

/**
 * Access Grant Manager API
 */
export interface AccessGrantManagerAPI {
  // Grant CRUD
  createGrant(
    contentId: string,
    granteeDid: string,
    permissions: PermissionType[],
    options?: CreateGrantOptions
  ): Promise<EnhancedAccessGrant>;
  getGrant(grantId: string): Promise<EnhancedAccessGrant | null>;
  updateGrant(grantId: string, updates: UpdateGrantOptions): Promise<EnhancedAccessGrant>;
  deleteGrant(grantId: string): Promise<void>;

  // Grant lifecycle
  revokeGrant(grantId: string, reason?: string): Promise<void>;
  suspendGrant(grantId: string, reason?: string): Promise<void>;
  resumeGrant(grantId: string): Promise<void>;
  consumeGrant(grantId: string): Promise<void>;

  // Grant checking
  checkGrant(grantId: string, requestedPermissions?: PermissionType[]): Promise<AccessCheckResult>;
  getGrantsForContent(contentId: string): Promise<EnhancedAccessGrant[]>;
  getGrantsForUser(userDid: string): Promise<EnhancedAccessGrant[]>;

  // Grant requests
  requestAccess(
    contentId: string,
    permissions: PermissionType[],
    options?: RequestAccessOptions
  ): Promise<GrantRequest>;
  approveRequest(requestId: string, permissions?: PermissionType[]): Promise<EnhancedAccessGrant>;
  rejectRequest(requestId: string, reason?: string): Promise<void>;
  getPendingRequests(contentId?: string): Promise<GrantRequest[]>;

  // Templates
  createTemplate(template: GrantTemplate): Promise<GrantTemplate>;
  getTemplate(templateId: string): Promise<GrantTemplate | null>;
  deleteTemplate(templateId: string): Promise<void>;
  listTemplates(): Promise<GrantTemplate[]>;
  createGrantFromTemplate(
    templateId: string,
    contentId: string,
    granteeDid: string
  ): Promise<EnhancedAccessGrant>;

  // Analytics
  getAnalytics(contentId?: string): Promise<GrantAnalytics>;
  getAuditLog(grantId: string): Promise<GrantAuditEntry[]>;
  exportGrants(contentId?: string): Promise<EnhancedAccessGrant[]>;

  // Cleanup
  cleanupExpiredGrants(): Promise<number>;
  cleanupConsumedGrants(): Promise<number>;
}

/**
 * Create grant options
 */
export interface CreateGrantOptions {
  grantType?: GrantType;
  expiresAt?: number;
  maxUsage?: number;
  parentGrantId?: string;
  canRedelegate?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Update grant options
 */
export interface UpdateGrantOptions {
  permissions?: PermissionType[];
  expiresAt?: number;
  maxUsage?: number;
  canRedelegate?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Request access options
 */
export interface RequestAccessOptions {
  reason?: string;
  requestedDuration?: number;
}

/**
 * Access Grant Manager Implementation
 */
export class AccessGrantManager implements AccessGrantManagerAPI {
  private grants: Map<string, EnhancedAccessGrant> = new Map();
  private requests: Map<string, GrantRequest> = new Map();
  private templates: Map<string, GrantTemplate> = new Map();
  private contentIndex: Map<string, Set<string>> = new Map(); // contentId -> grantIds
  private userIndex: Map<string, Set<string>> = new Map(); // userDid -> grantIds

  constructor(private sdk: VivimSDK) {}

  // ==========================================================================
  // Grant CRUD
  // ==========================================================================

  async createGrant(
    contentId: string,
    granteeDid: string,
    permissions: PermissionType[],
    options: CreateGrantOptions = {}
  ): Promise<EnhancedAccessGrant> {
    const identity = await this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity required');
    }

    const grant: EnhancedAccessGrant = {
      id: generateId(),
      contentId,
      granteeDid,
      grantedBy: identity.did,
      permissions,
      expiresAt: options.expiresAt,
      createdAt: Date.now(),
      grantType: options.grantType || 'direct',
      status: 'active',
      usageCount: 0,
      maxUsage: options.maxUsage || 0,
      parentGrantId: options.parentGrantId,
      delegationDepth: options.parentGrantId ? 1 : 0,
      canRedelegate: options.canRedelegate ?? true,
      auditLog: [
        {
          id: generateId(),
          timestamp: Date.now(),
          action: 'created',
          actorDid: identity.did,
        },
      ],
      metadata: options.metadata,
    };

    this.grants.set(grant.id, grant);

    // Update indexes
    if (!this.contentIndex.has(contentId)) {
      this.contentIndex.set(contentId, new Set());
    }
    this.contentIndex.get(contentId)!.add(grant.id);

    if (!this.userIndex.has(granteeDid)) {
      this.userIndex.set(granteeDid, new Set());
    }
    this.userIndex.get(granteeDid)!.add(grant.id);

    return grant;
  }

  async getGrant(grantId: string): Promise<EnhancedAccessGrant | null> {
    return this.grants.get(grantId) || null;
  }

  async updateGrant(
    grantId: string,
    updates: UpdateGrantOptions
  ): Promise<EnhancedAccessGrant> {
    const grant = this.grants.get(grantId);
    if (!grant) {
      throw new Error(`Grant not found: ${grantId}`);
    }

    const updated: EnhancedAccessGrant = {
      ...grant,
      permissions: updates.permissions || grant.permissions,
      expiresAt: updates.expiresAt ?? grant.expiresAt,
      maxUsage: updates.maxUsage ?? grant.maxUsage,
      canRedelegate: updates.canRedelegate ?? grant.canRedelegate,
      metadata: updates.metadata ? { ...grant.metadata, ...updates.metadata } : grant.metadata,
    };

    this.grants.set(grantId, updated);
    return updated;
  }

  async deleteGrant(grantId: string): Promise<void> {
    const grant = this.grants.get(grantId);
    if (grant) {
      this.grants.delete(grantId);
      this.contentIndex.get(grant.contentId)?.delete(grantId);
      this.userIndex.get(grant.granteeDid)?.delete(grantId);
    }
  }

  // ==========================================================================
  // Grant Lifecycle
  // ==========================================================================

  async revokeGrant(grantId: string, reason?: string): Promise<void> {
    const grant = this.grants.get(grantId);
    if (!grant) return;

    const identity = await this.sdk.getIdentity();

    grant.status = 'revoked';
    grant.auditLog.push({
      id: generateId(),
      timestamp: Date.now(),
      action: 'revoked',
      actorDid: identity?.did || 'unknown',
      reason,
    });
  }

  async suspendGrant(grantId: string, reason?: string): Promise<void> {
    const grant = this.grants.get(grantId);
    if (!grant) return;

    const identity = await this.sdk.getIdentity();

    grant.status = 'suspended';
    grant.auditLog.push({
      id: generateId(),
      timestamp: Date.now(),
      action: 'suspended',
      actorDid: identity?.did || 'unknown',
      reason,
    });
  }

  async resumeGrant(grantId: string): Promise<void> {
    const grant = this.grants.get(grantId);
    if (!grant || grant.status !== 'suspended') return;

    grant.status = 'active';
    grant.auditLog.push({
      id: generateId(),
      timestamp: Date.now(),
      action: 'resumed',
      actorDid: (await this.sdk.getIdentity())?.did || 'unknown',
    });
  }

  async consumeGrant(grantId: string): Promise<void> {
    const grant = this.grants.get(grantId);
    if (!grant) return;

    grant.usageCount++;
    grant.auditLog.push({
      id: generateId(),
      timestamp: Date.now(),
      action: 'used',
      actorDid: grant.granteeDid,
    });

    // Check if max usage reached
    if (grant.maxUsage > 0 && grant.usageCount >= grant.maxUsage) {
      grant.status = 'consumed';
    }
  }

  // ==========================================================================
  // Grant Checking
  // ==========================================================================

  async checkGrant(
    grantId: string,
    requestedPermissions: PermissionType[] = []
  ): Promise<AccessCheckResult> {
    const grant = this.grants.get(grantId);

    if (!grant) {
      return {
        granted: false,
        reason: 'Grant not found',
        permissions: [],
        missingPermissions: requestedPermissions,
      };
    }

    // Check status
    if (grant.status !== 'active') {
      return {
        granted: false,
        reason: `Grant is ${grant.status}`,
        permissions: [],
        missingPermissions: requestedPermissions,
      };
    }

    // Check expiration
    if (grant.expiresAt && Date.now() > grant.expiresAt) {
      grant.status = 'expired';
      return {
        granted: false,
        reason: 'Grant expired',
        permissions: [],
        missingPermissions: requestedPermissions,
      };
    }

    // Check usage limit
    if (grant.maxUsage > 0 && grant.usageCount >= grant.maxUsage) {
      return {
        granted: false,
        reason: 'Grant usage limit reached',
        permissions: [],
        missingPermissions: requestedPermissions,
      };
    }

    // Check permissions
    const grantedPermissions = requestedPermissions.filter((p) =>
      grant.permissions.includes(p)
    );
    const missing = requestedPermissions.filter((p) => !grant.permissions.includes(p));

    return {
      granted: grantedPermissions.length > 0 || requestedPermissions.length === 0,
      permissions: grantedPermissions,
      missingPermissions: missing,
    };
  }

  async getGrantsForContent(contentId: string): Promise<EnhancedAccessGrant[]> {
    const grantIds = this.contentIndex.get(contentId);
    if (!grantIds) return [];

    const grants: EnhancedAccessGrant[] = [];
    for (const id of grantIds) {
      const grant = this.grants.get(id);
      if (grant) grants.push(grant);
    }
    return grants;
  }

  async getGrantsForUser(userDid: string): Promise<EnhancedAccessGrant[]> {
    const grantIds = this.userIndex.get(userDid);
    if (!grantIds) return [];

    const grants: EnhancedAccessGrant[] = [];
    for (const id of grantIds) {
      const grant = this.grants.get(id);
      if (grant) grants.push(grant);
    }
    return grants;
  }

  // ==========================================================================
  // Grant Requests
  // ==========================================================================

  async requestAccess(
    contentId: string,
    permissions: PermissionType[],
    options: RequestAccessOptions = {}
  ): Promise<GrantRequest> {
    const identity = await this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity required');
    }

    const request: GrantRequest = {
      id: generateId(),
      contentId,
      requesterDid: identity.did,
      requestedPermissions: permissions,
      reason: options.reason,
      requestedDuration: options.requestedDuration,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.requests.set(request.id, request);
    return request;
  }

  async approveRequest(
    requestId: string,
    permissions?: PermissionType[]
  ): Promise<EnhancedAccessGrant> {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    const identity = await this.sdk.getIdentity();

    request.status = 'approved';
    request.respondedAt = Date.now();
    request.respondedBy = identity?.did;

    // Create grant
    const grant = await this.createGrant(
      request.contentId,
      request.requesterDid,
      permissions || request.requestedPermissions,
      {
        expiresAt: request.requestedDuration
          ? Date.now() + request.requestedDuration
          : undefined,
      }
    );

    return grant;
  }

  async rejectRequest(requestId: string, reason?: string): Promise<void> {
    const request = this.requests.get(requestId);
    if (!request) return;

    const identity = await this.sdk.getIdentity();

    request.status = 'rejected';
    request.respondedAt = Date.now();
    request.respondedBy = identity?.did;
    request.responseReason = reason;
  }

  async getPendingRequests(contentId?: string): Promise<GrantRequest[]> {
    const requests = Array.from(this.requests.values()).filter(
      (r) => r.status === 'pending'
    );

    if (contentId) {
      return requests.filter((r) => r.contentId === contentId);
    }

    return requests;
  }

  // ==========================================================================
  // Templates
  // ==========================================================================

  async createTemplate(template: GrantTemplate): Promise<GrantTemplate> {
    this.templates.set(template.id, template);
    return template;
  }

  async getTemplate(templateId: string): Promise<GrantTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    this.templates.delete(templateId);
  }

  async listTemplates(): Promise<GrantTemplate[]> {
    return Array.from(this.templates.values());
  }

  async createGrantFromTemplate(
    templateId: string,
    contentId: string,
    granteeDid: string
  ): Promise<EnhancedAccessGrant> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Check if grantee is allowed
    if (
      template.allowedGrantees &&
      template.allowedGrantees.length > 0 &&
      !template.allowedGrantees.includes(granteeDid)
    ) {
      throw new Error('Grantee not allowed for this template');
    }

    return await this.createGrant(contentId, granteeDid, template.permissions, {
      grantType: 'direct',
      canRedelegate: template.requireApproval === false,
      metadata: template.metadata,
    });
  }

  // ==========================================================================
  // Analytics
  // ==========================================================================

  async getAnalytics(contentId?: string): Promise<GrantAnalytics> {
    let grants = Array.from(this.grants.values());

    if (contentId) {
      grants = grants.filter((g) => g.contentId === contentId);
    }

    const analytics: GrantAnalytics = {
      totalGrants: grants.length,
      activeGrants: grants.filter((g) => g.status === 'active').length,
      revokedGrants: grants.filter((g) => g.status === 'revoked').length,
      expiredGrants: grants.filter((g) => g.status === 'expired').length,
      byType: {} as Record<GrantType, number>,
      byStatus: {} as Record<GrantStatus, number>,
      topPermissions: {} as Record<PermissionType, number>,
      usageOverTime: [],
    };

    // Count by type
    for (const grant of grants) {
      analytics.byType[grant.grantType] = (analytics.byType[grant.grantType] || 0) + 1;
    }

    // Count by status
    for (const grant of grants) {
      analytics.byStatus[grant.status] = (analytics.byStatus[grant.status] || 0) + 1;
    }

    // Count permissions
    for (const grant of grants) {
      for (const perm of grant.permissions) {
        analytics.topPermissions[perm] = (analytics.topPermissions[perm] || 0) + 1;
      }
    }

    // Usage over time (last 30 days)
    const now = Date.now();
    const days = 30;
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * dayMs;
      const count = grants.filter(
        (g) => g.createdAt >= timestamp - dayMs && g.createdAt < timestamp
      ).length;
      analytics.usageOverTime.push({ timestamp, count });
    }

    return analytics;
  }

  async getAuditLog(grantId: string): Promise<GrantAuditEntry[]> {
    const grant = this.grants.get(grantId);
    return grant?.auditLog || [];
  }

  async exportGrants(contentId?: string): Promise<EnhancedAccessGrant[]> {
    let grants = Array.from(this.grants.values());
    if (contentId) {
      grants = grants.filter((g) => g.contentId === contentId);
    }
    return grants;
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  async cleanupExpiredGrants(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, grant] of this.grants.entries()) {
      if (grant.expiresAt && now > grant.expiresAt && grant.status !== 'expired') {
        grant.status = 'expired';
        cleaned++;
      }
    }

    return cleaned;
  }

  async cleanupConsumedGrants(): Promise<number> {
    let cleaned = 0;

    for (const [id, grant] of this.grants.entries()) {
      if (grant.status === 'consumed' || grant.status === 'revoked') {
        await this.deleteGrant(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * Create Access Grant Manager instance
 */
export function createAccessGrantManager(sdk: VivimSDK): AccessGrantManager {
  return new AccessGrantManager(sdk);
}
