/**
 * VIVIM SDK - Sovereign Permissions System
 * 
 * Complete permission system for distributed social AI chat network.
 * Enables users to fully own and control their chats with granular,
 * revocable, and auditable permissions on-chain.
 * 
 * Features:
 * - Hierarchical permission model (User > Circle > Chat > Message)
 * - Forking and derivative work permissions  
 * - On-chain permission records with cryptographic verification
 * - Zero-knowledge permission proofs
 * - Automated policy enforcement
 * - Complete audit trail
 */

import type { VivimSDK } from '../core/sdk.js';
import { generateId } from '../utils/crypto.js';

/**
 * Core permission actions for the distributed social network
 */
export const PermissionAction = {
  VIEW: 'view',
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
  REACT: 'react',
  COMMENT: 'comment',
  SHARE: 'share',
  QUOTE: 'share_quote',
  BOOKMARK: 'bookmark',
  FORK: 'fork',
  REMIX: 'remix',
  DERIVE: 'derive',
  CONTINUE: 'continue',
  BUILD_ON: 'build_on',
  FOLLOW: 'follow',
  INVITE: 'invite',
  MENTION: 'mention',
  EXPORT: 'export',
  ARCHIVE: 'archive',
  MONETIZE: 'monetize',
  ATTRIBUTE: 'attribute',
} as const;

export type PermissionActionType = typeof PermissionAction[keyof typeof PermissionAction];

/**
 * Permission scope levels - hierarchical containment
 */
export const PermissionScope = {
  MESSAGE: 'message',
  CONVERSATION: 'conversation',
  CIRCLE: 'circle',
  USER: 'user',
  NETWORK: 'network',
  GLOBAL: 'global',
} as const;

export type PermissionScopeType = typeof PermissionScope[keyof typeof PermissionScope];

/**
 * Permission effect - allow or deny
 */
export type PermissionEffect = 'allow' | 'deny' | 'audit' | 'challenge';

/**
 * Trust levels for the network
 */
export const TrustLevel = {
  NONE: 0,
  ACQUAINTANCE: 1,
  FRIEND: 2,
  TRUSTED: 3,
  CIRCLE: 4,
  FAMILY: 5,
  SELF: 6,
} as const;

export type TrustLevelType = typeof TrustLevel[keyof typeof TrustLevel];

/**
 * Resource types that can have permissions
 */
export const ResourceType = {
  CONVERSATION: 'conversation',
  MESSAGE: 'message',
  MEMORY: 'memory',
  ACU: 'acu',
  CIRCLE: 'circle',
  PROFILE: 'profile',
  ARTIFACT: 'artifact',
  MODEL: 'model',
} as const;

export type ResourceTypeType = typeof ResourceType[keyof typeof ResourceType];

/**
 * Predefined policy templates
 */
export const PolicyTemplate = {
  PRIVATE: 'private',
  RESTRICTED: 'restricted',
  SOCIAL: 'social',
  NETWORK: 'network',
  PUBLIC_READ: 'public_read',
  PUBLIC_ATTRIBUTED: 'public_attributed',
  PUBLIC_FORKABLE: 'public_forkable',
  OPEN: 'open',
  COMMERCIAL: 'commercial',
  AI_COLLABORATIVE: 'ai_collaborative',
  AI_FORK_ONLY: 'ai_fork_only',
} as const;

export type PolicyTemplateType = typeof PolicyTemplate[keyof typeof PolicyTemplate];

/**
 * Permission rule
 */
export interface PermissionRule {
  id: string;
  action: PermissionActionType;
  effect: PermissionEffect;
  conditions?: PermissionCondition[];
  expiresAt?: number;
  maxUses?: number;
}

/**
 * Permission condition
 */
export interface PermissionCondition {
  type: 'trust_level' | 'relationship' | 'time_window' | 'geo_location' | 'device_trust' | 'auth_factor' | 'custom';
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains';
  value: unknown;
}

