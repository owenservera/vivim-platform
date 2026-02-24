/**
 * Memory System Types
 *
 * Comprehensive type definitions for the VIVIM Second Brain Memory System.
 * Designed for production use with proper typing throughout.
 */

import type {
  PrismaClient,
  Memory,
  MemoryType,
  MemoryImportance,
  MemoryConsolidationStatus,
  MemoryRelationship,
  MemoryExtractionJob,
  MemoryAnalytics,
} from '@prisma/client';

// ============================================================================
// ENUM MAPPINGS
// ============================================================================

export const MEMORY_TYPES = {
  EPISODIC: 'EPISODIC',
  SEMANTIC: 'SEMANTIC',
  PROCEDURAL: 'PROCEDURAL',
  FACTUAL: 'FACTUAL',
  PREFERENCE: 'PREFERENCE',
  IDENTITY: 'IDENTITY',
  RELATIONSHIP: 'RELATIONSHIP',
  GOAL: 'GOAL',
  PROJECT: 'PROJECT',
  CUSTOM: 'CUSTOM',
} as const;

export type MemoryTypeEnum = (typeof MEMORY_TYPES)[keyof typeof MEMORY_TYPES];

export const MEMORY_IMPORTANCE = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  MINIMAL: 'MINIMAL',
} as const;

export type MemoryImportanceEnum = (typeof MEMORY_IMPORTANCE)[keyof typeof MEMORY_IMPORTANCE];

