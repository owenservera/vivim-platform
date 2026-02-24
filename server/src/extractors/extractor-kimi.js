import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { captureWithSingleFile, cleanupTempFile } from '../capture.js';

/**
 * Extract conversation from Kimi share URL
 * @param {string} url - The share URL to extract from
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} The extracted conversation object
 */
async function extractKimiConversation(url, options = {}) {
  const {
    timeout = 120000,
    richFormatting = true,
    metadataOnly = false,
    headless = true,
  } = options;

  let tempFilePath = null;

  try {
    logger.info(`Starting Kimi extraction for ${url}...`);

    // Capture the live page using SingleFile CLI
    tempFilePath = await captureWithSingleFile(url, 'kimi', { timeout, headless });

    logger.info(`Reading captured Kimi HTML from: ${tempFilePath}`);
    const html = await fs.readFile(tempFilePath, 'utf8');
    const $ = cheerio.load(html);

    // Extract conversation data for Kimi
    const conversation = extractKimiData($, url, richFormatting);

    if (conversation.messages.length === 0) {
      const debugPath = `debug-kimi-${Date.now()}.html`;
      await fs.writeFile(debugPath, html);
      logger.warn(`No messages found for Kimi. Saved HTML to ${debugPath} for inspection.`);
    }

    // Add metadata and standardize
    conversation.id = uuidv4();
    conversation.sourceUrl = url;
    conversation.provider = 'kimi';
    conversation.exportedAt = new Date().toISOString();

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
    conversation.stats = calculateStats(conversation);

    return conversation;
  } catch (error) {
    throw new Error(`Kimi extraction failed: ${error.message}`);
  } finally {
    // Always clean up the temporary file
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath);
    }
  }
}

/**
 * Extract Kimi conversation data
 */
function extractKimiData($, url, richFormatting = true) {
  const title = $('title').text().replace(' - Kimi', '').trim() || 'Kimi Conversation';

  const messages = [];

  // Method 1: Look for structured chat turns (common in Kimi)
  // Kimi uses specific containers for each turn
  $('[class*="chat-item"], [class*="message-item"], .chat-turn').each((i, el) => {
    const $el = $(el);

    // Role detection based on child elements or classes
    let role = 'assistant'; // Default

    // Heuristic 1: User avatar or specific user classes
    if (
      $el.find('[class*="user-avatar"]').length > 0 ||
      $el.find('[class*="user_"]').length > 0 ||
      $el.hasClass('user-message') ||
      $el.find('img[alt="user"]').length > 0
    ) {
      role = 'user';
    } else if (
      $el.find('.markdown-content').length > 0 ||
      $el.find('[class*="assistant_"]').length > 0
    ) {
      role = 'assistant';
    }

    const $content = $el.find('.markdown-content, [class*="content_"]').first();
    const $target = $content.length > 0 ? $content : $el;

    const text = $target.text().trim();
    if (!text || text.length < 1) {
      return;
    }

    const content = richFormatting ? extractKimiRichContent($target, $, richFormatting) : text;

    messages.push({
      id: uuidv4(),
      role,
      content,
      timestamp: null,
    });
  });

  // Method 2: Fallback to broad markdown content search if no turns found
  if (messages.length === 0) {
    $('.markdown-content').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (!text) {
        return;
      }

      // In this fallback, we assume it's assistant if it's markdown-content
      const content = richFormatting ? extractKimiRichContent($el, $, richFormatting) : text;

      messages.push({
        id: uuidv4(),
        role: 'assistant',
        content,
        timestamp: null,
      });
    });
  }

  // Deduplicate and clean up
  const cleanedMessages = messages.filter(
    (msg, index, self) =>
      index === self.findIndex((m) => m.content === msg.content && m.role === msg.role)
  );

  return {
    title,
    createdAt: new Date().toISOString(),
    messages: cleanedMessages,
    metadata: {
      provider: 'kimi',
      model: 'Kimi-V1',
    },
  };
}

/**
 * Extract rich content from Kimi message element
 */
function extractKimiRichContent($el, $, richFormatting = true) {
  if (!richFormatting) {
    return $el.text().trim();
  }

  const $clone = $el.clone();
  const contentBlocks = [];

  // 1. Identify Code Blocks
  $clone.find('pre').each((index, elem) => {
    const $pre = $(elem);
    const $code = $pre.find('code');
    const text = $code.text().trim();
    if (text) {
      const language = $code.attr('class')?.match(/language-(\w+)/)?.[1] || 'text';
      contentBlocks.push({
        type: 'code',
        content: text,
        language: language,
      });
      $pre.remove();
    }
  });

  // 2. Identify remaining text
  const remainingText = $clone.text().trim();
  if (remainingText) {
    contentBlocks.unshift({
      type: 'text',
      content: remainingText,
    });
  }

  if (contentBlocks.length === 0) {
    return '';
  }
  if (contentBlocks.length === 1 && contentBlocks[0].type === 'text') {
    return contentBlocks[0].content;
  }
  return contentBlocks;
}

/**
 * Calculate statistics
 */
function calculateStats(conversation) {
  let totalWords = 0;
  let totalCharacters = 0;
  let totalCodeBlocks = 0;
  let totalMermaidDiagrams = 0;
  let totalImages = 0;

  for (const message of conversation.messages) {
    const processContent = (content) => {
      if (typeof content === 'string') {
        totalWords += content.split(/\s+/).filter((w) => w).length;
        totalCharacters += content.length;
      } else if (Array.isArray(content)) {
        content.forEach((block) => {
          if (block.type === 'text') {
            totalWords += block.content.split(/\s+/).filter((w) => w).length;
            totalCharacters += block.content.length;
          } else if (block.type === 'code') {
            totalCodeBlocks++;
            totalCharacters += block.content.length;
          } else if (block.type === 'mermaid') {
            totalMermaidDiagrams++;
            totalCharacters += block.content.length;
          } else if (block.type === 'image') {
            totalImages++;
          }
        });
      }
    };
    processContent(message.content);
  }

  return {
    totalMessages: conversation.messages.length,
    totalWords,
    totalCharacters,
    totalCodeBlocks,
    totalMermaidDiagrams,
    totalImages,
    firstMessageAt: conversation.messages[0]?.timestamp || conversation.createdAt,
    lastMessageAt:
      conversation.messages[conversation.messages.length - 1]?.timestamp ||
      new Date().toISOString(),
  };
}

export { extractKimiConversation };
