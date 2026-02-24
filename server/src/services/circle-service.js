/**
 * Circle Service - Phase 2
 *
 * Advanced circle management with smart auto-population,
 * granular permissions, and social graph integration
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { identityService } from './identity-service.js';

const log = logger.child({ module: 'circle-service' });

// ============================================================================
// Types
// ============================================================================

export const CircleType = {
  MANUAL: 'manual',
  SMART: 'smart',
  SHARED: 'shared',
  EPHEMERAL: 'ephemeral',
  INTEREST: 'interest',
  PROXIMITY: 'proximity',
  INTERACTION: 'interaction',
};

export const CircleVisibility = {
  SECRET: 'secret', // No one knows this circle exists
  PRIVATE: 'private', // Members know, but not listed
  VISIBLE: 'visible', // Listed on profile
};

export const MemberRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

export const MemberStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  LEFT: 'left',
};

// Default permissions per role
const DEFAULT_PERMISSIONS = {
  [MemberRole.OWNER]: {
    canInvite: true,
    canShare: true,
    canSeeOthers: true,
    canPost: true,
    canModerate: true,
    canManageSettings: true,
  },
  [MemberRole.ADMIN]: {
    canInvite: true,
    canShare: true,
    canSeeOthers: true,
    canPost: true,
    canModerate: true,
    canManageSettings: false,
  },
  [MemberRole.MODERATOR]: {
    canInvite: false,
    canShare: true,
    canSeeOthers: true,
    canPost: true,
    canModerate: true,
    canManageSettings: false,
  },
  [MemberRole.MEMBER]: {
    canInvite: false,
    canShare: true,
    canSeeOthers: true,
    canPost: true,
    canModerate: false,
    canManageSettings: false,
  },
  [MemberRole.VIEWER]: {
    canInvite: false,
    canShare: false,
    canSeeOthers: false,
    canPost: false,
    canModerate: false,
    canManageSettings: false,
  },
};

// ============================================================================
// Circle CRUD Operations
// ============================================================================

/**
 * Create a new circle
 */
export async function createCircle(
  ownerId,
  {
    name,
    description,
    icon,
    color,
    type = CircleType.MANUAL,
    visibility = CircleVisibility.PRIVATE,
    smartRules = null,
    expiresAt = null,
    isShared = false,
    autoSuggest = true,
  }
) {
  try {
    const prisma = getPrismaClient();

    const circle = await prisma.circle.create({
      data: {
        ownerId,
        name,
        description,
        icon,
        color,
        type,
        visibility,
        smartRules,
        expiresAt,
        isShared,
        autoSuggest,
        memberCount: 1, // Owner is first member
      },
    });

    // Add owner as member
    await prisma.circleMember.create({
      data: {
        circleId: circle.id,
        userId: ownerId,
        role: MemberRole.OWNER,
        permissions: DEFAULT_PERMISSIONS[MemberRole.OWNER],
        addedBy: ownerId,
        status: MemberStatus.ACTIVE,
      },
    });

    log.info({ circleId: circle.id, ownerId, type }, 'Circle created');
    return { success: true, circle };
  } catch (error) {
    log.error({ ownerId, error: error.message }, 'Failed to create circle');
    return { success: false, error: 'Failed to create circle' };
  }
}

/**
 * Get circle by ID with members
 */
