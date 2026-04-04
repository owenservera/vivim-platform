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

  // Strategy 1: Look for message containers with multiple selector patterns
  const messageSelectors = [
    '[class*="message"]',
    '[class*="chat-item"]',
    '[class*="message-item"]',
    '[class*="chat-turn"]',
    '[class*="bubble"]',
    '[class*="dialog"]',
    'article',
    'section',
  ];

  let messageElements = [];
  for (const selector of messageSelectors) {
    messageElements = $(selector).toArray();
    if (messageElements.length >= 2) {
      logger.info(`Kimi: Found ${messageElements.length} messages with selector: ${selector}`);
      break;
    }
  }

  // Strategy 2: If no messages found, look for content containers
  if (messageElements.length === 0) {
    messageElements = $('[class*="content"], [class*="text"], p').toArray();
    logger.info(`Kimi: Fallback found ${messageElements.length} potential content blocks`);
  }

  // Process each message element
  messageElements.forEach((el, index) => {
    const $el = $(el);
    const className = $el.attr('class') || '';
    
    // Skip UI chrome elements
    if ($el.closest('nav, header, footer, aside, sidebar, button, a').length > 0) {
      return;
    }

    // Role detection - multiple heuristics
    let role = null;

    // Heuristic 1: Check for user/assistant indicators in class
    const lowerClass = className.toLowerCase();
    if (lowerClass.includes('user') || lowerClass.includes('human') || lowerClass.includes('customer')) {
      role = 'user';
    } else if (
      lowerClass.includes('assistant') ||
      lowerClass.includes('ai') ||
      lowerClass.includes('bot') ||
      lowerClass.includes('model') ||
      lowerClass.includes('kimi')
    ) {
      role = 'assistant';
    }

    // Heuristic 2: Check for avatar indicators
    if (!role) {
      if ($el.find('[class*="user-avatar"], [class*="user-icon"], img[alt*="user"]').length > 0) {
        role = 'user';
      } else if ($el.find('[class*="ai-avatar"], [class*="bot-icon"], img[alt*="ai"], img[alt*="kimi"]').length > 0) {
        role = 'assistant';
      }
    }

    // Heuristic 3: Position-based (alternating pattern)
    if (!role) {
      role = index % 2 === 0 ? 'user' : 'assistant';
    }

    // Extract content
    let content = null;
    
    // Try to find markdown/content container
    const $contentContainer = $el.find('[class*="markdown"], [class*="content"], [class*="text-body"]').first();
    const $target = $contentContainer.length > 0 ? $contentContainer : $el;
    
    const text = $target.text().trim();
    
    // Skip if too short or looks like UI elements
    if (!text || text.length < 3 || /^[🔍🤖💬📎]/u.test(text)) {
      return;
    }
    
    // Skip duplicates
    if (messages.length > 0 && messages[messages.length - 1].content === text) {
      return;
    }

    if (richFormatting) {
      content = extractKimiRichContent($target, $, richFormatting);
    } else {
      content = text;
    }

    if (content && content.length > 0) {
      messages.push({
        id: uuidv4(),
        role,
        content,
        timestamp: null,
      });
    }
  });

  // Strategy 3: Fallback - look for any substantial paragraphs
  if (messages.length === 0) {
    logger.warn('Kimi: No messages found with standard selectors, trying aggressive fallback...');
    
    $('p, div').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      // Skip short text or UI chrome
      if (text.length < 20 || text.length > 10000) {
        return;
      }
      
      // Skip common UI patterns
      if (/^(Share|Copy|Export|Send|Like|Dislike|Regenerate)/i.test(text)) {
        return;
      }
      
      messages.push({
        id: uuidv4(),
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: text,
        timestamp: null,
      });
    });
  }

  // Deduplicate messages
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
