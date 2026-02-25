/**
 * Semantic Content Analyzer
 * 
 * Provides NLP processing, entity recognition, and semantic graph generation.
 * (Currently using heuristic-based NLP simulation for the 10x plan until ML models are loaded)
 */

import { logger } from '../lib/logger.js';

export class SemanticAnalyzer {
  constructor() {
    // In a full implementation, this would load spaCy, compromised, or a small ONNX model.
    this.isReady = true;
  }

  /**
   * Main entry point for semantic analysis
   */
  async analyze(content) {
    if (!content || typeof content !== 'string') return null;

    logger.debug('Running semantic analysis pipeline...');
    
    // 1. Basic text extraction/cleaning
    const cleanText = this.cleanContent(content);
    
    // 2. Entity Recognition (Mocked with Regex for now)
    const entities = this.extractEntities(cleanText);
    
    // 3. Topic Modeling / Keyword extraction
    const topics = this.extractTopics(cleanText);
    
    // 4. Sentiment Analysis
    const sentiment = this.analyzeSentiment(cleanText);

    return {
      entities,
      topics,
      sentiment,
      language: this.detectLanguage(cleanText),
      semanticHash: this.generateSemanticHash(topics, entities)
    };
  }

  cleanContent(content) {
    // Remove markdown
    return content
      .replace(/```[\s\S]*?```/g, '') // remove code blocks
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // links to text
      .replace(/[#*`_~>]/g, '') // formatting
      .trim();
  }

  extractEntities(text) {
    const entities = {
      technologies: [],
      people: [],
      organizations: []
    };

    // Very basic heuristics for demo
    const techWords = ['React', 'Node.js', 'Python', 'Docker', 'AWS', 'Prisma', 'PostgreSQL', 'AI', 'LLM', 'ChatGPT'];
    techWords.forEach(tech => {
      if (new RegExp(`\b${tech}\b`, 'i').test(text)) {
        entities.technologies.push(tech);
      }
    });

    return entities;
  }

  extractTopics(text) {
    // Extract capitalized words as potential topics (very naive)
    const words = text.split(/\s+/);
    const topics = new Set();
    
    words.forEach(w => {
      if (w.length > 4 && /^[A-Z][a-z]+$/.test(w)) {
        topics.add(w);
      }
    });

    return Array.from(topics).slice(0, 5);
  }

  analyzeSentiment(text) {
    const positiveWords = ['great', 'awesome', 'good', 'excellent', 'amazing', 'love', 'fix', 'success'];
    const negativeWords = ['bad', 'error', 'fail', 'bug', 'issue', 'wrong', 'crash', 'terrible'];
    
    let score = 0;
    const lowerText = text.toLowerCase();
    
    positiveWords.forEach(w => { if (lowerText.includes(w)) score++; });
    negativeWords.forEach(w => { if (lowerText.includes(w)) score--; });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  detectLanguage(text) {
    // Default to English for now
    return 'en';
  }

  generateSemanticHash(topics, entities) {
    // A simple hash representing the core semantic meaning
    const combined = [...topics, ...entities.technologies].sort().join(':').toLowerCase();
    return Buffer.from(combined).toString('base64').substring(0, 16);
  }
}

export const semanticAnalyzer = new SemanticAnalyzer();
