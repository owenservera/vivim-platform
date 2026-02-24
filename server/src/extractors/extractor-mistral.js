import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { captureWithPlaywright, cleanupPlaywrightFile } from '../capture-playwright.js';

/**
 * Extract conversation from Mistral AI share URL
 * @param {string} url - The share URL to extract from
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} The extracted conversation object
 */
async function extractMistralConversation(url, options = {}) {
  const {
    timeout = 120000,
    richFormatting = true,
    metadataOnly = false,
    headless = true,
    waitForTimeout = 3000,
  } = options;

  let tempFilePath = null;

  try {
    logger.info(`Starting Mistral extraction for ${url} using Playwright...`);

    // Capture the live page using Playwright (with stealth mode)
    tempFilePath = await captureWithPlaywright(url, 'mistral', {
      timeout,
      headless,
      waitForSelector: '[data-testid="conversation"], .chat-container, .conversation-item',
      waitForTimeout: waitForTimeout,
    });

    logger.info(`Reading captured Mistral HTML from: ${tempFilePath}`);
    const html = await fs.readFile(tempFilePath, 'utf8');
    const $ = cheerio.load(html);

    // Extract conversation data for Mistral
    const conversation = extractMistralData($, url, html, richFormatting);

    if (conversation.messages.length === 0) {
      const debugPath = `debug-mistral-${Date.now()}.html`;
      await fs.writeFile(debugPath, html);
      logger.warn(`No messages found for Mistral. Saved HTML to ${debugPath} for inspection.`);
    }

    // Add metadata and standardize
    conversation.id = uuidv4();
    conversation.sourceUrl = url;
    conversation.provider = 'mistral';
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
    conversation.stats = calculateStats(conversation.messages);

    return conversation;
  } catch (error) {
    throw new Error(`Mistral extraction failed: ${error.message}`);
  } finally {
    if (tempFilePath) {
      await cleanupPlaywrightFile(tempFilePath);
    }
  }
}

/**
 * Extract Mistral conversation data
 */
function extractMistralData($, url, html, richFormatting = true) {
  const title =
    $('title')
      .text()
      .replace(/[-–]Mistral$/i, '')
      .replace(/[-–]Chat$/i, '')
      .trim() || 'Mistral Conversation';
  const messages = [];

  // Method 1: Look for message containers with data attributes
  try {
    $('[data-testid="conversation-message"], [data-message-id], .message-container').each(
      (i, el) => {
        const $el = $(el);

        // Determine role based on class, data attribute, or icon
        let role = null;
        let author = 'Mistral';

        if ($el.find('[data-testid="user-message"], .user-message, .user-content').length > 0) {
          role = 'user';
          author = 'User';
        } else if (
          $el.find('[data-testid="assistant-message"], .assistant-message, .ai-content').length > 0
        ) {
          role = 'assistant';
          author = 'Mistral';
        }

        // Fallback: check for user avatar or assistant icon
        if (!role) {
          if ($el.find('.user-avatar, [data-testid="user-avatar"]').length > 0) {
            role = 'user';
            author = 'User';
          } else if (
            $el.find('.assistant-avatar, [data-testid="assistant-avatar"], .mistral-avatar')
              .length > 0
          ) {
            role = 'assistant';
            author = 'Mistral';
          }
        }

        if (role) {
          const $content = $el
            .find('.message-content, .text-content, [data-testid="message-content"]')
            .first();
          const $target = $content.length > 0 ? $content : $el;

          // Extract parts using rich content extractor
          const parts = extractMistralRichContent($target, $, richFormatting);

          if (parts.length > 0) {
            messages.push({
              id: $el.attr('data-message-id') || uuidv4(),
              role,
              author,
              parts,
              createdAt: null,
              status: 'completed',
            });
          }
        }
      }
    );
  } catch (e) {
    logger.error(`Error parsing Mistral messages: ${e.message}`);
  }

  // Method 2: Look for conversation turns in standard layout
  if (messages.length === 0) {
    $('section, article, div').each((i, el) => {
      const $el = $(el);

      // Skip if too small or no meaningful content
      if ($el.text().trim().length < 20) {
        return;
      }

      // Look for user/assistant indicators
      const text = $el.text().toLowerCase();
      let role = null;
      let author = 'Mistral';

      // Check for "You" indicator in user messages
      if (text.includes('you') && !text.includes('mistral')) {
        role = 'user';
        author = 'User';
      } else if (
        text.includes('mistral') ||
        $el.find('.mistral-logo, .assistant-icon').length > 0
      ) {
        role = 'assistant';
        author = 'Mistral';
      }

      if (role) {
        const $content = $el.find('p, .content, .text').first();
        const $target = $content.length > 0 ? $content : $el;

        const parts = extractMistralRichContent($target, $, richFormatting);

        if (
          parts.length > 0 &&
          !messages.some((m) => m.role === role && m.parts[0]?.content === parts[0]?.content)
        ) {
          messages.push({
            id: uuidv4(),
            role,
            author,
            parts,
            createdAt: null,
            status: 'completed',
          });
        }
      }
    });
  }

  // Method 3: Fallback - extract from markdown-rendered content
  if (messages.length === 0) {
    $('.markdown, .prose, [class*="markdown"]').each((i, el) => {
      const $el = $(el);

      // Determine if this is a user or assistant message
      let role = null;
      let author = 'Mistral';

      // Look for parent container that indicates role
      const $parent = $el
        .parents('[class*="user"], [class*="assistant"], [class*="human"], [class*="ai"]')
        .first();

      if ($parent.length > 0) {
        const parentClass = $parent.attr('class').toLowerCase();
        if (parentClass.includes('user') || parentClass.includes('human')) {
          role = 'user';
          author = 'User';
        } else if (
          parentClass.includes('assistant') ||
          parentClass.includes('ai') ||
          parentClass.includes('mistral')
        ) {
          role = 'assistant';
          author = 'Mistral';
        }
      }

      if (!role) {
        // Check position - first message is usually user
        if (i === 0) {
          role = 'user';
          author = 'User';
        } else {
          role = 'assistant';
          author = 'Mistral';
        }
      }

      if (role) {
        const parts = extractMistralRichContent($el, $, richFormatting);

        if (parts.length > 0) {
          messages.push({
            id: uuidv4(),
            role,
            author,
            parts,
            createdAt: null,
            status: 'completed',
          });
        }
      }
    });
  }

  // Calculate statistics
  const stats = calculateStats(messages);

  return {
    id: uuidv4(),
    provider: 'mistral',
    sourceUrl: url,
    title,
    model: 'Mistral AI',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    capturedAt: new Date().toISOString(),
    messages,
    metadata: {
      provider: 'mistral',
      model: 'Mistral AI',
    },
    ...stats,
  };
}

