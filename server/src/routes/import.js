/**
 * Import Routes
 *
 * API endpoints for importing conversation history from external AI platforms
 * Supports ChatGPT, Claude, Gemini exports via .zip files
 */

import { Router } from 'express';
import { createRequestLogger } from '../lib/logger.js';
import { optionalAuth } from '../middleware/unified-auth.js';
import { getPrismaClient } from '../lib/database.js';
import { importService } from '../services/import-service.js';
import { streamingImportService } from '../services/streaming-import-service.js';
import { tierOrchestrator } from '../services/tier-orchestrator.js';
import { DEFAULT_TIER_CONFIG, DEFAULT_INTELLIGENT_OPTIONS } from '../services/import-types.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const UPLOAD_DIR = './uploads/imports';
const MAX_FILE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for scan results (in production, use Redis)
const scanCache = new Map();

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Cleanup old files periodically
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
setInterval(cleanupOldFiles, CLEANUP_INTERVAL_MS);

/**
 * Clean up files older than MAX_FILE_AGE_MS
 */
function cleanupOldFiles() {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const now = Date.now();
    let cleanedCount = 0;

    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > MAX_FILE_AGE_MS) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[Import] Cleaned up ${cleanedCount} old file(s) from uploads directory`);
    }
  } catch (error) {
    console.error('[Import] Error cleaning up old files:', error.message);
  }
}

/**
 * Clean up a specific file
 */
function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Import] Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`[Import] Error cleaning up file ${filePath}:`, error.message);
  }
}

const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueId = uuidv4();
      cb(null, `${uniqueId}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed'), false);
    }
  },
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed'), false);
    }
  },
});

/**
 * POST /api/v1/import/upload
 * Upload a .zip file for import
 */
