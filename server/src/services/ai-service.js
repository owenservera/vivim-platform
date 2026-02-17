/**
 * AI Intelligence Service
 * 
 * Handles high-level cognitive tasks:
 * 1. Generating Embeddings (Vectors)
 * 2. Summarizing Conversations (Consolidation)
 * 3. Extracting Structured Memories (ACUs)
 * 
 * Integrated with Circuit Breakers for reliability.
 */

import OpenAI from 'openai';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';
import { circuitBreakerService } from './circuit-breaker.js';
import { serverErrorReporter } from '../utils/server-error-reporting.js';

class AIService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async init() {
    if (!config.openaiApiKey) {
      logger.warn('OpenAI API Key not configured. AI features disabled.');
      return;
    }
    
    try {
      this.client = new OpenAI({ apiKey: config.openaiApiKey });
      this.isConnected = true;
      logger.info('AI Intelligence Service initialized');
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to init OpenAI client');
      serverErrorReporter.reportServerError('OpenAI Init Failed', error, {}, 'high');
    }
  }

  /**
   * Generate vector embeddings for text
   * Uses OpenAI's text-embedding-3-small (1536 dim)
   * 
   * @param {string | string[]} input Text or array of texts
   * @returns {Promise<number[][]>} Array of vectors
   */
  async generateEmbeddings(input) {
    if (!this.isConnected) return [];

    // Wrap in Circuit Breaker
    return circuitBreakerService.execute('openai-embeddings', async () => {
      try {
        const response = await this.client.embeddings.create({
          model: 'text-embedding-3-small',
          input: Array.isArray(input) ? input : [input],
          encoding_format: 'float'
        });
        
        return response.data.map(item => item.embedding);
      } catch (error) {
        logger.error({ error: error.message }, 'Embedding generation failed');
        throw error; // Re-throw for circuit breaker logic
      }
    });
  }

  /**
   * Summarize a conversation into a coherent memory
   * 
   * @param {object} conversation Full conversation object
   * @returns {Promise<string>} Summary text
   */
  async summarizeConversation(conversation) {
    if (!this.isConnected) return 'AI Service unavailable';

    const transcript = conversation.messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')
      .slice(0, 10000); // Token limit safeguard

    return circuitBreakerService.execute('openai-summarization', async () => {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Summarize the following conversation into a concise episodic memory. Focus on key decisions, facts, and user intent.' },
          { role: 'user', content: transcript }
        ],
        temperature: 0.3
      });

      return response.choices[0].message.content;
    });
  }
}

export const aiService = new AIService();

// Initialize asynchronously
aiService.init().catch(err => logger.error('AI Service Init Error', err));
