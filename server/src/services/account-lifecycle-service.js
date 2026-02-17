/**
 * User Account Lifecycle Service
 *
 * Handles:
 * - Soft delete (account deactivation)
 * - Hard delete (GDPR erasure)
 * - Account suspension/ban
 * - Account status checks
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { debugReporter } from './debug-reporter.js';

const log = logger.child({ module: 'account-lifecycle' });

const DELETION_GRACE_PERIOD_DAYS = 30;
const MAX_DELETION_BATCH = 1000;

export async function checkAccountStatus(userId) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, deletedAt: true, suspendedAt: true, bannedAt: true },
  });
  return user;
}

export async function isAccountActive(userId) {
  const status = await checkAccountStatus(userId);
  if (!status) return false;
  if (status.status === 'DELETED') return false;
  if (status.status === 'DELETING') return false;
  if (status.status === 'SUSPENDED') return false;
  if (status.status === 'BANNED') return false;
  return true;
}

export async function canUserAccess(userId) {
  const status = await checkAccountStatus(userId);
  if (!status) return { allowed: false, reason: 'user_not_found' };
  if (status.status === 'DELETED') return { allowed: false, reason: 'account_deleted' };
  if (status.status === 'DELETING') return { allowed: false, reason: 'account_being_deleted' };
  if (status.status === 'SUSPENDED') return { allowed: false, reason: 'account_suspended' };
  if (status.status === 'BANNED') return { allowed: false, reason: 'account_banned' };
  return { allowed: true, reason: null };
}

export async function requestAccountDeletion(userId, options = {}) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.status === 'DELETED') {
    return { success: false, error: 'Account already deleted' };
  }

  const now = new Date();
  const scheduledDeletion = new Date(
    now.getTime() + DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'DELETING',
      deletionRequestedAt: now,
      deletedAt: scheduledDeletion,
    },
  });

  log.info({ userId, scheduledDeletion }, 'Account deletion scheduled');

  if (options.immediate) {
    await performHardDelete(userId);
  }

  return {
    success: true,
    scheduledDeletion: scheduledDeletion.toISOString(),
    gracePeriodDays: DELETION_GRACE_PERIOD_DAYS,
  };
}

export async function cancelAccountDeletion(userId) {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.status !== 'DELETING') {
    return { success: false, error: 'No pending deletion' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      deletionRequestedAt: null,
      deletedAt: null,
    },
  });

  log.info({ userId }, 'Account deletion cancelled');
  return { success: true };
}

export async function performHardDelete(userId) {
  const prisma = getPrismaClient();

  log.info({ userId }, 'Starting hard delete');
  debugReporter.trackInfo({ category: 'account', message: 'Starting hard delete' }, { userId });

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { status: 'DELETED' },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          email: null,
          phoneNumber: null,
          displayName: 'Deleted User',
          avatarUrl: null,
          publicKey: 'deleted',
          handle: null,
          did: `did:deleted:${userId}`,
          settings: {},
          privacyPreferences: {},
        },
      }),
    ]);

    log.info({ userId }, 'Hard delete completed');
    debugReporter.trackInfo({ category: 'account', message: 'Hard delete completed' }, { userId });
    return { success: true };
  } catch (error) {
    debugReporter.trackError(error, { operation: 'performHardDelete', userId });
    log.error({ userId, error: error.message }, 'Hard delete failed');
    return { success: false, error: error.message };
  }
}

export async function processScheduledDeletions() {
  const prisma = getPrismaClient();
  const now = new Date();

  const usersToDelete = await prisma.user.findMany({
    where: {
      status: 'DELETING',
      deletedAt: { lte: now },
    },
    take: MAX_DELETION_BATCH,
    select: { id: true },
  });

  log.info({ count: usersToDelete.length }, 'Processing scheduled deletions');

  for (const user of usersToDelete) {
    await performHardDelete(user.id);
  }

  return { processed: usersToDelete.length };
}

export async function suspendAccount(userId, reason) {
  const prisma = getPrismaClient();

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'SUSPENDED',
      suspendedAt: new Date(),
      suspensionReason: reason,
    },
  });

  log.info({ userId, reason }, 'Account suspended');
  return { success: true };
}

export async function unsuspendAccount(userId) {
  const prisma = getPrismaClient();

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      suspendedAt: null,
      suspensionReason: null,
    },
  });

  log.info({ userId }, 'Account unsuspended');
  return { success: true };
}

export async function banAccount(userId, reason) {
  const prisma = getPrismaClient();

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'BANNED',
      bannedAt: new Date(),
      banReason: reason,
    },
  });

  log.info({ userId, reason }, 'Account banned');
  return { success: true };
}

export async function unbanAccount(userId) {
  const prisma = getPrismaClient();

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      bannedAt: null,
      banReason: null,
    },
  });

  log.info({ userId }, 'Account unbanned');
  return { success: true };
}

export async function getAccountInfo(userId) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      did: true,
      email: true,
      displayName: true,
      status: true,
      verificationLevel: true,
      trustScore: true,
      createdAt: true,
      lastSeenAt: true,
      deletedAt: true,
      deletionRequestedAt: true,
      suspendedAt: true,
      suspensionReason: true,
      bannedAt: true,
      banReason: true,
    },
  });
  return user;
}

export const accountLifecycle = {
  checkAccountStatus,
  isAccountActive,
  canUserAccess,
  requestAccountDeletion,
  cancelAccountDeletion,
  performHardDelete,
  processScheduledDeletions,
  suspendAccount,
  unsuspendAccount,
  banAccount,
  unbanAccount,
  getAccountInfo,
};

export default accountLifecycle;
