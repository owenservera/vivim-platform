/**
 * Sharing Policy SDK Node - Granular content sharing with collaborative privacy
 * Enables users to control who can access their content and how
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
 * Permission types
 */
export const Permission = {
  VIEW: 'canView',
  VIEW_METADATA: 'canViewMetadata',
  REACT: 'canReact',
  COMMENT: 'canComment',
  SHARE: 'canShare',
  QUOTE: 'canQuote',
  BOOKMARK: 'canBookmark',
  FORK: 'canFork',
  REMIX: 'canRemix',
  ANNOTATE: 'canAnnotate',
} as const;

export type PermissionType = typeof Permission[keyof typeof Permission];

/**
 * Decision modes for collaborative decisions
 */
export const DecisionMode = {
  UNANIMOUS: 'unanimous',
  MAJORITY: 'majority',
  CREATOR_OVERRIDE: 'creator_override',
  HIERARCHICAL: 'hierarchical',
} as const;

export type DecisionModeType = typeof DecisionMode[keyof typeof DecisionMode];

/**
 * Stakeholder roles
 */
export const StakeholderRole = {
  CREATOR: 'creator',
  PRIMARY_MENTIONED: 'primary_mentioned',
  MENTIONED: 'mentioned',
  PARTICIPANT: 'participant',
  OBSERVER: 'observer',
} as const;

export type StakeholderRoleType = typeof StakeholderRole[keyof typeof StakeholderRole];

/**
 * Visibility levels
 */
export type VisibilityLevel =
  | 'public'
  | 'network'
  | 'friends'
  | 'circle'
  | 'private'
  | 'custom';

/**
 * Audience configuration
 */
export interface AudienceConfig {
  /** Circles that can access */
  circles?: string[];
  /** Specific users */
  specificUsers?: string[];
  /** Exceptions (users blocked from access) */
  exceptions?: string[];
  /** Network depth (0 = direct friends, 1 = friends of friends, etc.) */
  networkDepth?: number;
  /** Discoverable in feeds */
  discoverable?: boolean;
  /** Searchable */
  searchable?: boolean;
}

/**
 * Permission configuration
 */
export interface PermissionConfig {
  canView: boolean;
  canViewMetadata: boolean;
  canReact: boolean;
  canComment: boolean;
  canShare: boolean;
  canQuote: boolean;
  canBookmark: boolean;
  canFork: boolean;
  canRemix: boolean;
  canAnnotate: boolean;
  reactionsVisibleTo?: 'audience' | 'creator' | 'nobody';
  commentsVisibleTo?: 'audience' | 'creator' | 'nobody';
}

/**
 * Temporal access controls
 */
export interface TemporalConfig {
  /** Access starts at timestamp */
  startsAt?: number;
  /** Access expires at timestamp */
  expiresAt?: number;
  /** Access duration in milliseconds */
  duration?: number;
  /** Recurring access schedule */
  recurring?: {
    daysOfWeek?: number[];
    hoursOfDay?: number[];
  };
}

/**
 * Geographic access controls
 */
export interface GeographicConfig {
  /** Allowed countries */
  allowedCountries?: string[];
  /** Allowed regions/states */
  allowedRegions?: string[];
  /** Allowed cities */
  allowedCities?: string[];
  /** Require location verification */
  requireLocation?: boolean;
}

/**
 * Contextual access controls
 */
export interface ContextualConfig {
  /** Required context tags */
  requiredTags?: string[];
  /** Allowed platforms */
  allowedPlatforms?: string[];
  /** Required relationship type */
  requiredRelationship?: 'friend' | 'follower' | 'circle_member';
}

/**
 * Collaborative decision configuration
 */
export interface CollaborativeConfig {
  /** Decision mode */
  mode: DecisionModeType;
  /** Stakeholders who must agree */
  requiredStakeholders?: string[];
  /** Voting period in milliseconds */
  votingPeriod?: number;
  /** Minimum agreement percentage (0-100) */
  minAgreementPercent?: number;
}

/**
 * Sharing policy
 */
