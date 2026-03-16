/**
 * Import Routes
 *
 * API endpoints for importing conversation history from external AI platforms
 * Supports ChatGPT, Claude, Gemini exports via .zip files
 */

import { Router } from 'express';
import { createRequestLogger } from '../lib/logger.js';
import { optionalAuth } from '../middleware/auth.js';
import { getPrismaClient } from '../lib/database.js';
import { importService } from '../services/import-service.js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
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
router.post('/upload', optionalAuth, upload.single('file'), async (req, res, next) => {
  const log = createRequestLogger(req);
  const userId = req.userId || req.user?.userId || req.auth?.userId || 'dev-user';

  log.info({ userId, authDebug: { hasUserId: !!req.userId, hasUser: !!req.user, hasAuth: !!req.auth } }, 'Import upload attempt');

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    log.info(
      { 
        fileName: req.file.originalname, 
        fileSize: req.file.size,
        userId 
      },
      'Import file uploaded'
    );

    // Create import job and process the file
    const importJob = await importService.createImportJob(
      userId,
      req.file.buffer,
      req.file.originalname
    );

    res.json({
      success: true,
      importJobId: importJob.id,
      status: importJob.status,
      fileName: importJob.fileName,
      totalConversations: importJob.totalConversations,
      message: 'Import job created successfully. Processing will begin shortly.',
    });
  } catch (error) {
    log.error({ error: error.message }, 'Import upload failed');
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
  const userId = req.userId || req.user?.userId || req.auth?.userId || 'dev-user';

  try {
    const job = await importService.getImportJob(id, userId);

    if (!job) {
      return res.status(404).json({ error: 'Import job not found' });
    }

    const progress = job.totalConversations > 0
      ? Math.round((job.processedConversations / job.totalConversations) * 100)
      : 0;

    res.json({
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
  const userId = req.userId || req.user?.userId || req.auth?.userId || 'dev-user';

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
  const userId = req.userId || req.user?.userId || req.auth?.userId || 'dev-user';

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
  const userId = req.userId || req.user?.userId || req.auth?.userId || 'dev-user';

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

export { router as importRouter };
