/**
 * Dual Intent Classifier
 * 
 * Classifies user query intent to determine corpus vs user context weighting.
 * Uses two-stage approach: fast rule-based classification with LLM fallback.
 * 
 * @created March 27, 2026
 */

import {
  ClassificationParams,
  ClassificationResult,
  UserAvatar,
  OrchestrationIntent,
} from '../../types/corpus';
import { logger } from '../../../lib/logger';

interface LLMService {
  chat: (params: { model: string; messages: any[] }) => Promise<{ content: string }>;
}

export class DualIntentClassifier {
  private llmService?: LLMService;

  constructor(llmService?: LLMService) {
    this.llmService = llmService;
  }

  /**
   * Classify intent using two-stage approach
   */
  async classify(params: ClassificationParams): Promise<ClassificationResult> {
    const startTime = Date.now();

    try {
      // Stage 1: Fast rule-based classification
      const rulesResult = this.ruleBasedClassify(params);

      // If high confidence from rules, skip LLM
      if (rulesResult.confidence >= 0.85) {
        return this.applyAvatarModifier(rulesResult, params.userAvatar);
      }

      // Stage 2: LLM-based classification for ambiguous cases
      if (this.llmService) {
        const llmResult = await this.llmClassify(params);
        const result = this.mergeClassifications(rulesResult, llmResult, params.userAvatar);
        logger.debug({ stage: 'llm', duration: Date.now() - startTime }, 'Intent classified');
        return result;
      }

      logger.debug({ stage: 'rules', duration: Date.now() - startTime }, 'Intent classified');
      return this.applyAvatarModifier(rulesResult, params.userAvatar);
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Intent classification failed');
      // Return default classification
      return {
        primaryIntent: 'CORPUS_QUERY',
        confidence: 0.5,
        corpusWeight: 0.7,
        userWeight: 0.3,
        signals: {
          queryTermsInCorpus: 0,
          queryTermsInMemory: 0,
          recallIndicators: [],
          corpusIndicators: [],
          explicitSignals: [],
          conversationArc: 'new',
        },
      };
    }
  }