export interface SharingPolicy {
  /** Policy ID */
  id: string;
  /** Content ID */
  contentId: string;
  /** Content type */
  contentType: string;
  /** Owner DID */
  ownerDid: string;
  /** Audience configuration */
  audience: AudienceConfig;
  /** Permission configuration */
  permissions: PermissionConfig;
  /** Temporal configuration */
  temporal?: TemporalConfig;
  /** Geographic configuration */
  geographic?: GeographicConfig;
  /** Contextual configuration */
  contextual?: ContextualConfig;
  /** Collaborative configuration */
  collaborative?: CollaborativeConfig;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * Content stakeholder
 */
export interface ContentStakeholder {
  /** Stakeholder ID */
  id: string;
  /** Content ID */
  contentId: string;
  /** Stakeholder DID */
  did: string;
  /** Role */
  role: StakeholderRoleType;
  /** Permissions override */
  permissions?: Partial<PermissionConfig>;
  /** Added timestamp */
  addedAt: number;
  /** Added by DID */
  addedBy: string;
}

/**
 * Access grant
 */
export interface AccessGrant {
  /** Grant ID */
  id: string;
  /** Content ID */
  contentId: string;
  /** Grantee DID */
  granteeDid: string;
  /** Granted by DID */
  grantedBy: string;
  /** Permissions granted */
  permissions: PermissionType[];
  /** Expires at timestamp */
  expiresAt?: number;
  /** Created timestamp */
  createdAt: number;
}

/**
 * Access check result
 */
export interface AccessCheckResult {
  /** Access granted */
  granted: boolean;
  /** Reason for denial (if denied) */
  reason?: string;
  /** Granted permissions */
  permissions: PermissionType[];
  /** Missing permissions */
  missingPermissions: PermissionType[];
}

/**
 * Sharing policy events
 */
export interface SharingPolicyEvents {
  /** Policy created */
  'policy:created': SharingPolicy;
  /** Policy updated */
  'policy:updated': SharingPolicy;
  /** Policy deleted */
  'policy:deleted': { contentId: string };
  /** Stakeholder added */
  'stakeholder:added': ContentStakeholder;
  /** Stakeholder removed */
  'stakeholder:removed': { stakeholderId: string };
  /** Access granted */
  'access:granted': AccessGrant;
  /** Access revoked */
  'access:revoked': { grantId: string };
  /** Access checked */
  'access:checked': { contentId: string; userDid: string; granted: boolean };
}

/**
 * Sharing Policy API
 */
export interface SharingPolicyAPI {
  // Policy CRUD
  createPolicy(
    contentId: string,
    contentType: string,
    options?: CreatePolicyOptions
  ): Promise<SharingPolicy>;
  getPolicy(contentId: string): Promise<SharingPolicy | null>;
  updatePolicy(contentId: string, updates: UpdatePolicyOptions): Promise<SharingPolicy>;
  deletePolicy(contentId: string): Promise<void>;

  // Stakeholders
  addStakeholder(
    contentId: string,
    did: string,
    role: StakeholderRoleType
  ): Promise<ContentStakeholder>;
  removeStakeholder(contentId: string, stakeholderId: string): Promise<void>;
  getStakeholders(contentId: string): Promise<ContentStakeholder[]>;

  // Access Grants
  grantAccess(
    contentId: string,
    granteeDid: string,
    permissions: PermissionType[],
    options?: GrantAccessOptions
  ): Promise<AccessGrant>;
  revokeAccess(grantId: string): Promise<void>;
  getAccessGrants(contentId: string): Promise<AccessGrant[]>;

  // Access Checking
  checkAccess(
    contentId: string,
    userDid: string,
    requestedPermissions?: PermissionType[]
  ): Promise<AccessCheckResult>;

