/**
 * Auto Memory Extraction Engine
 *
 * Inspired by vCode's `src/services/extractMemories/` pattern.
 * Watches conversations, identifies reusable facts/preferences/conventions,
 * and persists them as structured memories.
 *
 * Key principles:
 * - Provider-agnostic (works with any LLM)
 * - Natural language triggers ("remember this", "save this pattern")
 * - Automatic extraction from conversation context
 * - Deduplication via content hashing
 */

import type { MemoryCommands, CreateMemoryInput } from './commands.js';
import type { MemoryEntry, MemoryMetadata } from './store.js';
import type { MemoryScope } from './directory.js';

/**
 * Extracted memory candidate from conversation analysis.
 */
export interface MemoryCandidate {
  /** The extracted content */
  content: string;
  /** Type of memory */
  type: MemoryCandidateType;
  /** Confidence score (0-1) */
  confidence: number;
  /** Suggested tags */
  tags: string[];
  /** Suggested category */
  category: string;
  /** Source reference */
  sourceId?: string;
}

export type MemoryCandidateType =
  | 'fact'           // Factual information
  | 'preference'     // User preference
  | 'convention'     // Coding convention, pattern
  | 'instruction'    // How-to knowledge
  | 'context'        // Project context
  | 'relationship'   // People/relationship info
  | 'goal';          // Plans, objectives

/**
 * Memory extraction result.
 */
export interface ExtractionResult {
  /** Memories that were extracted and persisted */
  extracted: MemoryEntry[];
  /** Candidates that were rejected (low confidence) */
  rejected: MemoryCandidate[];
  /** Total candidates found */
  totalCandidates: number;
}

/**
 * Extraction rule — defines patterns for identifying memories in text.
 */
export interface ExtractionRule {
  id: string;
  name: string;
  /** Pattern to match (regex or keyword list) */
  pattern: 'explicit' | 'implicit' | 'llm-assisted';
  /** Memory type this rule produces */
  producesType: MemoryCandidateType;
  /** Priority (higher = checked first) */
  priority: number;
}

/**
 * Auto Memory Extraction Engine.
 *
 * Two extraction modes:
 * 1. Explicit — User says "remember X" / "save this" — direct memory command
 * 2. Implicit — System identifies persistent-worthy content from conversations
 * 3. LLM-assisted — AI provider analyzes conversation and extracts memories
 */
export class MemoryExtractor {
  private rules: ExtractionRule[] = [
    { id: 'explicit-remember', name: 'Explicit Remember', pattern: 'explicit', producesType: 'fact', priority: 100 },
    { id: 'explicit-preference', name: 'Explicit Preference', pattern: 'explicit', producesType: 'preference', priority: 90 },
    { id: 'explicit-pattern', name: 'Explicit Pattern', pattern: 'explicit', producesType: 'convention', priority: 85 },
    { id: 'implicit-fact', name: 'Implicit Fact', pattern: 'implicit', producesType: 'fact', priority: 50 },
    { id: 'implicit-context', name: 'Implicit Context', pattern: 'implicit', producesType: 'context', priority: 40 },
    { id: 'llm-extract', name: 'LLM Extraction', pattern: 'llm-assisted', producesType: 'fact', priority: 70 },
  ];

  constructor(
    private commands: MemoryCommands,
    private defaultScope: MemoryScope = 'project'
  ) {}

  /**
   * Process a conversation turn and extract memories.
   *
   * @param userMessage The user's message
   * @param assistantMessage The AI's response
   * @param sourceId Reference to the conversation/message ID
   * @param provider LLM provider name
   */
  async extractFromConversation(
    userMessage: string,
    assistantMessage: string,
    options: {
      sourceId?: string;
      provider?: string;
      scope?: MemoryScope;
      /** Use LLM to assist with extraction */
      llmAssisted?: boolean;
    } = {}
  ): Promise<ExtractionResult> {
    const candidates: MemoryCandidate[] = [];

    // 1. Explicit extraction — check for "remember" patterns
    const explicitMemories = this.detectExplicitMemories(userMessage, assistantMessage);
    candidates.push(...explicitMemories);

    // 2. Implicit extraction — identify persistent-worthy content
    if (!options.llmAssisted) {
      const implicitMemories = this.detectImplicitMemories(userMessage, assistantMessage);
      candidates.push(...implicitMemories);
    }

    // 3. LLM-assisted extraction (if enabled)
    // In production, this would call an AI endpoint to analyze the conversation
    // For now, we use rule-based extraction as a fallback

    // Filter and score candidates
    const scope = options.scope ?? this.defaultScope;
    const extracted: MemoryEntry[] = [];
    const rejected: MemoryCandidate[] = [];

    for (const candidate of candidates) {
      // Skip low-confidence candidates
      if (candidate.confidence < 0.6) {
        rejected.push(candidate);
        continue;
      }

      // Check for duplicates via content hash
      const hash = this.hashContent(candidate.content);
      if (await this.isDuplicate(hash, scope)) {
        rejected.push({ ...candidate, confidence: 0 });
        continue;
      }

      // Create and persist the memory
      const input: CreateMemoryInput = {
        content: candidate.content,
        scope,
        tags: [...new Set([...candidate.tags, candidate.type])],
        category: candidate.category,
        sourceId: options.sourceId,
        provider: options.provider,
      };

      const entry = await this.commands.add(input);
      extracted.push(entry);
    }

    return {
      extracted,
      rejected,
      totalCandidates: candidates.length,
    };
  }

