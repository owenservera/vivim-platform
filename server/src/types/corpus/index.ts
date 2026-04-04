/**
 * VIVIM Corpus-Chatbot TypeScript Types
 * 
 * Type definitions for the corpus-chatbot system.
 * These types mirror the Prisma schema and provide type safety
 * for the corpus ingestion, retrieval, and orchestration systems.
 * 
 * @created March 27, 2026
 */

// ============================================================================
// ENUMS
// ============================================================================

export type UserAvatar = 'STRANGER' | 'ACQUAINTANCE' | 'FAMILIAR' | 'KNOWN';

export type TopicScope = 'USER' | 'CORPUS';

export type ChunkContentType = 'prose' | 'code' | 'table' | 'list' | 'mixed';

export type DocumentChangeType = 'major' | 'minor' | 'patch';

export type OrchestrationIntent =
  | 'CORPUS_QUERY'
  | 'CORPUS_DEEP_DIVE'
  | 'SUPPORT_QUERY'
  | 'USER_RECALL'
  | 'COMPARISON'
  | 'HOW_TO'
  | 'STATUS_CHECK'
  | 'GENERAL_CHAT'
  | 'FEEDBACK'
  | 'ACCOUNT_SPECIFIC'
  | 'CLARIFICATION'
  | 'NAVIGATION'
  | 'ESCALATION';

export type ConversationSentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

export type ResolutionStatus = 'resolved' | 'pending' | 'escalated' | 'unknown';

// ============================================================================
// TENANT
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  chatbotConfig: TenantChatbotConfig;
  brandVoice: BrandVoiceConfig;
  guardrails: string[];
  defaultModel: string;
  embeddingModel: string;
  maxContextTokens: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantChatbotConfig {
  companyName: string;
  productName: string;
  productDescription: string;
  brandVoice: BrandVoiceConfig;
  guardrails: string[];
  escalationInstructions: string;
  answerStyle: 'concise' | 'detailed' | 'conversational';
  citeSources: boolean;
  suggestRelated: boolean;
  proactiveHelp: boolean;
}

export interface BrandVoiceConfig {
  tone: 'professional' | 'friendly' | 'casual' | 'technical';
  formality: 'formal' | 'neutral' | 'informal';
  personality: string[];
}

// ============================================================================
// CORPUS DOCUMENTS
// ============================================================================

export interface CorpusDocument {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  rawContent: string;
  contentHash: string;
  format: string;
  category: string;
  topicId: string | null;
  version: string;
  isActive: boolean;
  previousVersionId: string | null;
  authors: string[];
  lastPublishedAt: Date;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  ingestedAt: Date;
}

export interface CorpusDocumentVersion {
  id: string;
  documentId: string;
  version: string;
  contentHash: string;
  changeType: DocumentChangeType;
  changelog: string | null;
  changedSections: string[];
  addedChunkIds: string[];
  modifiedChunkIds: string[];
  removedChunkIds: string[];
  isActive: boolean;
  publishedAt: Date;
  ingestedAt: Date;
}

// ============================================================================
// CORPUS CHUNKS
// ============================================================================

