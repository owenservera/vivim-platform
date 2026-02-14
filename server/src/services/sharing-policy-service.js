/**
 * Sharing Policy Service - Phase 3
 * 
 * Granular content sharing with collaborative privacy,
 * temporal controls, and contextual access
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { identityService } from './identity-service.js';

const log = logger.child({ module: 'sharing-policy-service' });

// ============================================================================
// Types & Constants
// ============================================================================

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
  ANNOTATE: 'canAnnotate'
};

export const DecisionMode = {
  UNANIMOUS: 'unanimous',
  MAJORITY: 'majority',
  CREATOR_OVERRIDE: 'creator_override',
  HIERARCHICAL: 'hierarchical'
};

export const StakeholderRole = {
  CREATOR: 'creator',
  PRIMARY_MENTIONED: 'primary_mentioned',
  MENTIONED: 'mentioned',
  PARTICIPANT: 'participant',
  OBSERVER: 'observer'
};

// Default permissions for new content
const DEFAULT_PERMISSIONS = {
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
  commentsVisibleTo: 'audience'
};

// ============================================================================
// Policy CRUD
// ============================================================================

/**
 * Create sharing policy for content
 */
export async function createSharingPolicy(
  contentId,
  contentType,
  ownerId,
  {
    audience = {},
    permissions = {},
    temporal = null,
    geographic = null,
    contextual = null,
    collaborative = null
  }
) {
  try {
    const prisma = getPrismaClient();

    const policy = await prisma.sharingPolicy.create({
      data: {
        contentId,
        contentType,
        ownerId,
        audience: {
          circles: [],
          specificUsers: [],
          exceptions: [],
          networkDepth: 0,
          discoverable: true,
          searchable: true,
          ...audience
        },
        permissions: { ...DEFAULT_PERMISSIONS, ...permissions },
        temporal,
        geographic,
        contextual,
        collaborative: collaborative || {
          decisionMode: DecisionMode.CREATOR_OVERRIDE,
          stakeholders: []
        },
        status: 'active',
        createdBy: ownerId
      }
    });

    log.info({ policyId: policy.id, contentId }, 'Sharing policy created');
    return { success: true, policy };
  } catch (error) {
    log.error({ contentId, error: error.message }, 'Failed to create sharing policy');
    return { success: false, error: 'Failed to create policy' };
  }
}

/**
 * Get sharing policy for content
 */