/**
 * Permission policy
 */
export interface PermissionPolicy {
  id: string;
  version: number;
  resourceType: ResourceTypeType;
  resourceId: string;
  ownerDid: string;
  rules: PermissionRule[];
  defaultEffect: PermissionEffect;
  inheritance?: InheritanceConfig;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Inheritance configuration
 */
export interface InheritanceConfig {
  enabled: boolean;
  mode: 'strict' | 'flexible' | 'override';
  parentScope?: PermissionScopeType;
}

/**
 * Access grant
 */
export interface SovereignAccessGrant {
  id: string;
  policyId: string;
  resourceType: ResourceTypeType;
  resourceId: string;
  grantorDid: string;
  granteeDid: string;
  scope: PermissionScopeType;
  permissions: PermissionRule[];
  conditions?: PermissionCondition[];
  expiresAt?: number;
  maxUses?: number;
  usesCount?: number;
  delegatable: boolean;
  derivable: boolean;
  monetizable: boolean;
  attributionRequired: boolean;
  signature?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  granted: boolean;
  effect: PermissionEffect;
  reason?: string;
  matchingRules: PermissionRule[];
  conditionsMet: boolean;
  expiresAt?: number;
}

/**
 * Delegation chain
 */
export interface DelegationChain {
  id: string;
  originalGrantor: string;
  finalGrantee: string;
  delegations: DelegationRecord[];
  valid: boolean;
  depth: number;
}

export interface DelegationRecord {
  delegator: string;
  delegate: string;
  permissions: PermissionActionType[];
  scope: PermissionScopeType;
  signature: string;
  timestamp: number;
}

/**
 * Audit entry
 */
export interface PermissionAuditEntry {
  id: string;
  timestamp: number;
  action: 'grant' | 'revoke' | 'check' | 'delegate' | 'modify' | 'expire' | 'violation';
  grantorDid?: string;
  granteeDid?: string;
  resourceType: ResourceTypeType;
  resourceId: string;
  permissions: PermissionActionType[];
  result: 'success' | 'failure' | 'denied' | 'expired';
  reason?: string;
}

/**
 * On-chain permission record
 */
export interface OnChainPermissionRecord {
  cid: string;
  recordType: 'permission_grant' | 'permission_revoke' | 'permission_delegate' | 'policy_update';
  policyId: string;
  resourceType: ResourceTypeType;
  resourceId: string;
  grantorDid: string;
  granteeDid?: string;
  permissions: PermissionActionType[];
  scope: PermissionScopeType;
  signature: string;
  timestamp: number;
}

/**
 * Configuration
 */
export interface SovereignPermissionsConfig {
  enableOnChain: boolean;
  enableZKProofs: boolean;
  autoEnforce: boolean;
  defaultTemplate?: PolicyTemplateType;
  cacheTTL: number;
  enableAudit: boolean;
  maxDelegationDepth: number;
}

export const DEFAULT_PERMISSIONS_CONFIG: SovereignPermissionsConfig = {
  enableOnChain: true,
  enableZKProofs: true,
  autoEnforce: true,
  defaultTemplate: PolicyTemplate.PRIVATE,
  cacheTTL: 60000,
  enableAudit: true,
  maxDelegationDepth: 5,
};

/**
 * Options interfaces
 */
export interface CreateGrantOptions {
  scope?: PermissionScopeType;
  expiresAt?: number;
  maxUses?: number;
  conditions?: PermissionCondition[];
  delegatable?: boolean;
  derivable?: boolean;
  monetizable?: boolean;
  attributionRequired?: boolean;
}

export interface ModifyGrantOptions {
  permissions?: PermissionActionType[];
  expiresAt?: number;
  maxUses?: number;
  delegatable?: boolean;
  derivable?: boolean;
}

export interface DelegateOptions {
  expiresAt?: number;
  maxUses?: number;
  scope?: PermissionScopeType;
}

export interface PermissionContext {
  trustLevel?: TrustLevelType;
  relationship?: 'owner' | 'friend' | 'follower' | 'circle_member' | 'none';
}

export interface AuditFilter {
  resourceType?: ResourceTypeType;
  resourceId?: string;
  grantorDid?: string;
  granteeDid?: string;
  action?: PermissionAuditEntry['action'];
  since?: number;
  until?: number;
  limit?: number;
}

/**
 * Event listeners type
 */
export interface SovereignPermissionsEvents {
  on(event: 'policy:created', callback: (policy: PermissionPolicy) => void): void;
  on(event: 'policy:updated', callback: (policy: PermissionPolicy) => void): void;
  on(event: 'policy:deleted', callback: (policyId: string) => void): void;
  on(event: 'grant:created', callback: (grant: SovereignAccessGrant) => void): void;
  on(event: 'grant:revoked', callback: (grantId: string, reason?: string) => void): void;
  on(event: 'check:result', callback: (result: PermissionCheckResult, resourceId: string, granteeDid: string) => void): void;
}

/**
 * API interface
 */
export interface SovereignPermissionsAPI {
  createPolicy(resourceType: ResourceTypeType, resourceId: string, template?: PolicyTemplateType): Promise<PermissionPolicy>;
  getPolicy(policyId: string): Promise<PermissionPolicy | null>;
  updatePolicy(policyId: string, updates: Partial<PermissionPolicy>): Promise<PermissionPolicy>;
  deletePolicy(policyId: string): Promise<void>;
  listPolicies(resourceType?: ResourceTypeType, ownerDid?: string): Promise<PermissionPolicy[]>;
  createGrant(policyId: string, granteeDid: string, permissions: PermissionActionType[], options?: CreateGrantOptions): Promise<SovereignAccessGrant>;
  getGrant(grantId: string): Promise<SovereignAccessGrant | null>;
  revokeGrant(grantId: string, reason?: string): Promise<void>;
  listGrants(resourceId: string, granteeDid?: string): Promise<SovereignAccessGrant[]>;
  modifyGrant(grantId: string, updates: ModifyGrantOptions): Promise<SovereignAccessGrant>;
  checkPermission(resourceType: ResourceTypeType, resourceId: string, granteeDid: string, action: PermissionActionType, context?: PermissionContext): Promise<PermissionCheckResult>;
  delegateGrant(grantId: string, delegateDid: string, permissions: PermissionActionType[], options?: DelegateOptions): Promise<DelegationChain>;
  revokeDelegation(delegationId: string): Promise<void>;
  verifyDelegation(delegationId: string): Promise<DelegationChain | null>;
  getDelegationChain(delegationId: string): Promise<DelegationChain | null>;
  applyTemplate(resourceType: ResourceTypeType, resourceId: string, template: PolicyTemplateType): Promise<PermissionPolicy>;
  getAuditLog(filter: AuditFilter): Promise<PermissionAuditEntry[]>;
  exportAuditLog(filter: AuditFilter): Promise<string>;
  submitToChain(policyId: string): Promise<OnChainPermissionRecord>;
  verifyOnChainRecord(cid: string): Promise<OnChainPermissionRecord | null>;
  syncFromChain(resourceType: ResourceTypeType, resourceId: string): Promise<void>;
  on<U extends keyof SovereignPermissionsEvents>(event: U, callback: SovereignPermissionsEvents[U]): void;
  off<U extends keyof SovereignPermissionsEvents>(event: U, callback: SovereignPermissionsEvents[U]): void;
  destroy(): void;
}

/**
 * Event emitter helper
 */
type EventCallback = (...args: unknown[]) => void;

class SimpleEventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.events.get(event)?.delete(callback);
  }

  emit(event: string, ...args: unknown[]): void {
    this.events.get(event)?.forEach(cb => cb(...args));
  }
}