router.post('/upload', optionalAuth, memoryUpload.single('file'), async (req, res, next) => {
  console.log('[IMPORT] ===== ROUTE START =====');
  console.log('[IMPORT] Path:', req.path);
  console.log('[IMPORT] Full URL:', req.url);
  console.log('[IMPORT] Method:', req.method);
  console.log('[IMPORT] Headers - Content-Type:', req.headers['content-type']);
  console.log('[IMPORT] Has file:', !!req.file);
  console.log('[IMPORT] File name:', req.file?.originalname);
  console.log('[IMPORT] Session ID:', req.sessionID);
  console.log('[IMPORT] Cookies:', req.cookies);
  console.log('[IMPORT] isAuthenticated():', req.isAuthenticated?.());
  console.log('[IMPORT] req.user:', req.user);
  console.log('[IMPORT] req.userId:', req.userId);
  console.log('[IMPORT] req.session.userId:', req.session?.userId);

  const log = createRequestLogger(req);

  log.info({
    url: req.url,
    method: req.method,
    headers: {
      auth: req.headers.authorization?.substring(0, 20),
      contentType: req.headers['content-type'],
      hasFile: !!req.file
    },
    authState: {
      isAuthenticated: req.isAuthenticated?.(),
      hasUserId: !!req.userId,
      hasUser: !!req.user,
      userIdFromReqUser: req.user?.userId || req.user?.id,
      sessionUserId: req.session?.userId,
      userStatus: req.user?.status,
      userEmail: req.user?.email
    }
  }, '=== IMPORT UPLOAD ROUTE HIT ===');

  console.log('[IMPORT] After optionalAuth - req.userId:', req.userId);
  console.log('[IMPORT] After optionalAuth - req.user:', req.user);

  let userId = req.userId || req.user?.userId || req.user?.id;
  
  if (!userId && req.session?.userId) {
    console.log('[IMPORT] Getting userId from session:', req.session.userId);
    userId = req.session.userId;
  }
  
  if (!userId && req.isAuthenticated?.()) {
    console.log('[IMPORT] Getting userId from isAuthenticated, user:', req.user);
    userId = req.user?.id || req.user?.userId;
  }

  console.log('[IMPORT] Final userId before dev fallback:', userId);
  log.info({ userId, hasSession: !!req.session, sessionUserId: req.session?.userId, reqUser: req.user, isAuthenticated: req.isAuthenticated?.() }, 'User identification');

  // Development mode: auto-create dev user if not authenticated
  if (!userId && process.env.NODE_ENV === 'development') {
    console.log('[IMPORT] No userId found, creating dev user...');
    const devUserId = 'dev-user-001';
    try {
      const prisma = getPrismaClient();
      let devUser = await prisma.user.findUnique({ where: { id: devUserId } });
      if (!devUser) {
        console.log('[IMPORT] Creating new dev user');
        devUser = await prisma.user.create({
          data: {
            id: devUserId,
            email: 'dev@example.com',
            did: `did:web:dev-user-001`,
            status: 'ACTIVE',
          },
        });
        log.info({ devUserId }, 'Created dev user for development');
      } else {
        console.log('[IMPORT] Using existing dev user:', devUserId);
      }
      userId = devUserId;
      req.userId = devUserId;
      req.user = { userId: devUserId, email: 'dev@example.com', did: `did:web:dev-user-001` };
    } catch (err) {
      console.log('[IMPORT] Failed to create dev user:', err.message);
      log.warn({ err: err.message }, 'Failed to create dev user, using fallback');
      userId = 'dev-user';
    }
  }

  console.log('[IMPORT] Final userId after all checks:', userId);

  // Require authentication for import
  if (!userId) {
    console.log('[IMPORT] ERROR: No userId, returning 401');
    log.warn({ auth: { hasUserId: !!req.userId, hasUser: !!req.user, hasAuth: !!req.auth, hasSession: !!req.session, sessionUserId: req.session?.userId } }, 'Import attempted without authentication');
    return res.status(401).json({ error: 'Authentication required to import conversations' });
  }

  console.log('[IMPORT] User authenticated, proceeding with import...');
  log.info({ userId, authDebug: { hasUserId: !!req.userId, hasUser: !!req.user, hasAuth: !!req.auth } }, 'Import upload attempt');

  log.info({ file: !!req.file, fileName: req.file?.originalname, userId }, 'Upload request details');

  try {
    if (!req.file) {
      console.log('[IMPORT] ERROR: No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('[IMPORT] File validated, creating import job...');
    console.log('[IMPORT] File name:', req.file.originalname);
    console.log('[IMPORT] File size:', req.file.size);
    console.log('[IMPORT] User ID:', userId);

    log.info({ fileName: req.file.originalname, fileSize: req.file.size, userId }, 'Creating import job...');

    // Create import job and process the file
    const importJob = await importService.createImportJob(
      userId,
      req.file.buffer,
      req.file.originalname
    );

    console.log('[IMPORT] Import job created:', importJob.id);
    res.json({
      success: true,
      importJobId: importJob.id,
      status: importJob.status,
      fileName: importJob.fileName,
      totalConversations: importJob.totalConversations,
      message: 'Import job created successfully. Processing will begin shortly.',
    });
  } catch (error) {
    log.error({ error: error.message, stack: error.stack }, 'Import upload failed');
    next(error);
  }
});

/**
 * POST /api/v1/import/scan
 * Upload and scan a .zip file without starting import
 * Returns file analysis and recommended tier configuration
 */
router.post('/scan', optionalAuth, diskUpload.single('file'), async (req, res, next) => {
  const log = createRequestLogger(req);
  
  let userId = req.userId || req.user?.userId || req.user?.id;
  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'dev-user-001';
  } else if (!userId) {
    userId = 'dev-user';
  }

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    log.info({ fileName: req.file.filename, userId }, 'Scanning import file');

    const filePath = req.file.path;
    const scanResult = await streamingImportService.scanImportFile(filePath);

    const recommendedConfig = {
      tier0: { enabled: true },
      tier1: { enabled: scanResult.totalConversations < 100, priority: 'medium' },
      tier2: { enabled: false },
      tier3: { enabled: false },
      tier4: { enabled: false },
    };

    // Generate a safe file token instead of exposing the actual path
    const fileToken = uuidv4();
    const scanCacheKey = `scan:${fileToken}`;

    // Store the file path in a secure cache (in production, use Redis)
    // For now, store it temporarily with the app
    scanCache.set(scanCacheKey, {
      filePath,
      scanResult,
      userId,
      createdAt: Date.now(),
    });

    // Clean up the cache entry after 1 hour
    setTimeout(() => {
      scanCache.delete(scanCacheKey);
      cleanupFile(filePath);
    }, 60 * 60 * 1000);

    res.json({
      success: true,
      scan: scanResult,
      recommendedConfig,
      fileToken, // Use token instead of filePath
    });
  } catch (error) {
    // Clean up file on error
    if (req.file?.path) {
      cleanupFile(req.file.path);
    }
    log.error({ error: error.message }, 'Import scan failed');
    next(error);
  }
});

