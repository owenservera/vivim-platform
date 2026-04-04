/**
 * Playwright-based HTML Capture (Queue Managed)
 * 
 * Routes capture requests through a concurrency-limited queue to prevent
 * server overload when handling multiple requests (e.g. 1000 links).
 * Spawns isolated Node.js workers for actual browser automation.
 * 
 * Updated: Uses new intelligent queue as fallback but maintains original interface
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './lib/logger.js';
import { browserPoolManager } from './capture/browser-pool-manager.js';
import { captureQueue } from './capture/intelligent-queue.js';

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
            resolve({
              path: result.path,
              images: result.images || [],
              imageCount: result.imageCount || 0
            });
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

// Global Singleton Queue - Original working implementation
const originalCaptureQueue = new CaptureQueue(MAX_CONCURRENT_CAPTURES);

// Fallback to new intelligent queue if original fails
const performIntelligentCapture = async (config) => {
  const {
    url,
    provider,
    timeout = 60000,
    tempDir = null,
  } = config;

  let context = null;
  let tempFilePath = null;

  try {
    console.log(`🎯 [INTELLIGENT CAPTURE] Starting capture for ${provider}: ${url}`);

    // 1. Setup Files
    const tempDirectory = path.resolve(tempDir || require('os').tmpdir());
    const tempFileName = `vivim-pw-${provider}-${require('uuid').v4()}.html`;
    tempFilePath = path.join(tempDirectory, tempFileName);
    console.log(`📁 [INTELLIGENT CAPTURE] Temporary file: ${tempFilePath}`);

    // 2. Acquire browser worker from pool
    console.log(`🌐 [INTELLIGENT CAPTURE] Acquiring browser context from pool...`);
    const startTime = Date.now();
    context = await browserPoolManager.acquireContext();
    const contextTime = Date.now() - startTime;
    console.log(`✅ [INTELLIGENT CAPTURE] Browser context acquired in ${contextTime}ms`);

    // 3. Navigate using the worker
    console.log(`📄 [INTELLIGENT CAPTURE] Navigating to ${url}...`);
    const html = await browserPoolManager.navigate(context, url, timeout);
    console.log(`✅ [INTELLIGENT CAPTURE] Page captured (${html.length} bytes)`);

    // 4. Save to file
    await require('fs/promises').writeFile(tempFilePath, html, 'utf8');
    console.log(`💾 [INTELLIGENT CAPTURE] Saved to ${tempFilePath}`);

    return tempFilePath;
  } catch (error) {
    logger.error({ error: error.message, url }, 'Intelligent capture failed');
    throw error;
  } finally {
    // 5. Release context back to pool
    if (context) {
      await browserPoolManager.releaseContext(context);
      console.log(`🔄 [INTELLIGENT CAPTURE] Released browser context`);
    }
  }
};

/**
 * Capture a URL using the queue system (original working implementation)
 * Falls back to intelligent queue if original fails
 */
export async function captureWithPlaywright(url, provider, options = {}) {
  // Pass all options to the worker
  const jobConfig = {
    url,
    provider,
    ...options,
  };

  logger.info({ url, queueLength: originalCaptureQueue.queue.length }, 'Queueing capture request (original)');
  
  try {
    // Try original working implementation first
    return await originalCaptureQueue.add(jobConfig);
  } catch (originalError) {
    logger.warn({ error: originalError.message }, 'Original queue failed, trying intelligent queue');
    
    // Fallback to new intelligent queue
    const priority = options.isBulk ? 0 : 10;
    return captureQueue.add(() => performIntelligentCapture(jobConfig), { priority });
  }
}

export async function cleanupPlaywrightFile(filePath) {
  try {
    await require('fs/promises').unlink(filePath);
  } catch (e) {
    // ignore
  }
}
