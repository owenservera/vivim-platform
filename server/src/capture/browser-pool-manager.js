import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { logger } from '../lib/logger.js';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Browser Pool Manager using Node.js subprocess for Playwright
 * Uses stdin/stdout JSON communication to avoid IPC issues
 */
class BrowserPoolManager {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.nodePath = null;
    this.workerScript = null;
    this.activeProcesses = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    this.nodePath = process.env.NODE || 'node';
    console.log('🌐 [BROWSER] Using Node.js at:', this.nodePath);
    
    this.workerScript = path.join(__dirname, 'browser-worker.cjs');
    await this._ensureWorkerScript();
    
    this.isInitialized = true;
    console.log('✅ [BROWSER POOL] Initialized with Node.js worker');
  }

  async _ensureWorkerScript() {
    const workerContent = `
// Browser Worker - Uses stdin/stdout for JSON communication
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

function findInstalledChromium() {
  const playwrightDir = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  if (!fs.existsSync(playwrightDir)) return null;

  const entries = fs.readdirSync(playwrightDir, { withFileTypes: true });
  const chromiumFolders = entries
    .filter(e => e.isDirectory() && e.name.startsWith('chromium-'))
    .map(e => e.name)
    .sort()
    .reverse();

  for (const folder of chromiumFolders) {
    const chromePath = path.join(playwrightDir, folder, 'chrome-win', 'chrome.exe');
    if (fs.existsSync(chromePath)) return chromePath;
  }
  return null;
}

const windowsArgs = [
  '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
  '--disable-gpu', '--no-zygote', '--disable-software-rasterizer',
  '--disable-extensions', '--disable-background-networking',
  '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
  '--disable-breakpad', '--disable-component-extensions-with-background-pages',
  '--disable-default-apps', '--disable-features=Translate,BlinkGenPropertyTrees',
  '--disable-hang-monitor', '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding', '--disable-sync',
  '--force-color-profile=srgb', '--metrics-recording-only',
  '--no-first-run', '--password-store=basic', '--use-mock-keychain',
  '--enable-automation', '--disable-infobars', '--disable-popup-blocking',
  '--safebrowsing-disable-auto-update', '--disable-web-security',
  '--allow-running-insecure-content',
];

let browser = null;
let context = null;

function send(msg) {
  console.log('JSON:' + JSON.stringify(msg));
}

async function launchBrowser() {
  const executablePath = findInstalledChromium();
  if (executablePath) {
    console.log('Using chromium:', executablePath);
    browser = await chromium.launch({
      headless: true,
      executablePath: executablePath,
      timeout: 30000,
      args: windowsArgs,
    });
  } else {
    browser = await chromium.launch({
      headless: true,
      timeout: 30000,
      args: windowsArgs,
    });
  }
  
  context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    deviceScaleFactor: 1,
  });
  
  send({ type: 'ready' });
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', async (line) => {
  try {
    const msg = JSON.parse(line.trim());
    
    if (msg.type === 'launch') {
      await launchBrowser();
    }
    else if (msg.type === 'navigate') {
      if (!context) {
        send({ type: 'error', error: 'Browser not initialized' });
        return;
      }
      
      const page = await context.newPage();
      try {
        await page.goto(msg.url, { waitUntil: 'domcontentloaded', timeout: msg.timeout || 60000 });
        await page.waitForTimeout(2000);
        const html = await page.content();
        send({ type: 'success', html: html });
      } catch (e) {
        send({ type: 'error', error: e.message });
      } finally {
        await page.close();
      }
    }
    else if (msg.type === 'close') {
      if (context) await context.close();
      if (browser) await browser.close();
      send({ type: 'closed' });
      process.exit(0);
    }
  } catch (e) {
    send({ type: 'error', error: e.message });
  }
});
`;
    
    fs.writeFileSync(this.workerScript, workerContent, 'utf8');
  }

  async acquireContext() {
    await this.initialize();
    
    const workerId = uuidv4();
    console.log('🌐 [BROWSER] Spawning worker ' + workerId + '...');
    
    return new Promise((resolve, reject) => {
      const worker = spawn(this.nodePath, [this.workerScript], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let ready = false;
      let buffer = '';
      
      worker.stdout.on('data', (data) => {
        buffer += data.toString();
        
        const lines = buffer.split('\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (line.startsWith('JSON:')) {
            try {
              const msg = JSON.parse(line.substring(5));
              console.log('[Worker ' + workerId + '] Got: ' + msg.type);
              
              if (msg.type === 'ready' && !ready) {
                ready = true;
                this.activeProcesses.set(workerId, worker);
                resolve({ workerId, worker, isBrowserContext: true });
              }
            } catch (e) {
              if (line.trim()) {
                console.log('[Worker ' + workerId + '] ' + line.trim());
              }
            }
          } else if (line.trim()) {
            console.log('[Worker ' + workerId + '] ' + line.trim());
          }
        }
      });
      
      worker.stderr.on('data', (data) => {
        console.error('[Worker ' + workerId + ' ERR] ' + data.toString().trim());
      });
      
      worker.on('error', (error) => {
        console.error('[Worker ' + workerId + '] Error:', error);
        reject(error);
      });
      
      worker.on('exit', (code) => {
        this.activeProcesses.delete(workerId);
        console.log('[Worker ' + workerId + '] Exited: ' + code);
      });
      
      worker.stdin.write(JSON.stringify({ type: 'launch' }) + '\n');
      
      setTimeout(() => {
        if (!ready) {
          worker.kill();
          reject(new Error('Browser launch timeout'));
        }
      }, 60000);
    });
  }

  async navigate(context, url, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const { worker, workerId } = context;
      let buffer = '';
      let resolved = false;
      
      const timeoutHandle = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Navigation timeout'));
        }
      }, timeout + 10000);
      
      const handleData = (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (line.startsWith('JSON:')) {
            try {
              const msg = JSON.parse(line.substring(5));
              clearTimeout(timeoutHandle);
              worker.stdout.removeListener('data', handleData);
              
              if (msg.type === 'success') {
                resolved = true;
                resolve(msg.html);
              } else {
                resolved = true;
                reject(new Error(msg.error));
              }
            } catch (e) {
              // Not JSON
            }
          }
        }
      };
      
      worker.stdout.on('data', handleData);
      worker.stdin.write(JSON.stringify({ type: 'navigate', url, timeout }) + '\n');
    });
  }

  async releaseContext(context) {
    if (!context) return;
    
    try {
      const { workerId, worker } = context;
      worker.stdin.write(JSON.stringify({ type: 'close' }) + '\n');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!worker.killed) {
        worker.kill();
      }
      
      this.activeProcesses.delete(workerId);
      console.log('🌐 [BROWSER] Released worker ' + workerId);
    } catch (e) {
      logger.error({ error: e.message }, 'Failed to release browser context');
    }
  }

  async shutdown() {
    console.log('🌐 [BROWSER] Shutting down...');
    
    for (const [workerId, worker] of this.activeProcesses) {
      try {
        worker.stdin.write(JSON.stringify({ type: 'close' }) + '\n');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!worker.killed) worker.kill();
      } catch (e) {
        console.error('Error killing worker ' + workerId + ':', e);
      }
    }
    
    this.activeProcesses.clear();
    
    if (this.workerScript && fs.existsSync(this.workerScript)) {
      fs.unlinkSync(this.workerScript);
    }
  }
}

export const browserPoolManager = new BrowserPoolManager(
  process.env.MAX_CONCURRENT_CAPTURES ? parseInt(process.env.MAX_CONCURRENT_CAPTURES, 10) : 10
);