  // Utilities
  getDefaultPermissions(): PermissionConfig;
  comparePolicies(policy1: SharingPolicy, policy2: SharingPolicy): string[];
  mergePolicies(policies: SharingPolicy[]): SharingPolicy;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

/**
 * Create policy options
 */
export interface CreatePolicyOptions {
  audience?: Partial<AudienceConfig>;
  permissions?: Partial<PermissionConfig>;
  temporal?: TemporalConfig;
  geographic?: GeographicConfig;
  contextual?: ContextualConfig;
  collaborative?: CollaborativeConfig;
}

/**
 * Update policy options
 */
export interface UpdatePolicyOptions {
  audience?: Partial<AudienceConfig>;
  permissions?: Partial<PermissionConfig>;
  temporal?: TemporalConfig;
  geographic?: GeographicConfig;
  contextual?: ContextualConfig;
  collaborative?: CollaborativeConfig;
}

/**
 * Grant access options
 */
export interface GrantAccessOptions {
  expiresAt?: number;
  temporary?: boolean;
}

/**
 * Default permissions
 */
const DEFAULT_PERMISSIONS: PermissionConfig = {
  canView: true,
  canViewMetadata: true,
  canReact: true,
  canComment: true,
  canShare: false,
  canQuote: false,
  canBookmark: true,
  canFork: false,
  canRemix: false,
  canAnnotate: false,
  reactionsVisibleTo: 'audience',
  commentsVisibleTo: 'audience',
};

/**
 * Sharing Policy Node Implementation
 */
export class SharingPolicyNode implements SharingPolicyAPI {
  private policies: Map<string, SharingPolicy> = new Map();
  private stakeholders: Map<string, ContentStakeholder[]> = new Map();
  private accessGrants: Map<string, AccessGrant[]> = new Map();
  private communication: ReturnType<typeof createCommunicationProtocol>;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK) {
    this.communication = createCommunicationProtocol('sharing-policy-node');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[SharingPolicyNode] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    const unsubError = this.communication.onEvent('message_error', (event) => {
      console.error(`[SharingPolicyNode] Message error: ${event.error}`);
    });
    this.eventUnsubscribe.push(unsubError);
  }

  // ==========================================================================
  // Policy CRUD
  // ==========================================================================

  async createPolicy(
    contentId: string,
    contentType: string,
    options: CreatePolicyOptions = {}
  ): Promise<SharingPolicy> {
    const identity = await this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity required to create sharing policy');
    }

    const policy: SharingPolicy = {
      id: generateId(),
      contentId,
      contentType,
      ownerDid: identity.did,
      audience: {
        circles: [],
        specificUsers: [],
        exceptions: [],
        networkDepth: 0,
        discoverable: true,
        searchable: true,
        ...options.audience,
      },
      permissions: {
        ...DEFAULT_PERMISSIONS,
        ...options.permissions,
      },
      temporal: options.temporal,
      geographic: options.geographic,
      contextual: options.contextual,
      collaborative: options.collaborative,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.policies.set(contentId, policy);
    this.stakeholders.set(contentId, []);
    this.accessGrants.set(contentId, []);

    this.emit('policy:created', policy);
    return policy;
  }

  async getPolicy(contentId: string): Promise<SharingPolicy | null> {
    return this.policies.get(contentId) || null;
  }

  async updatePolicy(
    contentId: string,
    updates: UpdatePolicyOptions
  ): Promise<SharingPolicy> {
    const policy = this.policies.get(contentId);
    if (!policy) {
      throw new Error(`Policy not found for content: ${contentId}`);
    }

    const updated: SharingPolicy = {
      ...policy,
      audience: updates.audience ? { ...policy.audience, ...updates.audience } : policy.audience,
      permissions: updates.permissions
        ? { ...policy.permissions, ...updates.permissions }
        : policy.permissions,
      temporal: updates.temporal || policy.temporal,
      geographic: updates.geographic || policy.geographic,
      contextual: updates.contextual || policy.contextual,
      collaborative: updates.collaborative || policy.collaborative,
      updatedAt: Date.now(),
    };

    this.policies.set(contentId, updated);
    this.emit('policy:updated', updated);
    return updated;
  }

  async deletePolicy(contentId: string): Promise<void> {
    const existed = this.policies.has(contentId);
    if (existed) {
      this.policies.delete(contentId);
      this.stakeholders.delete(contentId);
      this.accessGrants.delete(contentId);
      this.emit('policy:deleted', { contentId });
    }
  }

  // ==========================================================================
  // Stakeholders
  // ==========================================================================

  async addStakeholder(
    contentId: string,
    did: string,
    role: StakeholderRoleType
  ): Promise<ContentStakeholder> {
    const identity = await this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity required');
    }