/**
 * POST /api/v1/import/start
 * Start import with tier configuration
 */
router.post('/start', optionalAuth, async (req, res, next) => {
  const log = createRequestLogger(req);
  
  let userId = req.userId || req.user?.userId || req.user?.id;
  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'dev-user-001';
  } else if (!userId) {
    userId = 'dev-user';
  }

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { fileToken, tierConfig, intelligentOptions } = req.body;

  if (!fileToken) {
    return res.status(400).json({ error: 'fileToken is required' });
  }

  try {
    // Retrieve file path from cache
    const scanCacheKey = `scan:${fileToken}`;
    const cachedData = scanCache.get(scanCacheKey);

    if (!cachedData) {
      return res.status(404).json({ error: 'File not found or expired. Please re-scan the file.' });
    }

    // Verify user ownership
    if (cachedData.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to file' });
    }

    const filePath = cachedData.filePath;

    log.info({ fileToken, userId, tierConfig }, 'Starting tiered import');

    const job = await tierOrchestrator.startImportWithTiers(
      userId,
      filePath,
      tierConfig || DEFAULT_TIER_CONFIG,
      intelligentOptions || DEFAULT_INTELLIGENT_OPTIONS
    );

    res.json({
      success: true,
      jobId: job.id,
      status: job.status,
      currentTier: job.currentTier,
      estimatedTime: 'Calculating...',
    });
  } catch (error) {
    log.error({ error: error.message }, 'Tiered import start failed');
    next(error);
  }
});

/**
 * POST /api/v1/import/jobs/:id/pause
 * Pause a running import job
 */
router.post('/jobs/:id/pause', optionalAuth, async (req, res, next) => {
  const log = createRequestLogger(req);
  const { id } = req.params;
  let userId = req.userId || req.user?.userId || req.auth?.userId;

  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'dev-user-001';
  } else if (!userId) {
    userId = 'dev-user';
  }

  try {
    await tierOrchestrator.pauseImportJob(id);
    
    res.json({
      success: true,
      message: 'Import job paused',
    });
  } catch (error) {
    log.error({ error: error.message, jobId: id }, 'Failed to pause import job');
    next(error);
  }
});

/**
 * POST /api/v1/import/jobs/:id/resume
 * Resume a paused import job
 */
router.post('/jobs/:id/resume', optionalAuth, async (req, res, next) => {
  const log = createRequestLogger(req);
  const { id } = req.params;
  let userId = req.userId || req.user?.userId || req.auth?.userId;

  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'dev-user-001';
  } else if (!userId) {
    userId = 'dev-user';
  }

  try {
    await tierOrchestrator.resumeImportJob(id);
    
    res.json({
      success: true,
      message: 'Import job resumed',
    });
  } catch (error) {
    log.error({ error: error.message, jobId: id }, 'Failed to resume import job');
    next(error);
  }
});

/**
 * POST /api/v1/import/jobs/:id/tiers/:tier/run
 * Run a specific tier on a completed import
 */
