/**
 * Data Portability Service - Phase 5
 *
 * Complete data sovereignty with export, import, and migration capabilities
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import { debugReporter } from './debug-reporter.js';

const log = logger.child({ module: 'portability-service' });

// ============================================================================
// Data Export
// ============================================================================

/**
 * Request data export
 */
export async function requestExport(userId, options = {}) {
  try {
    const prisma = getPrismaClient();

    const exportConfig = {
      userId,
      exportType: options.exportType || 'full',
      formats: options.formats || ['json'],
      includeContent: options.includeContent !== false,
      includeCircles: options.includeCircles !== false,
      includeSocialGraph: options.includeSocialGraph !== false,
      includeSettings: options.includeSettings !== false,
      includeAnalytics: options.includeAnalytics || false,
      anonymizeOthers: options.anonymizeOthers || false,
      includePrivateContent: options.includePrivateContent !== false,
      includeDeletedContent: options.includeDeletedContent || false,
      status: 'pending',
      progress: 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    const exportJob = await prisma.dataExport.create({
      data: exportConfig,
    });

    // Start async export process
    const exportStartTime = Date.now();
    processExport(exportJob.id).catch((error) => {
      debugReporter.trackError(error, { operation: 'processExport', exportId: exportJob.id });
      log.error({ exportId: exportJob.id, error: error.message }, 'Export processing failed');
    });

    log.info(
      { exportId: exportJob.id, userId, duration: Date.now() - exportStartTime },
      'Export requested'
    );

    return {
      success: true,
      exportId: exportJob.id,
      status: 'pending',
      estimatedTime: '5-15 minutes',
    };
  } catch (error) {
    log.error({ userId, error: error.message }, 'Export request failed');
    return { success: false, error: 'Failed to request export' };
  }
}

/**
 * Process export asynchronously
 */
async function processExport(exportId) {
  const prisma = getPrismaClient();

  try {
    const exportJob = await prisma.dataExport.findUnique({
      where: { id: exportId },
    });

    if (!exportJob) return;

    // Update status
    await prisma.dataExport.update({
      where: { id: exportId },
      data: { status: 'processing', progress: 5 },
    });

    const files = [];
    const fileSizes = {};

    // Export in each requested format
    for (const format of exportJob.formats) {
      const { url, size } = await exportToFormat(exportJob, format);
      files.push(url);
      fileSizes[format] = size;
    }

    // Update with results
    await prisma.dataExport.update({
      where: { id: exportId },
      data: {
        status: 'completed',
        progress: 100,
        fileUrls: files,
        fileSizes,
        completedAt: new Date(),
      },
    });

    log.info({ exportId, files }, 'Export completed');
  } catch (error) {
    await prisma.dataExport.update({
      where: { id: exportId },
      data: {
        status: 'failed',
        errorMessage: error.message,
      },
    });
  }
}

/**
 * Export data to specific format
 */
async function exportToFormat(exportJob, format) {
  const prisma = getPrismaClient();
  const userId = exportJob.userId;

  // Gather data
  const data = await gatherUserData(userId, exportJob);

  let exportedData;
  let extension;

  switch (format) {
    case 'json':
      exportedData = await exportToJSON(data, exportJob);
      extension = 'json';
      break;
    case 'activitypub':
      exportedData = await exportToActivityPub(data, exportJob);
      extension = 'json';
      break;
    case 'atproto':
      exportedData = await exportToATProtocol(data, exportJob);
      extension = 'json';
      break;
    case 'markdown':
      exportedData = await exportToMarkdown(data, exportJob);
      extension = 'md';
      break;
    case 'html':
      exportedData = await exportToHTML(data, exportJob);
      extension = 'html';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  // Save to file (in production, upload to S3/blob storage)
  const filename = `export-${exportJob.id}-${format}.${extension}`;
  const url = `/exports/${filename}`;

  // In real implementation: await uploadToStorage(filename, exportedData);

  return {
    url,
    size: Buffer.byteLength(JSON.stringify(exportedData), 'utf8'),
  };
}

/**
 * Gather all user data
 */
async function gatherUserData(userId, options) {
  const prisma = getPrismaClient();
  let data = {
    metadata: {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: userId,
    },
  };

  // Get user identity
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      did: true,
      handle: true,
      displayName: true,
      avatarUrl: true,
      email: options.includePrivateContent,
      emailVerified: true,
      verificationLevel: true,
      publicKey: true,
      createdAt: true,
    },
  });
  data.identity = user;

  // Get content
  if (options.includeContent) {
    data.content = {};

    data.content.conversations = await prisma.conversation.findMany({
      where: { ownerId: userId },
      include: { messages: true },
    });

    data.content.acus = await prisma.atomicChatUnit.findMany({
      where: {
        authorDid: user.did,
        ...(options.includeDeletedContent ? {} : { state: 'ACTIVE' }),
      },
    });
  }

  // Get circles
  if (options.includeCircles) {
    data.circles = await prisma.circle.findMany({
      where: { ownerId: userId },
      include: { members: true },
    });
  }

  // Get social graph
  if (options.includeSocialGraph) {
    data.socialGraph = {
      following: await prisma.socialConnection.findMany({
        where: { followerId: userId, status: 'active' },
      }),
      followers: await prisma.socialConnection.findMany({
        where: { followingId: userId, status: 'active' },
      }),
    };
  }

  // Anonymize if requested
  if (options.anonymizeOthers) {
    data = anonymizeData(data);
  }

  return data;
}

