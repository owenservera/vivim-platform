import type { Conversation } from '../../extractors/types.js';

export interface ExtractionContext {
  url: string;
  provider: string;
  html: string;
  attempt: number;
  previousErrors: Error[];
  options: {
    richFormatting: boolean;
    metadataOnly: boolean;
  };
}

export interface ExtractionResult {
  success: boolean;
  conversation?: Conversation;
  error?: Error;
  confidence: number;
  strategyUsed: string;
  extractionTime: number;
}

export interface ExtractionStrategy {
  name: string;
  priority: number;
  canHandle(context: ExtractionContext): Promise<boolean>;
  extract(context: ExtractionContext): Promise<ExtractionResult>;
}

export abstract class BaseExtractionStrategy implements ExtractionStrategy {
  abstract name: string;
  abstract priority: number;
  
  abstract canHandle(context: ExtractionContext): Promise<boolean>;
  abstract extract(context: ExtractionContext): Promise<ExtractionResult>;
  
  protected createError(message: string, cause?: Error): Error {
    const error = new Error(message);
    if (cause) {
      (error as any).cause = cause;
    }
    return error;
  }
  
  protected calculateConfidence(messages: any[]): number {
    if (!messages || messages.length === 0) return 0;
    
    let score = 0;
    const maxScore = 100;
    
    // Has messages
    score += Math.min(messages.length * 5, 30);
    
    // Messages have content
    const hasContent = messages.every(m => {
      if (typeof m.content === 'string') return m.content.length > 0;
      if (Array.isArray(m.content)) return m.content.length > 0;
      if (Array.isArray(m.parts)) return m.parts.length > 0;
      return false;
    });
    if (hasContent) score += 30;
    
    // Messages have roles
    const hasRoles = messages.every(m => 
      m.role === 'user' || m.role === 'assistant' || m.role === 'system'
    );
    if (hasRoles) score += 20;
    
    // Proper alternation (user/assistant pattern)
    const roles = messages.map(m => m.role);
    let alternationScore = 0;
    for (let i = 1; i < roles.length; i++) {
      if (roles[i] !== roles[i-1]) alternationScore++;
    }
    score += Math.min(alternationScore * 5, 20);
    
    return Math.min(score, maxScore);
  }
}
