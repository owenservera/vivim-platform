import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { captureWithPlaywright, cleanupPlaywrightFile } from '../capture-playwright.js';

/**
 * Extract conversation from Gemini share URL
 * @param {string} url - The share URL to extract from
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} The extracted conversation object
 */
async function extractGeminiConversation(url, options = {}) {
  const {
    timeout = 60000, // Increased timeout for dynamic loading
    headless = true,
  } = options;

  let tempFilePath = null;

  try {
    logger.info(`Starting Gemini extraction for ${url}...`);

    // Capture the live page using Playwright
    // Use the robust selectors found in analysis
    tempFilePath = await captureWithPlaywright(url, 'gemini', {
      timeout,
      headless,
      waitForSelector: '[data-test-id*="message"], [class*="message"], article, [role="article"]',
      waitForTimeout: 5000,
      pageHandler: async (page, log) => {
        // Check if we're on a consent page
        const currentUrl = page.url();
        if (currentUrl.includes('consent.google.com')) {
          log.info('Consent page detected, attempting to accept');

          try {
            // Try multiple possible accept button selectors
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
                  log.info({ selector }, 'Clicked accept button');
                  accepted = true;
                  break;
                }
              } catch {
                // Try next selector
              }
            }

            if (accepted) {
              // Wait for navigation to actual content
              log.info('Waiting for redirect to content');
              await page.waitForURL((url) => !url.includes('consent.google.com'), {
                timeout: 10000,
              });
              log.info('Redirected to content page');
            } else {
              log.warn('Could not find accept button, continuing anyway');
            }
          } catch (error) {
            log.warn({ error: error.message }, 'Failed to handle consent page');
          }
        }
      },
    });

    logger.info(`Reading captured Gemini HTML from: ${tempFilePath}`);
    const html = await fs.readFile(tempFilePath, 'utf8');
    const $ = cheerio.load(html);

    // Extract conversation data
    const conversation = extractGeminiData($, url);

    if (conversation.messages.length === 0) {
      const debugPath = `debug-gemini-${Date.now()}.html`;
      await fs.writeFile(debugPath, html);
      logger.warn(`No messages found for Gemini. Saved HTML to ${debugPath} for inspection.`);
    }

    return conversation;
  } catch (error) {
    throw new Error(`Gemini extraction failed: ${error.message}`);
  } finally {
    if (tempFilePath) {
      await cleanupPlaywrightFile(tempFilePath);
    }
  }
}

/**
 * Extract Gemini conversation data
 */