/**
 * Export to VIVIM JSON format
 */
async function exportToJSON(data, options) {
  return {
    ...data,
    format: 'vivim-export-v1',
  };
}

/**
 * Export to ActivityPub format
 */
async function exportToActivityPub(data, options) {
  const actor = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Person',
    id: `https://vivim.social/users/${data.identity.handle}`,
    preferredUsername: data.identity.handle,
    name: data.identity.displayName,
    icon: data.identity.avatarUrl
      ? {
          type: 'Image',
          url: data.identity.avatarUrl,
        }
      : undefined,
    publicKey: {
      id: `https://vivim.social/users/${data.identity.handle}#main-key`,
      owner: `https://vivim.social/users/${data.identity.handle}`,
      publicKeyPem: data.identity.publicKey,
    },
  };

  const outbox = {
    type: 'OrderedCollection',
    totalItems: data.content?.conversations?.length || 0,
    orderedItems: (data.content?.conversations || []).map((conv) => ({
      type: 'Create',
      actor: actor.id,
      object: {
        type: 'Note',
        content: conv.title,
        published: conv.createdAt,
        url: conv.sourceUrl,
      },
    })),
  };

  return { actor, outbox };
}

/**
 * Export to AT Protocol format
 */
async function exportToATProtocol(data, options) {
  return {
    did: data.identity.did,
    handle: `${data.identity.handle}.vivim.social`,
    records: {
      'app.bsky.feed.post': (data.content?.conversations || []).map((conv) => ({
        text: conv.title,
        createdAt: conv.createdAt,
        $type: 'app.bsky.feed.post',
      })),
      'app.bsky.graph.follow': (data.socialGraph?.following || []).map((follow) => ({
        subject: follow.followingId,
        createdAt: follow.createdAt,
        $type: 'app.bsky.graph.follow',
      })),
    },
  };
}

/**
 * Export to Markdown format
 */
async function exportToMarkdown(data, options) {
  let markdown = `# ${data.identity.displayName}'s Data Export\n\n`;
  markdown += `Exported: ${data.metadata.exportedAt}\n\n`;

  if (data.content?.conversations) {
    markdown += '## Conversations\n\n';
    for (const conv of data.content.conversations) {
      markdown += `### ${conv.title}\n`;
      markdown += `- URL: ${conv.sourceUrl}\n`;
      markdown += `- Date: ${conv.createdAt}\n\n`;
    }
  }

  return markdown;
}

/**
 * Export to HTML format
 */
async function exportToHTML(data, options) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${data.identity.displayName} - Data Export</title>
</head>
<body>
  <h1>${data.identity.displayName}</h1>
  <p>Exported: ${data.metadata.exportedAt}</p>
  
  ${
    data.content?.conversations
      ?.map(
        (conv) => `
    <article>
      <h2>${conv.title}</h2>
      <p><a href="${conv.sourceUrl}">Source</a></p>
      <time>${conv.createdAt}</time>
    </article>
  `
      )
      .join('') || ''
  }
