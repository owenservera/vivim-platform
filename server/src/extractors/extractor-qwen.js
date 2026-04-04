import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { captureWithSingleFile, cleanupTempFile } from '../capture.js';

/**
 * Extract Qwen conversation with rich formatting support
 * @param {string} url - The share URL to extract from
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} The extracted conversation object
 */
async function extractQwenConversation(url, options = {}) {
  const { timeout = 120000, richFormatting = true, metadataOnly = false } = options;

  let tempFilePath = null;

  try {
    logger.info(`Starting Qwen extraction for ${url}...`);

    // Capture the live page using SingleFile CLI
    tempFilePath = await captureWithSingleFile(url, 'qwen', { timeout });

    logger.info(`Reading captured Qwen HTML from: ${tempFilePath}`);
    const html = await fs.readFile(tempFilePath, 'utf8');
    const $ = cheerio.load(html);

    // Extract conversation data for Qwen
    const conversation = extractQwenData($, url, richFormatting);

    // Add metadata and standardize
    conversation.id = uuidv4();
    conversation.sourceUrl = url;
    conversation.provider = 'qwen';
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
    throw new Error(`Qwen extraction failed: ${error.message}`);
  } finally {
    // Always clean up the temporary file
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath);
    }
  }
}

/**
 * Extract Qwen conversation data with rich formatting support
 */
function extractQwenData($, url, richFormatting = true) {
  const title = $('title').text().replace(' - Qwen Chat', '').trim() || 'Qwen Conversation';

  const messages = [];
  let conversationCreatedAt = new Date().toISOString();

  // Qwen specific message containers - multiple selector strategies
  // Strategy 1: Look for message containers with role indicators
  const messageSelectors = [
    '[class*="message"]',
    '[class*="chat-item"]',
    '[class*="conversation-item"]',
    '[data-role]',
    'article',
    'section',
  ];

  let messageElements = [];
  for (const selector of messageSelectors) {
    messageElements = $(selector).toArray();
    if (messageElements.length >= 2) { // Need at least 2 messages for a conversation
      logger.info(`Qwen: Found ${messageElements.length} messages with selector: ${selector}`);
      break;
    }
  }

  // Process each message element
  messageElements.forEach((el, index) => {
    const $el = $(el);
    const className = $el.attr('class') || '';
    const dataRole = $el.attr('data-role');
    
    // Skip elements that are likely not messages (headers, footers, sidebars)
    if ($el.closest('nav, header, footer, aside, sidebar').length > 0) {
      return;
    }

    // Role detection - multiple strategies
    let role = null;
    
    // Strategy 1: data-role attribute
    if (dataRole) {
      if (dataRole.includes('user') || dataRole === 'user') role = 'user';
      else if (dataRole.includes('assistant') || dataRole.includes('ai') || dataRole === 'bot') role = 'assistant';
    }
    
    // Strategy 2: class name patterns
    if (!role) {
      const lowerClass = className.toLowerCase();
      if (lowerClass.includes('user')) role = 'user';
      else if (lowerClass.includes('assistant') || lowerClass.includes('ai') || lowerClass.includes('bot') || lowerClass.includes('model')) role = 'assistant';
    }
    
    // Strategy 3: Position-based (alternating, first is usually user)
    if (!role) {
      role = index % 2 === 0 ? 'user' : 'assistant';
    }

    // Extract content - try multiple approaches
    let content = null;
    
    // Try to find content container first
    const $contentContainer = $el.find('[class*="content"], [class*="text"], [class*="message-body"], p').first();
    const $target = $contentContainer.length > 0 ? $contentContainer : $el;
    
    const rawText = $target.text().trim();
    
    // Skip if content is too short or looks like UI chrome
    if (!rawText || rawText.length < 5 || /^[🔍🤖💬]/u.test(rawText)) {
      return;
    }
    
    // Skip duplicates
    if (messages.length > 0 && messages[messages.length - 1].content === rawText) {
      return;
    }

    // Extract timestamp if present
    let timestamp = null;
    const timestampMatch = rawText.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}[\sT]\d{1,2}:\d{2}(?::\d{2})?)/);
    if (timestampMatch) {
      timestamp = timestampMatch[0];
      if (messages.length === 0) {
        conversationCreatedAt = timestamp;
      }
    }

    // Extract rich content or plain text
    if (richFormatting) {
      content = extractQwenRichContent($target, $, richFormatting);
    } else {
      content = rawText.replace(timestamp || '', '').trim();
    }

    if (content && content.length > 0) {
      messages.push({
        id: uuidv4(),
        role,
        content,
        timestamp: timestamp ? new Date(timestamp).toISOString() : null,
      });
    }
  });

  // Fallback: If still no messages, try to find any text content in the page
  if (messages.length === 0) {
    logger.warn('Qwen: No messages found with standard selectors, trying fallback...');
    
    // Look for any substantial text blocks
    $('p, div[class*="text"], div[class*="content"]').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      
      if (text.length > 50 && !text.match(/^(Share|Copy|Export|Send)/i)) {
        messages.push({
          id: uuidv4(),
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: text,
          timestamp: null,
        });
      }
    });
  }

  return {
    title,
    createdAt: conversationCreatedAt.includes('-')
      ? new Date(conversationCreatedAt).toISOString()
      : conversationCreatedAt,
    messages,
    metadata: {
      provider: 'qwen',
      model: 'Qwen3-Max',
    },
  };
}

/**
 * Extract rich content from Qwen HTML
 */
function extractQwenRichContent($el, $, richFormatting = true) {
  if (!richFormatting) {
    return $el.text().trim();
  }

  const $clone = $el.clone();
  const contentBlocks = [];

  // 1. Identify Mermaid diagrams - BE MORE LENIENT
  $clone
    .find(
      '.qwen-markdown-mermaid-chart, .qwen-markdown-mermaid-chart-wrapper, [class*="mermaid"], pre, code'
    )
    .each((index, elem) => {
      const $elem = $(elem);
      const text = $elem.text().trim();
      // Match even with leading numbers or whitespace
      if (
        text.match(
          /(?:^|\n)\s*\d*\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|mindmap|timeline|zenuml)/i
        )
      ) {
        contentBlocks.push({
          type: 'mermaid',
          content: text.replace(/^\s*\d*\s*/, ''), // Clean up leading numbers
        });
        $elem.remove();
      }
    });

  // 2. Identify code blocks
  $clone.find('pre, code, .qwen-markdown-code-body').each((index, elem) => {
    const $elem = $(elem);
    const text = $elem.text().trim();
    if (text) {
      const language = $elem.attr('class')?.match(/language-(\w+)/)?.[1] || 'text';
      contentBlocks.push({
        type: 'code',
        content: text,
        language: language,
      });
      $elem.remove();
    }
  });

  // 3. Identify images
  $clone.find('img').each((index, elem) => {
    const $elem = $(elem);
    const src = $elem.attr('src');
    if (src && !src.includes('logo')) {
      contentBlocks.push({
        type: 'image',
        content: src,
        alt: $elem.attr('alt') || '',
      });
    }
    $elem.remove();
  });

  // 4. Remaining text
  let remainingText = $clone.text().trim();
  remainingText = remainingText.replace(/\d{4}-\d{2}-\d{2} \d{1,2}:\d{2} [AP]M/, '').trim();

  if (remainingText) {
    // Final regex check for mermaid in text
    const mermaidRegex = /(?:^|\n)\s*(graph\s+[LRTDBC]{2}[\s\S]*?(?=---|###|Goal:|1\s+|2\s+))/gi;
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
 * Calculate statistics for the conversation
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

export { extractQwenConversation };
