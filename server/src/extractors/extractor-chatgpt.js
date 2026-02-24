import fs from 'fs/promises';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { captureWithPlaywright, cleanupPlaywrightFile } from '../capture-playwright.js';

/**
 * Extract conversation from ChatGPT share URL
 * @param {string} url - The share URL to extract from
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} The extracted conversation object
 */
async function extractChatgptConversation(url, options = {}) {
  const {
    timeout = 120000,
    richFormatting = true,
    metadataOnly = false,
    headless = true,
    waitForTimeout = 3000,
  } = options;

  let tempFilePath = null;

  try {
    logger.info(`Starting ChatGPT extraction for ${url} using Playwright...`);

    // Capture the live page using Playwright (with stealth mode)
    tempFilePath = await captureWithPlaywright(url, 'chatgpt', {
      timeout,
      headless,
      waitForSelector: 'h1, [data-message-author-role]',
      waitForTimeout: waitForTimeout,
    });

    logger.info(`Reading captured ChatGPT HTML from: ${tempFilePath}`);
    const html = await fs.readFile(tempFilePath, 'utf8');
    const $ = cheerio.load(html);

    // Extract conversation data for ChatGPT
    const conversation = extractChatgptData($, url, html, richFormatting);

    if (conversation.messages.length === 0) {
      const debugPath = `debug-chatgpt-${Date.now()}.html`;
      await fs.writeFile(debugPath, html);
      logger.warn(`No messages found for ChatGPT. Saved HTML to ${debugPath} for inspection.`);
    }

    // Add metadata and standardize
    conversation.id = uuidv4();
    conversation.sourceUrl = url;
    conversation.provider = 'chatgpt';
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
    throw new Error(`ChatGPT extraction failed: ${error.message}`);
  } finally {
    if (tempFilePath) {
      await cleanupPlaywrightFile(tempFilePath);
    }
  }
}

/**
 * Extract ChatGPT conversation data
 */
