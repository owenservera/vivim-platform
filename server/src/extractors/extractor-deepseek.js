import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { captureWithSingleFile, cleanupTempFile } from '../capture.js';

/**
 * Extract conversation from DeepSeek share URL
 * @param {string} url - The share URL to extract from
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} The extracted conversation object
 */
async function extractDeepseekConversation(url, options = {}) {
  const {
    timeout = 120000,
    richFormatting = true,
    metadataOnly = false,
    headless = true,
  } = options;

  let tempFilePath = null;

  try {
    logger.info(`Starting DeepSeek extraction for ${url}...`);

    // Capture the live page using SingleFile CLI
    tempFilePath = await captureWithSingleFile(url, 'deepseek', { timeout, headless });

    logger.info(`Reading captured DeepSeek HTML from: ${tempFilePath}`);
    const html = await fs.readFile(tempFilePath, 'utf8');
    const $ = cheerio.load(html);

    // Extract conversation data for DeepSeek
    const conversation = extractDeepseekData($, url, richFormatting);

    // Add metadata and standardize
    conversation.id = uuidv4();
    conversation.sourceUrl = url;
    conversation.provider = 'deepseek';
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
    throw new Error(`DeepSeek extraction failed: ${error.message}`);
  } finally {
    // Always clean up the temporary file
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath);
    }
  }
}

/**
 * Extract DeepSeek conversation data
 */
function extractDeepseekData($, url, richFormatting = true) {
  const title = $('title').text().replace(' - DeepSeek', '').trim() || 'DeepSeek Conversation';

  const messages = [];

  // Try multiple selectors for message containers
  const selectors = [
    '.ds-message',
    '[class*="message" i]',
    '.chat-message',
    '.conversation-message',
  ];

  let messageElements = [];
  for (const selector of selectors) {
    messageElements = $(selector).toArray();
    if (messageElements.length > 0) {
      break;
    }
  }

  if (messageElements.length === 0) {
    logger.warn('No message elements found with standard selectors, trying generic approach');
    // Fallback: look for alternating div patterns
    const allDivs = $('div').toArray();
    messageElements = allDivs
      .filter((el) => {
        const $el = $(el);
        const text = $el.text().trim();
        return text.length > 10 && text.length < 10000;
      })
      .slice(0, 50);
  }

  messageElements.forEach((el, index) => {
    const $el = $(el);
    const className = $el.attr('class') || '';
    const text = $el.text().trim();

    // Multiple heuristics for role detection
    let role = 'assistant';

    // Heuristic 1: Check for user-specific indicators
    const isUser =
      className.match(/[a-f0-9]{7,}/) || // Dynamic hash classes (like d29f3d7d)
      $el.find('img[src*="user"], .avatar-user, [data-role="user"]').length > 0 ||
      text.startsWith('You:') ||
      text.startsWith('User:');

    // Heuristic 2: Position-based (alternating)
    if (!isUser && messages.length > 0) {
      const prevRole = messages[messages.length - 1].role;
      if (prevRole === 'assistant') {
        role = 'user';
      }
    }

    if (isUser) {
      role = 'user';
    }

    // Skip if this looks like a duplicate or system message
    if (text.length < 2 || text.length > 50000) {
      return;
    }

    const content = richFormatting ? extractDeepseekRichContent($el, $, richFormatting) : text;

    if (content && content.length > 0) {
      messages.push({
        id: uuidv4(),
        role,
        content,
        timestamp: null,
      });
    }
  });

  // Remove duplicate messages
  const uniqueMessages = messages.filter(
    (msg, index, self) => index === self.findIndex((m) => m.content === msg.content)
  );

  return {
    title,
    createdAt: new Date().toISOString(),
    messages: uniqueMessages,
    metadata: {
      provider: 'deepseek',
      model: 'DeepSeek-V3',
    },
  };
}

/**
 * Extract rich content from DeepSeek message element
 */
function extractDeepseekRichContent($el, $, richFormatting = true) {
  if (!richFormatting) {
    return $el.text().trim();
  }

  const $clone = $el.clone();
  const contentBlocks = [];

  // 1. Identify "Thought" or "Thinking" blocks
  // DeepSeek often has a "Thought for X seconds" section
  const thoughtMatch = $clone.text().match(/Thought for \d+ seconds/i);
  if (thoughtMatch) {
    // Find the thought block - often a specific div or just text at the start
    // For now, we'll just extract the text and mark it
    contentBlocks.push({
      type: 'text',
      content: thoughtMatch[0],
      isThought: true,
    });
    // Try to remove it from the clone to avoid duplication
    // This is a bit tricky as it might not be in a separate tag
  }

  // 2. Identify Code Blocks
  $clone.find('.md-code-block, pre').each((index, elem) => {
    const $pre = $(elem);
    const $code = $pre.find('code');
    const text = $code.length > 0 ? $code.text().trim() : $pre.text().trim();
    if (text) {
      const language =
        $pre.attr('class')?.match(/language-(\w+)/)?.[1] ||
        $code.attr('class')?.match(/language-(\w+)/)?.[1] ||
        'text';
      contentBlocks.push({
        type: 'code',
        content: text,
        language: language,
      });
      $pre.remove();
    }
  });

  // 3. Identify images
  $clone.find('img').each((index, elem) => {
    const $elem = $(elem);
    const src = $elem.attr('src');
    if (src && !src.includes('avatar') && !src.includes('logo')) {
      contentBlocks.push({
        type: 'image',
        content: src,
        alt: $elem.attr('alt') || '',
      });
    }
    $elem.remove();
  });

  // 4. Handle remaining text
  const remainingText = $clone
    .text()
    .replace(/Thought for \d+ seconds/i, '')
    .trim();
  if (remainingText) {
    // Check for mermaid in text
    const mermaidRegex = /(?:^|\n)\s*(graph\s+[LRTDBC]{2}[\s\S]*?(?=---|###|$))/gi;
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

    // Combine
    const finalBlocks = [...newTextBlocks, ...contentBlocks.filter((b) => b.type !== 'text')];
    if (finalBlocks.length === 0) {
      return '';
    }
    if (finalBlocks.length === 1 && finalBlocks[0].type === 'text') {
      return finalBlocks[0].content;
    }
    return finalBlocks;
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

export { extractDeepseekConversation };
