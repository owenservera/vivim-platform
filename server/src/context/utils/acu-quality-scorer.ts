import { ITokenEstimator } from '../types';
import { TiktokenEstimator } from './token-estimator';
import { logger } from '../../lib/logger.js';

export interface QualityScore {
  overall: number;
  richness: number;
  integrity: number;
  uniqueness: number;
}

/**
 * SOTA ACU Quality Scorer
 * 
 * Implements multi-factor quality scoring for Atomic Chat Units.
 * Factors:
 * 1. Richness: Information density based on token count and entropy.
 * 2. Integrity: Structural completeness, grammar/code syntax heuristic.
 * 3. Uniqueness: (Placeholder) Similarity to existing knowledge.
 */
export class ACUQualityScorer {
  private tokenEstimator: ITokenEstimator;

  constructor(tokenEstimator?: ITokenEstimator) {
    this.tokenEstimator = tokenEstimator || new TiktokenEstimator();
  }

  /**
   * Calculate quality score for a given ACU content
   */
  async calculateScore(content: string, type: string): Promise<QualityScore> {
    const richness = this.calculateRichness(content);
    const integrity = this.calculateIntegrity(content, type);
    
    // Uniqueness currently requires DB lookup, so we provide a baseline
    // and let the pipeline update it if needed.
    const uniqueness = 0.5; 

    // Weighted overall score
    // 40% Richness, 40% Integrity, 20% Uniqueness
    const overall = (richness * 0.4) + (integrity * 0.4) + (uniqueness * 0.2);

    return {
      overall: parseFloat(overall.toFixed(2)),
      richness: parseFloat(richness.toFixed(2)),
      integrity: parseFloat(integrity.toFixed(2)),
      uniqueness: parseFloat(uniqueness.toFixed(2)),
    };
  }

  /**
   * Calculate information richness (0-1)
   */
  private calculateRichness(content: string): number {
    const tokens = this.tokenEstimator.estimateTokens(content);
    
    // Base score on token count (optimal ACU length is 50-200 tokens)
    let score = 0;
    if (tokens < 10) score = 0.2;
    else if (tokens < 30) score = 0.5;
    else if (tokens < 150) score = 0.9;
    else if (tokens < 300) score = 1.0;
    else score = 0.7; // Too long might be less "atomic"

    // Entropy heuristic: diversity of characters
    const uniqueChars = new Set(content.split('')).size;
    const entropyFactor = Math.min(1.0, uniqueChars / 50);
    
    return score * (0.8 + 0.2 * entropyFactor);
  }

  /**
   * Calculate structural integrity (0-1)
   */
  private calculateIntegrity(content: string, type: string): number {
    let score = 0.7; // Baseline

    // Check for balanced brackets (code/formulas)
    const brackets = { '(': ')', '[': ']', '{': '}' };
    const stack: string[] = [];
    for (const char of content) {
      if (char in brackets) stack.push(char);
      else if (Object.values(brackets).includes(char)) {
        const last = stack.pop();
        if (!last || brackets[last as keyof typeof brackets] !== char) {
          score -= 0.1; // Unbalanced
          break;
        }
      }
    }

    // Type-specific checks
    if (type === 'code_snippet') {
      if (content.includes('```')) score += 0.1;
      if (/(function|class|def|const|let|var)\b/.test(content)) score += 0.1;
    } else if (type === 'question') {
      if (content.includes('?')) score += 0.1;
      if (content.length > 20) score += 0.1;
    } else if (type === 'statement' || type === 'note') {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length >= 1) score += 0.1;
      if (sentences.length >= 3) score += 0.1;
    }

    // Penalize markers of low quality
    if (content.includes('[truncated]') || content.includes('...')) score -= 0.2;
    if (content.length < 5) score = 0.1;

    return Math.max(0, Math.min(1.0, score));
  }
}
