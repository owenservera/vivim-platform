import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { captureWithSingleFile, cleanupTempFile } from '../capture.js';

/**
 * Extract Z.ai conversation with rich formatting support
 * @param {string} url - The share URL to extract from
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} The extracted conversation object
 */
async function extractZaiConversation(url, options = {}) {
  const { timeout = 120000, richFormatting = true, metadataOnly = false } = options;

  let tempFilePath = null;

  try {
    logger.info(`Starting Z.ai extraction for ${url}...`);

    // Capture the live page using SingleFile CLI
    tempFilePath = await captureWithSingleFile(url, 'zai', { timeout });

    logger.info(`Reading captured Z.ai HTML from: ${tempFilePath}`);
    const html = await fs.readFile(tempFilePath, 'utf8');
    const $ = cheerio.load(html);

    // Extract conversation data for Z.ai
    const conversation = extractZaiData($, url, richFormatting);

    // Add metadata and standardize
    conversation.id = uuidv4();
    conversation.sourceUrl = url;
    conversation.provider = 'zai';
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
    throw new Error(`Z.ai extraction failed: ${error.message}`);
  } finally {
    // Always clean up the temporary file
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath);
    }
  }
}

/**
 * Extract Z.ai conversation data with rich formatting support
 */
function extractZaiData($, url, richFormatting = true) {
  const title =
    $('title').text().replace(' | Z.ai Chat - Free AI powered by GLM-4.7 & GLM-4.6', '').trim() ||
    'Z.ai Conversation';

  const messages = [];
  let conversationCreatedAt = new Date().toISOString();

  // Z.ai often uses specific containers for the chat history
  // Iterate through potential message containers
  $('.user-message, .chat-user, .chat-assistant, .message, [class*="message-"]').each((i, el) => {
    const $el = $(el);
    const className = $el.attr('class') || '';

    let role = null;
    if (className.includes('user-message') || className.includes('chat-user')) {
      role = 'user';
    } else if (className.includes('chat-assistant') || className.includes('message')) {
      // Check if it's actually an assistant message
      if ($el.closest('.user-message').length > 0) {
        return;
      }
      role = 'assistant';
    }

    if (role) {
      // Get HTML for rich content, but text for metadata
      const rawText = $el.text().trim();
      if (!rawText || rawText.length < 2) {
        return;
      }

      // Extract timestamp if present
      let timestamp = null;
      const timestampMatch = rawText.match(/(\d{1,2}\/\d{1,2}\/\d{4} at \d{1,2}:\d{2} (AM|PM))/);
      if (timestampMatch) {
        timestamp = timestampMatch[0];
        if (messages.length === 0) {
          conversationCreatedAt = timestamp;
        }
      }

      // Extract rich content
      const content = richFormatting
        ? extractRichContent($el, $, richFormatting)
        : rawText
            .replace(timestamp || '', '')
            .replace(/^GLM-4\.[67]\s*/, '')
            .trim();

      // Avoid duplicates
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      if (messages.length > 0) {
        const lastContent =
          typeof messages[messages.length - 1].content === 'string'
            ? messages[messages.length - 1].content
            : JSON.stringify(messages[messages.length - 1].content);
        if (
          lastContent.includes(contentStr.substring(0, 50)) &&
          role === messages[messages.length - 1].role
        ) {
          return;
        }
      }

      messages.push({
        id: uuidv4(),
        role,
        content,
        timestamp: timestamp ? new Date(timestamp.replace(' at ', ' ')).toISOString() : null,
      });
    }
  });

  return {
    title,
    createdAt: conversationCreatedAt.includes(' at ')
      ? new Date(conversationCreatedAt.replace(' at ', ' ')).toISOString()
      : conversationCreatedAt,
    messages,
    metadata: {
      provider: 'zai',
      model: 'GLM-4.7',
    },
  };
}

/**
 * Extract rich content from an element
 */
function extractRichContent($el, $, richFormatting = true) {
  if (!richFormatting) {
    return $el.text().trim();
  }

  // Clone element to manipulate it
  const $clone = $el.clone();
  const contentBlocks = [];

  // 1. Identify Mermaid diagrams (often in pre or specifically classed divs)
  $clone.find('pre, code, div.mermaid, .mermaid').each((index, elem) => {
    const $elem = $(elem);
    const text = $elem.text().trim();
    if (
      text.match(
        /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|mindmap|timeline|zenuml)/i
      )
    ) {
      contentBlocks.push({
        type: 'mermaid',
        content: text,
      });
      $elem.remove();
    }
  });

  // 2. Identify code blocks
  $clone.find('pre, code').each((index, elem) => {
    const $elem = $(elem);
    const text = $elem.text().trim();
    if (text) {
      const className = $elem.attr('class') || '';
      const language = className.match(/language-(\w+)|lang-(\w+)/)?.[1] || 'text';
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
    if (src && !src.includes('logo.svg')) {
      contentBlocks.push({
        type: 'image',
        content: src,
        alt: $elem.attr('alt') || '',
      });
    }
    $elem.remove();
  });

  // 4. Handle remaining text (split by potential mermaid diagrams that are NOT in pre/code)
  let remainingText = $clone.text().trim();

  // Remove GLM header and timestamps from remaining text
  remainingText = remainingText
    .replace(/^GLM-4\.[67]\s*/, '')
    .replace(/\d{1,2}\/\d{1,2}\/\d{4} at \d{1,2}:\d{2} (AM|PM)/, '')
    .trim();

  // Final check for Mermaid diagrams in the text itself
  const mermaidRegex = /(graph\s+[LRTDBC]{2}[\s\S]*?(?=---|$|###|Goal:))/gi;
  let match;
  let lastIndex = 0;
  const newTextBlocks = [];

  while ((match = mermaidRegex.exec(remainingText)) !== null) {
    const textBefore = remainingText.substring(lastIndex, match.index).trim();
    if (textBefore) {
      newTextBlocks.push({ type: 'text', content: textBefore });
    }
    contentBlocks.push({ type: 'mermaid', content: match[0].trim() });
    lastIndex = match.index + match[0].length;
  }

  const finalRemainingText = remainingText.substring(lastIndex).trim();
  if (finalRemainingText) {
    newTextBlocks.push({ type: 'text', content: finalRemainingText });
  }

  // Combine new text blocks with existing blocks
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

export { extractZaiConversation };