    const stakeholder: ContentStakeholder = {
      id: generateId(),
      contentId,
      did,
      role,
      addedAt: Date.now(),
      addedBy: identity.did,
    };

    const stakeholders = this.stakeholders.get(contentId) || [];
    stakeholders.push(stakeholder);
    this.stakeholders.set(contentId, stakeholders);

    this.emit('stakeholder:added', stakeholder);
    return stakeholder;
  }

  async removeStakeholder(contentId: string, stakeholderId: string): Promise<void> {
    const stakeholders = this.stakeholders.get(contentId) || [];
    const filtered = stakeholders.filter((s) => s.id !== stakeholderId);

    if (filtered.length !== stakeholders.length) {
      this.stakeholders.set(contentId, filtered);
      this.emit('stakeholder:removed', { stakeholderId });
    }
  }

  async getStakeholders(contentId: string): Promise<ContentStakeholder[]> {
    return this.stakeholders.get(contentId) || [];
  }

  // ==========================================================================
  // Access Grants
  // ==========================================================================

  async grantAccess(
    contentId: string,
    granteeDid: string,
    permissions: PermissionType[],
    options: GrantAccessOptions = {}
  ): Promise<AccessGrant> {
    const identity = await this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity required');
    }

    const grant: AccessGrant = {
      id: generateId(),
      contentId,
      granteeDid,
      grantedBy: identity.did,
      permissions,
      expiresAt: options.expiresAt,
      createdAt: Date.now(),
    };

    const grants = this.accessGrants.get(contentId) || [];
    grants.push(grant);
    this.accessGrants.set(contentId, grants);