export async function getCircle(circleId, requesterId = null) {
  try {
    const prisma = getPrismaClient();

    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        members: {
          where: { status: MemberStatus.ACTIVE },
          include: {
            user: {
              select: {
                id: true,
                did: true,
                handle: true,
                displayName: true,
                avatarUrl: true,
                verificationLevel: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            did: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!circle) {
      return { success: false, error: 'Circle not found' };
    }

    // Check visibility permissions
    if (circle.visibility === CircleVisibility.SECRET) {
      const isMember = circle.members.some((m) => m.userId === requesterId);
      if (!isMember && circle.ownerId !== requesterId) {
        return { success: false, error: 'Circle not found' };
      }
    }

    return { success: true, circle };
  } catch (error) {
    log.error({ circleId, error: error.message }, 'Failed to get circle');
    return { success: false, error: 'Failed to get circle' };
  }
}

/**
 * Get all circles for a user
 */
export async function getUserCircles(userId, options = {}) {
  try {
    const prisma = getPrismaClient();
    const { includeMemberships = true, type = null } = options;

    const where = {
      OR: [{ ownerId: userId }, { members: { some: { userId, status: MemberStatus.ACTIVE } } }],
    };

    if (type) {
      where.AND = [{ type }];
    }

    const circles = await prisma.circle.findMany({
      where,
      include: includeMemberships
        ? {
            members: {
              where: { status: MemberStatus.ACTIVE },
              select: {
                userId: true,
                role: true,
                user: {
                  select: {
                    id: true,
                    handle: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          }
        : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    return { success: true, circles };
  } catch (error) {
    log.error({ userId, error: error.message }, 'Failed to get user circles');
    return { success: false, error: 'Failed to get circles' };
  }
}

/**
 * Update circle settings
 */
export async function updateCircle(circleId, userId, updates) {
  try {
    const prisma = getPrismaClient();

    // Check permissions
    const membership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId,
        status: MemberStatus.ACTIVE,
        OR: [
          { role: MemberRole.OWNER },
          { role: MemberRole.ADMIN },
          { permissions: { path: ['canManageSettings'], equals: true } },
        ],
      },
    });

    if (!membership) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const allowedUpdates = [
      'name',
      'description',
      'icon',
      'color',
      'visibility',
      'autoSuggest',
      'smartRules',
    ];
    const filteredUpdates = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const circle = await prisma.circle.update({
      where: { id: circleId },
      data: {
        ...filteredUpdates,
        updatedAt: new Date(),
      },
    });

    // Log activity
    await logCircleActivity(circleId, userId, 'settings_changed', null, {
      updates: filteredUpdates,
    });

    return { success: true, circle };
  } catch (error) {
    log.error({ circleId, userId, error: error.message }, 'Failed to update circle');
    return { success: false, error: 'Failed to update circle' };
  }
}

/**
 * Delete a circle
 */
export async function deleteCircle(circleId, userId) {
  try {
    const prisma = getPrismaClient();

    // Only owner can delete
    const circle = await prisma.circle.findFirst({
      where: {
        id: circleId,
        ownerId: userId,
      },
    });

    if (!circle) {
      return { success: false, error: 'Circle not found or insufficient permissions' };
    }

    await prisma.circle.delete({
      where: { id: circleId },
    });

    log.info({ circleId, userId }, 'Circle deleted');
    return { success: true };
  } catch (error) {
    log.error({ circleId, userId, error: error.message }, 'Failed to delete circle');
    return { success: false, error: 'Failed to delete circle' };
  }
}

// ============================================================================
// Member Management
// ============================================================================

/**
 * Add member to circle
 */
export async function addMember(circleId, inviterId, inviteeId, role = MemberRole.MEMBER) {
  try {
    const prisma = getPrismaClient();

    // Check inviter permissions
    const inviter = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: inviterId,
        status: MemberStatus.ACTIVE,
        OR: [
          { role: { in: [MemberRole.OWNER, MemberRole.ADMIN] } },
          { permissions: { path: ['canInvite'], equals: true } },
        ],
      },
    });

    if (!inviter) {
      return { success: false, error: 'Insufficient permissions to invite' };
    }

    // Check if already member
    const existing = await prisma.circleMember.findUnique({
      where: {
        circleId_userId: {
          circleId,
          userId: inviteeId,
        },
      },
    });

    if (existing) {
      if (existing.status === MemberStatus.ACTIVE) {
        return { success: false, error: 'Already a member' };
      }
      // Reactivate
      await prisma.circleMember.update({
        where: { id: existing.id },
        data: {
          status: MemberStatus.ACTIVE,
          role,
          permissions: DEFAULT_PERMISSIONS[role],
          addedBy: inviterId,
        },
      });
    } else {
      // Create new member
      await prisma.circleMember.create({
        data: {
          circleId,
          userId: inviteeId,
          role,
          permissions: DEFAULT_PERMISSIONS[role],
          addedBy: inviterId,
          status: MemberStatus.ACTIVE,
        },
      });
    }

    // Update member count
    await prisma.circle.update({
      where: { id: circleId },
      data: { memberCount: { increment: 1 } },
    });

    // Log activity
    await logCircleActivity(circleId, inviterId, 'member_added', inviteeId);

    log.info({ circleId, inviterId, inviteeId, role }, 'Member added to circle');
    return { success: true };
  } catch (error) {
    log.error({ circleId, inviteeId, error: error.message }, 'Failed to add member');
    return { success: false, error: 'Failed to add member' };
  }
}

/**
 * Remove member from circle
 */
export async function removeMember(circleId, removerId, memberId) {
  try {
    const prisma = getPrismaClient();

    // Check permissions
    const remover = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: removerId,
        status: MemberStatus.ACTIVE,
      },
    });

    if (!remover) {
      return { success: false, error: 'Not a member' };
    }

    // Can remove self, or if admin/owner
    const canRemove =
      removerId === memberId ||
      [MemberRole.OWNER, MemberRole.ADMIN].includes(remover.role) ||
      remover.permissions?.canModerate;

    if (!canRemove) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Cannot remove owner
    const target = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: memberId,
        role: MemberRole.OWNER,
      },
    });

    if (target) {
      return { success: false, error: 'Cannot remove circle owner' };
    }

    await prisma.circleMember.updateMany({
      where: {
        circleId,
        userId: memberId,
      },
      data: {
        status: MemberStatus.LEFT,
        updatedAt: new Date(),
      },
    });

    // Update member count
    await prisma.circle.update({
      where: { id: circleId },
      data: { memberCount: { decrement: 1 } },
    });

    // Log activity
    await logCircleActivity(circleId, removerId, 'member_removed', memberId);

    return { success: true };
  } catch (error) {
    log.error({ circleId, memberId, error: error.message }, 'Failed to remove member');
    return { success: false, error: 'Failed to remove member' };
  }
}

