/**
 * Playwright-based HTML Capture (Node.js Worker Based)
 * Uses Node.js subprocess to avoid Bun + Playwright compatibility issues
 */

import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { logger } from './lib/logger.js';
import { browserPoolManager } from './capture/browser-pool-manager.js';
import { captureQueue } from './capture/intelligent-queue.js';

/**
 * The core capture logic executed within a pooled context
 */
async function performCapture(config) {
  const {
    url,
    provider,
    timeout = 60000,
    tempDir = null,
  } = config;

  let context = null;
  let tempFilePath = null;

  try {
    console.log(`🎯 [CAPTURE] Starting capture for ${provider}: ${url}`);

    // 1. Setup Files
    const tempDirectory = path.resolve(tempDir || os.tmpdir());
    const tempFileName = `openscroll-pw-${provider}-${uuidv4()}.html`;
    tempFilePath = path.join(tempDirectory, tempFileName);
    console.log(`📁 [CAPTURE] Temporary file: ${tempFilePath}`);

    // 2. Acquire browser worker from pool
    console.log(`🌐 [CAPTURE] Acquiring browser context from pool...`);
    const startTime = Date.now();
    context = await browserPoolManager.acquireContext();
    const contextTime = Date.now() - startTime;
    console.log(`✅ [CAPTURE] Browser context acquired in ${contextTime}ms`);

    // 3. Navigate using the worker
    console.log(`📄 [CAPTURE] Navigating to ${url}...`);
    const html = await browserPoolManager.navigate(context, url, timeout);
    console.log(`✅ [CAPTURE] Page captured (${html.length} bytes)`);

    // 4. Save to file
    await fs.writeFile(tempFilePath, html, 'utf8');
    console.log(`💾 [CAPTURE] Saved to ${tempFilePath}`);

    return tempFilePath;
  } catch (error) {
    logger.error({ error: error.message, url }, 'Capture failed');
    throw error;
  } finally {
    // 5. Release context back to pool
    if (context) {
      await browserPoolManager.releaseContext(context);
      console.log(`🔄 [CAPTURE] Released browser context`);
    }
  }
}

/**
 * Capture a URL using the intelligent queue system
 */
export async function captureWithPlaywright(url, provider, options = {}) {
  const jobConfig = {
    url,
    provider,
    ...options,
  };

  logger.info({ url }, 'Queueing intelligent capture request');
  
  // Use a higher priority if it's explicitly a single user request vs bulk
  const priority = options.isBulk ? 0 : 10;
  
  return captureQueue.add(() => performCapture(jobConfig), { priority });
}

export async function cleanupPlaywrightFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (e) {
    // ignore
  }
}