    this.emit('access:granted', grant);
    return grant;
  }

  async revokeAccess(grantId: string): Promise<void> {
    for (const [contentId, grants] of this.accessGrants.entries()) {
      const filtered = grants.filter((g) => g.id !== grantId);
      if (filtered.length !== grants.length) {
        this.accessGrants.set(contentId, filtered);
        this.emit('access:revoked', { grantId });
        return;
      }
    }
  }

  async getAccessGrants(contentId: string): Promise<AccessGrant[]> {
    return this.accessGrants.get(contentId) || [];
  }

  // ==========================================================================
  // Access Checking
  // ==========================================================================

  async checkAccess(
    contentId: string,
    userDid: string,
    requestedPermissions: PermissionType[] = [Permission.VIEW]
  ): Promise<AccessCheckResult> {
    const policy = this.policies.get(contentId);
    if (!policy) {
      return {
        granted: false,
        reason: 'Policy not found',
        permissions: [],
        missingPermissions: requestedPermissions,
      };
    }

    // Check if user is owner
    const identity = await this.sdk.getIdentity();
    if (identity?.did === userDid) {
      return {
        granted: true,
        permissions: Object.keys(policy.permissions)
          .filter((k) => policy.permissions[k as keyof PermissionConfig])
          .map((k) => k as PermissionType),
        missingPermissions: [],
      };
    }

    // Check access grants
    const grants = this.accessGrants.get(contentId) || [];
    const userGrant = grants.find(
      (g) => g.granteeDid === userDid && (!g.expiresAt || g.expiresAt > Date.now())
    );

    if (userGrant) {
      const grantedPermissions = userGrant.permissions.filter((p) =>
        requestedPermissions.includes(p)
      );
      const missing = requestedPermissions.filter(
        (p) => !grantedPermissions.includes(p)
      );

      return {
        granted: grantedPermissions.length > 0,
        permissions: grantedPermissions,
        missingPermissions: missing,
      };
    }

    // Check audience
    const audienceMatch = this.checkAudience(policy, userDid);
    if (!audienceMatch) {
      return {
        granted: false,
        reason: 'User not in audience',
        permissions: [],
        missingPermissions: requestedPermissions,
      };
    }

    // Check temporal constraints
    if (policy.temporal) {
      const now = Date.now();
      if (policy.temporal.startsAt && now < policy.temporal.startsAt) {
        return {
          granted: false,
          reason: 'Access not yet started',
          permissions: [],
          missingPermissions: requestedPermissions,
        };
      }
      if (policy.temporal.expiresAt && now > policy.temporal.expiresAt) {
        return {
          granted: false,
          reason: 'Access expired',
          permissions: [],
          missingPermissions: requestedPermissions,
        };
      }
    }

    // Build granted permissions based on policy
    const grantedPermissions = requestedPermissions.filter((p) => {
      const permKey = p as keyof PermissionConfig;
      return policy.permissions[permKey] === true;
    });

    const missing = requestedPermissions.filter((p) => !grantedPermissions.includes(p));

    this.emit('access:checked', { contentId, userDid, granted: grantedPermissions.length > 0 });

    return {
      granted: grantedPermissions.length > 0,
      permissions: grantedPermissions,
      missingPermissions: missing,
    };
  }

  /**
   * Check if user matches audience criteria
   */
  private async checkAudience(policy: SharingPolicy, userDid: string): Promise<boolean> {
    const { audience } = policy;

    // Check exceptions (blocked users)
    if (audience.exceptions?.includes(userDid)) {
      return false;
    }

    // Check specific users
    if (audience.specificUsers?.includes(userDid)) {
      return true;
    }

    // Check circles (would require social node integration)
    if (audience.circles && audience.circles.length > 0) {
      // TODO: Integrate with SocialNode to check circle membership
      console.log('[SharingPolicyNode] Circle check not implemented');
    }

    // Check network depth (would require social node integration)
    if (audience.networkDepth && audience.networkDepth > 0) {
      // TODO: Integrate with SocialNode to check network distance
      console.log('[SharingPolicyNode] Network depth check not implemented');
    }

    // Default: public access
    return audience.discoverable !== false;
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  getDefaultPermissions(): PermissionConfig {
    return { ...DEFAULT_PERMISSIONS };
  }

  comparePolicies(policy1: SharingPolicy, policy2: SharingPolicy): string[] {
    const differences: string[] = [];

    // Compare permissions
    for (const key of Object.keys(DEFAULT_PERMISSIONS)) {
      const k = key as keyof PermissionConfig;
      if (policy1.permissions[k] !== policy2.permissions[k]) {
        differences.push(`permissions.${key}`);
      }
    }

    // Compare audience
    if (JSON.stringify(policy1.audience) !== JSON.stringify(policy2.audience)) {
      differences.push('audience');
    }

    // Compare temporal
    if (JSON.stringify(policy1.temporal) !== JSON.stringify(policy2.temporal)) {
      differences.push('temporal');
    }

    return differences;
  }

  mergePolicies(policies: SharingPolicy[]): SharingPolicy {
    if (policies.length === 0) {
      throw new Error('At least one policy required for merge');
    }

    // Start with most restrictive permissions
    const merged: SharingPolicy = {
      ...policies[0],
      permissions: { ...DEFAULT_PERMISSIONS },
    };

    for (const policy of policies) {
      // Take intersection of permissions (most restrictive)
      for (const key of Object.keys(DEFAULT_PERMISSIONS)) {
        const k = key as keyof PermissionConfig;
        if (typeof merged.permissions[k] === 'boolean') {
          (merged.permissions as any)[k] = (merged.permissions[k] as boolean) && (policy.permissions[k] as boolean);
        } else {
          (merged.permissions as any)[k] = policy.permissions[k];
        }
      }

      // Union of audiences
      if (policy.audience.specificUsers) {
        merged.audience.specificUsers = [
          ...(merged.audience.specificUsers || []),
          ...policy.audience.specificUsers,
        ];
      }
    }

    return merged;
  }

  // ==========================================================================
  // Communication Protocol
  // ==========================================================================

  getNodeId(): string {
    return 'sharing-policy-node';
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
  private emit<K extends keyof SharingPolicyEvents>(
    event: K,
    data: SharingPolicyEvents[K]
  ): void {
    console.log(`[SharingPolicyNode] Event: ${event}`, data);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.eventUnsubscribe.forEach((unsub) => unsub());
    this.eventUnsubscribe = [];
    this.policies.clear();
    this.stakeholders.clear();
    this.accessGrants.clear();
  }
}

/**
 * Create Sharing Policy Node instance
 */
export function createSharingPolicyNode(sdk: VivimSDK): SharingPolicyNode {
  return new SharingPolicyNode(sdk);
}
