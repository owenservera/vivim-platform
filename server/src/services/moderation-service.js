/**
 * Content Moderation Service
 *
 * Handles content flagging, review, and automated moderation
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { debugReporter } from './debug-reporter.js';

const log = logger.child({ module: 'moderation-service' });

// ============================================================================
// Content Flagging (User Reports)
// ============================================================================

/**
 * Report content for moderation
 */
export async function flagContent(reporterId, options) {
  const prisma = getPrismaClient();

  const { contentId, contentType, contentOwnerId, contentText, reason, description } = options;

  // Check for duplicate report
  const existing = await prisma.contentFlag.findFirst({
    where: {
      reporterId,
      contentId,
      contentType,
      status: { in: ['PENDING', 'REVIEWING', 'FLAGGED'] },
    },
  });

  if (existing) {
    return { success: false, error: 'Content already reported' };
  }

  const flag = await prisma.contentFlag.create({
    data: {
      contentId,
      contentType,
      contentOwnerId,
      contentText: contentText?.substring(0, 5000), // Store first 5000 chars
      reporterId,
      reason,
      description,
      priority: getPriorityForReason(reason),
    },
  });

  // Update user moderation record if content owner exists
  if (contentOwnerId) {
    await incrementUserStrike(contentOwnerId, reason);
  }

  log.info({ flagId: flag.id, reporterId, contentType, reason }, 'Content flagged');

  return { success: true, flagId: flag.id };
}

/**
 * Get priority based on reason
 */
function getPriorityForReason(reason) {
  const priorityMap = {
    SELF_HARM: 'CRITICAL',
    UNDERAGE: 'CRITICAL',
    VIOLENCE: 'HIGH',
    SEXUAL: 'HIGH',
    HATE_SPEECH: 'HIGH',
    HARASSMENT: 'MEDIUM',
    SPAM: 'LOW',
    MISINFORMATION: 'MEDIUM',
    PRIVACY: 'MEDIUM',
    COPYRIGHT: 'MEDIUM',
    IMPERSONATION: 'MEDIUM',
    DANGEROUS: 'HIGH',
    OTHER: 'LOW',
  };
  return priorityMap[reason] || 'LOW';
}

// ============================================================================
// Moderation Review
// ============================================================================

/**
 * Review a flagged content
 */
export async function reviewFlag(flagId, reviewerId, decision) {
  const prisma = getPrismaClient();

  const { status, resolution, action, notifyUser } = decision;

  const flag = await prisma.contentFlag.update({
    where: { id: flagId },
    data: {
      status,
      reviewerId,
      reviewedAt: new Date(),
      resolution,
      actionTaken: action,
      userNotified: notifyUser === true,
    },
  });

  // Take action on content if needed
  if (action && flag.contentId && flag.contentType) {
    await takeContentAction(flag.contentId, flag.contentType, action);
  }

  log.info({ flagId, reviewerId, status, action }, 'Flag reviewed');

  return { success: true, flag };
}

/**
 * Take action on content
 */
async function takeContentAction(contentId, contentType, action) {
  const prisma = getPrismaClient();

  switch (action) {
    case 'remove':
      // Mark content as removed/hidden
      await hideContent(contentId, contentType);
      break;
    case 'warn':
      // Content owner will be warned (handled separately)
      break;
    case 'ban':
      await hideContent(contentId, contentType);
      // Could also ban the user
      break;
    default:
      log.warn({ action }, 'Unknown content action');
  }
}

/**
 * Hide content based on type
 */
async function hideContent(contentId, contentType) {
  const prisma = getPrismaClient();

  const updateMap = {
    conversation: { state: 'REMOVED' },
    acu: { state: 'REMOVED' },
    memory: { isArchived: true },
    group_post: {
      /* Would need status field */
    },
  };

  const update = updateMap[contentType];
  if (!update) {
    return;
  }

  // Map content type to model
  const modelMap = {
    conversation: prisma.conversation,
    acu: prisma.atomicChatUnit,
    memory: prisma.memory,
    group_post: prisma.groupPost,
  };

  const model = modelMap[contentType];
  if (model) {
    await model.update({
      where: { id: contentId },
      data: update,
    });
  }
}

// ============================================================================
// User Moderation Records (Strike System)
// ============================================================================

/**
 * Get user moderation record
 */
export async function getUserModerationRecord(userId) {
  const prisma = getPrismaClient();

  let record = await prisma.userModerationRecord.findUnique({
    where: { userId },
  });

  if (!record) {
    record = await prisma.userModerationRecord.create({
      data: { userId },
    });
  }

  return record;
}

/**
 * Increment user strike count
 */
