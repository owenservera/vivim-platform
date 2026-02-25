/**
 * Playwright-based HTML Capture (Intelligent Queue & Pool Managed)
 *
 * Replaces the legacy process-spawning queue with a dynamic BrowserPoolManager
 * and IntelligentQueue for 10x capture performance.
 */

import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { logger } from './lib/logger.js';
import { browserPoolManager } from './capture/browser-pool-manager.js';
import { captureQueue } from './capture/intelligent-queue.js';

async function handleGeminiConsent(page) {
  try {
    const currentUrl = page.url();
    if (currentUrl.includes('consent.google.com')) {
      logger.info('Consent page detected, attempting to accept');

      const acceptSelectors = [
        'button:has-text("Accept all")',
        'button:has-text("I agree")',
        'button:has-text("Yes, I agree")',
        'button[aria-label*="Accept"]',
        'form[action*="save"] button[type="submit"]',
        '.VfPpkd-LgbsSe:has-text("Accept")',
      ];

      let accepted = false;
      for (const selector of acceptSelectors) {
        try {
          const button = await page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            await button.click();
            logger.info(`Clicked accept button: ${selector}`);
            accepted = true;
            break;
          }
        } catch (e) {
          // Try next
        }
      }

      if (accepted) {
        logger.info('Waiting for redirect...');
        await page.waitForURL((url) => !url.includes('consent.google.com'), { timeout: 15000 });
        logger.info('Redirected successfully');
      } else {
        logger.warn('Could not find accept button');
      }
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Consent handler error');
  }
}

/**
 * The core capture logic executed within a pooled context
 */
async function performCapture(config) {
  const {
    url,
    provider,
    timeout = 60000,
    tempDir = null,
    waitForSelector,
    waitForTimeout,
  } = config;

  let context = null;
  let page = null;
  let tempFilePath = null;

  try {
    // 1. Setup Files
    const tempDirectory = path.resolve(tempDir || os.tmpdir());
    const tempFileName = `openscroll-pw-${provider}-${uuidv4()}.html`;
    tempFilePath = path.join(tempDirectory, tempFileName);

    // 2. Acquire context from pool
    context = await browserPoolManager.acquireContext();
    page = await context.newPage();

    // 3. Navigate
    logger.info(`Navigating to ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    } catch (gotoError) {
      logger.warn(`Initial navigation failed: ${gotoError.message}. Retrying with load...`);
      await page.goto(url, { waitUntil: 'load', timeout });
    }

    // 4. Handle Provider Specifics
    if (provider === 'gemini') {
      await handleGeminiConsent(page);
    }

    // 5. Wait for Content
    if (waitForSelector) {
      logger.info(`Waiting for selector: ${waitForSelector}`);
      try {
        await page.waitForSelector(waitForSelector, { timeout: 15000, state: 'attached' });
        await page.waitForTimeout(1000);
      } catch (e) {
        logger.warn('Selector wait timed out, continuing...');
      }
    }

    if (waitForTimeout) {
      await page.waitForTimeout(waitForTimeout);
    }

    // 6. Extract & Save
    const html = await page.content();
    await fs.writeFile(tempFilePath, html, 'utf8');

    return tempFilePath;
  } catch (error) {
    logger.error({ error: error.message, url }, 'Capture failed');
    throw error;
  } finally {
    if (page) {
      await page.close().catch(e => logger.warn({error: e.message}, 'Failed to close page'));
    }
    if (context) {
      await browserPoolManager.releaseContext(context);
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
