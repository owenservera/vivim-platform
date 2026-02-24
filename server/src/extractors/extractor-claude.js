import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { captureWithPlaywright, cleanupPlaywrightFile } from '../capture-playwright.js';

/**
 * Extract conversation from Claude share URL
 * @param {string} url - The share URL to extract from
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} The extracted conversation object
 */
async function extractClaudeConversation(url, options = {}) {
  const { timeout = 60000, headless = true } = options;

  let tempFilePath = null;

  try {
    logger.info(`Starting Claude extraction for ${url}...`);

    // Capture the live page using Playwright
    // Claude share pages render conversation in a list
    tempFilePath = await captureWithPlaywright(url, 'claude', {
      timeout,
      headless,
      // Try to wait for message containers
      waitForSelector:
        '[data-testid="user-message"], .font-claude-response-body, .prose-claude, .standard-markdown',
      waitForTimeout: 5000,
      pageHandler: async (page, log) => {
        // Claude sometimes has a "I understand" button or cookie banner
        try {
          const bannerButtons = [
            'button:has-text("I understand")',
            'button:has-text("Accept")',
            'button:has-text("Agree")',
          ];

          for (const selector of bannerButtons) {
            const button = page.locator(selector).first();
            if (await button.isVisible({ timeout: 2000 })) {
              await button.click();
              log.info({ selector }, 'Dismissed Claude banner');
            }
          }
        } catch (err) {
          // Ignore banner errors
        }
      },
    });

    logger.info(`Reading captured Claude HTML from: ${tempFilePath}`);
    const html = await fs.readFile(tempFilePath, 'utf8');
    const $ = cheerio.load(html);

    // Extract conversation data
    const conversation = extractClaudeData($, url);

    if (conversation.messages.length === 0) {
      const debugPath = `debug-claude-${Date.now()}.html`;
      await fs.writeFile(debugPath, html);
      logger.warn(`No messages found for Claude. Saved HTML to ${debugPath} for inspection.`);
    }

    return conversation;
  } catch (error) {
    throw new Error(`Claude extraction failed: ${error.message}`);
  } finally {
    if (tempFilePath) {
      await cleanupPlaywrightFile(tempFilePath);
    }
  }
}

/**
 * Extract Claude conversation data
 */
function extractClaudeData($, url) {
  const title =
    $('title').text().replace(' - Claude', '').trim() ||
    $('h1').first().text().trim() ||
    'Claude Conversation';

  const messages = [];

  // Claude's share pages usually have a consistent structure:
  // User messages are in [data-testid="user-message"]
  // Assistant messages are in .prose-claude or .standard-markdown

  // We want to find each distinct message.
  // Often they are inside a container that represents a "turn"

  // Find all user messages
  const userMessages = $('[data-testid="user-message"]').toArray();
  // Find all assistant messages
  const assistantMessages = $('.prose-claude, .standard-markdown').toArray();

  // Filter assistant messages to remove nested ones (if any)
  const topAssistantMessages = assistantMessages.filter((el) => {
    return $(el).parents('.prose-claude, .standard-markdown').length === 0;
  });

  const allMessages = [...userMessages, ...topAssistantMessages];

  // Sort by position in DOM
  const indexedMessages = allMessages
    .map((el) => ({
      el,
      index: indexInDocument($, el),
    }))
    .sort((a, b) => a.index - b.index);

  indexedMessages.forEach((item, index) => {
    const $el = $(item.el);
    let role = 'assistant';
    let author = 'Claude';

    if (
      $el.attr('data-testid') === 'user-message' ||
      $el.find('[data-testid="user-message"]').length > 0
    ) {
      role = 'user';
      author = 'User';
    }

    const parts = extractContentParts($el, $);

    if (parts.length > 0) {
      messages.push({
        id: uuidv4(),
        role,
        author,
        messageIndex: index,
        parts,
        createdAt: new Date().toISOString(),
        status: 'completed',
        metadata: {},
      });
    }
  });

  // Calculate stats
  const stats = calculateStats(messages);

  return {
    id: uuidv4(),
    provider: 'claude',
    sourceUrl: url,
    title,
    model: 'claude',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    capturedAt: new Date().toISOString(),
    messages,
    metadata: {
      url,
    },
    ...stats,
  };
}

/**
 * Find index of element in document to maintain order
 */
function indexInDocument($, el) {
  return Array.from($('*')).indexOf(el);
}

/**
 * Extract structured content parts from a Claude message element
 */