  /**
   * Rule-based classification (fast path)
   */
  private ruleBasedClassify(params: ClassificationParams): ClassificationResult {
    const message = params.message.toLowerCase();
    let corpusWeight = 0.5;
    let intent: OrchestrationIntent = 'CORPUS_QUERY';
    let confidence = 0.5;

    // --- RECALL INDICATORS (shift toward user) ---
    const recallPatterns = [
      /\b(remember|recall|last time|we (discussed|talked|chatted)|previously|before|earlier)\b/i,
      /\b(you (said|mentioned|told|suggested)|did (i|we)|what was)\b/i,
      /\b(my (account|plan|setup|config|history|issue|problem|ticket))\b/i,
      /\b(update on|status of|follow up|any news)\b/i,
    ];

    const recallHits = recallPatterns.filter(p => p.test(message));
    if (recallHits.length > 0) {
      corpusWeight -= 0.25 * recallHits.length;
      intent = recallHits.length >= 2 ? 'USER_RECALL' : 'STATUS_CHECK';
      confidence = 0.7 + (recallHits.length * 0.05);
    }

    // --- CORPUS INDICATORS (shift toward corpus) ---
    const corpusPatterns = [
      /\b(how (does|do|to|can)|what (is|are|does)|explain|describe|documentation)\b/i,
      /\b(api|endpoint|sdk|library|function|method|parameter|config)\b/i,
      /\b(pricing|plans|features|integration|authentication)\b/i,
      /\b(error|code|example|syntax|setup|install|deploy)\b/i,
    ];

    const corpusHits = corpusPatterns.filter(p => p.test(message));
    if (corpusHits.length > 0) {
      corpusWeight += 0.15 * corpusHits.length;
      if (corpusHits.length >= 2) {
        intent = message.includes('how') ? 'HOW_TO' : 'CORPUS_QUERY';
        confidence = 0.7 + (corpusHits.length * 0.05);
      }
    }

    // --- SUPPORT INDICATORS (balanced) ---
    const supportPatterns = [
      /\b(error|bug|broken|not working|issue|problem|help|stuck)\b/i,
      /\b(429|500|401|403|timeout|crash|fail)\b/i,
    ];

    const supportHits = supportPatterns.filter(p => p.test(message));
    if (supportHits.length > 0) {
      intent = 'SUPPORT_QUERY';
      corpusWeight = 0.55; // Slightly corpus-heavy but needs user context
      confidence = 0.75;
    }

    // --- ESCALATION ---
    const escalationPatterns = [
      /\b(talk to|speak (to|with)|human|agent|real person|escalate|manager)\b/i,
    ];
    if (escalationPatterns.some(p => p.test(message))) {
      intent = 'ESCALATION';
      corpusWeight = 0.1;
      confidence = 0.95;
    }

    // --- GREETING / GENERAL ---
    const greetingPatterns = [
      /^(hi|hello|hey|good (morning|afternoon|evening)|sup|yo)\b/i,
      /\b(how are you|what's up|nice to (meet|see))\b/i,
    ];
    if (greetingPatterns.some(p => p.test(message)) && message.split(/\s+/).length < 8) {
      intent = 'GENERAL_CHAT';
      corpusWeight = 0.2;
      confidence = 0.85;
    }

    // Clamp weights
    corpusWeight = Math.max(0.05, Math.min(0.95, corpusWeight));

    return {
      primaryIntent: intent,
      confidence: Math.min(confidence, 0.95),
      corpusWeight,
      userWeight: 1 - corpusWeight,
      signals: {
        queryTermsInCorpus: corpusHits.length,
        queryTermsInMemory: recallHits.length,
        recallIndicators: recallHits.map(p => p.source),
        corpusIndicators: corpusHits.map(p => p.source),
        explicitSignals: [],
        conversationArc: this.detectConversationArc(params.conversationHistory),
      },
    };
  }

  /**
   * LLM-based classification (fallback for ambiguous cases)
   */
  private async llmClassify(params: ClassificationParams): Promise<ClassificationResult> {
    if (!this.llmService) {
      throw new Error('LLM service not available');
    }

    try {
      const response = await this.llmService.chat({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Classify the user's query intent into one of these categories:
- CORPUS_QUERY: General product/documentation question
- CORPUS_DEEP_DIVE: Detailed technical question
- SUPPORT_QUERY: Issue or problem needing help
- USER_RECALL: Referencing past interactions
- COMPARISON: Comparing features or options
- HOW_TO: Step-by-step guidance request
- STATUS_CHECK: Checking on previous request
- GENERAL_CHAT: Casual conversation
- FEEDBACK: Providing feedback
- ACCOUNT_SPECIFIC: Questions about their specific situation
- CLARIFICATION: Follow-up to previous answer
- NAVIGATION: "Where can I find X?"
- ESCALATION: Request to talk to human

Also determine the appropriate weight balance between corpus (documentation) and user (personal history) context.

Respond with JSON: { "intent": "...", "corpusWeight": 0.0-1.0, "confidence": 0.0-1.0, "reasoning": "..." }`,
          },
          {
            role: 'user',
            content: `Message: "${params.message}"

Context:
- User avatar: ${params.userAvatar}
- Known about user: ${params.userMemorySummary || 'Nothing yet'}
- Available topics: ${params.corpusTopics.join(', ') || 'None specified'}
- Recent conversation arc: ${this.detectConversationArc(params.conversationHistory)}`,
          },
        ],
      });

      const parsed = JSON.parse(response.content);

      return {
        primaryIntent: parsed.intent as OrchestrationIntent,
        secondaryIntent: undefined,
        confidence: parsed.confidence || 0.7,
        corpusWeight: parsed.corpusWeight || 0.5,
        userWeight: 1 - (parsed.corpusWeight || 0.5),
        signals: {
          queryTermsInCorpus: 0,
          queryTermsInMemory: 0,
          recallIndicators: [],
          corpusIndicators: [],
          explicitSignals: [],
          conversationArc: this.detectConversationArc(params.conversationHistory),
        },
      };
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'LLM classification failed');
      throw error;
    }
  }

  /**
   * Apply avatar modifier to weights
   */
  private applyAvatarModifier(
    result: ClassificationResult,
    avatar: UserAvatar
  ): ClassificationResult {
    // Avatar maturity shifts the balance toward user context
    const avatarModifiers: Record<UserAvatar, number> = {
      STRANGER: 0.0, // No shift (corpus-dominant by default)
      ACQUAINTANCE: -0.05, // Slight shift toward user
      FAMILIAR: -0.12, // Moderate shift toward user
      KNOWN: -0.2, // Significant shift toward user
    };

    const modifier = avatarModifiers[avatar];
    const adjustedCorpusWeight = Math.max(
      0.05,
      Math.min(0.95, result.corpusWeight + modifier)
    );

    return {
      ...result,
      corpusWeight: adjustedCorpusWeight,
      userWeight: 1 - adjustedCorpusWeight,
    };
  }

  /**
   * Merge rule-based and LLM classifications
   */
  private mergeClassifications(
    rules: ClassificationResult,
    llm: ClassificationResult,
    avatar: UserAvatar
  ): ClassificationResult {
    // Use LLM intent but adjust weights with rule signals
    const mergedIntent = llm.primaryIntent;
    const mergedConfidence = (rules.confidence + llm.confidence) / 2;

    // Blend weights: 60% LLM, 40% rules
    const blendedCorpusWeight = 0.6 * llm.corpusWeight + 0.4 * rules.corpusWeight;

    const result: ClassificationResult = {
      primaryIntent: mergedIntent,
      secondaryIntent: rules.primaryIntent !== llm.primaryIntent ? rules.primaryIntent : undefined,
      confidence: mergedConfidence,
      corpusWeight: blendedCorpusWeight,
      userWeight: 1 - blendedCorpusWeight,
      signals: {
        ...rules.signals,
        explicitSignals: ['llm_classification'],
      },
    };

    return this.applyAvatarModifier(result, avatar);
  }

  /**
   * Detect conversation arc from history
   */
  private detectConversationArc(history: any[]): string {
    if (history.length === 0) return 'new';

    // Analyze last 5 messages to determine thread type
    const recent = history.slice(-5);
    let corpusSignals = 0;
    let userSignals = 0;

    for (const msg of recent) {
      if (msg.role === 'assistant' && msg.metadata) {
        if (msg.metadata.corpusWeight > 0.6) corpusSignals++;
        if (msg.metadata.userWeight > 0.6) userSignals++;
      }
    }

    if (corpusSignals > userSignals) return 'corpus_thread';
    if (userSignals > corpusSignals) return 'user_thread';
    return 'mixed';
  }
}
