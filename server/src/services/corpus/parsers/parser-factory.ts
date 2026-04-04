/**
 * Parser Factory
 * 
 * Factory for selecting the appropriate document parser based on format.
 * 
 * @created March 27, 2026
 */

import { DocumentParser } from '../../../types/corpus';
import { MarkdownParser } from './markdown-parser';
import { HtmlParser } from './html-parser';
import { logger } from '../../../lib/logger';

/**
 * Get parser for specified format
 */
export function getParser(format: string): DocumentParser {
  const normalizedFormat = format.toLowerCase().trim();

  logger.debug({ format: normalizedFormat }, 'Getting parser for format');

  switch (normalizedFormat) {
    case 'markdown':
    case 'md':
    case 'mkd':
    case 'mdown':
      return new MarkdownParser();

    case 'html':
    case 'htm':
    case 'xhtml':
      return new HtmlParser();

    default:
      // Default to Markdown for unknown formats
      logger.warn({ format }, 'Unknown format, defaulting to Markdown parser');
      return new MarkdownParser();
  }
}

/**
 * Check if format is supported
 */
export function isFormatSupported(format: string): boolean {
  const supportedFormats = [
    'markdown', 'md', 'mkd', 'mdown',
    'html', 'htm', 'xhtml',
  ];

  return supportedFormats.includes(format.toLowerCase().trim());
}

/**
 * Get list of supported formats
 */
export function getSupportedFormats(): string[] {
  return [
    'markdown', 'md',
    'html', 'htm',
  ];
}
