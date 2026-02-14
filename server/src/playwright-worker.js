
/**
 * Standalone Playwright Worker (Node.js)
 * 
 * This script runs in a separate Node.js process to ensure isolation 
 * and proper runtime support for Playwright/Puppeteer dependencies.
 * 
 * Usage: node src/playwright-worker.js <JSON_CONFIG_STRING>
 */

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Apply stealth plugin
chromium.use(StealthPlugin());

async function handleGeminiConsent(page) {
    try {
        const currentUrl = page.url();
        if (currentUrl.includes('consent.google.com')) {
            console.error('[Worker] Consent page detected, attempting to accept');
            
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
                        console.error(`[Worker] Clicked accept button: ${selector}`);
                        accepted = true;
                        break;
                    }
                } catch (e) {
                    // Try next
                }
            }
            
            if (accepted) {
                console.error('[Worker] Waiting for redirect...');
                await page.waitForURL(url => !url.includes('consent.google.com'), { timeout: 15000 });
                console.error('[Worker] Redirected successfully');
            } else {
                console.error('[Worker] Could not find accept button');
            }
        }
    } catch (error) {
        console.error(`[Worker] Consent handler error: ${error.message}`);
    }
}

async function runCapture() {
    // 1. Parse Arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Error: No configuration provided');
        process.exit(1);
    }

    let config;
    try {
        config = JSON.parse(args[0]);
    } catch (e) {
        console.error('Error: Invalid JSON config');
        process.exit(1);
    }

    const {
        url,
        provider,
        timeout = 60000,
        headless = true,
        tempDir = null,
        waitForSelector,
        waitForTimeout,
    } = config;

    let browser = null;
    let tempFilePath = null;

    try {
        // 2. Setup Files
        const tempDirectory = path.resolve(tempDir || os.tmpdir());
        const tempFileName = `openscroll-pw-${provider}-${uuidv4()}.html`;
        tempFilePath = path.join(tempDirectory, tempFileName);

        // 3. Launch Browser
        browser = await chromium.launch({ 
            headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'en-US',
        });

        const page = await context.newPage();

        // 4. Navigate (with fallback)
        console.error(`[Worker] Navigating to ${url}`);
        try {
            // First try domcontentloaded as it's faster and more reliable for heavy JS sites
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
        } catch (gotoError) {
            console.error(`[Worker] Initial navigation failed: ${gotoError.message}. Retrying with load...`);
            await page.goto(url, { waitUntil: 'load', timeout });
        }
        
        // 5. Handle Provider Specifics (e.g. Consent)
        if (provider === 'gemini') {
            await handleGeminiConsent(page);
        }

        // 6. Wait for Content
        if (waitForSelector) {
            console.error(`[Worker] Waiting for selector: ${waitForSelector}`);
            try {
                // Wait for the selector to actually have content if possible
                await page.waitForSelector(waitForSelector, { timeout: 15000, state: 'attached' });
                // Brief pause to let any dynamic content settle
                await page.waitForTimeout(1000);
            } catch (e) {
                console.error('[Worker] Selector wait timed out, continuing...');
            }
        }

        if (waitForTimeout) {
            await page.waitForTimeout(waitForTimeout);
        }

        // 7. Extract
        const html = await page.content();
        await fs.writeFile(tempFilePath, html, 'utf8');

        // 8. Output Result (JSON to stdout)
        console.log(JSON.stringify({ status: 'success', path: tempFilePath }));

    } catch (error) {
        console.error(`[Worker] Error: ${error.message}`);
        console.log(JSON.stringify({ status: 'error', message: error.message }));
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

runCapture();