export interface CorpusChunk {
  id: string;
  tenantId: string;
  documentId: string;
  content: string;
  summary: string | null;
  parentChunkId: string | null;
  childChunks: CorpusChunk[];
  chunkIndex: number;
  totalChunks: number;
  sectionPath: string[];
  headingLevel: number;
  contentType: ChunkContentType;
  embedding: number[] | null;
  embeddingModel: string | null;
  keywords: string[];
  topicSlug: string;
  difficulty: string;
  generatedQuestions: string[];
  generatedAnswer: string | null;
  questionEmbeddings: Record<string, number[]> | null;
  sourceUpdatedAt: Date;
  freshnessScore: number;
  qualityScore: number;
  retrievalCount: number;
  avgRelevanceScore: number;
  lastRetrievedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoredCorpusChunk {
  chunk: CorpusChunk;
  scores: {
    semantic: number;
    keyword: number;
    qaMatch: number;
    freshness: number;
    topicAlign: number;
    quality: number;
    combined: number;
  };
  parentContext?: string;
}

// ============================================================================
// CORPUS TOPICS
// ============================================================================

export interface CorpusTopic {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  description: string | null;
  parentTopicId: string | null;
  childTopics: CorpusTopic[];
  path: string[];
  depth: number;
  documentCount: number;
  chunkCount: number;
  totalTokens: number;
  embedding: number[] | null;
  representativeQuestions: string[];
  queryCount: number;
  avgConfidence: number;
  popularity: number;
  lastUpdatedAt: Date;
  isActive: boolean;
}

// ============================================================================
// CORPUS FAQ
// ============================================================================

export interface CorpusFAQ {
  id: string;
  tenantId: string;
  question: string;
  answer: string;
  sourceChunkId: string | null;
  isManual: boolean;
  questionEmbedding: number[] | null;
  topicSlug: string;
  category: string;
  confidence: number;
  matchCount: number;
  helpfulCount: number;
  unhelpfulCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CONVERSATION AWARENESS
// ============================================================================

export interface ConversationIndex {
  id: string;
  virtualUserId: string;
  conversationId: string;
  summary: string;
  embedding: number[] | null;
  topics: string[];
  keyFacts: KeyFact[];
  questionsAsked: string[];
  issuesDiscussed: string[];
  decisionsReached: string[];
  actionItems: string[];
  messageCount: number;
  duration: number;
  sentiment: ConversationSentiment;
  resolutionStatus: ResolutionStatus;
  startedAt: Date;
  endedAt: Date | null;
  lastReferencedAt: Date | null;
  referenceCount: number;
  relatedConversationIds: string[];
  memoryIds: string[];
  createdAt: Date;
}

export interface KeyFact {
  fact: string;
  confidence: number;
  source: 'explicit' | 'inferred';
  messageIndex: number;
}

// ============================================================================
// USER PROFILE EVOLUTION
// ============================================================================

export interface UserProfileSnapshot {
  id: string;
  virtualUserId: string;
  avatar: UserAvatar;
  version: number;
  identity: UserIdentity;
  preferences: UserPreferences;
  topicExpertise: Record<string, TopicExpertise>;
  behavior: UserBehavior;
  activeConcerns: ActiveConcerns;
  evolutionLog: EvolutionLogEntry[];
  createdAt: Date;
  lastEvolvedAt: Date;
}

export interface UserIdentity {
  displayName: string | null;
  role: string | null;
  company: string | null;
  teamSize: number | null;
  plan: string | null;
  expertise: 'beginner' | 'intermediate' | 'advanced' | null;
}

export interface UserPreferences {
  communicationStyle: 'concise' | 'detailed' | 'conversational' | null;
  technicalLevel: 'high' | 'medium' | 'low' | null;
  responseFormat: 'text' | 'code_heavy' | 'visual' | null;
  timezone: string | null;
  language: string | null;
}

export interface TopicExpertise {
  level: 'novice' | 'intermediate' | 'advanced';
  questionsAsked: number;
  lastInteraction: Date;
}

export interface UserBehavior {
  avgSessionLength: number;
  avgMessagesPerSession: number;
  peakActivityHours: number[];
  returnFrequency: number;
  escalationRate: number;
  satisfactionTrend: 'improving' | 'stable' | 'declining';
}

export interface ActiveConcerns {
  unresolvedIssues: string[];
  pendingFeatureRequests: string[];
  openActionItems: string[];
}

export interface EvolutionLogEntry {
  timestamp: Date;
  changes: string[];
}

// ============================================================================
// ORCHESTRATION TELEMETRY
// ============================================================================

export interface OrchestrationLog {
  id: string;
  tenantId: string;
  virtualUserId: string;
  conversationId: string;
  intent: OrchestrationIntent;
  intentConfidence: number;
  avatar: UserAvatar;
  corpusWeight: number;
  userWeight: number;
  assemblyTimeMs: number;
  totalTokens: number;
  corpusTokens: number;
  userTokens: number;
  historyTokens: number;
  corpusConfidence: number;
  chunksRetrieved: number;
  memoriesUsed: number;
  proactiveInsights: number;
  userSatisfaction: string | null;
  followUpRequired: boolean;
  escalated: boolean;
  createdAt: Date;
}

// ============================================================================
// CORPUS RETRIEVAL
// ============================================================================

export interface CorpusRetrievalParams {
  tenantId: string;
  query: string;
  queryEmbedding: number[];
  topicSlugs?: string[];
  contentTypes?: ChunkContentType[];
  difficulty?: string;
  documentIds?: string[];
  maxResults?: number;
  finalResults?: number;
  freshnessBias?: number;
  userAvatar?: UserAvatar;
  userTopics?: string[];
  userDifficulty?: string;
}

export interface CorpusRetrievalResult {
  chunks: ScoredCorpusChunk[];
  totalCandidates: number;
  retrievalTimeMs: number;
  confidence: number;
  fallbackSuggestions?: string[];
  citations: Citation[];
}

export interface Citation {
  chunkId: string;
  documentTitle: string;
  sectionPath: string[];
  url?: string;
  version: string;
  relevanceScore: number;
}

// ============================================================================
// CORPUS CONTEXT ASSEMBLY
// ============================================================================

export interface CorpusAssemblyParams {
  tenantId: string;
  query: string;
  queryEmbedding: number[];
  totalBudget: number;
  topicSlugs?: string[];
  documentIds?: string[];
  userAvatar: UserAvatar;
  userTopics?: string[];
  userDifficulty?: string;
  previousQueries?: string[];
}

export interface AssembledCorpusContext {
  compiledPrompt: string;
  layers: {
    C0: CompiledLayer;
    C1: CompiledLayer;
    C2: CompiledLayer;
    C3: CompiledLayer;
    C4: CompiledLayer;
  };
  totalTokens: number;
  citations: Citation[];
  confidence: number;
  metadata: {
    retrievalTimeMs: number;
    chunksConsidered: number;
    chunksUsed: number;
    topicsCovered: string[];
    freshnessInfo: string | null;
  };
}

export interface CompiledLayer {
  content: string;
  tokens: number;
}

export interface CorpusLayerBudgets {
  C0_identity: number;
  C1_topic: number;
  C2_knowledge: number;
  C3_supporting: number;
  C4_freshness: number;
}

// ============================================================================
// DUAL-ENGINE ORCHESTRATION
// ============================================================================

export interface ClassificationParams {
  message: string;
  conversationHistory: Message[];
  userAvatar: UserAvatar;
  userMemorySummary: string;
  corpusTopics: string[];
}

export interface ClassificationResult {
  primaryIntent: OrchestrationIntent;
  secondaryIntent?: OrchestrationIntent;
  confidence: number;
  corpusWeight: number;
  userWeight: number;
  signals: {
    queryTermsInCorpus: number;
    queryTermsInMemory: number;
    recallIndicators: string[];
    corpusIndicators: string[];
    explicitSignals: string[];
    conversationArc: string;
  };
}

export interface WeightCalculation {
  intentWeight: { corpus: number; user: number };
  avatarModifier: number;
  conversationArcModifier: number;
  explicitOverride: number | null;
  final: { corpus: number; user: number };
}

export interface DualBudgetAllocation {
  totalBudget: number;
  corpusBudget: {
    total: number;
    layers: CorpusLayerBudgets;
  };
  userBudget: {
    total: number;
    layers: Record<string, number>;
  };
  sharedBudget: {
    systemInstructions: number;
    conversationHistory: number;
  };
}

export interface OrchestrationParams {
  tenantId: string;
  virtualUserId: string;
  conversationId: string;
  message: string;
  conversationHistory: Message[];
  conversationState: ConversationState;
  totalBudget?: number;
}

export interface ConversationState {
  hasActiveConversation: boolean;
  totalTokens: number;
  messageCount: number;
  recentArc?: string;
}

export interface MergedContext {
  systemPrompt: string;
  metadata: {
    totalTokens: number;
    corpusTokens: number;
    userTokens: number;
    historyTokens: number;
    corpusConfidence: number;
    userMemoriesUsed: number;
    citations: Citation[];
    engineWeights: { corpus: number; user: number };
    avatarUsed: UserAvatar;
    intentDetected: OrchestrationIntent;
    assemblyTimeMs: number;
  };
}

// ============================================================================
// PROACTIVE AWARENESS
// ============================================================================

export interface ProactiveInsight {
  type: ProactiveInsightType;
  content: string;
  relevance: number;
  source: 'memory' | 'corpus_update' | 'pattern';
}

export type ProactiveInsightType =
  | 'DOC_UPDATED'
  | 'FEATURE_RELEASED'
  | 'ISSUE_RESOLVED'
  | 'RELATED_QUESTION'
  | 'UNRESOLVED_FOLLOWUP'
  | 'PLAN_RECOMMENDATION';

// ============================================================================
// DOCUMENT INGESTION
// ============================================================================

export interface DocumentIngestionParams {
  tenantId: string;
  title: string;
  content: string;
  format: string;
  category: string;
  topicSlug?: string;
  sourceUrl?: string;
  version?: string;
  authors?: string[];
}

export interface IngestionResult {
  documentId: string;
  chunks: CorpusChunk[];
  faqPairs: CorpusFAQ[];
  topicsUpdated: string[];
  changelog?: string;
  addedChunks: number;
  modifiedChunks: number;
  removedChunks: number;
}

export interface ParsedDocument {
  title: string;
  sections: Section[];
  codeBlocks: CodeBlock[];
  tables: Table[];
  metadata: DocumentMetadata;
}

export interface Section {
  heading: string;
  level: number;
  content: string;
  subsections: Section[];
}

export interface CodeBlock {
  language: string;
  code: string;
  startIndex: number;
  endIndex: number;
}

export interface Table {
  headers: string[];
  rows: string[][];
  startIndex: number;
  endIndex: number;
}

export interface DocumentMetadata {
  wordCount: number;
  estimatedReadingTime: number;
  hasCodeBlocks: boolean;
  hasTables: boolean;
  sectionCount: number;
}

export interface ChunkingConfig {
  targetChunkSize: number;
  maxChunkSize: number;
  minChunkSize: number;
  overlapSize: number;
  respectHeadings: boolean;
  preserveCodeBlocks: boolean;
  preserveTables: boolean;
  preserveLists: boolean;
  generateParentChunks: boolean;
  maxHierarchyDepth: number;
}

export interface ChunkResult {
  chunks: CorpusChunk[];
  parentChunks: CorpusChunk[];
  rootChunk: CorpusChunk;
  metadata: {
    totalChunks: number;
    avgChunkSize: number;
    preservedStructures: number;
  };
}

export interface QAPair {
  question: string;
  answer: string;
  confidence: number;
}

// ============================================================================
// CONFIDENCE ASSESSMENT
// ============================================================================

export interface ConfidenceAssessment {
  level: 'NONE' | 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  action: 'ESCALATE' | 'ESCALATE_TO_HUMAN' | 'SUGGEST_ALTERNATIVES' | 'ANSWER_WITH_CAVEAT' | 'ANSWER_DIRECTLY';
  message: string;
  suggestions?: string[];
}

// ============================================================================
// CACHE INTERFACES
// ============================================================================

export interface CorpusCacheEntry<T> {
  value: T;
  expiresAt: number;
  hitCount: number;
}

export interface CorpusCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

// ============================================================================
// ANALYTICS INTERFACES
// ============================================================================

export interface CorpusAnalytics {
  totalDocuments: number;
  totalChunks: number;
  totalTopics: number;
  avgChunkQuality: number;
  totalQueries: number;
  avgConfidence: number;
  lowConfidenceRate: number;
  topQueries: QueryFrequency[];
  unansweredQueries: string[];
  topicCoverageGaps: TopicGap[];
  staleContent: StaleContentReport[];
  followUpRate: number;
  escalationRate: number;
  thumbsUpRate: number;
}

export interface QueryFrequency {
  query: string;
  count: number;
  avgConfidence: number;
}

export interface TopicGap {
  topicSlug: string;
  queryCount: number;
  avgConfidence: number;
  recommendation: string;
}

export interface StaleContentReport {
  documentId: string;
  topicSlug: string;
  lastUpdatedAt: Date;
  ageInDays: number;
  recommendation: string;
}

// ============================================================================
// MESSAGE TYPE (simplified for orchestration)
// ============================================================================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// RECALL RESULT
// ============================================================================

export interface RecallResult {
  found: boolean;
  topMatch?: ConversationIndex;
  conversationSummary?: string;
  keyExchanges?: KeyExchange[];
  relatedConversations?: ConversationIndex[];
  suggestions?: ConversationIndex[];
}

export interface KeyExchange {
  question: string;
  answer: string;
  importance: number;
  timestamp: Date;
}

// ============================================================================
// EXTRACTED MEMORY
// ============================================================================

export interface ExtractedMemory {
  content: string;
  memoryType: string;
  category: string;
  importance: number;
  confidence: number;
  source?: string;
  tags?: string[];
}