router.post('/jobs/:id/tiers/:tier/run', optionalAuth, async (req, res, next) => {
  const log = createRequestLogger(req);
  const { id, tier } = req.params;
  let userId = req.userId || req.user?.userId || req.auth?.userId;

  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'dev-user-001';
  } else if (!userId) {
    userId = 'dev-user';
  }

  const validTiers = ['TIER_1_ACU', 'TIER_2_MEMORY', 'TIER_3_CONTEXT', 'TIER_4_INDEX'];
  if (!validTiers.includes(tier)) {
    return res.status(400).json({ error: `Invalid tier. Must be one of: ${validTiers.join(', ')}` });
  }

  try {
    await tierOrchestrator.runSpecificTier(id, tier);
    
    res.json({
      success: true,
      message: `Tier ${tier} started`,
    });
  } catch (error) {
    log.error({ error: error.message, jobId: id, tier }, 'Failed to run tier');
    next(error);
  }
});

/**
 * GET /api/v1/import/jobs/:id
 * Get import job status
 */
router.get('/jobs/:id', optionalAuth, async (req, res, next) => {
  const log = createRequestLogger(req);
  const { id } = req.params;
  let userId = req.userId || req.user?.userId || req.auth?.userId;

  // Development mode: use dev user if not authenticated
  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'dev-user-001';
  } else if (!userId) {
    userId = 'dev-user';
  }

  try {
    const tierProgress = await tierOrchestrator.getJobProgress(id);

    if (!tierProgress) {
      const job = await importService.getImportJob(id, userId);
      if (!job) {
        return res.status(404).json({ error: 'Import job not found' });
      }

      const progress = job.totalConversations > 0
        ? Math.round((job.processedConversations / job.totalConversations) * 100)
        : 0;

      return res.json({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          fileName: job.fileName,
          sourceProvider: job.sourceProvider,
          totalConversations: job.totalConversations,
          processedConversations: job.processedConversations,
          failedConversations: job.failedConversations,
          progress,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          createdAt: job.createdAt,
          errors: job.errors || [],
        },
      });
    }

    res.json({
      success: true,
      job: {
        id: tierProgress.id,
        status: tierProgress.status,
        currentTier: tierProgress.currentTier,
        fileName: tierProgress.fileName,
        totalConversations: tierProgress.totalConversations,
        processedConversations: tierProgress.processedConversations,
        failedConversations: tierProgress.failedConversations,
        tierProgress: tierProgress.tiers,
        acuGenerated: tierProgress.acuGenerated,
        memoriesExtracted: tierProgress.memoriesExtracted,
        contextEnriched: tierProgress.contextEnriched,
        startedAt: tierProgress.startedAt,
        completedAt: tierProgress.completedAt,
        createdAt: tierProgress.createdAt,
        errors: tierProgress.errors,
      },
    });
  } catch (error) {
    log.error({ error: error.message, jobId: id }, 'Failed to get import job status');
    next(error);
  }
});

/**
 * GET /api/v1/import/jobs
 * List all import jobs for user
 */
router.get('/jobs', optionalAuth, async (req, res, next) => {
  const log = createRequestLogger(req);
  let userId = req.userId || req.user?.userId || req.auth?.userId;

  // Development mode: use dev user if not authenticated
  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'dev-user-001';
  } else if (!userId) {
    userId = 'dev-user';
  }

  try {
    const jobs = await importService.listImportJobs(userId);

    res.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        status: job.status,
        fileName: job.fileName,
        sourceProvider: job.sourceProvider,
        totalConversations: job.totalConversations,
        processedConversations: job.processedConversations,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      })),
    });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to list import jobs');
    next(error);
  }
});

/**
 * POST /api/v1/import/jobs/:id/cancel
 * Cancel an import job
 */
router.post('/jobs/:id/cancel', optionalAuth, async (req, res, next) => {
  const log = createRequestLogger(req);
  const { id } = req.params;
  let userId = req.userId || req.user?.userId || req.auth?.userId;

  // Development mode: use dev user if not authenticated
  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'dev-user-001';
  } else if (!userId) {
    userId = 'dev-user';
  }

  try {
    await importService.cancelImportJob(id, userId);

    res.json({
      success: true,
      message: 'Import job cancelled successfully',
    });
  } catch (error) {
    log.error({ error: error.message, jobId: id }, 'Failed to cancel import job');
    next(error);
  }
});

