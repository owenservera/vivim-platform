/**
 * Playwright-based HTML Capture (Queue Managed)
 * 
 * Routes capture requests through a concurrency-limited queue to prevent
 * server overload when handling multiple requests (e.g. 1000 links).
 * Spawns isolated Node.js workers for actual browser automation.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const MAX_CONCURRENT_CAPTURES = 2; // Keep low to prevent OOM
const WORKER_SCRIPT = path.join(__dirname, 'playwright-worker.js');

class CaptureQueue {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.active = 0;
    this.queue = [];
  }

  /**
   * Add a capture task to the queue
   * @param {Object} jobData - Data needed for the worker
   * @returns {Promise<string>} - Resolves with result path
   */
  add(jobData) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        data: jobData,
        resolve,
        reject,
        queuedAt: Date.now(),
      });
      this.processNext();
    });
  }

  async processNext() {
    if (this.active >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.active++;
    const job = this.queue.shift();
    const { url, provider } = job.data;

    const log = logger.child({ 
        url, 
        provider, 
        queueSize: this.queue.length,
        activeWorkers: this.active, 
    });

    log.info('Starting capture job from queue');

    try {
      const resultPath = await this.executeWorker(job.data, log);
      job.resolve(resultPath);
    } catch (error) {
      log.error({ error: error.message }, 'Capture job failed');
      job.reject(error);
    } finally {
      this.active--;
      this.processNext();
    }
  }

  executeWorker(config, log) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [WORKER_SCRIPT, JSON.stringify(config)], {
        stdio: ['ignore', 'pipe', 'inherit'], // Pipe stdout to capture result JSON
        cwd: process.cwd(),
        env: { ...process.env },
      });

      let stdoutData = '';

      child.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      child.on('error', (err) => {
        reject(new Error(`Failed to spawn worker: ${err.message}`));
      });

      child.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Worker exited with code ${code}`));
        }

        try {
          // Parse the last line of stdout for JSON result
          const lines = stdoutData.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine);

          if (result.status === 'success') {
            resolve(result.path);
          } else {
            reject(new Error(result.message || 'Unknown worker error'));
          }
        } catch (e) {
            // Check if stdout contains useful error info before failing
            log.warn({ stdout: stdoutData }, 'Worker stdout parse failed');
            reject(new Error(`Failed to parse worker output: ${e.message}`));
        }
      });
    });
  }
}

// Global Singleton Queue
const captureQueue = new CaptureQueue(MAX_CONCURRENT_CAPTURES);

/**
 * Capture a URL using the queue system
 */
export async function captureWithPlaywright(url, provider, options = {}) {
  // Pass all options to the worker
  const jobConfig = {
    url,
    provider,
    ...options,
  };

  logger.info({ url, queueLength: captureQueue.queue.length }, 'Queueing capture request');
  return captureQueue.add(jobConfig);
}

export async function cleanupPlaywrightFile(filePath) {
  // Existing cleanup logic
  try {
    const fs = await import('fs/promises');
    await fs.unlink(filePath);
  } catch (e) { 
    // ignore 
  }
}

