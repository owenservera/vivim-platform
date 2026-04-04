/**
 * Demo Routes
 *
 * API for managing demo journeys and screenshots
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getJourneys,
  getJourney,
  getScreenshots,
  runJourney,
  getStatus,
  getConfig,
  cancelRun,
} from '../services/demo-service.js';
import { SCREENSHOTS_DIR } from '../lib/journey-parser.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    name: 'VIVIM Demo API',
    version: '1.0.0',
    description: 'API for managing demo journeys and screenshots',
    endpoints: [
      'GET /api/demo - API info',
      'GET /api/demo/journeys - List all journeys',
      'GET /api/demo/journeys/:slug - Get journey details',
      'GET /api/demo/journeys/:slug/screenshots - Get journey screenshots',
      'POST /api/demo/run/:slug - Run a journey',
      'GET /api/demo/status - System status',
      'GET /api/demo/config - Configuration',
      'DELETE /api/demo/run - Cancel running journey',
    ],
  });
});

router.get('/journeys', (_req, res) => {
  try {
    const journeys = getJourneys();
    res.json({
      journeys,
      total: journeys.length,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/journeys/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const journey = getJourney(slug);

    if (!journey) {
      return res.status(404).json({ error: `Journey not found: ${slug}` });
    }

    res.json(journey);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/journeys/:slug/screenshots', (req, res) => {
  try {
    const { slug } = req.params;
    const screenshots = getScreenshots(slug);

    res.json({
      journeySlug: slug,
      screenshots,
      total: screenshots.length,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/run/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await runJourney(slug);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.delete('/run', (_req, res) => {
  try {
    const result = cancelRun();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/status', (_req, res) => {
  try {
    const status = getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/config', (_req, res) => {
  try {
    const config = getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/screenshots/:journeySlug/:filename', (req, res) => {
  try {
    const { journeySlug, filename } = req.params;
    const filepath = path.join(SCREENSHOTS_DIR, journeySlug, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    const stream = fs.createReadStream(filepath);
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/screenshots/:journeySlug', (req, res) => {
  try {
    const { journeySlug } = req.params;
    const screenshots = getScreenshots(journeySlug);
    res.json(screenshots);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
