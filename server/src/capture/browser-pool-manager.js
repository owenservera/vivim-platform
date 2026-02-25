import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logger } from '../lib/logger.js';
import os from 'os';

chromium.use(StealthPlugin());

/**
 * Manages a pool of Playwright browser contexts for efficient capturing.
 * Eliminates the overhead of launching a new browser process for each request.
 */
class BrowserPoolManager {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.browser = null;
    this.contexts = new Set();
    this.isInitializing = false;
    this.initPromise = null;
    
    // Auto-recover if browser crashes
    this._browserDisconnectedHandler = this._handleBrowserDisconnect.bind(this);
  }

  async initialize() {
    if (this.browser) return;
    if (this.isInitializing) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        logger.info('Initializing Browser Pool Manager...');
        this.browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process'
          ],
        });
        
        this.browser.on('disconnected', this._browserDisconnectedHandler);
        logger.info('Browser Pool initialized successfully.');
      } catch (error) {
        logger.error({ error: error.message }, 'Failed to initialize Browser Pool');
        throw error;
      } finally {
        this.isInitializing = false;
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  async _handleBrowserDisconnect() {
    logger.warn('Browser disconnected or crashed. Restarting pool...');
    this.browser = null;
    this.contexts.clear();
    await this.initialize().catch(e => logger.error({error: e}, 'Failed to recover browser pool'));
  }

  async acquireContext() {
    await this.initialize();
    
    // Check if we hit the limit (though queue should manage concurrency)
    if (this.contexts.size >= this.maxSize) {
      logger.warn(`Browser pool at max capacity (${this.maxSize}). Creating context anyway, but performance may degrade.`);
    }

    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      deviceScaleFactor: 1,
    });

    this.contexts.add(context);
    
    // Setup generic error handlers for the context
    context.on('page', page => {
       page.on('crash', () => logger.error('A page crashed in the browser pool!'));
    });

    return context;
  }

  async releaseContext(context) {
    if (!context) return;
    try {
      this.contexts.delete(context);
      await context.close();
    } catch (e) {
      logger.error({ error: e.message }, 'Failed to cleanly release browser context');
    }
  }

  async shutdown() {
    if (this.browser) {
      this.browser.removeListener('disconnected', this._browserDisconnectedHandler);
      await this.browser.close();
      this.browser = null;
      this.contexts.clear();
    }
  }
}

// Export singleton instance
export const browserPoolManager = new BrowserPoolManager(
  process.env.MAX_CONCURRENT_CAPTURES ? parseInt(process.env.MAX_CONCURRENT_CAPTURES, 10) : 10
);