  /**
   * Extract memories from a batch of messages.
   */
  async extractFromMessages(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: {
      sourceId?: string;
      provider?: string;
      scope?: MemoryScope;
    } = {}
  ): Promise<ExtractionResult> {
    // Process consecutive user/assistant pairs
    const pairs: Array<{ user: string; assistant: string }> = [];

    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
        pairs.push({ user: messages[i].content, assistant: messages[i + 1].content });
      }
    }

    const allExtracted: MemoryEntry[] = [];
    const allRejected: MemoryCandidate[] = [];
    let totalCandidates = 0;

    for (const pair of pairs) {
      const result = await this.extractFromConversation(
        pair.user,
        pair.assistant,
        options
      );
      allExtracted.push(...result.extracted);
      allRejected.push(...result.rejected);
      totalCandidates += result.totalCandidates;
    }

    return {
      extracted: allExtracted,
      rejected: allRejected,
      totalCandidates,
    };
  }

  /**
   * Detect explicit memory commands in user messages.
   */
  private detectExplicitMemories(
    userMessage: string,
    _assistantMessage: string
  ): MemoryCandidate[] {
    const candidates: MemoryCandidate[] = [];

    // Pattern: "remember X", "remember that X", "remember this: X"
    const rememberPatterns = [
      /remember\s+(?:that\s+)?(.+?)(?:\.|\!|$)/i,
      /remember\s+this:\s*(.+)/i,
      /save\s+(?:this|that)\s*(?::\s*)?(.+)/i,
      /note\s+(?:that\s+)?(.+?)(?:\.|\!|$)/i,
      /keep\s+in\s+mind\s+(?:that\s+)?(.+?)(?:\.|\!|$)/i,
    ];

    for (const pattern of rememberPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        const content = match[1].trim();
        if (content.length > 3) {
          const type = this.classifyExplicitType(userMessage);
          candidates.push({
            content,
            type,
            confidence: 0.95, // High confidence for explicit commands
            tags: this.extractTags(userMessage),
            category: this.classifyCategory(content),
          });
        }
      }
    }

    return candidates;
  }

  /**
   * Classify the type of an explicit memory command.
   */
  private classifyExplicitType(message: string): MemoryCandidateType {
    const lower = message.toLowerCase();
    if (lower.includes('prefer') || lower.includes('like') || lower.includes('don\'t like') || lower.includes('hate')) {
      return 'preference';
    }
    if (lower.includes('pattern') || lower.includes('convention') || lower.includes('always use') || lower.includes('never use')) {
      return 'convention';
    }
    if (lower.includes('how to') || lower.includes('steps') || lower.includes('procedure')) {
      return 'instruction';
    }
    return 'fact';
  }

  /**
   * Detect implicit memories — content worthy of persistence.
   */
  private detectImplicitMemories(
    userMessage: string,
    assistantMessage: string
  ): MemoryCandidate[] {
    const candidates: MemoryCandidate[] = [];

    // Heuristic: User provides substantial context (>50 chars, specific details)
    if (userMessage.length > 50 && this.containsFactualContent(userMessage)) {
      candidates.push({
        content: this.summarizeContent(userMessage, 200),
        type: 'context',
        confidence: 0.5,
        tags: this.extractTags(userMessage),
        category: this.classifyCategory(userMessage),
      });
    }

    // Heuristic: Assistant states a fact or convention explicitly
    const conventionPatterns = [
      /(?:in this project|here|we)\s+(?:use|follow|prefer)\s+(.+)/i,
      /the\s+(?:standard|convention|pattern)\s+is\s+(.+)/i,
      /(?:always|never)\s+(.+)/i,
    ];

    for (const pattern of conventionPatterns) {
      const match = assistantMessage.match(pattern);
      if (match && match[1]) {
        candidates.push({
          content: match[1].trim(),
          type: 'convention',
          confidence: 0.65,
          tags: ['convention'],
          category: 'project',
        });
      }
    }

    return candidates;
  }

  /**
   * Check if text contains factual/substantial content (not just questions or short phrases).
   */
  private containsFactualContent(text: string): boolean {
    // Must have at least one declarative sentence
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.length >= 1;
  }

  /**
   * Summarize content to a max length.
   */
  private summarizeContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength).trimEnd() + '...';
  }

  /**
   * Extract suggested tags from text.
   */
  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lower = text.toLowerCase();

    // Technology detection
    const techKeywords = ['typescript', 'javascript', 'react', 'next.js', 'python', 'rust', 'go', 'bun', 'node', 'prisma', 'postgresql'];
    for (const tech of techKeywords) {
      if (lower.includes(tech)) tags.push(tech);
    }

    return tags.slice(0, 5);
  }

  /**
   * Classify the category of content.
   */
  private classifyCategory(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('code') || lower.includes('function') || lower.includes('component') || lower.includes('api')) return 'code';
    if (lower.includes('design') || lower.includes('ui') || lower.includes('ux') || lower.includes('layout')) return 'design';
    if (lower.includes('test') || lower.includes('spec') || lower.includes('unit')) return 'testing';
    if (lower.includes('deploy') || lower.includes('server') || lower.includes('database')) return 'infrastructure';
    return 'general';
  }

  /**
   * Simple content hash for deduplication.
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `h_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Check if a memory with the same content hash already exists.
   */
  private async isDuplicate(hash: string, scope: 'project' | 'user' | 'team'): Promise<boolean> {
    const memories = await this.commands.list({ scopes: [scope] });
    return memories.some(m => m.meta.contentHash === hash);
  }
}