export const MEMORY_CONSOLIDATION_STATUS = {
  RAW: 'RAW',
  CONSOLIDATING: 'CONSOLIDATING',
  CONSOLIDATED: 'CONSOLIDATED',
  MERGED: 'MERGED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type MemoryConsolidationStatusEnum =
  (typeof MEMORY_CONSOLIDATION_STATUS)[keyof typeof MEMORY_CONSOLIDATION_STATUS];

// ============================================================================
// CATEGORY MAPPINGS
// ============================================================================

// Maps memory types to their typical categories
export const MEMORY_TYPE_CATEGORIES: Record<MemoryTypeEnum, string[]> = {
  [MEMORY_TYPES.EPISODIC]: [
    'conversation_summary',
    'event',
    'experience',
    'interaction',
    'milestone',
  ],
  [MEMORY_TYPES.SEMANTIC]: ['knowledge', 'concept', 'fact', 'understanding'],
  [MEMORY_TYPES.PROCEDURAL]: ['howto', 'skill', 'workflow', 'process', 'method'],
  [MEMORY_TYPES.FACTUAL]: [
    'biography',
    'fact_about_user',
    'fact_about_world',
    'preference',
    'ability',
    'background',
  ],
  [MEMORY_TYPES.PREFERENCE]: ['like', 'dislike', 'style', 'requirement', 'frustration'],
  [MEMORY_TYPES.IDENTITY]: ['role', 'identity', 'bio', 'personality', 'values', 'belief'],
  [MEMORY_TYPES.RELATIONSHIP]: ['person_info', 'relationship', 'contact', 'team'],
  [MEMORY_TYPES.GOAL]: ['goal', 'plan', 'intention', 'aspiration'],
  [MEMORY_TYPES.PROJECT]: ['project', 'task', 'deliverable', 'deadline'],
  [MEMORY_TYPES.CUSTOM]: ['custom'],
};

// Importance thresholds
export const IMPORTANCE_THRESHOLDS = {
  [MEMORY_IMPORTANCE.CRITICAL]: 0.9,
  [MEMORY_IMPORTANCE.HIGH]: 0.7,
  [MEMORY_IMPORTANCE.MEDIUM]: 0.4,
  [MEMORY_IMPORTANCE.LOW]: 0.1,
  [MEMORY_IMPORTANCE.MINIMAL]: 0.0,
};

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateMemoryInput {
  content: string;
  summary?: string;
  memoryType?: MemoryTypeEnum;
  category?: string;
  subcategory?: string;
  tags?: string[];
  importance?: number;
  sourceConversationIds?: string[];
  sourceAcuIds?: string[];
  sourceMessageIds?: string[];
  occurredAt?: Date;
  validFrom?: Date;
  validUntil?: Date;
  isPinned?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateMemoryInput {
  content?: string;
  summary?: string;
  memoryType?: MemoryTypeEnum;
  category?: string;
  subcategory?: string;
  tags?: string[];
  importance?: number;
  relevance?: number;
  isPinned?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  validUntil?: Date;
  metadata?: Record<string, unknown>;
}

export interface MemorySearchInput {
  query?: string;
  memoryTypes?: MemoryTypeEnum[];
  categories?: string[];
  tags?: string[];
  minImportance?: number;
  maxImportance?: number;
  isPinned?: boolean;
  isActive?: boolean;
  includeArchived?: boolean;
  occurredAfter?: Date;
  occurredBefore?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'importance' | 'relevance' | 'createdAt' | 'accessedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MemoryRetrievalOptions {
  maxTokens?: number;
  minImportance?: number;
  preferredTypes?: MemoryTypeEnum[];
  requiredTypes?: MemoryTypeEnum[];
  excludedTypes?: MemoryTypeEnum[];
  tags?: string[];
  excludeTags?: string[];
  timeRange?: {
    after?: Date;
    before?: Date;
  };
  includePinned?: boolean;
  contextMessage?: string; // For contextual relevance scoring
}

export interface MemoryExtractionInput {
  conversationId: string;
  messageRange?: {
    from: number;
    to: number;
  };
  priority?: number;
  forceReextract?: boolean;
}

export interface MemoryConsolidationOptions {
  batchSize?: number;
  minImportance?: number;
  maxAge?: number; // hours
  similarityThreshold?: number;
  mergeThreshold?: number;
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

export interface MemoryWithRelations extends Memory {
  relatedMemories?: Memory[];
  children?: MemoryWithRelations[];
}

export interface MemorySearchResult {
  memories: MemoryWithRelations[];
  total: number;
  hasMore: boolean;
  tokensEstimate: number;
}

export interface MemoryRetrievalResult {
  content: string;
  memories: Array<{
    id: string;
    content: string;
    summary?: string;
    memoryType: string;
    category: string;
    importance: number;
    relevance: number;
    sourceConversationIds: string[];
  }>;
  totalTokens: number;
  usedTokenBudget: number;
}

export interface ExtractedMemory {
  content: string;
  summary?: string;
  memoryType: MemoryTypeEnum;
  category: string;
  subcategory?: string;
  tags?: string[];
  importance: number;
  confidence: number; // How confident the extractor is
  evidence?: string[]; // Supporting evidence from conversation
}

export interface MemoryStatistics {
  totalMemories: number;
  byType: Record<MemoryTypeEnum, number>;
  byCategory: Record<string, number>;
  byImportance: Record<string, number>;
  avgImportance: number;
  avgRelevance: number;
  pinnedCount: number;
  archivedCount: number;
  activeCount: number;
  totalAccesses: number;
  lastActivity?: Date;
}

// ============================================================================
// SERVICE CONFIG
// ============================================================================

export interface MemoryServiceConfig {
  prisma: PrismaClient;
  embeddingService?: IEmbeddingService;
  llmService?: ILLMService;
}

export interface IEmbeddingService {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export interface ILLMService {
  chat(params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    response_format?: { type: string };
  }): Promise<{ content: string; parsed?: unknown }>;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface MemoryEvent {
  type: 'created' | 'updated' | 'deleted' | 'merged' | 'archived' | 'restored';
  memoryId: string;
  userId: string;
  timestamp: Date;
  payload?: Record<string, unknown>;
}

export type MemoryEventHandler = (event: MemoryEvent) => void | Promise<void>;

// ============================================================================
// MEMORY RELATIONSHIP TYPES
// ============================================================================

export type MemoryRelationshipType =
  | 'similar'
  | 'contradicts'
  | 'supports'
  | 'derived_from'
  | 'related_to'
  | 'same_topic'
  | 'same_event'
  | 'follows'
  | 'precedes';

export interface CreateMemoryRelationshipInput {
  sourceMemoryId: string;
  targetMemoryId: string;
  relationshipType: MemoryRelationshipType;
  strength?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// EXTRACTION PROMPTS
// ============================================================================

export const MEMORY_EXTRACTION_PROMPT = `You are an expert at extracting meaningful memories from AI conversations. Your task is to analyze the conversation below and extract distinct, useful memories that would help future AI interactions.

## Guidelines for Memory Extraction:

1. **Identity & Background**: Extract facts about the user - their role, profession, background, skills, values, personality traits
2. **Preferences**: Note explicit and implicit preferences - communication style, technical preferences, interests, likes/dislikes
3. **Goals & Plans**: Extract stated goals, plans, intentions, and aspirations
4. **Knowledge**: Note any factual statements, explanations, or knowledge shared
5. **Relationships**: Information about people, teams, or organizations mentioned
6. **Projects**: Current or past projects, tasks, deliverables
7. **Procedures**: How-to knowledge, workflows, methods learned
8. **Important Events**: Significant events, milestones, conversations

## Output Format:

For each memory, provide:
- content: The actual memory (1-3 sentences)
- memoryType: EPISODIC, SEMANTIC, PROCEDURAL, FACTUAL, PREFERENCE, IDENTITY, RELATIONSHIP, GOAL, PROJECT
- category: A specific category from: biography, preference, goal, skill, fact, project, event, workflow, relationship, other
- importance: 0.0-1.0 (how important this memory is for future interactions)
- tags: Array of relevant tags
- confidence: How confident you are in this extraction (0-1)
- evidence: Key phrases from conversation that support this memory

## Important Rules:
- Only extract memories with confidence > 0.5
- Merge similar information into single memories
- Focus on personally relevant information about the user
- Ignore generic AI responses unless they reveal something about the user
- Extract specific, actionable information rather than vague statements

Conversation to analyze:`;

export const MEMORY_CONSOLIDATION_PROMPT = `You are an expert at consolidating similar memories. Your task is to analyze multiple memories about similar topics and create a consolidated version.

## Guidelines:

1. **Merge overlapping information** - combine facts from multiple sources
2. **Preserve unique details** - keep information that adds value
3. **Update outdated information** - prefer recent memories for temporal facts
4. **Resolve contradictions** - keep the most recent/reliable information
5. **Generate summary** - create a brief summary capturing the essence

## Output Format:
- mergedContent: The consolidated memory content
- summary: Brief summary
- mergedFrom: Array of source memory IDs that were merged
- keptDetails: Important details from each source to preserve

Memories to consolidate:`;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getMemoryTypeFromImportance(importance: number): MemoryImportanceEnum {
  if (importance >= IMPORTANCE_THRESHOLDS.CRITICAL) return MEMORY_IMPORTANCE.CRITICAL;
  if (importance >= IMPORTANCE_THRESHOLDS.HIGH) return MEMORY_IMPORTANCE.HIGH;
  if (importance >= IMPORTANCE_THRESHOLDS.MEDIUM) return MEMORY_IMPORTANCE.MEDIUM;
  if (importance >= IMPORTANCE_THRESHOLDS.LOW) return MEMORY_IMPORTANCE.LOW;
  return MEMORY_IMPORTANCE.MINIMAL;
}

export function getDefaultCategoryForType(memoryType: MemoryTypeEnum): string {
  const categories = MEMORY_TYPE_CATEGORIES[memoryType];
  return categories[0] || 'other';
}

export function calculateRelevance(
  baseRelevance: number,
  accessCount: number,
  lastAccessedAt: Date | null,
  isPinned: boolean,
  now: Date = new Date()
): number {
  // Pinned memories always have high relevance
  if (isPinned) return 1.0;

  // Base relevance
  let relevance = baseRelevance;

  // Boost for frequent access
  const accessBoost = Math.min(0.2, accessCount * 0.02);
  relevance += accessBoost;

  // Decay for non-access over time (half-life of 30 days)
  if (lastAccessedAt) {
    const daysSinceAccess = (now.getTime() - lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.pow(0.5, daysSinceAccess / 30);
    relevance = relevance * (0.5 + 0.5 * decayFactor);
  }

  return Math.min(1.0, Math.max(0.0, relevance));
}

export function estimateTokensForMemories(memories: Memory[]): number {
  // Rough estimate: 1 token ≈ 4 characters
  return memories.reduce((total, mem) => {
    const content = mem.summary || mem.content;
    return total + Math.ceil(content.length / 4);
  }, 0);
}
