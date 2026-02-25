/**
 * Content Validation Pipeline
 * 
 * Validates extracted content for structural and semantic integrity.
 */

import { logger } from '../lib/logger.js';

export class ContentValidator {
  
  /**
   * Run the full validation pipeline on an extracted conversation
   */
  validate(conversation) {
    if (!conversation) {
      throw new Error('Content validation failed: Result is null');
    }

    this.validateStructure(conversation);
    this.validateContent(conversation);
    const score = this.calculateQualityScore(conversation);
    
    // Auto-enhance if needed
    if (score < 50) {
       this.enhanceContent(conversation);
    }
    
    conversation.qualityScore = this.calculateQualityScore(conversation); // Recalculate after enhancement
    
    if (conversation.qualityScore < 30) {
        logger.warn(`Conversation ${conversation.id} has low quality score: ${conversation.qualityScore}`);
    }

    return conversation;
  }

  validateStructure(conversation) {
    if (!conversation.messages || !Array.isArray(conversation.messages)) {
      throw new Error('Content validation failed: Missing or invalid messages array');
    }
    
    if (conversation.messages.length === 0) {
      throw new Error('Content validation failed: No messages extracted');
    }

    // Repair structure
    conversation.messages.forEach((msg, idx) => {
      if (!msg.id) msg.id = `repaired-msg-${idx}`;
      if (!msg.role) msg.role = idx % 2 === 0 ? 'user' : 'assistant';
      if (!msg.parts || !Array.isArray(msg.parts)) {
        msg.parts = [{ type: 'text', content: String(msg.content || '') }];
      }
    });
  }

  validateContent(conversation) {
    let emptyMessages = 0;
    
    conversation.messages.forEach(msg => {
      const textParts = msg.parts.filter(p => p.type === 'text');
      const hasContent = textParts.some(p => p.content && p.content.trim().length > 0) || 
                         msg.parts.some(p => p.type !== 'text'); // e.g. images
                         
      if (!hasContent) emptyMessages++;
    });

    if (emptyMessages > conversation.messages.length / 2) {
      throw new Error('Content validation failed: Over 50% of messages are empty');
    }
  }

  enhanceContent(conversation) {
    logger.debug('Attempting content enhancement to improve quality...');
    // Basic enhancement: remove excessive whitespace, standardize roles
    conversation.messages.forEach(msg => {
      msg.parts.forEach(part => {
        if (part.type === 'text') {
           part.content = part.content.replace(/
{3,}/g, '

').trim();
        }
      });
    });
  }

  calculateQualityScore(conversation) {
    let score = 100;
    
    if (conversation.messages.length < 2) score -= 40;
    
    const totalWords = conversation.messages.reduce((acc, msg) => {
      return acc + msg.parts.reduce((pAcc, p) => pAcc + (p.type === 'text' ? p.content.split(' ').length : 0), 0);
    }, 0);

    if (totalWords < 20) score -= 30;
    
    return Math.max(0, score);
  }
}

export const contentValidator = new ContentValidator();