</body>
</html>`;
}

/**
 * Anonymize data (remove other users' identifying info)
 */
function anonymizeData(data) {
  // Replace user IDs with hashes
  const anonymized = JSON.parse(JSON.stringify(data));

  if (anonymized.circles) {
    for (const circle of anonymized.circles) {
      for (const member of circle.members || []) {
        member.userId = hashId(member.userId);
      }
    }
  }

  if (anonymized.socialGraph) {
    for (const conn of anonymized.socialGraph.following || []) {
      conn.followingId = hashId(conn.followingId);
    }
    for (const conn of anonymized.socialGraph.followers || []) {
      conn.followerId = hashId(conn.followerId);
    }
  }

  return anonymized;
}

function hashId(id) {
  // Simple hash - in production use proper hashing
  return 'user_' + Buffer.from(id).toString('base64').slice(0, 8);
}

// ============================================================================
// Account Migration
// ============================================================================

/**
 * Initiate account migration
 */
export async function initiateMigration(userId, options) {
  try {
    const prisma = getPrismaClient();

    const migration = await prisma.accountMigration.create({
      data: {
        userId,
        direction: options.direction,
        fromPds: options.fromPds,
        toPds: options.toPds,
        migrateIdentity: options.migrateIdentity !== false,
        migrateContent: options.migrateContent !== false,
        migrateSocialGraph: options.migrateSocialGraph !== false,
        migrateSettings: options.migrateSettings !== false,
        status: 'preparing',
        steps: [
          { step: 'export_data', status: 'pending' },
          { step: 'transfer_identity', status: 'pending' },
          { step: 'import_data', status: 'pending' },
          { step: 'verify_migration', status: 'pending' },
          { step: 'update_dns', status: 'pending' },
        ],
        canRollback: true,
      },
    });

    // Start migration process
    const migrationStartTime = Date.now();
    processMigration(migration.id).catch((error) => {
      debugReporter.trackError(error, { operation: 'processMigration', migrationId: migration.id });
      log.error({ migrationId: migration.id, error: error.message }, 'Migration failed');
    });

    return {
      success: true,
      migrationId: migration.id,
      status: 'preparing',
    };
  } catch (error) {
    log.error({ userId, error: error.message }, 'Migration initiation failed');
    return { success: false, error: 'Failed to initiate migration' };
  }
}

/**
 * Process migration asynchronously
 */
async function processMigration(migrationId) {
  const prisma = getPrismaClient();

  try {
    const migration = await prisma.accountMigration.findUnique({
      where: { id: migrationId },
    });

    if (!migration) return;

    // Step 1: Export data
    await updateMigrationStep(migrationId, 'export_data', 'in_progress');
    const exportData = await gatherUserData(migration.userId, {
      includeContent: migration.migrateContent,
      includeCircles: migration.migrateSocialGraph,
      includeSocialGraph: migration.migrateSocialGraph,
      includeSettings: migration.migrateSettings,
    });
    await updateMigrationStep(migrationId, 'export_data', 'completed');

    // Step 2: Transfer identity
    if (migration.migrateIdentity) {
      await updateMigrationStep(migrationId, 'transfer_identity', 'in_progress');
      // In production: Transfer DID or create new one
      await updateMigrationStep(migrationId, 'transfer_identity', 'completed');
    }

    // Step 3: Import data to new PDS
    await updateMigrationStep(migrationId, 'import_data', 'in_progress');
    // In production: POST to new PDS
    await updateMigrationStep(migrationId, 'import_data', 'completed');

    // Step 4: Verify
    await updateMigrationStep(migrationId, 'verify_migration', 'in_progress');
    // In production: Verify data integrity
    await updateMigrationStep(migrationId, 'verify_migration', 'completed');

    // Step 5: Update DNS/handle redirection
    await updateMigrationStep(migrationId, 'update_dns', 'in_progress');
    await prisma.accountMigration.update({
      where: { id: migrationId },
      data: {
        handleRedirectionEnabled: true,
      },
    });
    await updateMigrationStep(migrationId, 'update_dns', 'completed');

    // Mark complete
    await prisma.accountMigration.update({
      where: { id: migrationId },
      data: {
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
        itemsMigrated: Object.keys(exportData).length,
      },
    });

    log.info({ migrationId }, 'Migration completed');
  } catch (error) {
    await prisma.accountMigration.update({
      where: { id: migrationId },
      data: {
        status: 'failed',
        errorMessage: error.message,
        errorDetails: { stack: error.stack },
      },
    });
  }
}

async function updateMigrationStep(migrationId, stepName, status) {
  const prisma = getPrismaClient();

  const migration = await prisma.accountMigration.findUnique({
    where: { id: migrationId },
  });

  const steps = migration.steps.map((s) =>
    s.step === stepName
      ? {
          ...s,
          status,
          [status === 'in_progress' ? 'startedAt' : 'completedAt']: new Date().toISOString(),
        }
      : s
  );

  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  await prisma.accountMigration.update({
    where: { id: migrationId },
    data: { steps, progress },
  });
}

// ============================================================================
// Export Service
// ============================================================================

export const portabilityService = {
  // Export
  requestExport,

  // Migration
  initiateMigration,

  // Utility
  gatherUserData,
};

export default portabilityService;