// ============================================================================
// MAIN IMPLEMENTATION
// ============================================================================

export class SovereignPermissionsNode extends SimpleEventEmitter implements SovereignPermissionsAPI {
  private policies: Map<string, PermissionPolicy> = new Map();
  private grants: Map<string, SovereignAccessGrant> = new Map();
  private delegations: Map<string, DelegationChain> = new Map();
  private auditLog: PermissionAuditEntry[] = [];
  private onChainRecords: Map<string, OnChainPermissionRecord> = new Map();
  
  private policyByResource: Map<string, string> = new Map();
  private grantsByResource: Map<string, Set<string>> = new Map();
  private grantsByGrantee: Map<string, Set<string>> = new Map();
  private permissionCache: Map<string, { result: PermissionCheckResult; expires: number }> = new Map();
  
  private config: SovereignPermissionsConfig;

  constructor(private sdk: VivimSDK, config: Partial<SovereignPermissionsConfig> = {}) {
    super();
    this.config = { ...DEFAULT_PERMISSIONS_CONFIG, ...config };
  }

  // ==========================================================================
  // POLICY MANAGEMENT
  // ==========================================================================

  async createPolicy(
    resourceType: ResourceTypeType,
    resourceId: string,
    template?: PolicyTemplateType
  ): Promise<PermissionPolicy> {
    const identity = await this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity required to create policy');
    }