function extractChatgptData($, url, html, richFormatting = true) {
  const title = $('title').text().replace(' - ChatGPT', '').trim() || 'ChatGPT Conversation';
  const messages = [];

  // Method 1: Extraction from React Router stream (Newer ChatGPT layout)
  try {
    // 1. Robustly extract enqueue arguments (JSON strings)
    const chunks = [];
    const searchStr = 'streamController.enqueue("';
    let pos = 0;

    while (true) {
      pos = html.indexOf(searchStr, pos);
      if (pos === -1) {
        break;
      }

      pos += searchStr.length;
      const start = pos;
      let end = -1;
      let escape = false;

      // Find closing quote ignoring escaped quotes
      for (let i = start; i < html.length; i++) {
        const char = html[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (char === '\\') {
          escape = true;
          continue;
        }
        if (char === '"') {
          end = i;
          break;
        }
      }

      if (end !== -1) {
        chunks.push(html.substring(start, end));
        pos = end;
      } else {
        break;
      }
    }

    // 2. Concatenate and Parse
    let combinedJsonStr = '';
    chunks.forEach((jsonPart) => {
      try {
        // Unescape the string literal content
        const unescaped = JSON.parse(`"${jsonPart}"`);
        // Filter out React Flight data chunks
        if (!unescaped.trim().match(/^[A-Z0-9]+:\[/)) {
          combinedJsonStr += unescaped;
        }
      } catch (e) {
        // Ignore unescape errors
      }
    });

    let root = null;
    try {
      root = JSON.parse(combinedJsonStr);
    } catch (e) {
      // Tolerant parsing if possible
    }

    // 3. Resolve References and Extract Messages
    if (root && Array.isArray(root)) {
      const mappingIdx = root.indexOf('mapping');
      if (mappingIdx !== -1 && mappingIdx + 1 < root.length) {
        const mapping = root[mappingIdx + 1];

        Object.values(mapping).forEach((nodeOrRef) => {
          let node = nodeOrRef;
          // Reference resolution
          if (typeof nodeOrRef === 'number') {
            node = root[nodeOrRef];
          }

          if (node && node.message) {
            const msgData = node.message;
            const role = msgData.author?.role;

            if (role === 'user' || role === 'assistant' || role === 'system') {
              let parts = [];

              // Content parts resolution
              if (msgData.content && msgData.content.parts) {
                parts = msgData.content.parts.map((part) => {
                  if (typeof part === 'number') {
                    const resolved = root[part] || '';
                    return { type: 'text', content: String(resolved) };
                  }
                  return { type: 'text', content: String(part) };
                });
              }

              if (parts.length > 0) {
                messages.push({
                  id: msgData.id || uuidv4(),
                  role: role,
                  author: role === 'user' ? 'User' : 'ChatGPT',
                  parts: parts,
                  createdAt: msgData.create_time
                    ? new Date(msgData.create_time * 1000).toISOString()
                    : null,
                  status: 'completed',
                });
              }
            }
          }
        });
      }
    }
  } catch (e) {
    logger.error(`Error parsing ChatGPT stream: ${e.message}`);
  }

  // Method 2: Look for turns in older/standard layouts (article tags)
  if (messages.length === 0) {
    $('article').each((i, el) => {
      const $art = $(el);
      let role = null;
      if ($art.find('h5').text().toLowerCase().includes('you said')) {
        role = 'user';
      } else if ($art.find('h6').text().toLowerCase().includes('chatgpt said')) {
        role = 'assistant';
      }

      if (!role) {
        if ($art.find('.bg-user-pixel, .rounded-sm > svg').length > 0) {
          role = 'user';
        } else if ($art.find('.markdown, .prose').length > 0) {
          role = 'assistant';
        }
      }

      if (role) {
        const $content = $art.find('.whitespace-pre-wrap, .markdown, .prose').first();
        const $target = $content.length > 0 ? $content : $art;

        // Extract parts using rich content extractor
        const parts = extractChatgptRichContent($target, $, richFormatting);

        if (parts.length > 0) {
          messages.push({
            id: uuidv4(),
            role,
            author: role === 'user' ? 'User' : 'ChatGPT',
            parts,
            createdAt: null,
            status: 'completed',
          });
        }
      }
    });
  }

  // Method 3: Fallback to data attributes
  if (messages.length === 0) {
    $('[data-message-author-role]').each((i, el) => {
      const $el = $(el);
      const role = $el.attr('data-message-author-role');
      if (role === 'user' || role === 'assistant') {
        const parts = extractChatgptRichContent($el, $, richFormatting);
        if (parts.length > 0) {
          messages.push({
            id: uuidv4(),
            role,
            author: role === 'user' ? 'User' : 'ChatGPT',
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
    provider: 'chatgpt',
    sourceUrl: url,
    title,
    model: 'ChatGPT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    capturedAt: new Date().toISOString(),
    messages,
    metadata: {
      provider: 'chatgpt',
      model: 'ChatGPT',
    },
    ...stats,
  };
}

/**
 * Extract rich content from ChatGPT message element
 */
function extractChatgptRichContent($el, $, richFormatting = true) {
  if (!richFormatting) {
    return [{ type: 'text', content: $el.text().trim() }];
  }

  const $clone = $el.clone();
  $clone.find('h5, h6').remove(); // Remove headers like "You said"

  const contentBlocks = [];

  // 1. Identify Mermaid diagrams in code blocks
  $clone.find('pre, code').each((index, elem) => {
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
        metadata: { diagramType: text.split('\n')[0].trim() },
      });
      $elem.remove();
    }
  });

  // 2. Identify code blocks
  $clone.find('pre').each((index, elem) => {
    const $pre = $(elem);
    const $code = $pre.find('code');
    const text = $code.text().trim();
    if (text) {
      const language = $code.attr('class')?.match(/language-(\w+)/)?.[1] || 'text';
      contentBlocks.push({
        type: 'code',
        content: text,
        metadata: { language },
      });
      $pre.remove();
    }
  });

  // 3. Identify images
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

  // 4. Identify LaTeX
  $clone.find('.katex-block, .katex-display').each((_, elem) => {
    const $elem = $(elem);
    const tex = $elem.find('annotation[encoding="application/x-tex"]').text() || $elem.text();
    contentBlocks.push({
      type: 'latex',
      content: tex,
      metadata: { display: 'block' },
    });
    $elem.remove();
  });

  $clone.find('.katex').each((_, elem) => {
    const $elem = $(elem);
    const tex = $elem.find('annotation[encoding="application/x-tex"]').text() || $elem.text();
    contentBlocks.push({
      type: 'latex',
      content: tex,
      metadata: { display: 'inline' },
    });
    $elem.remove();
  });

  // 5. Identify Tables
  $clone.find('table').each((index, elem) => {
    const $table = $(elem);
    const headers = [];
    $table.find('thead th').each((_, th) => headers.push($(th).text().trim()));

    const rows = [];
    $table.find('tbody tr').each((_, tr) => {
      const row = [];
      $(tr)
        .find('td')
        .each((_, td) => row.push($(td).text().trim()));
      rows.push(row);
    });

    if (rows.length > 0) {
      contentBlocks.push({
        type: 'table',
        content: { headers, rows },
        metadata: { format: 'html' },
      });
      $table.remove();
    }
  });

  // 6. Handle remaining text and potential hidden diagrams
  const remainingText = $clone.text().trim();

  const mermaidRegex = /(?:^|\n)\s*(graph\s+[LRTDBC]{2}[\s\S]*?(?=--|\n|###|Goal:|1\s+|2\s+))/gi;
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

  const finalBlocks = [...newTextBlocks, ...contentBlocks];

  return finalBlocks;
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

    if (message.parts) {
      message.parts.forEach((part) => {
        if (part.type === 'text') {
          totalWords += part.content.split(/\s+/).filter((w) => w).length;
          totalCharacters += part.content.length;
        } else if (part.type === 'code') {
          totalCodeBlocks++;
          totalCharacters += part.content.length;
        } else if (part.type === 'mermaid') {
          totalMermaidDiagrams++;
          totalCharacters += part.content.length;
        } else if (part.type === 'image') {
          totalImages++;
        } else if (part.type === 'table') {
          totalTables++;
        } else if (part.type === 'latex') {
          totalLatexBlocks++;
        } else if (part.type === 'tool_call') {
          totalToolCalls++;
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
    totalMermaidDiagrams,
    totalImages,
    totalTables,
    totalLatexBlocks,
    totalToolCalls,
    firstMessageAt: messages[0]?.createdAt || new Date().toISOString(),
    lastMessageAt: messages[messages.length - 1]?.createdAt || new Date().toISOString(),
  };
}

export { extractChatgptConversation, extractChatgptData };
