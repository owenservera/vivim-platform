/**
 * ChatGPT Extractor with Authentication Support
 * 
 * Addresses the core issue: ChatGPT share URLs require authentication
 * to access conversation content.
 */

import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { captureWithPlaywright, cleanupPlaywrightFile } from '../capture-playwright.js';

/**
 * Extract conversation from ChatGPT share URL with authentication
 */
async function extractChatgptConversationWithAuth(url, options = {}) {
  const {
    timeout = 120000,
    richFormatting = true,
    metadataOnly = false,
    headless = true,
    waitForTimeout = 3000,
    authSession = null, // New: session cookies/tokens
  } = options;

  let tempFilePath = null;
  let capturedImages = [];

  try {
    logger.info(`Starting ChatGPT extraction with auth for ${url}...`);

    // Enhanced capture with authentication support
    const captureResult = await captureWithPlaywrightAuth(url, 'chatgpt', {
      timeout,
      headless,
      waitForSelector: 'h1, [data-message-author-role]',
      waitForTimeout: waitForTimeout,
      authSession, // Pass authentication
    });

    tempFilePath = captureResult.path;
    capturedImages = captureResult.images || [];
    
    logger.info(`Reading captured ChatGPT HTML from: ${tempFilePath}`);
    logger.info(`Found ${capturedImages.length} captured images`);
    const html = await fs.readFile(tempFilePath, 'utf8');
    const $ = cheerio.load(html);

    // Check if we got actual content
    const hasContent = checkForContent($, html);
    
    if (!hasContent) {
      logger.warn('No conversation content found - likely requires authentication');
      
      // Return structured error instead of crashing
      return {
        id: uuidv4(),
        provider: 'chatgpt',
        sourceUrl: url,
        title: 'ChatGPT Conversation (Authentication Required)',
        model: 'ChatGPT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        capturedAt: new Date().toISOString(),
        messages: [],
        metadata: {
          provider: 'chatgpt',
          model: 'ChatGPT',
          requiresAuth: true,
          authStatus: detectAuthStatus(html),
          extractionMethod: 'failed-auth',
        },
        stats: {
          messageCount: 0,
          userMessageCount: 0,
          aiMessageCount: 0,
          totalWords: 0,
          totalCharacters: 0,
        },
        error: {
          type: 'AUTHENTICATION_REQUIRED',
          message: 'This ChatGPT conversation requires authentication to access',
          suggestion: 'Please provide session cookies or access token'
        }
      };
    }

    // Extract conversation data for ChatGPT
    const conversation = extractChatgptData($, url, html, richFormatting, capturedImages);

    // Add metadata and standardize
    conversation.id = uuidv4();
    conversation.sourceUrl = url;
    conversation.provider = 'chatgpt';
    conversation.exportedAt = new Date().toISOString();
    conversation.images = capturedImages;

    // If metadata only, return early
    if (metadataOnly) {
      return {
        id: conversation.id,
        provider: conversation.provider,
        sourceUrl: conversation.sourceUrl,
        title: conversation.title,
        createdAt: conversation.createdAt,
        exportedAt: conversation.exportedAt,
        metadata: conversation.metadata,
        stats: conversation.stats,
      };
    }

    // Calculate statistics
    conversation.stats = calculateStats(conversation.messages);

    return conversation;
  } catch (error) {
    throw new Error(`ChatGPT extraction failed: ${error.message}`);
  } finally {
    if (tempFilePath) {
      await cleanupPlaywrightFile(tempFilePath);
    }
  }
}

/**
 * Check if HTML contains actual conversation content
 */
function checkForContent($, html) {
  // Check for message elements
  const messageElements = $('[data-message-author-role], article, .markdown, .prose').length;
  
  // Check for React stream data with actual conversation
  const hasStreamData = html.includes('conversation') && 
                       !html.includes('P21:[{}]') && 
                       !html.includes('"authStatus":"logged_out"');
  
  // Check for text content that looks like conversation
  const textContent = $.text().trim();
  const hasConversationText = textContent.length > 1000 && 
                             (textContent.includes('User:') || 
                              textContent.includes('ChatGPT:') ||
                              textContent.includes('Assistant:'));
  
  return messageElements > 0 || hasStreamData || hasConversationText;
}

/**
 * Detect authentication status from HTML
 */
function detectAuthStatus(html) {
  if (html.includes('"authStatus":"logged_out"')) {
    return 'logged_out';
  } else if (html.includes('"authStatus":"logged_in"')) {
    return 'logged_in';
  } else if (html.includes('login') || html.includes('sign-in')) {
    return 'login_required';
  }
  return 'unknown';
}

/**
 * Enhanced Playwright capture with authentication support
 */
async function captureWithPlaywrightAuth(url, provider, options = {}) {
  // This would be implemented in capture-playwright.js
  // For now, delegate to existing method
  return captureWithPlaywright(url, provider, options);
}

export { extractChatgptConversationWithAuth };