async function incrementUserStrike(userId, reason) {
  const prisma = getPrismaClient();

  const reasonFieldMap = {
    SPAM: 'spamCount',
    HARASSMENT: 'harassmentCount',
    HATE_SPEECH: 'hateSpeechCount',
    VIOLENCE: 'violenceCount',
    SEXUAL: 'sexualCount',
    MISINFORMATION: 'misinformationCount',
    OTHER: 'otherCount',
  };

  const field = reasonFieldMap[reason] || 'otherCount';

  // Get current record or create
  let record = await prisma.userModerationRecord.findUnique({ where: { userId } });

  if (!record) {
    record = await prisma.userModerationRecord.create({
      data: { userId, [field]: 1, totalStrikes: 1, lastStrikedAt: new Date() },
    });
  } else {
    // Increment the specific count
    await prisma.userModerationRecord.update({
      where: { userId },
      data: {
        [field]: { increment: 1 },
        totalStrikes: { increment: 1 },
        lastStrikedAt: new Date(),
      },
    });
  }

  // Check if action needed based on strike count
  await checkAndApplyStrikes(userId);
}

/**
 * Check strike count and apply automatic actions
 */
async function checkAndApplyStrikes(userId) {
  const prisma = getPrismaClient();
  const record = await prisma.userModerationRecord.findUnique({ where: { userId } });

  if (!record || record.isBanned) {
    return;
  }

  // Auto-warn after 3 strikes
  if (record.totalStrikes >= 3 && !record.isWarningActive) {
    await prisma.userModerationRecord.update({
      where: { userId },
      data: {
        isWarningActive: true,
        warningExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Could trigger notification here
    log.info({ userId, strikes: record.totalStrikes }, 'User auto-warned');
  }

  // Auto-ban after 10 strikes
  if (record.totalStrikes >= 10) {
    await prisma.userModerationRecord.update({
      where: { userId },
      data: {
        isBanned: true,
        banReason: 'Automatic ban due to repeated violations',
      },
    });

    log.warn({ userId, strikes: record.totalStrikes }, 'User auto-banned');
  }
}

// ============================================================================
// Moderation Rules
// ============================================================================

/**
 * Create moderation rule
 */
export async function createModerationRule(options) {
  const prisma = getPrismaClient();

  const rule = await prisma.moderationRule.create({
    data: {
      name: options.name,
      description: options.description,
      conditionType: options.conditionType,
      condition: options.condition,
      action: options.action,
      actionConfig: options.actionConfig,
      contentTypes: options.contentTypes || ['conversation', 'acu', 'memory', 'group_post'],
      appliesTo: options.appliesTo || 'all',
      isEnabled: options.isEnabled !== false,
      priority: options.priority || 0,
      maxStrikes: options.maxStrikes,
      timeWindow: options.timeWindow,
      createdBy: options.createdBy,
    },
  });

  return { success: true, rule };
}

/**
 * Get active moderation rules
 */
export async function getActiveRules() {
  const prisma = getPrismaClient();

  return await prisma.moderationRule.findMany({
    where: { isEnabled: true },
    orderBy: { priority: 'desc' },
  });
}

/**
 * Process content against moderation rules (automod)
 */
export async function processAutoModeration(contentId, contentType, text, ownerId) {
  const rules = await getActiveRules();

  // Filter rules applicable to this content type
  const applicableRules = rules.filter(
    (r) => r.contentTypes.includes(contentType) || r.contentTypes.includes('all')
  );

  for (const rule of applicableRules) {
    const shouldFlag = await evaluateRule(rule, text);

    if (shouldFlag) {
      await flagContent('system', {
        contentId,
        contentType,
        contentOwnerId: ownerId,
        contentText: text,
        reason: 'OTHER',
        description: `Auto-flagged by rule: ${rule.name}`,
      });

      // Take automatic action
      if (rule.action === 'remove') {
        await takeContentAction(contentId, contentType, 'remove');
      }

      return { flagged: true, rule: rule.name, action: rule.action };
    }
  }

  return { flagged: false };
}

/**
 * Evaluate a rule against text
 */
async function evaluateRule(rule, text) {
  if (!text) {
    return false;
  }

  const { condition } = rule;

  switch (rule.conditionType) {
    case 'keyword': {
      const keywords = condition.keywords || [];
      return keywords.some((k) => text.toLowerCase().includes(k.toLowerCase()));
    }

    case 'pattern': {
      try {
        const regex = new RegExp(condition.pattern, 'i');
        return regex.test(text);
      } catch {
        return false;
      }
    }

    case 'threshold':
      // For length/quantity thresholds
      return false; // Would need specific implementation

    case 'ai_score':
      // Would integrate with AI moderation API
      return false;

    default:
      return false;
  }
}

// ============================================================================
// Appeals
// ============================================================================

/**
 * Appeal a moderation decision
 */
export async function appealDecision(flagId, userId, reason) {
  const prisma = getPrismaClient();

  const flag = await prisma.contentFlag.findUnique({ where: { id: flagId } });

  if (!flag) {
    return { success: false, error: 'Flag not found' };
  }

  if (flag.contentOwnerId !== userId) {
    return { success: false, error: 'Not authorized to appeal this decision' };
  }

  if (flag.status !== 'REMOVED' && flag.status !== 'WARNED') {
    return { success: false, error: 'This decision cannot be appealed' };
  }

  await prisma.contentFlag.update({
    where: { id: flagId },
    data: {
      status: 'APPEALED',
      appealReason: reason,
      appealedAt: new Date(),
    },
  });

  return { success: true };
}

/**
 * Resolve appeal
 */
export async function resolveAppeal(flagId, reviewerId, sustained, resolution) {
  const prisma = getPrismaClient();

  const flag = await prisma.contentFlag.findUnique({ where: { id: flagId } });
  if (!flag) {
    return { success: false, error: 'Flag not found' };
  }

  const newStatus = sustained ? flag.status : 'APPROVED';

  await prisma.contentFlag.update({
    where: { id: flagId },
    data: {
      status: newStatus,
      appealReviewerId: reviewerId,
      appealResolvedAt: new Date(),
      resolution,
    },
  });

  // If appeal denied, content stays removed
  // If appeal sustained, restore content
  if (!sustained && flag) {
    await restoreContent(flag.contentId, flag.contentType);
  }

  return { success: true, sustained };
}

/**
 * Restore previously removed content
 */
async function restoreContent(contentId, contentType) {
  const prisma = getPrismaClient();

  const restoreMap = {
    conversation: { state: 'ACTIVE' },
    acu: { state: 'ACTIVE' },
    memory: { isArchived: false },
  };

  const restore = restoreMap[contentType];
  if (!restore) {
    return;
  }

  const modelMap = {
    conversation: prisma.conversation,
    acu: prisma.atomicChatUnit,
    memory: prisma.memory,
  };

  const model = modelMap[contentType];
  if (model) {
    await model.update({
      where: { id: contentId },
      data: restore,
    });
  }
}

// ============================================================================
// Moderator Notes
// ============================================================================

/**
 * Add moderator note
 */
export async function addModeratorNote(options) {
  const prisma = getPrismaClient();

  const note = await prisma.moderatorNote.create({
    data: {
      targetType: options.targetType,
      targetId: options.targetId,
      content: options.content,
      moderatorId: options.moderatorId,
      isInternal: options.isInternal !== false,
      isPublic: options.isPublic === true,
    },
  });

  return { success: true, note };
}

/**
 * Get notes for a target
 */
export async function getModeratorNotes(targetType, targetId) {
  const prisma = getPrismaClient();

  return await prisma.moderatorNote.findMany({
    where: {
      targetType,
      targetId,
      isInternal: false, // Only return non-internal notes
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================================================
// Dashboard & Stats
// ============================================================================

/**
 * Get moderation dashboard stats
 */
export async function getModerationStats() {
  const prisma = getPrismaClient();

  const [pendingCount, flaggedCount, removedCount, bannedCount, recentFlags] = await Promise.all([
    prisma.contentFlag.count({ where: { status: 'PENDING' } }),
    prisma.contentFlag.count({ where: { status: 'FLAGGED' } }),
    prisma.contentFlag.count({ where: { status: 'REMOVED' } }),
    prisma.userModerationRecord.count({ where: { isBanned: true } }),
    prisma.contentFlag.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    pending: pendingCount,
    flagged: flaggedCount,
    removed: removedCount,
    banned: bannedCount,
    recentFlags,
  };
}

/**
 * List flags with filters
 */
export async function listFlags(options = {}) {
  const prisma = getPrismaClient();

  const { status, reason, priority, contentType, limit = 50, offset = 0 } = options;

  const where = {};
  if (status) {
    where.status = status;
  }
  if (reason) {
    where.reason = reason;
  }
  if (priority) {
    where.priority = priority;
  }
  if (contentType) {
    where.contentType = contentType;
  }

  const [flags, total] = await Promise.all([
    prisma.contentFlag.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    }),
    prisma.contentFlag.count({ where }),
  ]);

  return { flags, total, limit, offset };
}

// ============================================================================
// Export
// ============================================================================

export const moderationService = {
  // Flagging
  flagContent,

  // Review
  reviewFlag,

  // User records
  getUserModerationRecord,

  // Rules
  createModerationRule,
  getActiveRules,
  processAutoModeration,

  // Appeals
  appealDecision,
  resolveAppeal,

  // Notes
  addModeratorNote,
  getModeratorNotes,

  // Dashboard
  getModerationStats,
  listFlags,
};

export default moderationService;
