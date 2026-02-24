import { Router } from 'express';
import { z } from 'zod';
import { portabilityService } from '../services/portability-service.js';
import { authenticateDID } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const router = Router();
const log = logger.child({ module: 'portability-routes' });

const exportRequestSchema = z.object({
  exportType: z.enum(['full', 'partial', 'selective']).default('full'),
  formats: z
    .array(z.enum(['json', 'activitypub', 'atproto', 'markdown', 'html']))
    .default(['json']),
  includeContent: z.boolean().default(true),
  includeCircles: z.boolean().default(true),
  includeSocialGraph: z.boolean().default(true),
  includeSettings: z.boolean().default(true),
  includeAnalytics: z.boolean().default(false),
  anonymizeOthers: z.boolean().default(false),
  includePrivateContent: z.boolean().default(true),
  includeDeletedContent: z.boolean().default(false),
});

const migrationRequestSchema = z.object({
  direction: z.enum(['export_from_platform', 'import_to_platform']),
  toPds: z.string().url().optional(),
  migrateIdentity: z.boolean().default(true),
  migrateContent: z.boolean().default(true),
  migrateSocialGraph: z.boolean().default(true),
  migrateSettings: z.boolean().default(true),
});

router.post('/export', authenticateDID, async (req, res) => {
  try {
    const parsed = exportRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const result = await portabilityService.requestExport(req.user.userId, parsed.data);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.status(202).json({
      success: true,
      data: {
        exportId: result.exportId,
        status: result.status,
        estimatedTime: result.estimatedTime,
      },
    });
  } catch (error) {
    log.error({ error: error.message }, 'Export request failed');
    res.status(500).json({ success: false, error: 'Failed to request export' });
  }
});

router.get('/export/:exportId', authenticateDID, async (req, res) => {
  try {
    const prisma = (await import('../lib/database.js')).getPrismaClient();

    const exportJob = await prisma.dataExport.findFirst({
      where: {
        id: req.params.exportId,
        userId: req.user.userId,
      },
    });

    if (!exportJob) {
      return res.status(404).json({ success: false, error: 'Export not found' });
    }

    res.json({
      success: true,
      data: {
        id: exportJob.id,
        status: exportJob.status,
        progress: exportJob.progress,
        fileUrls: exportJob.fileUrls,
        fileSizes: exportJob.fileSizes,
        completedAt: exportJob.completedAt,
        expiresAt: exportJob.expiresAt,
      },
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get export status failed');
    res.status(500).json({ success: false, error: 'Failed to get export status' });
  }
});

router.get('/exports', authenticateDID, async (req, res) => {
  try {
    const prisma = (await import('../lib/database.js')).getPrismaClient();

    const exports = await prisma.dataExport.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        progress: true,
        formats: true,
        createdAt: true,
        completedAt: true,
        expiresAt: true,
      },
    });

    res.json({ success: true, data: exports });
  } catch (error) {
    log.error({ error: error.message }, 'Get exports list failed');
    res.status(500).json({ success: false, error: 'Failed to get exports' });
  }
});

router.post('/migrate', authenticateDID, async (req, res) => {
  try {
    const parsed = migrationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const result = await portabilityService.initiateMigration(req.user.userId, parsed.data);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.status(202).json({
      success: true,
      data: {
        migrationId: result.migrationId,
        status: result.status,
      },
    });
  } catch (error) {
    log.error({ error: error.message }, 'Migration initiation failed');
    res.status(500).json({ success: false, error: 'Failed to initiate migration' });
  }
});

router.get('/migrate/:migrationId', authenticateDID, async (req, res) => {
  try {
    const prisma = (await import('../lib/database.js')).getPrismaClient();

    const migration = await prisma.accountMigration.findFirst({
      where: {
        id: req.params.migrationId,
        userId: req.user.userId,
      },
    });

    if (!migration) {
      return res.status(404).json({ success: false, error: 'Migration not found' });
    }

    res.json({
      success: true,
      data: {
        id: migration.id,
        status: migration.status,
        progress: migration.progress,
        steps: migration.steps,
        itemsMigrated: migration.itemsMigrated,
        itemsFailed: migration.itemsFailed,
        errorMessage: migration.errorMessage,
        createdAt: migration.createdAt,
        completedAt: migration.completedAt,
      },
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get migration status failed');
    res.status(500).json({ success: false, error: 'Failed to get migration status' });
  }
});

router.get('/data-summary', authenticateDID, async (req, res) => {
  try {
    const prisma = (await import('../lib/database.js')).getPrismaClient();
    const { userId } = req.user;

    const [conversationCount, acuCount, circleCount, memberCount, followingCount, followerCount] =
      await Promise.all([
        prisma.conversation.count({ where: { ownerId: userId } }),
        prisma.atomicChatUnit.count({ where: { author: { id: userId } } }),
        prisma.circle.count({ where: { ownerId: userId } }),
        prisma.circleMember.count({ where: { userId, status: 'active' } }),
        prisma.socialConnection.count({ where: { followerId: userId, status: 'active' } }),
        prisma.socialConnection.count({ where: { followingId: userId, status: 'active' } }),
      ]);

    res.json({
      success: true,
      data: {
        content: {
          conversations: conversationCount,
          acus: acuCount,
        },
        circles: {
          owned: circleCount,
          memberOf: memberCount,
        },
        socialGraph: {
          following: followingCount,
          followers: followerCount,
        },
      },
    });
  } catch (error) {
    log.error({ error: error.message }, 'Get data summary failed');
    res.status(500).json({ success: false, error: 'Failed to get data summary' });
  }
});

export default router;
