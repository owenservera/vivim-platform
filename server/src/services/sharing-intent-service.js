import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { sharingPolicyService } from './sharing-policy-service.js';
import crypto from 'crypto';

const log = logger.child({ module: 'sharing-intent-service' });

const prisma = getPrismaClient();

export async function createSharingIntent({
  actorDid,
  ownerDid,
  contentType,
  contentIds,
  contentScope = 'FULL',
  includeACUs = [],
  excludeACUs = [],
  audienceType,
  circleIds = [],
  userDids = [],
  permissions,
  schedule = null,
  transformations = null,
  metadata = null,
  policy = null,
}) {
  const intent = await prisma.sharingIntent.create({
    data: {
      actorDid,
      ownerDid,
      contentType,
      contentIds,
      contentScope,
      includeACUs,
      excludeACUs,
      audienceType,
      circleIds,
      userDids,
      permissions,
      schedule,
      transformations,
      metadata,
      policy,
      status: 'DRAFT',
    },
  });

  await sharingPolicyService.createSharingPolicy(contentIds[0], contentType, ownerDid, {
    audience: { circles: circleIds, specificUsers: userDids },
    permissions: permissions || {},
    temporal: schedule,
  });

  log.info({ intentId: intent.id, actorDid }, 'Created sharing intent');
  return intent;
}

export async function getSharingIntent(intentId) {
  return prisma.sharingIntent.findUnique({
    where: { id: intentId },
    include: {
      contentRecords: true,
      shareLinks: true,
      accessGrants: true,
      accessLogs: true,
    },
  });
}

export async function getIntentsByOwner(ownerDid, options = {}) {
  const { status, contentType, audienceType, limit = 50, offset = 0 } = options;

  const where = { ownerDid };
  if (status) {
    where.status = status;
  }
  if (contentType) {
    where.contentType = contentType;
  }
  if (audienceType) {
    where.audienceType = audienceType;
  }

  return prisma.sharingIntent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      shareLinks: true,
      _count: { select: { accessGrants: true, accessLogs: true } },
    },
  });
}

export async function updateSharingIntent(intentId, updates) {
  const {
    audienceType,
    circleIds,
    userDids,
    permissions,
    schedule,
    transformations,
    metadata,
    status,
  } = updates;

  return prisma.sharingIntent.update({
    where: { id: intentId },
    data: {
      ...(audienceType && { audienceType }),
      ...(circleIds && { circleIds }),
      ...(userDids && { userDids }),
      ...(permissions && { permissions }),
      ...(schedule && { schedule }),
      ...(transformations && { transformations }),
      ...(metadata && { metadata }),
      ...(status && { status }),
      updatedAt: new Date(),
    },
  });
}

export async function publishSharingIntent(intentId) {
  const intent = await prisma.sharingIntent.findUnique({ where: { id: intentId } });
  if (!intent) {
    throw new Error('Intent not found');
  }
  if (intent.status !== 'DRAFT' && intent.status !== 'VALIDATED') {
    throw new Error(`Cannot publish intent with status: ${intent.status}`);
  }

  const published = await prisma.sharingIntent.update({
    where: { id: intentId },
    data: {
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
  });

  await logAnalyticsEvent({
    eventType: 'SHARE_CREATED',
    actorDid: intent.actorDid,
    intentId: intent.id,
    eventData: { contentType: intent.contentType, audienceType: intent.audienceType },
  });

  log.info({ intentId }, 'Published sharing intent');
  return published;
}

export async function revokeSharingIntent(intentId, reason) {
  return prisma.sharingIntent.update({
    where: { id: intentId },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
}

export async function createShareLink(intentId, options = {}) {
  const { maxUses, expiresAt, password, createdByDid } = options;

  const passwordHash = password ? crypto.createHash('sha256').update(password).digest('hex') : null;

  return prisma.shareLink.create({
    data: {
      intentId,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      passwordHash,
      createdByDid,
      isActive: true,
    },
  });
}

export async function getShareLink(linkCode) {
  return prisma.shareLink.findUnique({
    where: { linkCode },
    include: {
      intent: {
        include: {
          accessGrants: true,
        },
      },
    },
  });
}

export async function accessShareLink(linkCode, options = {}) {
  const { password, accessorDid } = options;

  const shareLink = await prisma.shareLink.findUnique({
    where: { linkCode },
    include: { intent: true },
  });

  if (!shareLink) {
    throw new Error('Link not found');
  }
  if (!shareLink.isActive) {
    throw new Error('Link is inactive');
  }
  if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
    throw new Error('Link has expired');
  }
  if (shareLink.maxUses && shareLink.usesCount >= shareLink.maxUses) {
    throw new Error('Link usage limit exceeded');
  }
  if (shareLink.passwordHash) {
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    if (passwordHash !== shareLink.passwordHash) {
      throw new Error('Invalid password');
    }
  }

  await prisma.shareLink.update({
    where: { id: shareLink.id },
    data: { usesCount: { increment: 1 }, lastUsedAt: new Date() },
  });

  await logAnalyticsEvent({
    eventType: 'LINK_CLICKED',
    actorDid: accessorDid,
    intentId: shareLink.intentId,
    eventData: { linkCode },
  });

  return shareLink.intent;
}

export async function logAnalyticsEvent({
  eventType,
  actorDid,
  intentId,
  contentRecordId,
  eventData = {},
}) {
  return prisma.analyticsEvent.create({
    data: {
      eventType,
      actorDid,
      intentId,
      contentRecordId,
      eventData,
      timestamp: new Date(),
    },
  });
}

export async function getContentRecord(contentId) {
  return prisma.contentRecord.findUnique({
    where: { contentId },
    include: { providers: true, accessLog: true },
  });
}

export async function createContentRecord({
  contentId,
  contentHash,
  contentType,
  size,
  mimeType,
  ownerDid,
  creatorDid,
  intentId,
  discoveryMetadata = {},
}) {
  return prisma.contentRecord.create({
    data: {
      contentId,
      contentHash,
      contentType,
      size,
      mimeType,
      ownerDid,
      creatorDid,
      intentId,
      discoveryMetadata,
    },
  });
}

export const sharingIntentService = {
  createSharingIntent,
  getSharingIntent,
  getIntentsByOwner,
  updateSharingIntent,
  publishSharingIntent,
  revokeSharingIntent,
  createShareLink,
  getShareLink,
  accessShareLink,
  logAnalyticsEvent,
  getContentRecord,
  createContentRecord,
};

export default sharingIntentService;