export async function getSharingPolicy(contentId) {
  try {
    const prisma = getPrismaClient();

    const policy = await prisma.sharingPolicy.findUnique({
      where: { contentId },
      include: {
        stakeholders: {
          include: {
            user: {
              select: {
                id: true,
                did: true,
                handle: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    if (!policy) {
      return { success: false, error: 'Policy not found' };
    }

    return { success: true, policy };
  } catch (error) {
    log.error({ contentId, error: error.message }, 'Failed to get sharing policy');
    return { success: false, error: 'Failed to get policy' };
  }
}

/**
 * Update sharing policy
 */
export async function updateSharingPolicy(
  contentId,
  updaterId,
  updates
) {
  try {
    const prisma = getPrismaClient();

    // Get existing policy
    const existing = await prisma.sharingPolicy.findUnique({
      where: { contentId },
      include: { stakeholders: true }
    });

    if (!existing) {
      return { success: false, error: 'Policy not found' };
    }

    // Check collaborative privacy if multi-stakeholder
    if (existing.stakeholders.length > 1) {
      const conflictCheck = await checkCollaborativePrivacy(
        existing,
        updaterId,
        updates
      );

      if (!conflictCheck.allowed) {
        return {
          success: false,
          error: 'Change conflicts with stakeholder privacy preferences',
          conflict: conflictCheck.conflict
        };
      }
    }

    // Apply updates
    const allowedUpdates = ['audience', 'permissions', 'temporal', 'geographic', 'contextual'];
    const filteredUpdates = {};
    
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const policy = await prisma.sharingPolicy.update({
      where: { contentId },
      data: {
        ...filteredUpdates,
        updatedAt: new Date()
      }
    });

    log.info({ contentId, updaterId }, 'Sharing policy updated');
    return { success: true, policy };
  } catch (error) {
    log.error({ contentId, error: error.message }, 'Failed to update sharing policy');
    return { success: false, error: 'Failed to update policy' };
  }
}

/**
 * Delete sharing policy
 */
export async function deleteSharingPolicy(contentId, deleterId) {
  try {
    const prisma = getPrismaClient();

    const policy = await prisma.sharingPolicy.findUnique({
      where: { contentId }
    });

    if (!policy) {
      return { success: false, error: 'Policy not found' };
    }

    if (policy.ownerId !== deleterId) {
      return { success: false, error: 'Only owner can delete policy' };
    }

    await prisma.sharingPolicy.delete({
      where: { contentId }
    });

    log.info({ contentId }, 'Sharing policy deleted');
    return { success: true };
  } catch (error) {
    log.error({ contentId, error: error.message }, 'Failed to delete sharing policy');
    return { success: false, error: 'Failed to delete policy' };
  }
}

// ============================================================================
// Access Control
// ============================================================================

/**
 * Check if user can access content with specific permission
 */
export async function checkAccess(
  contentId,
  accessorId,
  permission = Permission.VIEW,
  context = {}
) {
  try {
    const prisma = getPrismaClient();

    // Get policy
    const policy = await prisma.sharingPolicy.findUnique({
      where: { contentId },
      include: {
        stakeholders: true,
        accessGrants: {
          where: {
            grantedTo: accessorId,
            status: 'active',
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        }
      }
    });

    if (!policy) {
      // No policy = no access (fail closed)
      return { granted: false, reason: 'no_policy' };
    }

    // Check if policy is active
    if (policy.status !== 'active') {
      return { granted: false, reason: 'policy_inactive' };
    }

    // Check temporal controls
    const temporalCheck = checkTemporalControls(policy.temporal);
    if (!temporalCheck.allowed) {
      return { granted: false, reason: temporalCheck.reason };
    }

    // Check geographic controls
    if (context.ipAddress && policy.geographic) {
      const geoCheck = checkGeographicControls(policy.geographic, context);
      if (!geoCheck.allowed) {
        return { granted: false, reason: geoCheck.reason };
      }
    }

    // Check contextual controls
    if (policy.contextual) {
      const contextCheck = checkContextualControls(policy.contextual, accessorId, context);
      if (!contextCheck.allowed) {
        return { granted: false, reason: contextCheck.reason };
      }
    }

    // Check if owner
    if (policy.ownerId === accessorId) {
      return { granted: true, via: 'owner' };
    }

    // Check specific permission
    if (!policy.permissions[permission]) {
      return { granted: false, reason: 'permission_denied' };
    }

    // Check audience
    const audienceCheck = await checkAudience(policy.audience, accessorId);
    if (!audienceCheck.allowed) {
      return { granted: false, reason: 'not_in_audience' };
    }

    // Check temporary access grant
    if (policy.accessGrants.length > 0) {
      const grant = policy.accessGrants[0];
      
      // Check view limits
      if (grant.maxViews && grant.viewsUsed >= grant.maxViews) {
        await revokeAccessGrant(grant.id);
        return { granted: false, reason: 'grant_exhausted' };
      }

      // Update view count
      await prisma.contentAccessGrant.update({
        where: { id: grant.id },
        data: {
          viewsUsed: { increment: 1 },
          lastAccessedAt: new Date()
        }
      });

      return { granted: true, via: 'grant', grantId: grant.id };
    }

    return { granted: true, via: audienceCheck.via };
  } catch (error) {
    log.error({ contentId, accessorId, error: error.message }, 'Access check failed');
    return { granted: false, reason: 'error' };
  }
}

/**
 * Check if user is in audience
 */
async function checkAudience(audience, accessorId) {
  try {
    const prisma = getPrismaClient();

    // Check specific users
    if (audience.specificUsers?.includes(accessorId)) {
      return { allowed: true, via: 'specific_user' };
    }

    // Check exceptions (blacklist)
    if (audience.exceptions?.includes(accessorId)) {
      return { allowed: false };
    }

    // Check circles
    if (audience.circles?.length > 0) {
      const circleMembership = await prisma.circleMember.findFirst({
        where: {
          userId: accessorId,
          circleId: { in: audience.circles },
          status: 'active'
        }
      });

      if (circleMembership) {
        return { allowed: true, via: 'circle' };
      }
    }

    // Check network depth (friends-of-friends, etc.)
    if (audience.networkDepth > 0) {
      // This would require social graph traversal
      // Simplified for now
      const connection = await prisma.socialConnection.findFirst({
        where: {
          followerId: accessorId,
          followingId: audience.ownerId || '',
          status: 'active'
        }
      });

      if (connection) {
        return { allowed: true, via: 'network' };
      }
    }

    return { allowed: false };
  } catch (error) {
    log.error({ accessorId, error: error.message }, 'Audience check failed');
    return { allowed: false };
  }
}

// ============================================================================
// Temporal Controls
// ============================================================================

function checkTemporalControls(temporal) {
  if (!temporal) return { allowed: true };

  const now = new Date();

  // Check available from
  if (temporal.availableFrom) {
    const availableFrom = new Date(temporal.availableFrom);
    if (now < availableFrom) {
      return { allowed: false, reason: 'not_yet_available' };
    }
  }

  // Check expires at
  if (temporal.expiresAt) {
    const expiresAt = new Date(temporal.expiresAt);
    if (now > expiresAt) {
      return { allowed: false, reason: 'expired' };
    }
  }

  // Check max views (global)
  if (temporal.maxViews && temporal.viewsUsed >= temporal.maxViews) {
    return { allowed: false, reason: 'max_views_reached' };
  }

  // Check phases
  if (temporal.phases?.length > 0) {
    const activePhase = temporal.phases.find(phase => {
      const start = new Date(phase.startTime);
      const end = phase.endTime ? new Date(phase.endTime) : null;
      return now >= start && (!end || now <= end);
    });

    if (!activePhase) {
      return { allowed: false, reason: 'no_active_phase' };
    }
  }

  return { allowed: true };
}

// ============================================================================
// Geographic Controls
// ============================================================================

function checkGeographicControls(geographic, context) {
  // In production, this would use IP geolocation
  // Simplified implementation

  if (geographic.allowedCountries?.length > 0) {
    // Check if user's country is in allowed list
    // Would need actual geolocation service
  }

  if (geographic.blockedCountries?.length > 0) {
    // Check if user's country is blocked
  }

  if (geographic.requireVPN) {
    // Check for VPN usage
  }

  return { allowed: true };
}

// ============================================================================
// Contextual Controls
// ============================================================================

function checkContextualControls(contextual, accessorId, context) {
  // Check time of day
  if (contextual.timeOfDay?.availableHours) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const inAllowedHours = contextual.timeOfDay.availableHours.some(range => {
      const [startHour, startMin] = range.start.split(':').map(Number);
      const [endHour, endMin] = range.end.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      return currentTime >= startTime && currentTime <= endTime;
    });

    if (!inAllowedHours) {
      return { allowed: false, reason: 'outside_allowed_hours' };
    }
  }

  // Check device requirements
  if (contextual.deviceContext?.requireTrustedDevice && !context.isTrustedDevice) {
    return { allowed: false, reason: 'untrusted_device' };
  }

  // Check social context
  if (contextual.socialContext?.requireMutualFollow) {
    // Would need to check social graph
  }

  return { allowed: true };
}

// ============================================================================
// Collaborative Privacy
// ============================================================================

/**
 * Add stakeholder to content
 */
export async function addStakeholder(
  policyId,
  userId,
  role,
  contribution,
  privacySettings = {}
) {
  try {
    const prisma = getPrismaClient();

    const stakeholder = await prisma.contentStakeholder.create({
      data: {
        policyId,
        userId,
        role,
        contribution,
        privacySettings: {
          canRequestRemoval: true,
          canRequestAnonymization: true,
          canBlockReshare: true,
          canSetAudienceLimit: true,
          ...privacySettings
        },
        influenceScore: role === StakeholderRole.CREATOR ? 100 : 50
      }
    });

    log.info({ policyId, userId, role }, 'Stakeholder added');
    return { success: true, stakeholder };
  } catch (error) {
    log.error({ policyId, userId, error: error.message }, 'Failed to add stakeholder');
    return { success: false, error: 'Failed to add stakeholder' };
  }
}

/**
 * Check collaborative privacy before policy change
 */
async function checkCollaborativePrivacy(policy, proposedById, proposedChanges) {
  const stakeholders = policy.stakeholders;
  const decisionMode = policy.collaborative?.decisionMode || DecisionMode.CREATOR_OVERRIDE;

  // Creator override
  const creator = stakeholders.find(s => s.role === StakeholderRole.CREATOR);
  if (decisionMode === DecisionMode.CREATOR_OVERRIDE && creator?.userId === proposedById) {
    return { allowed: true };
  }

  // Check if proposed changes conflict with any stakeholder preferences
  const conflicts = [];
  
  for (const stakeholder of stakeholders) {
    if (stakeholder.userId === proposedById) continue;

    const prefs = stakeholder.privacySettings;

    // Check if stakeholder has blocked reshare and change would allow it
    if (prefs.canBlockReshare && proposedChanges.permissions?.canShare === true) {
      conflicts.push({
        stakeholderId: stakeholder.userId,
        issue: 'share_permission_conflict'
      });
    }

    // Check audience expansion
    if (prefs.canSetAudienceLimit && proposedChanges.audience) {
      // Would need to compare audience sizes
      conflicts.push({
        stakeholderId: stakeholder.userId,
        issue: 'audience_expansion'
      });
    }
  }

  if (conflicts.length > 0) {
    return {
      allowed: false,
      conflict: {
        conflicts,
        requiresConsensus: true
      }
    };
  }

  return { allowed: true };
}

/**
 * Resolve privacy conflict with voting
 */
export async function resolvePrivacyConflict(
  contentId,
  proposedChanges,
  votes
) {
  try {
    const prisma = getPrismaClient();

    const policy = await prisma.sharingPolicy.findUnique({
      where: { contentId },
      include: { stakeholders: true }
    });

    if (!policy) {
      return { success: false, error: 'Policy not found' };
    }

    const decisionMode = policy.collaborative?.decisionMode || DecisionMode.MAJORITY;
    const stakeholders = policy.stakeholders;

    let approved = false;
    let finalDecision = null;

    switch (decisionMode) {
      case DecisionMode.UNANIMOUS:
        approved = Object.values(votes).every(v => v === 'approve');
        break;

      case DecisionMode.MAJORITY:
        const approvals = Object.values(votes).filter(v => v === 'approve').length;
        approved = approvals > stakeholders.length / 2;
        break;

      case DecisionMode.CREATOR_OVERRIDE:
        const creatorVote = votes[stakeholders.find(s => s.role === StakeholderRole.CREATOR)?.userId];
        approved = creatorVote === 'approve';
        break;

      case DecisionMode.HIERARCHICAL:
        // Most restrictive wins
        const hasRejections = Object.values(votes).some(v => v === 'reject');
        approved = !hasRejections;
        if (!approved) {
          finalDecision = 'most_restrictive';
        }
        break;
    }

    if (approved) {
      // Apply changes
      await prisma.sharingPolicy.update({
        where: { contentId },
        data: proposedChanges
      });
    }

    // Record resolution
    await prisma.privacyConflict.create({
      data: {
        contentId,
        proposedChanges,
        votes,
        resolution: approved ? 'approved' : 'rejected',
        finalDecision,
        status: 'resolved',
        resolvedAt: new Date()
      }
    });

    return {
      success: true,
      approved,
      finalDecision
    };
  } catch (error) {
    log.error({ contentId, error: error.message }, 'Conflict resolution failed');
    return { success: false, error: 'Resolution failed' };
  }
}

// ============================================================================
// Access Grants
// ============================================================================

/**
 * Create temporary access grant
 */
export async function createAccessGrant(
  policyId,
  grantedBy,
  grantedTo,
  options = {}
) {
  try {
    const prisma = getPrismaClient();

    const grant = await prisma.contentAccessGrant.create({
      data: {
        policyId,
        grantedBy,
        grantedTo,
        grantedToType: options.grantedToType || 'user',
        accessLevel: options.accessLevel || 'view',
        permissions: options.permissions,
        expiresAt: options.expiresAt,
        maxViews: options.maxViews
      }
    });

    log.info({ grantId: grant.id, policyId, grantedTo }, 'Access grant created');
    return { success: true, grant };
  } catch (error) {
    log.error({ policyId, error: error.message }, 'Failed to create access grant');
    return { success: false, error: 'Failed to create grant' };
  }
}

/**
 * Revoke access grant
 */
export async function revokeAccessGrant(grantId) {
  try {
    const prisma = getPrismaClient();

    await prisma.contentAccessGrant.update({
      where: { id: grantId },
      data: {
        status: 'revoked',
        updatedAt: new Date()
      }
    });

    return { success: true };
  } catch (error) {
    log.error({ grantId, error: error.message }, 'Failed to revoke grant');
    return { success: false, error: 'Failed to revoke grant' };
  }
}

// ============================================================================
// Access Logging
// ============================================================================

/**
 * Log content access
 */
export async function logContentAccess(
  policyId,
  accessorId,
  action,
  granted,
  context = {}
) {
  try {
    const prisma = getPrismaClient();

    await prisma.contentAccessLog.create({
      data: {
        policyId,
        accessorId,
        accessorType: context.accessorType || 'user',
        action,
        granted,
        denialReason: context.denialReason,
        viaCircleId: context.viaCircleId,
        viaGrantId: context.viaGrantId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceId: context.deviceId,
        location: context.location
      }
    });
  } catch (error) {
    log.error({ policyId, error: error.message }, 'Failed to log access');
  }
}

/**
 * Get access log for content
 */
export async function getContentAccessLog(
  contentId,
  options = {}
) {
  try {
    const prisma = getPrismaClient();
    const { limit = 100, offset = 0 } = options;

    const policy = await prisma.sharingPolicy.findUnique({
      where: { contentId }
    });

    if (!policy) {
      return { success: false, error: 'Policy not found' };
    }

    const logs = await prisma.contentAccessLog.findMany({
      where: { policyId: policy.id },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });

    return { success: true, logs };
  } catch (error) {
    log.error({ contentId, error: error.message }, 'Failed to get access log');
    return { success: false, error: 'Failed to get log' };
  }
}

// ============================================================================
// Export Service
// ============================================================================

export const sharingPolicyService = {
  // Policy CRUD
  createSharingPolicy,
  getSharingPolicy,
  updateSharingPolicy,
  deleteSharingPolicy,

  // Access Control
  checkAccess,

  // Collaborative Privacy
  addStakeholder,
  resolvePrivacyConflict,

  // Access Grants
  createAccessGrant,
  revokeAccessGrant,

  // Logging
  logContentAccess,
  getContentAccessLog,

  // Constants
  Permission,
  DecisionMode,
  StakeholderRole,
  DEFAULT_PERMISSIONS
};

export default sharingPolicyService;