function extractContentParts($el, $) {
  const parts = [];
  const $clone = $el.clone();

  // 1. Extract Code Blocks
  // Claude wraps code in a container with a language label
  // We target the container to get the language, but avoid matching the pre inside it twice.
  $clone.find('.bg-bg-000\\/50').each((_, elem) => {
    const $container = $(elem);
    const $pre = $container.find('pre');

    if ($pre.length > 0) {
      const $code = $pre.find('code');
      const language =
        $container.find('.text-text-500').first().text().trim() ||
        $code.attr('class')?.match(/language-(\w+)/)?.[1] ||
        'text';

      const codeContent = $code.text().trim() || $pre.text().trim();

      if (codeContent) {
        // Check for Mermaid
        const isMermaid =
          language.toLowerCase() === 'mermaid' ||
          codeContent.match(
            /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|quadrantChart|requirementDiagram|gitGraph|C4Context|mindmap|timeline|zenuml)/i
          );

        if (isMermaid) {
          parts.push({
            type: 'mermaid',
            content: codeContent,
            metadata: { diagramType: isMermaid[0]?.toLowerCase() || 'flowchart' },
          });
        } else {
          parts.push({
            type: 'code',
            content: codeContent,
            metadata: { language: language.toLowerCase() },
          });
        }
        $container.remove();
      }
    }
  });

  // Catch any remaining pre blocks that weren't in the standard container
  $clone.find('pre').each((_, elem) => {
    const $pre = $(elem);
    const $code = $pre.find('code');
    const language = $code.attr('class')?.match(/language-(\w+)/)?.[1] || 'text';
    const codeContent = $code.text().trim() || $pre.text().trim();

    if (codeContent) {
      parts.push({
        type: 'code',
        content: codeContent,
        metadata: { language: language.toLowerCase() },
      });
      $pre.remove();
    }
  });

  // 2. Extract Math (KaTeX)
  // Target the container to avoid double matching katex-mathml and katex-html
  $clone.find('.katex-display, .katex:not(.katex-display .katex)').each((_, elem) => {
    const $math = $(elem);
    let tex = $math.find('annotation[encoding="application/x-tex"]').first().text().trim();

    if (!tex) {
      tex = $math.text().trim();
    }

    if (tex) {
      parts.push({
        type: 'latex',
        content: tex,
        metadata: {
          display: $math.hasClass('katex-display') ? 'block' : 'inline',
        },
      });
      $math.remove();
    }
  });

  // 3. Extract Tables
  $clone.find('table').each((_, elem) => {
    const $table = $(elem);
    const headers = [];
    const rows = [];

    $table.find('th').each((_, th) => headers.push($(th).text().trim()));
    $table.find('tr').each((_, tr) => {
      const row = [];
      const $cells = $(tr).find('td');
      if ($cells.length > 0) {
        $cells.each((_, td) => row.push($(td).text().trim()));
        rows.push(row);
      }
    });

    if (rows.length > 0 || headers.length > 0) {
      parts.push({
        type: 'table',
        content: { headers, rows },
        metadata: { format: 'html' },
      });
      $table.remove();
    }
  });

  // 4. Extract Images
  $clone.find('img').each((_, elem) => {
    const $img = $(elem);
    const src = $img.attr('src');
    if (src && !src.includes('avatar') && !src.includes('icon')) {
      parts.push({
        type: 'image',
        content: src,
        metadata: { alt: $img.attr('alt') || 'Claude Image' },
      });
      $img.remove();
    }
  });

  // 5. Remaining Text
  const textContent = $clone
    .text()
    .trim()
    .replace(/\n\s+\n/g, '\n\n');
  if (textContent) {
    parts.push({
      type: 'text',
      content: textContent,
      metadata: { format: 'markdown' },
    });
  }

  return parts;
}

/**
 * Calculate statistics
 */
function calculateStats(messages) {
  let totalWords = 0;
  let totalCharacters = 0;
  let totalCodeBlocks = 0;
  let totalMermaidDiagrams = 0;
  let totalImages = 0;
  let totalTables = 0;
  let totalLatexBlocks = 0;
  let userMessageCount = 0;
  let aiMessageCount = 0;

  for (const message of messages) {
    if (message.role === 'user') {
      userMessageCount++;
    }
    if (message.role === 'assistant') {
      aiMessageCount++;
    }

    for (const part of message.parts) {
      if (part.type === 'text') {
        const text = part.content;
        totalWords += text.split(/\s+/).filter((w) => w).length;
        totalCharacters += text.length;
      } else if (part.type === 'code') {
        totalCodeBlocks++;
        totalCharacters += part.content.length;
      } else if (part.type === 'image') {
        totalImages++;
      } else if (part.type === 'table') {
        totalTables++;
      } else if (part.type === 'latex') {
        totalLatexBlocks++;
      } else if (part.type === 'mermaid') {
        totalMermaidDiagrams++;
      }
    }
  }

  return {
    messageCount: messages.length,
    userMessageCount,
    aiMessageCount,
    totalWords,
    totalCharacters,
    totalCodeBlocks,
    totalMermaidDiagrams,
    totalImages,
    totalTables,
    totalLatexBlocks,
    totalToolCalls: 0, // Claude doesn't usually show tool calls in share links
  };
}

export { extractClaudeConversation };
