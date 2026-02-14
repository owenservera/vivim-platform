/**
 * Global Content Rendering Toolkit - Content Parser
 * Parse raw content into structured content blocks
 */

import type {
  ContentBlock,
  ContentCollection,
  ContentType,
  ContentParseResult,
} from '../ContentRenderer.types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique ID for content blocks
 */
export function generateContentId(prefix: string = 'block'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if content is a string
 */
export function isStringContent(content: any): content is string {
  return typeof content === 'string';
}

/**
 * Check if content is an array
 */
export function isArrayContent(content: any): content is ContentBlock[] {
  return Array.isArray(content);
}

/**
 * Check if content is an object (but not array)
 */
export function isObjectContent(content: any): content is Record<string, any> {
  return typeof content === 'object' && content !== null && !Array.isArray(content);
}

// ============================================================================
// CONTENT DETECTION
// ============================================================================

/**
 * Detect content type from raw content
 */
export function detectContentType(content: any): ContentType {
  // String content
  if (isStringContent(content)) {
    return detectStringContentType(content);
  }

  // Array content
  if (isArrayContent(content)) {
    return 'text'; // Default for arrays
  }

  // Object content
  if (isObjectContent(content)) {
    return detectObjectContentType(content);
  }

  return 'text'; // Default fallback
}

/**
 * Detect content type from string
 */
function detectStringContentType(content: string): ContentType {
  const trimmed = content.trim();

  // Check for code blocks
  if (trimmed.startsWith('```')) {
    return 'code';
  }

  // Check for LaTeX
  if (trimmed.startsWith('$') && trimmed.endsWith('$') ||
      trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) {
    return 'latex';
  }

  // Check for Mermaid
  if (trimmed.startsWith('```mermaid') || trimmed.startsWith('graph ') ||
      trimmed.startsWith('sequenceDiagram ') || trimmed.startsWith('gantt ')) {
    return 'mermaid';
  }

  // Check for URLs
  if (isValidUrl(trimmed)) {
    return detectUrlContentType(trimmed);
  }

  // Check for HTML
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return 'html';
  }

  // Check for blockquotes
  if (trimmed.startsWith('>')) {
    return 'quote';
  }

  // Check for dividers
  if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
    return 'divider';
  }

  return 'text'; // Default
}

/**
 * Detect content type from URL
 */
function detectUrlContentType(url: string): ContentType {
  const lowerUrl = url.toLowerCase();

  // YouTube
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }

  // Twitter/X
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return 'twitter';
  }

  // Vimeo
  if (lowerUrl.includes('vimeo.com')) {
    return 'vimeo';
  }

  // CodePen
  if (lowerUrl.includes('codepen.io')) {
    return 'codepen';
  }

  // Image extensions
  if (/\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(lowerUrl)) {
    return 'image';
  }

  // Video extensions
  if (/\.(mp4|webm|ogg|mov|avi|mkv|flv)(\?.*)?$/i.test(lowerUrl)) {
    return 'video';
  }

  // Audio extensions
  if (/\.(mp3|wav|ogg|flac|aac|m4a)(\?.*)?$/i.test(lowerUrl)) {
    return 'audio';
  }

  // PDF
  if (/\.pdf(\?.*)?$/i.test(lowerUrl)) {
    return 'pdf';
  }

  // Documents
  if (/\.(doc|docx|odt|rtf)(\?.*)?$/i.test(lowerUrl)) {
    return 'doc';
  }

  // Spreadsheets
  if (/\.(xls|xlsx|ods|csv)(\?.*)?$/i.test(lowerUrl)) {
    return 'spreadsheet';
  }

  return 'link'; // Default for URLs
}

/**
 * Detect content type from object
 */
function detectObjectContentType(content: Record<string, any>): ContentType {
  const { type, tool, tool_call, tool_result, acu_type, acuType } = content;

  // Explicit type
  if (type) {
    return type as ContentType;
  }

  // Tool call
  if (tool || tool_call) {
    return 'tool_call';
  }

  // Tool result
  if (tool_result) {
    return 'tool_result';
  }

  // ACU type
  if (acu_type || acuType) {
    const acuTypeValue = (acu_type || acuType) as string;
    return `acu_${acuTypeValue}` as ContentType;
  }

  // Check for structured data
  if (content.headers && content.rows) {
    return 'table';
  }

  if (content.events) {
    return 'timeline';
  }

  if (content.options) {
    return 'poll';
  }

  if (content.questions) {
    return 'quiz';
  }

  if (content.fields) {
    return 'form';
  }

  if (content.items && content.tabs) {
    return 'tabs';
  }

  if (content.items && content.accordion) {
    return 'accordion';
  }

  if (content.diagram) {
    return 'mermaid';
  }

  if (content.formula) {
    return 'latex';
  }

  if (content.chart) {
    return 'chart';
  }

  if (content.src && (content.mimetype || content.filename)) {
    return 'file';
  }

  return 'text'; // Default fallback
}

/**
 * Validate URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// CONTENT PARSING
// ============================================================================

/**
 * Parse raw content into content blocks
 */
