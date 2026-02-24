/**
 * Extraction Result Validator and Normalizer
 * Ensures all extractors return consistent, valid data
 */

import { logger } from '../lib/logger.js';

/**
 * Validates and normalizes extracted conversation data
 */
export class ExtractionValidator {
  /**
   * Validate extraction result
   * Returns { valid: true } or { valid: false, errors: [...] }
   */
  static validate(conversation, provider) {
    const errors = [];
    const warnings = [];

    // Required fields check
    if (!conversation) {
      return { valid: false, errors: ['Conversation is null/undefined'] };
    }

    if (!conversation.messages) {
      errors.push('Missing messages array');
    } else if (!Array.isArray(conversation.messages)) {
      errors.push('Messages is not an array');
    } else {
      // Validate each message
      conversation.messages.forEach((msg, idx) => {
        if (!msg.role) {
          errors.push(`Message ${idx}: Missing role`);
        } else if (!['user', 'assistant', 'system', 'tool'].includes(msg.role)) {
          warnings.push(`Message ${idx}: Unusual role "${msg.role}"`);
        }

        // Check for content or parts
        const hasContent = msg.content !== undefined && msg.content !== null;
        const hasParts = Array.isArray(msg.parts) && msg.parts.length > 0;

        if (!hasContent && !hasParts) {
          errors.push(`Message ${idx}: No content or parts`);
        }
      });
    }

    // Warning for empty extraction
    if (conversation.messages?.length === 0) {
      errors.push('Zero messages extracted - likely extraction failure');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      messageCount: conversation.messages?.length || 0,
    };
  }

  /**
   * Normalize conversation to standard format
   * Converts various extractor outputs to consistent schema
   */
  static normalize(conversation, provider) {
    if (!conversation) {
      return null;
    }

    const normalized = {
      id: conversation.id || this.generateId(),
      provider: conversation.provider || provider,
      sourceUrl: conversation.sourceUrl || '',
      title: conversation.title || `${provider} Conversation`,
      model: conversation.model || provider,
      createdAt: this.normalizeTimestamp(conversation.createdAt),
      updatedAt:
        this.normalizeTimestamp(conversation.updatedAt) ||
        this.normalizeTimestamp(conversation.createdAt),
      capturedAt: this.normalizeTimestamp(conversation.capturedAt) || new Date().toISOString(),
      exportedAt: new Date().toISOString(),
      messages: [],
      metadata: {
        ...conversation.metadata,
        provider,
        normalized: true,
        originalFormat: this.detectOriginalFormat(conversation),
      },
    };

    // Normalize messages
    if (Array.isArray(conversation.messages)) {
      normalized.messages = conversation.messages.map((msg, idx) =>
        this.normalizeMessage(msg, idx)
      );
    }

    // Calculate stats
    normalized.stats = this.calculateStats(normalized.messages);

    return normalized;
  }

  /**
   * Normalize a single message
   */
  static normalizeMessage(msg, index) {
    const normalized = {
      id: msg.id || this.generateId(),
      role: msg.role || 'assistant',
      author: msg.author || (msg.role === 'user' ? 'User' : 'Assistant'),
      messageIndex: index,
      createdAt: this.normalizeTimestamp(msg.createdAt || msg.timestamp),
      status: msg.status || 'completed',
      metadata: msg.metadata || {},
    };

    // Normalize content to parts array
    if (Array.isArray(msg.parts) && msg.parts.length > 0) {
      // Already in parts format
      normalized.parts = msg.parts.map((p) => this.normalizePart(p));
    } else if (Array.isArray(msg.content)) {
      // Content is array - convert to parts
      normalized.parts = msg.content.map((c) => this.normalizePart(c));
    } else if (typeof msg.content === 'string') {
      // Content is string - wrap in text part
      normalized.parts = [
        {
          type: 'text',
          content: msg.content,
        },
      ];
    } else {
      // Unknown format - empty parts
      normalized.parts = [];
    }

    // Backwards compatibility: also set content field
    normalized.content = normalized.parts;

    return normalized;
  }

  /**
   * Normalize a content part
   */
  static normalizePart(part) {
    if (typeof part === 'string') {
      return { type: 'text', content: part };
    }

    if (!part || typeof part !== 'object') {
      return { type: 'text', content: String(part) };
    }

    // Ensure required fields
    return {
      type: part.type || 'text',
      content: part.content !== undefined ? part.content : '',
      metadata: part.metadata || {},
      // Backwards compat for legacy fields
      language: part.language,
      alt: part.alt,
    };
  }

  /**
   * Detect original format for debugging
   */
  static detectOriginalFormat(conv) {
    if (!conv.messages || conv.messages.length === 0) {
      return 'empty';
    }

    const firstMsg = conv.messages[0];
    if (firstMsg.parts) {
      return 'parts-array';
    }
    if (Array.isArray(firstMsg.content)) {
      return 'content-array';
    }
    if (typeof firstMsg.content === 'string') {
      return 'content-string';
    }
    return 'unknown';
  }

  /**
   * Normalize timestamp to ISO string
   */
  static normalizeTimestamp(ts) {
    if (!ts) {
      return null;
    }

    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch {
      return null;
    }
  }

  /**
   * Calculate conversation statistics
   */
  static calculateStats(messages) {
    let totalWords = 0;
    let totalCharacters = 0;
    let userMessageCount = 0;
    let aiMessageCount = 0;
    let totalCodeBlocks = 0;
    let totalImages = 0;
    let totalTables = 0;
    let totalMermaidDiagrams = 0;
    let totalLatexBlocks = 0;

    for (const msg of messages) {
      if (msg.role === 'user') {
        userMessageCount++;
      }
      if (msg.role === 'assistant') {
        aiMessageCount++;
      }

      // Count from parts
      if (Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          if (part.type === 'text' && typeof part.content === 'string') {
            totalWords += part.content.split(/\s+/).filter((w) => w).length;
            totalCharacters += part.content.length;
          } else if (part.type === 'code') {
            totalCodeBlocks++;
            if (typeof part.content === 'string') {
              totalCharacters += part.content.length;
            }
          } else if (part.type === 'image') {
            totalImages++;
          } else if (part.type === 'table') {
            totalTables++;
          } else if (part.type === 'mermaid') {
            totalMermaidDiagrams++;
          } else if (part.type === 'latex') {
            totalLatexBlocks++;
          }
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
      totalImages,
      totalTables,
      totalMermaidDiagrams,
      totalLatexBlocks,
      firstMessageAt: messages[0]?.createdAt || new Date().toISOString(),
      lastMessageAt: messages[messages.length - 1]?.createdAt || new Date().toISOString(),
    };
  }

  /**
   * Generate unique ID
   */
  static generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ExtractionValidator;
