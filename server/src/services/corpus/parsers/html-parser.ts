/**
 * HTML Parser
 * 
 * Parses HTML documents into structured format for chunking.
 * Uses cheerio for robust HTML parsing and sanitization.
 * 
 * @created March 27, 2026
 */

import * as cheerio from 'cheerio';
import { DocumentParser, ParsedDocument, Section, CodeBlock, Table, DocumentMetadata } from '../../../types/corpus';
import { logger } from '../../../lib/logger';

export class HtmlParser implements DocumentParser {
  /**
   * Parse HTML content into structured document
   */
  async parse(content: string): Promise<ParsedDocument> {
    logger.debug({ contentLength: content.length }, 'Parsing HTML document');

    try {
      // Load HTML into cheerio
      const $ = cheerio.load(content, {
        decodeEntities: true,
        xmlMode: false,
      });

      // Sanitize: remove scripts, styles, and other non-content elements
      this.sanitize($);

      // Extract title
      const title = this.extractTitle($);

      // Extract sections with hierarchy
      const sections = this.extractSections($);

      // Extract code blocks
      const codeBlocks = this.extractCodeBlocks($);

      // Extract tables
      const tables = this.extractTables($);

      // Calculate metadata
      const metadata = this.calculateMetadata($, sections, codeBlocks, tables);

      logger.debug(
        { sections: sections.length, codeBlocks: codeBlocks.length, tables: tables.length },
        'HTML parsed successfully'
      );

      return {
        title,
        sections,
        codeBlocks,
        tables,
        metadata,
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'HTML parsing failed');
      throw error;
    }
  }

  /**
   * Sanitize HTML by removing unwanted elements
   */
  private sanitize($: cheerio.CheerioAPI): void {
    // Remove scripts, styles, and other non-content elements
    $('script, style, noscript, iframe, svg, canvas, nav, footer, header').remove();

    // Remove empty elements (except certain ones)
    $('*').each((_, el) => {
      const $el = $(el);
      const tagName = el.tagName.toLowerCase();
      
      // Keep structural elements even if empty
      if (['div', 'section', 'article', 'p', 'li', 'td', 'th'].includes(tagName)) {
        if ($el.text().trim().length === 0 && $el.children().length === 0) {
          $el.remove();
        }
      }
    });
  }

  /**
   * Extract title from HTML
   */
  private extractTitle($: cheerio.CheerioAPI): string {
    // Try <title> tag first
    const titleTag = $('title').text().trim();
    if (titleTag) {
      return titleTag;
    }

    // Try <h1> tag
    const h1 = $('h1').first().text().trim();
    if (h1) {
      return h1;
    }

    // Try meta og:title
    const ogTitle = $('meta[property="og:title"]').attr('content');
    if (ogTitle) {
      return ogTitle;
    }

    return 'Untitled Document';
  }

  /**
   * Extract sections from HTML heading hierarchy
   */
  private extractSections($: cheerio.CheerioAPI): Section[] {
    const sections: Section[] = [];
    const sectionStack: Section[] = [];

    // Find all headings
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const $el = $(el);
      const level = parseInt(el.tagName.charAt(1), 10);
      const heading = $el.text().trim();
      const tagName = el.tagName;

      const newSection: Section = {
        heading,
        level,
        content: '',
        subsections: [],
      };

      // Find correct parent level
      while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
        sectionStack.pop();
      }

      // Get content between this heading and next
      const content = this.extractSectionContent($el, $);
      newSection.content = content;

      if (sectionStack.length === 0) {
        sections.push(newSection);
      } else {
        sectionStack[sectionStack.length - 1].subsections.push(newSection);
      }

      sectionStack.push(newSection);
    });

    // If no headings found, treat entire body as one section
    if (sections.length === 0) {
      const bodyContent = $('body').length > 0 ? $('body').text() : $.text();
      sections.push({
        heading: 'Content',
        level: 1,
        content: bodyContent.trim(),
        subsections: [],
      });
    }

    return sections;
  }

  /**
   * Extract content between headings
   */
  private extractSectionContent($heading: cheerio.Cheerio, $: cheerio.CheerioAPI): string {
    const contentParts: string[] = [];
    let $current = $heading.next();

    // Collect content until next heading of same or higher level
    while ($current.length > 0) {
      const tagName = $current.prop('tagName')?.toLowerCase() || '';
      
      // Stop at next heading of same or higher level
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        const currentLevel = parseInt($heading.prop('tagName').charAt(1), 10);
        const nextLevel = parseInt(tagName.charAt(1), 10);
        if (nextLevel <= currentLevel) {
          break;
        }
      }

      // Add text content
      const text = $current.text().trim();
      if (text) {
        contentParts.push(text);
      }

      $current = $current.next();
    }

    return contentParts.join('\n\n');
  }

  /**
   * Extract code blocks from HTML
   */
  private extractCodeBlocks($: cheerio.CheerioAPI): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];

    $('pre, code').each((_, el) => {
      const $el = $(el);
      let code = $el.text().trim();
      
      if (!code) return;

      // Try to detect language from class
      const className = $el.attr('class') || '';
      const langMatch = className.match(/language-(\w+)/);
      const language = langMatch ? langMatch[1] : 'text';

      // Find position in original content (approximate)
      const htmlContent = $.html();
      const startIndex = htmlContent.indexOf(code);
      const endIndex = startIndex + code.length;

      codeBlocks.push({
        language,
        code,
        startIndex: startIndex >= 0 ? startIndex : 0,
        endIndex: endIndex >= 0 ? endIndex : code.length,
      });
    });

    return codeBlocks;
  }

  /**
   * Extract tables from HTML
   */
  private extractTables($: cheerio.CheerioAPI): Table[] {
    const tables: Table[] = [];

    $('table').each((_, el) => {
      const $table = $(el);
      const table: Table = {
        headers: [],
        rows: [],
        startIndex: 0,
        endIndex: 0,
      };

      // Extract headers from <thead> or first row
      $table.find('thead tr').each((_, tr) => {
        $(tr).find('th').each((_, th) => {
          table.headers.push($(th).text().trim());
        });
      });

      // If no thead, try first row
      if (table.headers.length === 0) {
        $table.find('tr').first().find('th').each((_, th) => {
          table.headers.push($(th).text().trim());
        });
      }

      // Extract data rows
      $table.find('tbody tr, tr').each((_, tr) => {
        const $tr = $(tr);
        
        // Skip if this is a header row
        if ($tr.find('th').length > 0 && table.headers.length === 0) {
          return;
        }

        const row: string[] = [];
        $tr.find('td, th').each((_, td) => {
          row.push($(td).text().trim());
        });

        if (row.length > 0) {
          table.rows.push(row);
        }
      });

      // Only add if table has content
      if (table.headers.length > 0 && table.rows.length > 0) {
        tables.push(table);
      }
    });

    return tables;
  }

  /**
   * Calculate document metadata
   */
  private calculateMetadata(
    $: cheerio.CheerioAPI,
    sections: Section[],
    codeBlocks: CodeBlock[],
    tables: Table[]
  ): DocumentMetadata {
    const text = $.text();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Estimate reading time (average 200 words per minute)
    const estimatedReadingTime = Math.ceil(wordCount / 200);

    return {
      wordCount,
      estimatedReadingTime,
      hasCodeBlocks: codeBlocks.length > 0,
      hasTables: tables.length > 0,
      sectionCount: sections.length,
    };
  }
}