export function parseContent(
  content: string | ContentBlock | ContentBlock[] | ContentCollection
): ContentParseResult {
  const blocks: ContentBlock[] = [];
  const errors: Error[] = [];

  try {
    // Handle string content
    if (isStringContent(content)) {
      const parsedBlocks = parseStringContent(content as string);
      blocks.push(...parsedBlocks);
    }
    // Handle single content block
    else if (isObjectContent(content) && !isArrayContent(content)) {
      const block = parseObjectContent(content as Record<string, any>);
      if (block) {
        blocks.push(block);
      }
    }
    // Handle array of content blocks
    else if (isArrayContent(content)) {
      const parsedBlocks = (content as ContentBlock[]).map(block => {
        if (block.type) {
          return block;
        }
        return parseObjectContent(block);
      }).filter(Boolean) as ContentBlock[];
      blocks.push(...parsedBlocks);
    }
    // Handle content collection
    else if (isObjectContent(content) && (content as ContentCollection).blocks) {
      const collection = content as ContentCollection;
      const parsedBlocks = collection.blocks.map(block => {
        if (block.type) {
          return block;
        }
        return parseObjectContent(block);
      }).filter(Boolean) as ContentBlock[];
      blocks.push(...parsedBlocks);
    }
  } catch (error) {
    errors.push(error as Error);
  }

  return { blocks, errors };
}

/**
 * Parse string content into blocks
 */
function parseStringContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = content.split('\n');
  let currentBlock: Partial<ContentBlock> | null = null;
  let codeBlock: { language: string; content: string[] } | null = null;
  let mermaidBlock: { content: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Code block start
    if (trimmed.startsWith('```')) {
      if (currentBlock) {
        blocks.push(finishBlock(currentBlock));
        currentBlock = null;
      }

      const match = trimmed.match(/^```(\w+)?/);
      codeBlock = {
        language: match?.[1] || 'text',
        content: [],
      };
      continue;
    }

    // Code block content
    if (codeBlock) {
      if (trimmed === '```') {
        blocks.push({
          id: generateContentId('code'),
          type: 'code',
          content: codeBlock.content.join('\n'),
          language: codeBlock.language,
        });
        codeBlock = null;
        continue;
      }
      codeBlock.content.push(line);
      continue;
    }

    // Mermaid block
    if (trimmed.startsWith('```mermaid')) {
      if (currentBlock) {
        blocks.push(finishBlock(currentBlock));
        currentBlock = null;
      }
      mermaidBlock = { content: [] };
      continue;
    }

    if (mermaidBlock) {
      if (trimmed === '```') {
        blocks.push({
          id: generateContentId('mermaid'),
          type: 'mermaid',
          content: mermaidBlock.content.join('\n'),
        });
        mermaidBlock = null;
        continue;
      }
      mermaidBlock.content.push(line);
      continue;
    }

    // Divider
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      if (currentBlock) {
        blocks.push(finishBlock(currentBlock));
        currentBlock = null;
      }
      blocks.push({
        id: generateContentId('divider'),
        type: 'divider',
        content: '',
      });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      if (currentBlock) {
        blocks.push(finishBlock(currentBlock));
        currentBlock = null;
      }
      currentBlock = {
        id: generateContentId('quote'),
        type: 'quote',
        content: trimmed.substring(1).trim(),
      };
      continue;
    }

    // Empty line - finish current block
    if (trimmed === '') {
      if (currentBlock) {
        blocks.push(finishBlock(currentBlock));
        currentBlock = null;
      }
      continue;
    }

    // Regular text
    if (currentBlock && currentBlock.type === 'text') {
      currentBlock.content += '\n' + line;
    } else {
      if (currentBlock) {
        blocks.push(finishBlock(currentBlock));
      }
      currentBlock = {
        id: generateContentId('text'),
        type: 'text',
        content: line,
      };
    }
  }

  // Finish last block
  if (currentBlock) {
    blocks.push(finishBlock(currentBlock));
  }

  return blocks;
}

/**
 * Parse object content into content block
 */
function parseObjectContent(content: Record<string, any>): ContentBlock | null {
  const type = detectContentType(content);

  return {
    id: content.id || generateContentId(type),
    type,
    content: content.content || content,
    metadata: content.metadata,
    ...content,
  };
}

/**
 * Finish a content block
 */
function finishBlock(block: Partial<ContentBlock>): ContentBlock {
  return {
    id: block.id || generateContentId(),
    type: block.type || 'text',
    content: block.content || '',
    ...block,
  };
}

// ============================================================================
// CONTENT NORMALIZATION
// ============================================================================

/**
 * Normalize content blocks to ensure consistent structure
 */
export function normalizeContentBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.map((block, index) => ({
    ...block,
    id: block.id || generateContentId(),
    index,
  }));
}

/**
 * Filter out empty or invalid content blocks
 */
export function filterValidBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.filter(block => {
    if (!block) return false;

    // Check content
    if (isStringContent(block.content)) {
      return block.content.trim().length > 0;
    }

    if (Array.isArray(block.content)) {
      return block.content.length > 0;
    }

    if (isObjectContent(block.content)) {
      return Object.keys(block.content).length > 0;
    }

    return true;
  });
}

/**
 * Merge adjacent text blocks
 */
export function mergeTextBlocks(blocks: ContentBlock[]): ContentBlock[] {
  const merged: ContentBlock[] = [];
  let currentTextBlock: ContentBlock | null = null;

  for (const block of blocks) {
    if (block.type === 'text') {
      if (currentTextBlock) {
        // Merge with current text block
        currentTextBlock.content = `${currentTextBlock.content}\n\n${block.content}`;
      } else {
        currentTextBlock = { ...block };
      }
    } else {
      // Push current text block if exists
      if (currentTextBlock) {
        merged.push(currentTextBlock);
        currentTextBlock = null;
      }
      // Push non-text block
      merged.push(block);
    }
  }

  // Push last text block if exists
  if (currentTextBlock) {
    merged.push(currentTextBlock);
  }

  return merged;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  generateContentId,
  isStringContent,
  isArrayContent,
  isObjectContent,
  detectContentType,
  parseContent,
  normalizeContentBlocks,
  filterValidBlocks,
  mergeTextBlocks,
};