/**
 * Update member role/permissions
 */
export async function updateMemberRole(circleId, updaterId, memberId, { role, permissions }) {
  try {
    const prisma = getPrismaClient();

    // Check updater permissions
    const updater = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: updaterId,
        status: MemberStatus.ACTIVE,
        role: { in: [MemberRole.OWNER, MemberRole.ADMIN] },
      },
    });

    if (!updater) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Admin cannot modify owner
    if (updater.role === MemberRole.ADMIN) {
      const target = await prisma.circleMember.findFirst({
        where: { circleId, userId: memberId, role: MemberRole.OWNER },
      });
      if (target) {
        return { success: false, error: 'Cannot modify owner' };
      }
    }

    const updateData = {};
    if (role) {
      updateData.role = role;
    }
    if (permissions) {
      updateData.permissions = permissions;
    }

    await prisma.circleMember.updateMany({
      where: { circleId, userId: memberId },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    log.error({ circleId, memberId, error: error.message }, 'Failed to update member role');
    return { success: false, error: 'Failed to update member' };
  }
}

// ============================================================================
// Smart Circle Engine
// ============================================================================

/**
 * Evaluate smart circle rules and suggest members
 */
export async function evaluateSmartCircle(circleId) {
  try {
    const prisma = getPrismaClient();

    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!circle || circle.type !== CircleType.SMART) {
      return { success: false, error: 'Not a smart circle' };
    }

    const rules = circle.smartRules || {};
    const existingMemberIds = circle.members.map((m) => m.userId);

    // Build query based on rules
    const candidates = await findSmartCircleCandidates(circle.ownerId, existingMemberIds, rules);

    return {
      success: true,
      candidates: candidates.slice(0, 20),
      totalCandidates: candidates.length,
    };
  } catch (error) {
    log.error({ circleId, error: error.message }, 'Smart circle evaluation failed');
    return { success: false, error: 'Evaluation failed' };
  }
}

/**
 * Auto-populate smart circle with matching users
 */
export async function autoPopulateSmartCircle(circleId, maxAdditions = 10) {
  try {
    const prisma = getPrismaClient();

    const { success, candidates } = await evaluateSmartCircle(circleId);
    if (!success) {
      return { success: false, error: 'Evaluation failed' };
    }

    let added = 0;
    for (const candidate of candidates.slice(0, maxAdditions)) {
      const result = await addMember(circleId, 'system', candidate.userId, MemberRole.MEMBER);
      if (result.success) {
        added++;
      }
    }

    log.info({ circleId, added }, 'Smart circle auto-populated');
    return { success: true, added };
  } catch (error) {
    log.error({ circleId, error: error.message }, 'Auto-population failed');
    return { success: false, error: 'Auto-population failed' };
  }
}

/**
 * Find candidates for smart circle
 */
async function findSmartCircleCandidates(ownerId, excludeIds, rules) {
  const prisma = getPrismaClient();

  // Base query: users connected to owner
  const where = {
    id: { notIn: excludeIds },
    OR: [
      // Mutual connections
      {
        following: {
          some: {
            followerId: ownerId,
            status: 'active',
          },
        },
      },
      {
        followers: {
          some: {
            followingId: ownerId,
            status: 'active',
          },
        },
      },
    ],
  };

  // Apply interaction filter
  if (rules.minInteractions) {
    // This would require interaction tracking
    // Simplified: check conversation co-participation
  }

  // Apply interest filter
  if (rules.sharedInterests?.length > 0) {
    where.AND = where.AND || [];
    where.AND.push({
      topicProfiles: {
        some: {
          topicSlug: { in: rules.sharedInterests },
        },
      },
    });
  }

  const candidates = await prisma.user.findMany({
    where,
    select: {
      id: true,
      did: true,
      handle: true,
      displayName: true,
      avatarUrl: true,
      verificationLevel: true,
      _count: {
        select: {
          following: true,
          followers: true,
        },
      },
    },
    take: 50,
  });

  // Score and rank candidates
  return candidates
    .map((c) => ({
      userId: c.id,
      did: c.did,
      handle: c.handle,
      displayName: c.displayName,
      avatarUrl: c.avatarUrl,
      verificationLevel: c.verificationLevel,
      mutualConnections: c._count.following + c._count.followers,
      score: calculateCandidateScore(c, rules),
    }))
    .sort((a, b) => b.score - a.score);
}

