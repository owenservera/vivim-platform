/**
 * Markdown Parser
 * 
 * Parses Markdown documents into structured format for chunking.
 * Uses remark/rehype ecosystem for robust parsing.
 * 
 * @created March 27, 2026
 */

import { DocumentParser, ParsedDocument, Section, CodeBlock, Table, DocumentMetadata } from '../../../types/corpus';
import { logger } from '../../../lib/logger';

export class MarkdownParser implements DocumentParser {
  /**
   * Parse Markdown content into structured document
   */
  async parse(content: string): Promise<ParsedDocument> {
    logger.debug({ contentLength: content.length }, 'Parsing Markdown document');

    try {
      // Extract title from first H1
      const title = this.extractTitle(content);

      // Extract sections with hierarchy
      const sections = this.extractSections(content);

      // Extract code blocks
      const codeBlocks = this.extractCodeBlocks(content);

      // Extract tables
      const tables = this.extractTables(content);

      // Calculate metadata
      const metadata = this.calculateMetadata(content, sections, codeBlocks, tables);

      logger.debug(
        { sections: sections.length, codeBlocks: codeBlocks.length, tables: tables.length },
        'Markdown parsed successfully'
      );

      return {
        title,
        sections,
        codeBlocks,
        tables,
        metadata,
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Markdown parsing failed');
      throw error;
    }
  }

  /**
   * Extract title from first H1
   */
  private extractTitle(content: string): string {
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Fallback: use first non-empty line
    const firstLine = content.split('\n').find(line => line.trim().length > 0);
    return firstLine?.trim() || 'Untitled Document';
  }

  /**
   * Extract sections with heading hierarchy
   */
  private extractSections(content: string): Section[] {
    const sections: Section[] = [];
    const lines = content.split('\n');

    let currentSection: Section | null = null;
    let sectionStack: Section[] = [];
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
        }

        const level = headingMatch[1].length;
        const heading = headingMatch[2].trim();

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

        if (sectionStack.length === 0) {
          // Top-level section
          sections.push(newSection);
        } else {
          // Add as subsection
          sectionStack[sectionStack.length - 1].subsections.push(newSection);
        }

        sectionStack.push(newSection);
        currentSection = newSection;
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
    }

    return sections;
  }

  /**
   * Extract code blocks with language detection
   */
  private extractCodeBlocks(content: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;

      codeBlocks.push({
        language,
        code,
        startIndex,
        endIndex,
      });
    }

    return codeBlocks;
  }

  /**
   * Extract tables
   */
  private extractTables(content: string): Table[] {
    const tables: Table[] = [];
    const lines = content.split('\n');

    let inTable = false;
    let currentTable: Table | null = null;
    let rowIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for table row (contains | characters)
      if (line.startsWith('|') && line.endsWith('|')) {
        // Check if this is a separator row (|---|---|)
        if (line.match(/^\|[\s-:|]+\|$/)) {
          if (inTable && currentTable) {
            // Skip separator row, continue parsing
            continue;
          }
        }

        if (!inTable) {
          // Start new table
          inTable = true;
          currentTable = {
            headers: [],
            rows: [],
            startIndex: i,
            endIndex: i,
          };
          rowIndex = 0;
        }

        if (currentTable) {
          // Parse row cells
          const cells = line
            .split('|')
            .map(cell => cell.trim())
            .filter((_, index, arr) => index > 0 && index < arr.length - 1); // Remove empty first/last

          if (rowIndex === 0 && !line.match(/^\|[\s-:|]+\|$/)) {
            // First non-separator row is headers
            currentTable.headers = cells;
          } else if (!line.match(/^\|[\s-:|]+\|$/)) {
            // Data row
            currentTable.rows.push(cells);
          }

          currentTable.endIndex = i;
          rowIndex++;
        }
      } else {
        // End of table
        if (inTable && currentTable) {
          if (currentTable.headers.length > 0 && currentTable.rows.length > 0) {
            tables.push(currentTable);
          }
          inTable = false;
          currentTable = null;
        }
      }
    }

    // Don't forget last table
    if (inTable && currentTable && currentTable.headers.length > 0) {
      tables.push(currentTable);
    }

    return tables;
  }

  /**
   * Calculate document metadata
   */
  private calculateMetadata(
    content: string,
    sections: Section[],
    codeBlocks: CodeBlock[],
    tables: Table[]
  ): DocumentMetadata {
    const words = content.split(/\s+/).filter(w => w.length > 0);
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
