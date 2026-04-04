import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { captureWithSingleFile, cleanupTempFile } from '../capture.js';

/**
 * Extract conversation from Grok share URL
 * @param {string} url - The share URL to extract from
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} The extracted conversation object
 */
async function extractGrokConversation(url, options = {}) {
  const {
    timeout = 120000,
    richFormatting = true,
    metadataOnly = false,
    headless = true,
  } = options;

  let tempFilePath = null;

  try {
    logger.info(`Starting Grok extraction for ${url}...`);

    // Capture the live page using SingleFile CLI
    tempFilePath = await captureWithSingleFile(url, 'grok', { timeout, headless });

    logger.info(`Reading captured Grok HTML from: ${tempFilePath}`);
    const html = await fs.readFile(tempFilePath, 'utf8');
    const $ = cheerio.load(html);

    // Extract conversation data for Grok
    const conversation = extractGrokData($, url, richFormatting);

    // Add metadata and standardize
    conversation.id = uuidv4();
    conversation.sourceUrl = url;
    conversation.provider = 'grok';
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
    throw new Error(`Grok extraction failed: ${error.message}`);
  } finally {
    // Always clean up the temporary file
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath);
    }
  }
}

/**
 * Extract Grok conversation data
 */
function extractGrokData($, url, richFormatting = true) {
  const title =
    $('title').text().replace(' | Shared Grok Conversation', '').trim() || 'Grok Conversation';

  const messages = [];

  // Strategy 1: Try multiple selectors for Grok message containers
  const selectors = [
    '[class*="message"]',
    '[class*="bubble"]',
    '[class*="chat-item"]',
    '[class*="conversation-item"]',
    '[class*="prose"]',
    '[class*="content"]',
    '[data-testid*="message"]',
    'article',
    'section',
  ];

  let messageElements = [];
  for (const selector of selectors) {
    messageElements = $(selector).toArray();
    if (messageElements.length >= 2) {
      logger.info(`Grok: Found ${messageElements.length} messages with selector: ${selector}`);
      break;
    }
  }

  // Strategy 2: Fallback to looking for text content containers
  if (messageElements.length === 0) {
    messageElements = $('[class*="text"], p, div[class*="content"]').toArray();
    logger.info(`Grok: Fallback found ${messageElements.length} potential content blocks`);
  }

  // Process each message element
  messageElements.forEach((el, index) => {
    const $el = $(el);
    const className = $el.attr('class') || '';
    
    // Skip UI chrome elements
    if ($el.closest('nav, header, footer, aside, sidebar, button, a').length > 0) {
      return;
    }

    const text = $el.text().trim();

    // Skip if too short or too long
    if (text.length < 5 || text.length > 50000) {
      return;
    }

    // Role detection - multiple heuristics
    let role = 'assistant'; // Default

    // Heuristic 1: Class name patterns
    const lowerClass = className.toLowerCase();
    if (
      lowerClass.includes('user') ||
      lowerClass.includes('human') ||
      lowerClass.includes('customer') ||
      lowerClass.includes('bg-surface-l1') ||
      lowerClass.includes('border-border-l1')
    ) {
      role = 'user';
    } else if (
      lowerClass.includes('assistant') ||
      lowerClass.includes('ai') ||
      lowerClass.includes('bot') ||
      lowerClass.includes('grok') ||
      lowerClass.includes('model')
    ) {
      role = 'assistant';
    }

    // Heuristic 2: Check for user avatar indicators
    if ($el.find('img[src*="user"], .user-avatar, [data-testid="user"]').length > 0) {
      role = 'user';
    }

    // Heuristic 3: Position-based (alternating pattern, first is usually user)
    if (messages.length === 0 && role === 'assistant') {
      // First message is often user
      role = 'user';
    } else if (messages.length > 0 && messages[messages.length - 1].role === role) {
      // If same role as previous, might be wrong - but keep it for now
    }

    // Skip UI text patterns
    if (/^(Share|Copy|Export|Send|Like|Dislike|Regenerate|Continue)/i.test(text)) {
      return;
    }

    // Skip duplicates
    if (messages.length > 0 && messages[messages.length - 1].content === text) {
      return;
    }

    const content = richFormatting ? extractGrokRichContent($el, $, richFormatting) : text;

    if (content && content.length > 0) {
      messages.push({
        id: uuidv4(),
        role,
        content,
        timestamp: null,
      });
    }
  });

  // Strategy 3: Aggressive fallback - look for any substantial text
  if (messages.length === 0) {
    logger.warn('Grok: No messages found with standard selectors, trying aggressive fallback...');
    
    $('p, div, span').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      // Skip short or very long text
      if (text.length < 30 || text.length > 10000) {
        return;
      }
      
      // Skip UI patterns
      if (/^(Share|Copy|Export|Send|Like|Dislike|Regenerate|Continue|Grok)/i.test(text)) {
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

  // Remove exact duplicates
  const uniqueMessages = messages.filter(
    (msg, index, self) => index === self.findIndex((m) => m.content === msg.content)
  );

  return {
    title,
    createdAt: new Date().toISOString(),
    messages: uniqueMessages,
    metadata: {
      provider: 'grok',
      model: 'Grok-2',
    },
  };
}

/**
 * Extract rich content from Grok message element
 */
function extractGrokRichContent($el, $, richFormatting = true) {
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

  // 2. Identify Mermaid (if Grok supports/renders it, usually via code blocks)
  // Check remaining text or code blocks for mermaid keywords

  // 3. Handle remaining text
  // Grok often puts text in paragraphs
  const remainingText = $clone.text().trim();

  // Check for regex-based mermaid if not caught in code blocks
  const mermaidRegex = /(?:^|\n)\s*(graph\s+[LRTDBC]{2}[\s\S]*?(?=---|\n|$|###))/gi;
  let match;
  let lastIndex = 0;
  const newTextBlocks = [];

  while ((match = mermaidRegex.exec(remainingText)) !== null) {
    const textBefore = remainingText.substring(lastIndex, match.index).trim();
    if (textBefore) {
      newTextBlocks.push({ type: 'text', content: textBefore });
    }
    contentBlocks.push({ type: 'mermaid', content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  const finalRemainingText = remainingText.substring(lastIndex).trim();
  if (finalRemainingText) {
    newTextBlocks.push({ type: 'text', content: finalRemainingText });
  }

  const finalBlocks = [...newTextBlocks, ...contentBlocks.filter((b) => b.type !== 'text')];

  if (finalBlocks.length === 0) {
    return '';
  }
  if (finalBlocks.length === 1 && finalBlocks[0].type === 'text') {
    return finalBlocks[0].content;
  }
  return finalBlocks;
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

export { extractGrokConversation };