/**
 * POST /api/v1/import/jobs/:id/retry
 * Retry failed import job
 */
router.post('/jobs/:id/retry', optionalAuth, async (req, res, next) => {
  const log = createRequestLogger(req);
  const { id } = req.params;
  let userId = req.userId || req.user?.userId || req.auth?.userId;

  // Development mode: use dev user if not authenticated
  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'dev-user-001';
  } else if (!userId) {
    userId = 'dev-user';
  }

  try {
    const job = await importService.retryImportJob(id, userId);

    res.json({
      success: true,
      importJobId: job.id,
      status: job.status,
      message: 'Import job retry initiated',
    });
  } catch (error) {
    log.error({ error: error.message, jobId: id }, 'Failed to retry import job');
    next(error);
  }
});

/**
 * GET /api/v1/import/providers
 * List supported import providers
 */
router.get('/providers', (req, res) => {
  res.json({
    success: true,
    providers: [
      {
        id: 'chatgpt',
        name: 'ChatGPT',
        description: 'Export from chatgpt.com/settings/data-controls',
        format: 'chatgpt-export',
      },
      {
        id: 'claude',
        name: 'Claude',
        description: 'Export from claude.ai/settings/data',
        format: 'claude-export',
      },
    ],
  });
});

/**
 * GET /api/v1/import/memories
 * Get memories created from imports
 */
router.get('/memories', optionalAuth, async (req, res, next) => {
  const log = createRequestLogger(req);
  let userId = req.userId || req.user?.userId || req.auth?.userId;

  // Development mode: use dev user if not authenticated
  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'dev-user-001';
  } else if (!userId) {
    userId = 'dev-user';
  }
  
  const { limit = 50, offset = 0, type } = req.query;

  try {
    const prisma = getPrismaClient();
    
    const where = {
      userId,
      tags: { has: 'chatgpt-import' },
    };

    // Note: This would need the Memory retrieval API
    // For now, return import job info with memory counts
    
    const jobs = await importService.listImportJobs(userId, parseInt(limit));
    
    res.json({
      success: true,
      imports: jobs.map(job => ({
        id: job.id,
        status: job.status,
        fileName: job.fileName,
        totalConversations: job.totalConversations,
        processedConversations: job.processedConversations,
        // Estimate: each conversation creates 1 EPISODIC + ~3 SEMANTIC memories
        memoriesCreated: job.processedConversations * 4,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      })),
    });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get import memories');
    next(error);
  }
});

/**
 * GET /api/v1/import/memories/:conversationId
 * Get specific memory from imported conversation
 */
router.get('/memories/:conversationId', optionalAuth, async (req, res, next) => {
  const log = createRequestLogger(req);
  const { conversationId } = req.params;
  let userId = req.userId || req.user?.userId || req.auth?.userId;

  // Development mode: use dev user if not authenticated
  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'dev-user-001';
  } else if (!userId) {
    userId = 'dev-user';
  }

  try {
    const prisma = getPrismaClient();
    
    // Get the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Imported conversation not found' });
    }

    // Return conversation info that can be used for memory retrieval
    res.json({
      success: true,
      conversation: {
        id: conversation.id,
        title: conversation.title,
        provider: conversation.provider,
        model: conversation.model,
        messageCount: conversation.messageCount,
        createdAt: conversation.createdAt,
        sourceUrl: conversation.sourceUrl,
        // This can be used to query memories via /api/v2/memories?conversationId=...
      },
      memoryQuery: {
        sourceConversationIds: [conversation.id],
      },
    });
  } catch (error) {
    log.error({ error: error.message, conversationId }, 'Failed to get import memory');
    next(error);
  }
});

export { router as importRouter };
