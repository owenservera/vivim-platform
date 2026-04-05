/**
 * VIVIM Server — Demo API Routes
 *
 * Endpoints for investor demo journeys:
 * - GET  /api/demo                  — Demo info
 * - GET  /api/demo/journeys         — List all journeys
 * - GET  /api/demo/journeys/:slug   — Get journey details
 * - POST /api/demo/run/:slug        — Run a journey
 * - DELETE /api/demo/run            — Cancel running journey
 * - GET  /api/demo/status           — System status
 * - GET  /api/demo/config           — Demo configuration
 * - GET  /api/demo/screenshots/:journey/:file — Serve screenshots
 * - POST /api/demo/seed             — Seed demo database
 * - GET  /api/demo/metrics          — Demo-specific metrics
 */

import { Router, Request, Response } from 'express';
import { ServerMetricsCollector } from './metrics.js';

export interface DemoJourneyDef {
  slug: string;
  title: string;
  description: string;
  duration: number;
  target: string;
  steps: number;
}

export interface DemoRunState {
  slug: string;
  startedAt: number;
  currentStep: number;
  totalSteps: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}

/**
 * Create demo API routes.
 */
export function createDemoRoutes(options: {
  metricsCollector: ServerMetricsCollector;
  seedDatabase?: () => Promise<{ conversations: number; memories: number; providers: number }>;
  runJourney?: (slug: string) => Promise<void>;
  cancelJourney?: () => void;
  getRunState?: () => DemoRunState | null;
  getScreenshotDir?: () => string;
}) {
  const router = Router();

  // Demo info
  router.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'VIVIM Demo API',
      version: '1.0.0',
      description: 'Investor demo journey execution and metrics',
      endpoints: [
        'GET /api/demo',
        'GET /api/demo/journeys',
        'GET /api/demo/journeys/:slug',
        'POST /api/demo/run/:slug',
        'DELETE /api/demo/run',
        'GET /api/demo/status',
        'GET /api/demo/config',
        'POST /api/demo/seed',
        'GET /api/demo/metrics',
      ],
    });
  });

  // List journeys
  router.get('/journeys', (_req: Request, res: Response) => {
    const journeys: DemoJourneyDef[] = [
      { slug: 'investor-pitch', title: 'Investor Pitch', description: '90-second cinematic demo showing AI memory sovereignty', duration: 90, target: 'general', steps: 6 },
      { slug: 'onboarding', title: 'Onboarding', description: '45-second demo: connect, capture, remember', duration: 45, target: 'product', steps: 3 },
      { slug: 'problem-solver', title: 'Problem Solver', description: '90-second demo showing pain → solution', duration: 90, target: 'business', steps: 5 },
      { slug: 'daily-worker', title: 'Daily Worker', description: '60-second demo of daily AI memory workflow', duration: 60, target: 'product', steps: 4 },
      { slug: 'team-collab', title: 'Team Collaboration', description: '75-second demo of team memory sharing', duration: 75, target: 'business', steps: 5 },
      { slug: 'deep-research', title: 'Deep Research', description: '120-second demo of knowledge graph + extraction', duration: 120, target: 'technical', steps: 7 },
    ];

    res.json({ journeys });
  });

  // Get journey details
  router.get('/journeys/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;

    const journeys: Record<string, DemoJourneyDef & { faq?: Array<{ q: string; a: string }>; backupPlan?: Array<{ failure: string; solution: string }> }> = {
      'investor-pitch': {
        slug: 'investor-pitch',
        title: 'Investor Pitch',
        description: '90-second cinematic demo',
        duration: 90,
        target: 'general',
        steps: 6,
        faq: [
          { q: 'How do you make money?', a: 'Platform fees, enterprise tiers, marketplace.' },
          { q: 'What about OpenAI building this?', a: 'Their model is vendor lock-in. We\'re the anti-lock-in play.' },
        ],
        backupPlan: [
          { failure: 'Live extraction fails', solution: 'Show pre-captured results' },
          { failure: 'Graph rendering fails', solution: 'Show static graph image' },
        ],
      },
      'onboarding': {
        slug: 'onboarding',
        title: 'Onboarding',
        description: '45-second quick start demo',
        duration: 45,
        target: 'product',
        steps: 3,
      },
    };

    const journey = journeys[slug];
    if (!journey) {
      return res.status(404).json({ error: `Journey not found: ${slug}` });
    }

    res.json({ journey });
  });

  // Run a journey
  router.post('/run/:slug', async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!options.runJourney) {
      return res.status(501).json({ error: 'Journey runner not configured' });
    }

    try {
      options.metricsCollector.incrementMetric('demo_journey_started', 1);

      await options.runJourney(slug);

      res.json({
        status: 'started',
        slug,
        message: `Journey "${slug}" is now running`,
      });
    } catch (error) {
      options.metricsCollector.incrementMetric('demo_journey_failed', 1);
      res.status(500).json({ error: String(error) });
    }
  });

  // Cancel running journey
  router.delete('/run', (req: Request, res: Response) => {
    if (!options.cancelJourney) {
      return res.status(501).json({ error: 'Journey runner not configured' });
    }

    options.cancelJourney();
    options.metricsCollector.incrementMetric('demo_journey_cancelled', 1);

    res.json({ status: 'cancelled' });
  });

  // System status
  router.get('/status', (req: Request, res: Response) => {
    const runState = options.getRunState?.() ?? null;

    res.json({
      status: 'healthy',
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node: process.version,
      },
      demo: {
        running: runState,
        totalJourneysRun: options.metricsCollector.getJSON().custom?.demo_journey_started ?? 0,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Demo configuration
  router.get('/config', (_req: Request, res: Response) => {
    res.json({
      supportedProviders: ['chatgpt', 'claude', 'gemini', 'perplexity', 'copilot', 'deepseek', 'groq', 'ollama', 'midjourney'],
      journeyTypes: ['investor-pitch', 'onboarding', 'problem-solver', 'daily-worker', 'team-collab', 'deep-research'],
      viewport: { width: 1920, height: 1080 },
      timeout: parseInt(process.env.DEMO_JOURNEY_TIMEOUT || '120000', 10),
      features: {
        liveExtraction: true,
        knowledgeGraph: true,
        contextCockpit: true,
        teamSync: true,
        encryption: true,
      },
    });
  });

  // Seed demo database
  router.post('/seed', async (req: Request, res: Response) => {
    if (!options.seedDatabase) {
      return res.status(501).json({ error: 'Database seeding not configured' });
    }

    try {
      options.metricsCollector.incrementMetric('demo_seed_runs', 1);
      const result = await options.seedDatabase();

      res.json({
        status: 'seeded',
        conversations: result.conversations,
        memories: result.memories,
        providers: result.providers,
      });
    } catch (error) {
      options.metricsCollector.incrementMetric('demo_seed_errors', 1);
      res.status(500).json({ error: String(error) });
    }
  });

  // Demo-specific metrics
  router.get('/metrics', (req: Request, res: Response) => {
    const json = options.metricsCollector.getJSON();

    res.json({
      demo: {
        journeysCompleted: json.custom?.demo_journey_completed ?? 0,
        journeysFailed: json.custom?.demo_journey_failed ?? 0,
        journeysCancelled: json.custom?.demo_journey_cancelled ?? 0,
        totalSeedRuns: json.custom?.demo_seed_runs ?? 0,
        currentRun: options.getRunState?.() ?? null,
      },
      system: json,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