function calculateCandidateScore(candidate, rules) {
  let score = 0;

  // Verification level boost
  score += candidate.verificationLevel * 10;

  // Mutual connections
  score += candidate.mutualConnections * 5;

  // Interest overlap (would need actual data)
  if (rules.sharedInterests) {
    score += rules.sharedInterests.length * 3;
  }

  return score;
}

// ============================================================================
// Circle Suggestions
// ============================================================================

/**
 * Generate circle suggestions for a user
 */
export async function generateCircleSuggestions(userId) {
  try {
    const prisma = getPrismaClient();

    // Get user's connections
    const connections = await prisma.socialConnection.findMany({
      where: {
        followerId: userId,
        status: 'active',
      },
      select: {
        followingId: true,
      },
    });

    const connectionIds = connections.map((c) => c.followingId);

    // Find users with mutual connections
    const suggestions = await prisma.user.findMany({
      where: {
        id: { notIn: [userId, ...connectionIds] },
        followers: {
          some: {
            followerId: { in: connectionIds },
          },
        },
      },
      select: {
        id: true,
        did: true,
        handle: true,
        displayName: true,
        avatarUrl: true,
      },
      take: 20,
    });

    // Create suggestion records
    for (const suggestion of suggestions) {
      await prisma.circleSuggestion.upsert({
        where: {
          userId_suggestedUserId: {
            userId,
            suggestedUserId: suggestion.id,
          },
        },
        update: {},
        create: {
          userId,
          suggestedUserId: suggestion.id,
          reason: 'mutual_friends',
          confidence: 0.7,
        },
      });
    }

    return { success: true, count: suggestions.length };
  } catch (error) {
    log.error({ userId, error: error.message }, 'Failed to generate suggestions');
    return { success: false, error: 'Failed to generate suggestions' };
  }
}

/**
 * Get circle suggestions for user
 */
export async function getCircleSuggestions(userId, options = {}) {
  try {
    const prisma = getPrismaClient();
    const { limit = 10, includeDismissed = false } = options;

    const suggestions = await prisma.circleSuggestion.findMany({
      where: {
        userId,
        ...(includeDismissed ? {} : { dismissedAt: null }),
        actedAt: null,
      },
      include: {
        suggestedUser: {
          select: {
            id: true,
            did: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
            verificationLevel: true,
          },
        },
      },
      orderBy: { confidence: 'desc' },
      take: limit,
    });

    return { success: true, suggestions };
  } catch (error) {
    log.error({ userId, error: error.message }, 'Failed to get suggestions');
    return { success: false, error: 'Failed to get suggestions' };
  }
}

// ============================================================================
// Activity Logging
// ============================================================================

async function logCircleActivity(circleId, actorId, action, targetId = null, details = null) {
  try {
    const prisma = getPrismaClient();

    await prisma.circleActivityLog.create({
      data: {
        circleId,
        action,
        actorId,
        targetId,
        details,
      },
    });
  } catch (error) {
    log.error({ circleId, action, error: error.message }, 'Failed to log activity');
  }
}

/**
 * Get circle activity log
 */
export async function getCircleActivity(circleId, options = {}) {
  try {
    const prisma = getPrismaClient();
    const { limit = 50, offset = 0 } = options;

    const activities = await prisma.circleActivityLog.findMany({
      where: { circleId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return { success: true, activities };
  } catch (error) {
    log.error({ circleId, error: error.message }, 'Failed to get activity');
    return { success: false, error: 'Failed to get activity' };
  }
}

// ============================================================================
// Export Service
// ============================================================================

export const circleService = {
  // Circle CRUD
  createCircle,
  getCircle,
  getUserCircles,
  updateCircle,
  deleteCircle,

  // Member Management
  addMember,
  removeMember,
  updateMemberRole,

  // Smart Circles
  evaluateSmartCircle,
  autoPopulateSmartCircle,

  // Suggestions
  generateCircleSuggestions,
  getCircleSuggestions,

  // Activity
  getCircleActivity,

  // Constants
  CircleType,
  CircleVisibility,
  MemberRole,
  MemberStatus,
  DEFAULT_PERMISSIONS,
};

export default circleService;
