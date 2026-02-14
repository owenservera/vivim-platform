// apps/server/src/routes/omni.js

import { Router } from 'express';
import { omniService } from '../services/omni-service.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * @route   GET /api/v1/omni/search
 * @desc    Search context for Omni-Composer triggers
 * @access  Public (for now, should be protected)
 */
router.get('/search', async (req, res) => {
  try {
    const { trigger, query } = req.query;
    const userId = req.headers['x-user-id']; // Mock auth

    if (!['/', '@', '+', '!', '#'].includes(trigger)) {
      return res.json({ success: true, data: [] });
    }

    const results = await omniService.search(trigger, query || '', userId);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Omni search failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

export const omniRouter = router;
export default router;
