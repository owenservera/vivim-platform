/**
 * Dynamic Context Pipeline Types
 *
 * Type definitions for the layered, pre-generated, bespoke context system.
 * This module provides intelligent context assembly with token budget management.
 */

// ============================================================================
// USER SETTINGS
// ============================================================================

export interface UserContextSettings {
  /** User's max context window (4096 - 50000, default 12000) */
  maxContextTokens: number;

  /** Prioritize conversation history over knowledge (default: true for continuing) */
  prioritizeConversationHistory: boolean;

  /** Knowledge depth setting (default: 'standard') */
  knowledgeDepth: 'minimal' | 'standard' | 'deep';

  /** Include entity context (default: true) */
  includeEntityContext: boolean;
}

// ============================================================================
// LAYER BUDGET TYPES
// ============================================================================

export interface LayerBudget {
  layer: string;
  /** Hard floor — below this, don't include at all */
  minTokens: number;
  /** What we'd like */
  idealTokens: number;
  /** Hard ceiling — never exceed */
  maxTokens: number;
  /** 0-100, for allocation conflicts */
  priority: number;
  /** Final allocation after algorithm runs */
  allocated: number;
  /** 0-1, how willing this layer is to shrink */
  elasticity: number;
}

export interface BudgetInput {
  /** User's maxContextTokens setting */
  totalBudget: number;
  /** How many messages in the conversation */
  conversationMessageCount: number;
  /** Raw token count of all messages */
  conversationTotalTokens: number;
  /** Current message size */
  userMessageTokens: number;
  /** How many topics were detected */
  detectedTopicCount: number;
  /** How many entities were detected */
  detectedEntityCount: number;
  /** Is this continuing a conversation? */
  hasActiveConversation: boolean;
  knowledgeDepth: 'minimal' | 'standard' | 'deep';
  prioritizeHistory: boolean;
  /** bundleType -> actual token count */
  availableBundles: Map<string, number>;
}

export interface ComputedBudget {
  layers: Record<string, LayerBudget>;
  totalUsed: number;
  totalAvailable: number;
}

export interface TokenBudget {
  totalAvailable: number;
  totalUsed: number;
}

// ============================================================================
// CONTEXT DETECTION TYPES
// ============================================================================

export interface DetectedTopic {
  slug: string;
  profileId: string;
  source: 'conversation_history' | 'semantic_match';
  confidence: number;
}

export interface DetectedEntity {
  id: string;
  name: string;
  type: string;
  source: 'semantic_match' | 'explicit_mention';
  confidence: number;
}

export interface DetectedContext {
  topics: DetectedTopic[];
  entities: DetectedEntity[];
  isNewTopic: boolean;
  isContinuation: boolean;
}

// ============================================================================
// BUNDLE TYPES
// ============================================================================

export type BundleType =
  | 'identity_core' // L0
  | 'global_prefs' // L1
  | 'topic' // L2
  | 'entity' // L3
  | 'conversation' // L4
  | 'composite'; // Pre-merged

export interface CompiledBundle {
  id: string;
  userId: string;
  bundleType: BundleType;
  compiledPrompt: string;
  tokenCount: number;
  composition: BundleComposition;
  version: number;
  isDirty: boolean;
  compiledAt: Date;
}

export interface BundleComposition {
  memoryIds?: string[];
  acuIds?: string[];
  instructionIds?: string[];
  conversationIds?: string[];
  [key: string]: string[] | undefined;
}

// ============================================================================
// CONVERSATION WINDOW TYPES
// ============================================================================

export type CompressionStrategy = 'full' | 'windowed' | 'compacted' | 'multi_level';

export interface ConversationWindow {
  /** Conversation arc (goes into L4 budget) */
  l4Arc: string;
  /** Message history (goes into L6 budget) */
  l6Messages: string;
  l4TokenCount: number;
  l6TokenCount: number;
  /** Strategy used for compression */
  strategy: CompressionStrategy;
  /** Metadata about what was included */
  coverage: {
    totalMessages: number;
    fullMessages: number;
    summarizedMessages: number;
    droppedMessages: number;
  };
}

export interface ConversationArc {
  arc: string;
  openQuestions: string[];
  decisions: string[];
  currentFocus: string | null;
}

// ============================================================================
// PREDICTION TYPES
// ============================================================================

export type InteractionType =
  | 'continue_conversation'
  | 'new_on_topic'
  | 'entity_related'
  | 'cold_start';

export interface PredictedInteraction {
  type: InteractionType;
  conversationId?: string;
  topicSlug?: string;
  entityId?: string;
  personaId?: string;
  /** 0-1 probability */
  probability: number;
  /** Bundle types needed */
  requiredBundles: BundleType[];
}

// ============================================================================
// ASSEMBLY RESULT TYPES
// ============================================================================

export interface AssembledContext {
  /** The final system prompt with all context layers */
  systemPrompt: string;
  /** Token budget breakdown */
  budget: ComputedBudget;
  /** Which bundles were used */
  bundlesUsed: BundleType[];
  /** Assembly metadata */
  metadata: {
    assemblyTimeMs: number;
    detectedTopics: number;
    detectedEntities: number;
    cacheHitRate: number;
    bundlesInfo?: Array<{
      id: string;
      type: string;
      title: string;
      tokenCount: number;
      snippet: string;
    }>;
    conversationStats?: {
      messageCount: number;
      totalTokens: number;
      hasConversation: boolean;
    };
  };
}

export interface AssemblyParams {
  userId: string;
  conversationId: string;
  userMessage: string;
  personaId?: string;
  deviceId?: string;
  providerId?: string;
  modelId?: string;
  settings?: Partial<UserContextSettings>;
}

export interface JITKnowledge {
  acus: Array<{
    id: string;
    content: string;
    type: string;
    category: string;
    createdAt: Date;
    similarity: number;
  }>;
  memories: Array<{
    id: string;
    content: string;
    category: string;
    importance: number;
    similarity: number;
  }>;
}

// ============================================================================
// CLIENT PRESENCE TYPES
// ============================================================================

export interface NavigationEvent {
  path: string;
  timestamp: string;
}

export interface ClientPresenceState {
  userId: string;
  deviceId: string;
  activeConversationId?: string;
  visibleConversationIds: string[];
  activeNotebookId?: string;
  activePersonaId?: string;
  lastNavigationPath?: string;
  navigationHistory: NavigationEvent[];
  localTime?: Date;
  sessionStartedAt: Date;
  idleSince?: Date;
  predictedTopics: string[];
  predictedEntities: string[];
  lastHeartbeatAt: Date;
  isOnline: boolean;
}

// ============================================================================
// TOPIC & ENTITY PROFILE TYPES
// ============================================================================

export interface ProficiencySignal {
  signal: string;
  date: Date;
  direction: 'up' | 'down';
}

export interface EntityFact {
  fact: string;
  confidence: number;
  source: string;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IEmbeddingService {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export interface ILLMService {
  chat(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    response_format?: { type: string };
  }): Promise<{ content: string }>;
}

export interface ITokenEstimator {
  estimateTokens(text: string): number;
  estimateMessageTokens(message: { role?: string; content: any }): number;
}