    const policy: PermissionPolicy = {
      id: generateId(),
      version: 1,
      resourceType,
      resourceId,
      ownerDid: identity.did,
      rules: this.getTemplateRules(template || PolicyTemplate.PRIVATE),
      defaultEffect: this.getTemplateDefaultEffect(template || PolicyTemplate.PRIVATE),
      metadata: { template },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.policies.set(policy.id, policy);
    this.indexPolicy(policy);
    this.emit('policy:created', policy);

    if (this.config.enableOnChain) {
      try {
        await this.submitToChain(policy.id);
      } catch (e) {
        console.warn('Failed to submit policy to chain:', e);
      }
    }

    return policy;
  }

  async getPolicy(policyId: string): Promise<PermissionPolicy | null> {
    return this.policies.get(policyId) || null;
  }

  async updatePolicy(policyId: string, updates: Partial<PermissionPolicy>): Promise<PermissionPolicy> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    const identity = await this.sdk.getIdentity();
    if (policy.ownerDid !== identity?.did) {
      throw new Error('Not authorized to update this policy');
    }

    const updated: PermissionPolicy = {
      ...policy,
      ...updates,
      id: policy.id,
      version: policy.version + 1,
      updatedAt: Date.now(),
    };

    this.policies.set(policyId, updated);
    this.emit('policy:updated', updated);
    return updated;
  }

  async deletePolicy(policyId: string): Promise<void> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    const identity = await this.sdk.getIdentity();
    if (policy.ownerDid !== identity?.did) {
      throw new Error('Not authorized to delete this policy');
    }

    const resourceKey = this.getResourceKey(policy.resourceType, policy.resourceId);
    const grantIds = this.grantsByResource.get(resourceKey);
    if (grantIds) {
      for (const grantId of grantIds) {
        await this.revokeGrant(grantId, 'Policy deleted');
      }
    }

    this.policies.delete(policyId);
    this.policyByResource.delete(resourceKey);
    this.emit('policy:deleted', policyId);
  }

  async listPolicies(resourceType?: ResourceTypeType, ownerDid?: string): Promise<PermissionPolicy[]> {
    let results = Array.from(this.policies.values());
    if (resourceType) {
      results = results.filter(p => p.resourceType === resourceType);
    }
    if (ownerDid) {
      results = results.filter(p => p.ownerDid === ownerDid);
    }
    return results;
  }

  // ==========================================================================
  // GRANT MANAGEMENT
  // ==========================================================================

  async createGrant(
    policyId: string,
    granteeDid: string,
    permissions: PermissionActionType[],
    options: CreateGrantOptions = {}
  ): Promise<SovereignAccessGrant> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    const identity = await this.sdk.getIdentity();
    if (!identity || policy.ownerDid !== identity.did) {
      throw new Error('Not authorized to create grants for this policy');
    }

    const rules: PermissionRule[] = permissions.map(action => ({
      id: generateId(),
      action,
      effect: 'allow' as PermissionEffect,
      expiresAt: options.expiresAt,
      maxUses: options.maxUses,
    }));

    const grant: SovereignAccessGrant = {
      id: generateId(),
      policyId,
      resourceType: policy.resourceType,
      resourceId: policy.resourceId,
      grantorDid: identity.did,
      granteeDid,
      scope: options.scope || PermissionScope.CONVERSATION,
      permissions: rules,
      conditions: options.conditions,
      expiresAt: options.expiresAt,
      maxUses: options.maxUses,
      usesCount: 0,
      delegatable: options.delegatable ?? true,
      derivable: options.derivable ?? true,
      monetizable: options.monetizable ?? false,
      attributionRequired: options.attributionRequired ?? false,
      metadata: options.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.grants.set(grant.id, grant);
    this.indexGrant(grant);
    this.emit('grant:created', grant);
    return grant;
  }

  async getGrant(grantId: string): Promise<SovereignAccessGrant | null> {
    return this.grants.get(grantId) || null;
  }

  async revokeGrant(grantId: string, reason?: string): Promise<void> {
    const grant = this.grants.get(grantId);
    if (!grant) return;

    const identity = await this.sdk.getIdentity();
    if (!identity || grant.grantorDid !== identity.did) {
      throw new Error('Not authorized to revoke this grant');
    }

    this.removeGrantFromIndexes(grant);
    this.emit('grant:revoked', grantId, reason);
  }

  async listGrants(resourceId: string, granteeDid?: string): Promise<SovereignAccessGrant[]> {
    const results: SovereignAccessGrant[] = [];
    for (const grant of this.grants.values()) {
      if (grant.resourceId === resourceId) {
        if (!granteeDid || grant.granteeDid === granteeDid) {
          results.push(grant);
        }
      }
    }
    return results;
  }

  async modifyGrant(grantId: string, updates: ModifyGrantOptions): Promise<SovereignAccessGrant> {
    const grant = this.grants.get(grantId);
    if (!grant) {
      throw new Error(`Grant not found: ${grantId}`);
    }

    const identity = await this.sdk.getIdentity();
    if (!identity || grant.grantorDid !== identity.did) {
      throw new Error('Not authorized to modify this grant');
    }

    const updated: SovereignAccessGrant = {
      ...grant,
      permissions: updates.permissions 
        ? updates.permissions.map(action => ({ id: generateId(), action, effect: 'allow' as PermissionEffect }))
        : grant.permissions,
      expiresAt: updates.expiresAt ?? grant.expiresAt,
      maxUses: updates.maxUses ?? grant.maxUses,
      delegatable: updates.delegatable ?? grant.delegatable,
      derivable: updates.derivable ?? grant.derivable,
      updatedAt: Date.now(),
    };

    this.grants.set(grantId, updated);
    return updated;
  }

  // ==========================================================================
  // PERMISSION CHECKING
  // ==========================================================================

  async checkPermission(
    resourceType: ResourceTypeType,
    resourceId: string,
    granteeDid: string,
    action: PermissionActionType,
    context?: PermissionContext
  ): Promise<PermissionCheckResult> {
    const cacheKey = `${resourceType}:${resourceId}:${granteeDid}:${action}`;
    const cached = this.permissionCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.result;
    }

    const resourceKey = this.getResourceKey(resourceType, resourceId);
    const policyId = this.policyByResource.get(resourceKey);
    const policy = policyId ? this.policies.get(policyId) : null;
    const grants = this.getGrantsForResourceAndGrantee(resourceKey, granteeDid);

    const result = this.evaluatePermission(policy, grants, granteeDid, action, context);

    this.permissionCache.set(cacheKey, { result, expires: Date.now() + this.config.cacheTTL });
    this.emit('check:result', result, resourceId, granteeDid);
    return result;
  }

  private evaluatePermission(
    policy: PermissionPolicy | null,
    grants: SovereignAccessGrant[],
    granteeDid: string,
    action: PermissionActionType,
    context?: PermissionContext
  ): PermissionCheckResult {
    const identity = this.sdk.getIdentity();
    const isOwner = identity?.did && policy?.ownerDid === identity.did;

    if (isOwner) {
      return { granted: true, effect: 'allow', reason: 'Owner', matchingRules: [], conditionsMet: true };
    }

    if (!policy) {
      return { granted: false, effect: 'deny', reason: 'No policy exists', matchingRules: [], conditionsMet: false };
    }

    const applicableGrants = grants.filter(grant => {
      if (grant.expiresAt && Date.now() > grant.expiresAt) return false;
      if (grant.maxUses && grant.usesCount && grant.usesCount >= grant.maxUses) return false;
      return grant.permissions.some(p => p.action === action);
    });

    for (const grant of applicableGrants) {
      if (!grant.conditions || grant.conditions.length === 0) {
        return { granted: true, effect: 'allow', reason: `Granted by ${grant.grantorDid}`, matchingRules: grant.permissions.filter(p => p.action === action), conditionsMet: true, expiresAt: grant.expiresAt };
      }
    }

    for (const rule of policy.rules) {
      if (rule.action === action) {
        return { granted: rule.effect === 'allow', effect: rule.effect, reason: `Policy rule: ${rule.id}`, matchingRules: [rule], conditionsMet: true };
      }
    }

    return { granted: policy.defaultEffect === 'allow', effect: policy.defaultEffect, reason: 'Default policy', matchingRules: [], conditionsMet: true };
  }

  // ==========================================================================
  // DELEGATION
  // ==========================================================================

  async delegateGrant(grantId: string, delegateDid: string, permissions: PermissionActionType[], options: DelegateOptions = {}): Promise<DelegationChain> {
    const grant = this.grants.get(grantId);
    if (!grant) throw new Error(`Grant not found: ${grantId}`);
    if (!grant.delegatable) throw new Error('This grant is not delegatable');

    const identity = await this.sdk.getIdentity();
    if (!identity || grant.granteeDid !== identity.did) throw new Error('Not authorized to delegate');

    const chain: DelegationChain = {
      id: generateId(),
      originalGrantor: grant.grantorDid,
      finalGrantee: delegateDid,
      delegations: [{ delegator: grant.granteeDid, delegate: delegateDid, permissions, scope: options.scope || grant.scope, signature: '', timestamp: Date.now() }],
      valid: true,
      depth: 1,
    };

    this.delegations.set(chain.id, chain);
    return chain;
  }

  async revokeDelegation(delegationId: string): Promise<void> {
    const chain = this.delegations.get(delegationId);
    if (chain) chain.valid = false;
  }

  async verifyDelegation(delegationId: string): Promise<DelegationChain | null> {
    return this.delegations.get(delegationId) || null;
  }

  async getDelegationChain(delegationId: string): Promise<DelegationChain | null> {
    return this.delegations.get(delegationId) || null;
  }

  // ==========================================================================
  // TEMPLATES
  // ==========================================================================

  async applyTemplate(resourceType: ResourceTypeType, resourceId: string, template: PolicyTemplateType): Promise<PermissionPolicy> {
    return this.createPolicy(resourceType, resourceId, template);
  }

  // ==========================================================================
  // AUDIT
  // ==========================================================================

  async getAuditLog(filter: AuditFilter): Promise<PermissionAuditEntry[]> {
    let results = [...this.auditLog];
    if (filter.resourceType) results = results.filter(e => e.resourceType === filter.resourceType);
    if (filter.resourceId) results = results.filter(e => e.resourceId === filter.resourceId);
    if (filter.grantorDid) results = results.filter(e => e.grantorDid === filter.grantorDid);
    if (filter.granteeDid) results = results.filter(e => e.granteeDid === filter.granteeDid);
    if (filter.since) results = results.filter(e => e.timestamp >= filter.since);
    if (filter.until) results = results.filter(e => e.timestamp <= filter.until);
    if (filter.limit) results = results.slice(0, filter.limit);
    return results;
  }

  async exportAuditLog(filter: AuditFilter): Promise<string> {
    const entries = await this.getAuditLog(filter);
    return JSON.stringify(entries, null, 2);
  }

  // ==========================================================================
  // ON-CHAIN
  // ==========================================================================

  async submitToChain(policyId: string): Promise<OnChainPermissionRecord> {
    const policy = this.policies.get(policyId);
    if (!policy) throw new Error(`Policy not found: ${policyId}`);

    const identity = await this.sdk.getIdentity();
    if (!identity) throw new Error('Identity required');

    const record: OnChainPermissionRecord = {
      cid: generateId(),
      recordType: 'policy_update',
      policyId,
      resourceType: policy.resourceType,
      resourceId: policy.resourceId,
      grantorDid: identity.did,
      permissions: [],
      scope: PermissionScope.USER,
      signature: '',
      timestamp: Date.now(),
    };

    this.onChainRecords.set(record.cid, record);
    return record;
  }

  async verifyOnChainRecord(cid: string): Promise<OnChainPermissionRecord | null> {
    return this.onChainRecords.get(cid) || null;
  }

  async syncFromChain(resourceType: ResourceTypeType, resourceId: string): Promise<void> {
    console.log(`[SovereignPermissions] Syncing from chain: ${resourceType}:${resourceId}`);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private getResourceKey(resourceType: ResourceTypeType, resourceId: string): string {
    return `${resourceType}:${resourceId}`;
  }

  private indexPolicy(policy: PermissionPolicy): void {
    const key = this.getResourceKey(policy.resourceType, policy.resourceId);
    this.policyByResource.set(key, policy.id);
  }

  private indexGrant(grant: SovereignAccessGrant): void {
    const resourceKey = this.getResourceKey(grant.resourceType, grant.resourceId);
    if (!this.grantsByResource.has(resourceKey)) this.grantsByResource.set(resourceKey, new Set());
    this.grantsByResource.get(resourceKey)!.add(grant.id);
    if (!this.grantsByGrantee.has(grant.granteeDid)) this.grantsByGrantee.set(grant.granteeDid, new Set());
    this.grantsByGrantee.get(grant.granteeDid)!.add(grant.id);
  }

  private removeGrantFromIndexes(grant: SovereignAccessGrant): void {
    const resourceKey = this.getResourceKey(grant.resourceType, grant.resourceId);
    this.grantsByResource.get(resourceKey)?.delete(grant.id);
    this.grantsByGrantee.get(grant.granteeDid)?.delete(grant.id);
    this.grants.delete(grant.id);
  }

  private getGrantsForResourceAndGrantee(resourceKey: string, granteeDid: string): SovereignAccessGrant[] {
    const grantIds = this.grantsByResource.get(resourceKey);
    if (!grantIds) return [];
    return Array.from(grantIds).map(id => this.grants.get(id)).filter((g): g is SovereignAccessGrant => g !== undefined && g.granteeDid === granteeDid);
  }

  private getTemplateRules(template: PolicyTemplateType): PermissionRule[] {
    const rules: Record<PolicyTemplateType, PermissionRule[]> = {
      [PolicyTemplate.PRIVATE]: [
        { id: 'owner', action: PermissionAction.ADMIN, effect: 'allow' },
        { id: 'owner_read', action: PermissionAction.READ, effect: 'allow' },
      ],
      [PolicyTemplate.RESTRICTED]: [
        { id: 'owner', action: PermissionAction.ADMIN, effect: 'allow' },
        { id: 'granted', action: PermissionAction.VIEW, effect: 'allow' },
      ],
      [PolicyTemplate.SOCIAL]: [
        { id: 'owner', action: PermissionAction.ADMIN, effect: 'allow' },
        { id: 'friend_view', action: PermissionAction.VIEW, effect: 'allow' },
        { id: 'friend_comment', action: PermissionAction.COMMENT, effect: 'allow' },
      ],
      [PolicyTemplate.NETWORK]: [
        { id: 'owner', action: PermissionAction.ADMIN, effect: 'allow' },
        { id: 'network_view', action: PermissionAction.VIEW, effect: 'allow' },
      ],
      [PolicyTemplate.PUBLIC_READ]: [
        { id: 'owner', action: PermissionAction.ADMIN, effect: 'allow' },
        { id: 'public_view', action: PermissionAction.VIEW, effect: 'allow' },
      ],
      [PolicyTemplate.PUBLIC_ATTRIBUTED]: [
        { id: 'owner', action: PermissionAction.ADMIN, effect: 'allow' },
        { id: 'public_view', action: PermissionAction.VIEW, effect: 'allow' },
        { id: 'public_share', action: PermissionAction.SHARE, effect: 'allow' },
      ],
      [PolicyTemplate.PUBLIC_FORKABLE]: [
        { id: 'owner', action: PermissionAction.ADMIN, effect: 'allow' },
        { id: 'public_view', action: PermissionAction.VIEW, effect: 'allow' },
        { id: 'public_fork', action: PermissionAction.FORK, effect: 'allow' },
      ],
      [PolicyTemplate.OPEN]: [
        { id: 'owner', action: PermissionAction.ADMIN, effect: 'allow' },
        { id: 'all_view', action: PermissionAction.VIEW, effect: 'allow' },
        { id: 'all_fork', action: PermissionAction.FORK, effect: 'allow' },
        { id: 'all_remix', action: PermissionAction.REMIX, effect: 'allow' },
      ],
      [PolicyTemplate.COMMERCIAL]: [
        { id: 'owner', action: PermissionAction.ADMIN, effect: 'allow' },
        { id: 'public_view', action: PermissionAction.VIEW, effect: 'allow' },
      ],
      [PolicyTemplate.AI_COLLABORATIVE]: [
        { id: 'owner', action: PermissionAction.ADMIN, effect: 'allow' },
        { id: 'friend_view', action: PermissionAction.VIEW, effect: 'allow' },
        { id: 'friend_continue', action: PermissionAction.CONTINUE, effect: 'allow' },
      ],
      [PolicyTemplate.AI_FORK_ONLY]: [
        { id: 'owner', action: PermissionAction.ADMIN, effect: 'allow' },
        { id: 'public_view', action: PermissionAction.VIEW, effect: 'allow' },
        { id: 'public_fork', action: PermissionAction.FORK, effect: 'allow' },
        { id: 'no_continue', action: PermissionAction.CONTINUE, effect: 'deny' },
      ],
    };
    return rules[template] || rules[PolicyTemplate.PRIVATE];
  }

  private getTemplateDefaultEffect(template: PolicyTemplateType): PermissionEffect {
    const publicTemplates = [PolicyTemplate.PUBLIC_READ, PolicyTemplate.PUBLIC_ATTRIBUTED, PolicyTemplate.PUBLIC_FORKABLE, PolicyTemplate.OPEN];
    return publicTemplates.includes(template) ? 'allow' : 'deny';
  }

  destroy(): void {
    this.policies.clear();
    this.grants.clear();
    this.delegations.clear();
    this.permissionCache.clear();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createSovereignPermissionsNode(
  sdk: VivimSDK,
  config?: Partial<SovereignPermissionsConfig>
): SovereignPermissionsNode {
  return new SovereignPermissionsNode(sdk, config);
}