function extractGeminiData($, url) {
  const title =
    $('title').text().replace('‎Gemini - direct access to Google AI', '').trim() ||
    $('h1').first().text().trim() ||
    'Gemini Conversation';

  const messages = [];

  // Selectors found in analysis: [data-test-id], [class*="message"], [class*="turn"]
  // Priority: data-test-id (most stable), then class-based
  let messageElements = $('[data-test-id*="message"], [data-test-id*="turn"]').toArray();

  if (messageElements.length === 0) {
    messageElements = $('[class*="message-content"], [class*="conversation-turn"]').toArray();
  }

  // Fallback to article
  if (messageElements.length === 0) {
    messageElements = $('article, [role="article"]').toArray();
  }

  logger.info(`Found ${messageElements.length} message elements`);

  messageElements.forEach((el, index) => {
    const $el = $(el);

    // Determine role
    let role = 'user'; // Default
    const attrRole = $el.attr('data-role');
    const classList = $el.attr('class') || '';
    const text = $el.text();

    if (
      attrRole === 'model' ||
      classList.includes('model') ||
      classList.includes('bot') ||
      classList.includes('assistant')
    ) {
      role = 'assistant';
    } else if (attrRole === 'user' || classList.includes('user')) {
      role = 'user';
    } else {
      // Heuristic: User messages are often headings or short text in specific containers
      // Assistant messages are usually complex with markdown
      if ($el.find('.code-block, table, .math').length > 0) {
        role = 'assistant';
      }
    }

    // Extract content parts
    const parts = extractContentParts($el, $);

    if (parts.length > 0) {
      messages.push({
        id: uuidv4(),
        role,
        author: role === 'user' ? 'User' : 'Gemini',
        messageIndex: index,
        parts,
        createdAt: new Date().toISOString(), // Gemini doesn't always show timestamps
        status: 'completed',
        metadata: {},
      });
    }
  });

  // Calculate stats
  const stats = calculateStats(messages);

  return {
    id: uuidv4(),
    provider: 'gemini',
    sourceUrl: url,
    title,
    model: 'gemini',
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
 * Extract structured content parts from a message element
 */
function extractContentParts($el, $) {
  const parts = [];
  const $clone = $el.clone();

  // 1. Extract Code Blocks
  // Div.code-block usually contains the code
  $clone.find('.code-block').each((_, elem) => {
    const $block = $(elem);
    const $code = $block.find('code');
    const header = $block.find('.code-block-decoration').text().trim(); // e.g. "Python"
    const codeContent = $code.text();

    if (codeContent) {
      // Check if it's a mermaid diagram
      // Mermaid diagrams in Gemini often have "Code snippet" header or explicit mermaid syntax
      const isMermaid = codeContent
        .trim()
        .match(
          /^(graph|sequenceDiagram|gantt|classDiagram|stateDiagram|pie|flowchart|erDiagram|journey|gitGraph|mindmap|timeline)/i
        );

      if (isMermaid) {
        parts.push({
          type: 'mermaid',
          content: codeContent,
          metadata: {
            diagramType: isMermaid[0].toLowerCase(),
          },
        });
      } else {
        parts.push({
          type: 'code',
          content: codeContent,
          metadata: {
            language: header.toLowerCase() || 'text',
            originalLanguage: header,
          },
        });
      }
      // Replace with placeholder to maintain order if needed, or remove
      // For now, we'll remove to separate content types
      $block.remove();
    }
  });

  // 2. Extract Tables
  $clone.find('table').each((_, elem) => {
    const $table = $(elem);
    const headers = [];
    const rows = [];

    // Get headers
    $table.find('th').each((_, th) => {
      headers.push($(th).text().trim());
    });

    // Get rows
    $table.find('tr').each((_, tr) => {
      const row = [];
      const $cells = $(tr).find('td');
      if ($cells.length > 0) {
        $cells.each((_, td) => {
          row.push($(td).text().trim());
        });
        rows.push(row);
      }
    });

    if (rows.length > 0) {
      parts.push({
        type: 'table',
        content: { headers, rows },
        metadata: { format: 'html' },
      });
      $table.remove();
    }
  });

  // 3. Extract Math/LaTeX
  // Selectors from analysis: span.math-inline, span.katex, span.katex-html
  $clone.find('.math-inline, .katex, .katex-block, [data-math]').each((_, elem) => {
    const $math = $(elem);
    // Prefer data-math attribute if available, otherwise text
    let mathContent = $math.attr('data-math');

    // If no data-math, try to find the semantic TeX annotation usually hidden in KaTeX
    if (!mathContent) {
      mathContent = $math.find('annotation[encoding="application/x-tex"]').text();
    }

    // Fallback to text content but it might be messy
    if (!mathContent) {
      mathContent = $math.text();
    }

    if (mathContent) {
      parts.push({
        type: 'latex',
        content: mathContent,
        metadata: {
          display: $math.hasClass('katex-block') ? 'block' : 'inline',
        },
      });
      $math.remove();
    }
  });

  // 4. Extract Images
  // Check for normal images and generated images
  $clone.find('img').each((_, elem) => {
    const $img = $(elem);
    const src = $img.attr('src');
    const alt = $img.attr('alt');

    const widthAttr = $img.attr('width');
    // Filter out UI icons (usually small SVGs or tiny PNGs)
    // Gemini user images or generated images are usually substantial
    if (
      src &&
      !src.includes('icon') &&
      !src.includes('avatar') &&
      (!widthAttr || parseInt(widthAttr) > 50)
    ) {
      parts.push({
        type: 'image',
        content: src,
        metadata: {
          alt: alt || 'Generated Image',
        },
      });
      $img.remove();
    }
  });

  // 5. Extract Tool Calls (Citations)
  // Gemini citations often appear as links or specific citation blocks
  $clone.find('[data-test-id*="citation"], .citation').each((_, elem) => {
    const $cit = $(elem);
    const text = $cit.text();
    parts.push({
      type: 'tool_call',
      content: {
        id: uuidv4(), // Generate ID as it's often not in DOM
        name: 'citation',
        arguments: { text },
      },
      metadata: { type: 'citation' },
    });
    $cit.remove();
  });

  // 6. Remaining Text
  // Clean up whitespace and get remaining text
  const textContent = $clone
    .text()
    .trim()
    .replace(/\n\s+\n/g, '\n\n'); // Normalize paragraphs

  if (textContent) {
    // If text is mixed with other parts, we might want to split it logic
    // For now, simpler approach: text part is added last if distinct blocks weren't cleanly removed
    // Better strategy: iterate over child nodes to preserve order.
    // BUT for now, pushing remaining text as one block is a safe MVP.
    parts.push({
      type: 'text',
      content: textContent,
      metadata: { format: 'markdown' },
    });
  }

  // Optimize: Join adjacent text parts if needed, but for now distinct parts is fine.

  return parts;
}

/**
 * Calculate statistics for the conversation
 */
function calculateStats(messages) {
  let totalWords = 0;
  let totalCharacters = 0;
  let totalCodeBlocks = 0;
  let totalMermaidDiagrams = 0;
  let totalImages = 0;
  let totalTables = 0;
  let totalLatexBlocks = 0;
  let totalToolCalls = 0;
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
      } else if (part.type === 'tool_call') {
        totalToolCalls++;
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
    totalToolCalls,
  };
}

export { extractGeminiConversation };