/**
 * Extract rich content from Mistral message element
 */
function extractMistralRichContent($el, $, richFormatting = true) {
  if (!richFormatting) {
    return [{ type: 'text', content: $el.text().trim() }];
  }

  const $clone = $el.clone();

  const contentBlocks = [];

  // 1. Identify code blocks
  $clone.find('pre, code').each((index, elem) => {
    const $pre = $(elem);
    const $code = $pre.find('code');
    const text = $code.length > 0 ? $code.text().trim() : $pre.text().trim();

    if (text) {
      const language =
        $code.attr('class')?.match(/language-(\w+)/)?.[1] ||
        $code.attr('class')?.match(/lang-(\w+)/)?.[1] ||
        'text';
      contentBlocks.push({
        type: 'code',
        content: text,
        metadata: { language },
      });
      $pre.remove();
    }
  });

  // 2. Identify images
  $clone.find('img').each((index, elem) => {
    const $elem = $(elem);
    const src = $elem.attr('src');
    if (
      src &&
      !src.includes('profile') &&
      !src.includes('avatar') &&
      !src.includes('data:image/svg')
    ) {
      contentBlocks.push({
        type: 'image',
        content: src,
        metadata: { alt: $elem.attr('alt') || '' },
      });
    }
    $elem.remove();
  });

  // 3. Identify lists
  $clone.find('ul, ol').each((index, elem) => {
    const $list = $(elem);
    const items = [];
    $list.find('li').each((_, li) => {
      items.push($(li).text().trim());
    });

    if (items.length > 0) {
      contentBlocks.push({
        type: 'list',
        content: {
          items,
          ordered: $list.is('ol'),
        },
        metadata: {},
      });
      $list.remove();
    }
  });

  // 4. Identify headings
  $clone.find('h1, h2, h3, h4, h5, h6').each((index, elem) => {
    const $heading = $(elem);
    const level = parseInt(elem.tagName[1], 10);
    const text = $heading.text().trim();

    if (text) {
      contentBlocks.push({
        type: 'heading',
        content: text,
        metadata: { level },
      });
      $heading.remove();
    }
  });

  // 5. Identify blockquotes
  $clone.find('blockquote').each((index, elem) => {
    const $blockquote = $(elem);
    const text = $blockquote.text().trim();

    if (text) {
      contentBlocks.push({
        type: 'quote',
        content: text,
        metadata: {},
      });
      $blockquote.remove();
    }
  });

  // 6. Handle remaining text
  const remainingText = $clone.text().trim();

  if (remainingText) {
    // Split by double newlines to preserve paragraphs
    const paragraphs = remainingText.split(/\n\n+/);
    paragraphs.forEach((para) => {
      const trimmed = para.trim();
      if (trimmed) {
        contentBlocks.push({ type: 'text', content: trimmed });
      }
    });
  }

  return contentBlocks;
}

/**
 * Calculate statistics
 */
function calculateStats(messages) {
  let totalWords = 0;
  let totalCharacters = 0;
  let totalCodeBlocks = 0;
  let totalImages = 0;
  let totalLists = 0;
  let totalHeadings = 0;
  let totalQuotes = 0;
  let userMessageCount = 0;
  let aiMessageCount = 0;

  for (const message of messages) {
    if (message.role === 'user') {
      userMessageCount++;
    }
    if (message.role === 'assistant') {
      aiMessageCount++;
    }

    if (message.parts) {
      message.parts.forEach((part) => {
        if (part.type === 'text') {
          totalWords += part.content.split(/\s+/).filter((w) => w).length;
          totalCharacters += part.content.length;
        } else if (part.type === 'code') {
          totalCodeBlocks++;
          totalCharacters += part.content.length;
        } else if (part.type === 'image') {
          totalImages++;
        } else if (part.type === 'list') {
          totalLists++;
        } else if (part.type === 'heading') {
          totalHeadings++;
        } else if (part.type === 'quote') {
          totalQuotes++;
        }
      });
    }
  }

  return {
    messageCount: messages.length,
    userMessageCount,
    aiMessageCount,
    totalWords,
    totalCharacters,
    totalCodeBlocks,
    totalImages,
    totalLists,
    totalHeadings,
    totalQuotes,
    firstMessageAt: messages[0]?.createdAt || new Date().toISOString(),
    lastMessageAt: messages[messages.length - 1]?.createdAt || new Date().toISOString(),
  };
}

export { extractMistralConversation, extractMistralData };
