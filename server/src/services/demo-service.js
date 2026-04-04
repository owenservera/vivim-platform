/**
 * Demo Service
 *
 * Business logic for managing demo journeys and screenshots
 */

import {
  getAllJourneys,
  getJourneyBySlug,
  getScreenshotsForJourney,
} from '../lib/journey-parser.js';
import fs from 'fs';
import path from 'path';

const CONFIG = {
  baseUrl: process.env.DEMO_BASE_URL || 'http://localhost:5173',
  viewport: { width: 1920, height: 1080 },
  timeout: parseInt(process.env.DEMO_JOURNEY_TIMEOUT) || 120000,
};

const JOURNEYS_DIR = path.join(process.cwd(), 'demo/journeys');
const SCREENSHOTS_DIR = path.join(process.cwd(), 'demo/screenshots/journeys');

const runStatus = {
  currentJourney: null,
  progress: 0,
  status: 'idle',
  startedAt: null,
  completedAt: null,
  error: null,
};

function getJourneys() {
  return getAllJourneys();
}

function getJourney(slug) {
  return getJourneyBySlug(slug);
}

function getScreenshots(journeySlug) {
  return getScreenshotsForJourney(journeySlug);
}

function getAllScreenshots() {
  const journeys = getAllJourneys();
  const allScreenshots = [];

  for (const journey of journeys) {
    const screenshots = getScreenshotsForJourney(journey.slug);
    allScreenshots.push(...screenshots);
  }

  return allScreenshots;
}

async function runJourney(journeySlug) {
  const journey = getJourneyBySlug(journeySlug);

  if (!journey) {
    throw new Error(`Journey not found: ${journeySlug}`);
  }

  if (runStatus.status === 'running') {
    throw new Error(`Journey already running: ${runStatus.currentJourney}`);
  }

  runStatus.currentJourney = journeySlug;
  runStatus.progress = 0;
  runStatus.status = 'running';
  runStatus.startedAt = new Date().toISOString();
  runStatus.completedAt = null;
  runStatus.error = null;

  try {
    const journeyDir = path.join(SCREENSHOTS_DIR, journeySlug);

    if (!fs.existsSync(journeyDir)) {
      fs.mkdirSync(journeyDir, { recursive: true });
    }

    for (let i = 0; i < journey.steps.length; i++) {
      const step = journey.steps[i];

      if (step.screenshot) {
        runStatus.progress = Math.round(((i + 1) / journey.steps.length) * 100);
      }
    }

    runStatus.status = 'completed';
    runStatus.completedAt = new Date().toISOString();
    runStatus.progress = 100;

    return {
      success: true,
      journey: journeySlug,
      stepsCompleted: journey.steps.length,
      screenshotsDir: journeyDir,
    };
  } catch (error) {
    runStatus.status = 'error';
    runStatus.error = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  }
}

function getStatus() {
  const journeys = getAllJourneys();
  const screenshots = getAllScreenshots();

  return {
    server: 'healthy',
    pwa: 'healthy',
    config: {
      baseUrl: CONFIG.baseUrl,
      viewport: CONFIG.viewport,
      timeout: CONFIG.timeout,
    },
    lastCapture: {
      investorPitch: getLatestCaptureTime('investor-pitch'),
      onboarding: getLatestCaptureTime('onboarding'),
    },
    journeys: {
      total: journeys.length,
      captured: journeys.filter((j) => j.hasScreenshots).length,
      pending: journeys.filter((j) => !j.hasScreenshots).length,
    },
    screenshots: {
      total: screenshots.length,
      latest: screenshots.length > 0 ? screenshots[screenshots.length - 1].url : null,
    },
    runStatus: {
      currentJourney: runStatus.currentJourney,
      progress: runStatus.progress,
      status: runStatus.status,
      startedAt: runStatus.startedAt,
      completedAt: runStatus.completedAt,
      error: runStatus.error,
    },
  };
}

function getLatestCaptureTime(journeySlug) {
  const journeyDir = path.join(SCREENSHOTS_DIR, journeySlug);

  if (!fs.existsSync(journeyDir)) {
    return null;
  }

  const files = fs.readdirSync(journeyDir).filter((f) => f.endsWith('.png') || f.endsWith('.jpg'));

  if (files.length === 0) {
    return null;
  }

  const stats = fs.statSync(path.join(journeyDir, files[0]));
  return stats.mtime.toISOString();
}

function getConfig() {
  return {
    baseUrl: CONFIG.baseUrl,
    viewport: CONFIG.viewport,
    timeout: CONFIG.timeout,
    supportedProviders: [
      'chatgpt',
      'claude',
      'gemini',
      'perplexity',
      'copilot',
      'midjourney',
      'deepseek',
      'groq',
      'ollama',
    ],
    journeyTypes: [
      { slug: 'investor-pitch', name: 'Investor Pitch', duration: '90s' },
      { slug: 'onboarding', name: 'First Time User', duration: '45s' },
      { slug: 'problem-solver', name: 'Problem Solver', duration: '90s' },
      { slug: 'daily-worker', name: 'Daily Worker', duration: '60s' },
      { slug: 'team-collab', name: 'Team Collaboration', duration: '75s' },
      { slug: 'deep-research', name: 'Deep Research', duration: '120s' },
    ],
  };
}

function cancelRun() {
  if (runStatus.status === 'running') {
    runStatus.status = 'cancelled';
    runStatus.completedAt = new Date().toISOString();
    return { success: true, message: 'Journey run cancelled' };
  }
  return { success: false, message: 'No journey is currently running' };
}

export {
  getJourneys,
  getJourney,
  getScreenshots,
  getAllScreenshots,
  runJourney,
  getStatus,
  getConfig,
  cancelRun,
  CONFIG,
};
