/**
 * Engine Weight Calculator
 * 
 * Calculates optimal corpus/user context weights based on:
 * - Intent classification
 * - Avatar maturity
 * - Conversation arc
 * - Memory density
 * 
 * @created March 27, 2026
 */

import {
  ClassificationResult,
  UserAvatar,
  OrchestrationIntent,
  WeightCalculation,
} from '../../types/corpus';

interface ConversationState {
  hasActiveConversation: boolean;
  totalTokens: number;
  messageCount: number;
  recentArc?: string;
}

export class EngineWeightCalculator {
  /**
   * Calculate final engine weights
   */
  calculate(
    intent: ClassificationResult,
    avatar: UserAvatar,
    conversationState: ConversationState,
    userMemoryDensity: number
  ): WeightCalculation {
    // Start with intent-based weights
    let corpusWeight = intent.corpusWeight;
    let userWeight = intent.userWeight;

    // Avatar modifier
    const avatarShift = this.getAvatarShift(avatar, userMemoryDensity);
    corpusWeight += avatarShift;

    // Conversation arc modifier
    const arcShift = this.getArcShift(conversationState);
    corpusWeight += arcShift;

    // Memory density modifier
    const densityShift = this.getDensityShift(userMemoryDensity, intent.primaryIntent);
    corpusWeight += densityShift;

    // Normalize
    corpusWeight = Math.max(0.05, Math.min(0.95, corpusWeight));
    userWeight = 1 - corpusWeight;

    return {
      intentWeight: { corpus: intent.corpusWeight, user: intent.userWeight },
      avatarModifier: avatarShift,
      conversationArcModifier: arcShift,
      explicitOverride: null,
      final: { corpus: corpusWeight, user: userWeight },
    };
  }

  /**
   * Get avatar-based weight shift
   */
  private getAvatarShift(avatar: UserAvatar, memoryDensity: number): number {
    // Base shifts per avatar level
    const base: Record<UserAvatar, number> = {
      STRANGER: 0.0,
      ACQUAINTANCE: -0.03,
      FAMILIAR: -0.08,
      KNOWN: -0.15,
    };

    // Scale by actual memory density
    // Don't shift toward user context if we don't have meaningful memories
    return base[avatar] * memoryDensity;
  }

  /**
   * Get conversation arc-based weight shift
   */
  private getArcShift(state: ConversationState): number {
    if (!state.hasActiveConversation) return 0;

    // Maintain conversation momentum
    switch (state.recentArc) {
      case 'corpus_thread':
        return 0.05; // Stay corpus-heavy
      case 'user_thread':
        return -0.05; // Stay user-heavy
      case 'mixed':
      default:
        return 0;
    }
  }

  /**
   * Get memory density-based weight shift
   */
  private getDensityShift(
    density: number,
    intent: OrchestrationIntent
  ): number {
    // For recall-type intents, density matters more
    const recallIntents: OrchestrationIntent[] = [
      'USER_RECALL',
      'STATUS_CHECK',
      'ACCOUNT_SPECIFIC',
    ];

    if (recallIntents.includes(intent)) {
      // More user-heavy when we have data and they want it
      return -0.1 * density;
    }

    // Small shift for other intents
    return -0.03 * density;
  }
}
