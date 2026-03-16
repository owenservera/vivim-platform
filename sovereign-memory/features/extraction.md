# Memory Extraction

## Overview

Memory Extraction is the intelligent process of automatically identifying and capturing meaningful memories from your conversations, notes, and interactions. The system uses AI to analyze content and extract structured memories that help power personalized AI experiences.

---

## Extraction Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Memory Extraction Pipeline                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Input     │────►│   Analyze   │────►│   Extract   │      │
│  │  Content    │     │   Content   │     │  Candidates │      │
│  └─────────────┘     └─────────────┘     └──────┬──────┘      │
│                                                  │              │
│                                                  ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Store     │◄────│   Validate  │◄────│   Score &   │      │
│  │  Memories   │     │   & Filter  │     │   Rank      │      │
│  └─────────────┘     └─────────────┘     └─────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Input Sources

### 1. Conversations

Extract memories from AI chat conversations:

```typescript
interface ConversationExtractionInput {
  conversationId: string;
  messages: Message[];
  participants: {
    user: string;      // DID
    assistant: string; // AI model
  };
  
  // Extraction options
  options: {
    extractMemories: boolean;
    extractEntities: boolean;
    extractTopics: boolean;
    minConfidence: number;  // 0.0 - 1.0
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: ISO8601;
}
```

**Example:**

```
User: "I've been working as a software engineer for 10 years, mostly in Python and JavaScript."
Assistant: "That's great experience! What kind of projects do you work on?"
User: "Currently leading a team building a fintech platform in San Francisco."

Extracted Memories:
- IDENTITY: "Software engineer with 10 years of experience"
- PREFERENCE: "Works with Python and JavaScript"
- FACTUAL: "Based in San Francisco"
- PROJECT: "Leading a team building a fintech platform"
```

### 2. Notes & Documents

Extract memories from user-created content:

```typescript
interface DocumentExtractionInput {
  documentId: string;
  title: string;
  content: string;
  type: 'note' | 'document' | 'email' | 'article';
  createdAt: ISO8601;
  
  options: {
    extractKeyPoints: boolean;
    extractEntities: boolean;
    extractActions: boolean;
  };
}
```

### 3. Code & Technical Content

Extract procedural memories from code:

```typescript
interface CodeExtractionInput {
  fileId: string;
  filePath: string;
  language: string;
  code: string;
  comments: string[];
  
  options: {
    extractPatterns: boolean;
    extractTechnologies: boolean;
    extractWorkflows: boolean;
  };
}
```

---

## Memory Categories

The extraction engine identifies different types of memories:

### Identity & Background

```typescript
interface IdentityExtraction {
  type: 'IDENTITY';
  category: 'role' | 'bio' | 'skill' | 'experience';
  confidence: number;
  
  // Example extractions
  examples: [
    "Software engineer with 10 years of experience",
    "Based in San Francisco",
    "Leads a team of 5 developers",
    "Expert in Python and JavaScript"
  ];
}
```

**Extraction Patterns:**

```typescript
const identityPatterns = [
  // Role statements
  /I (?:work as|am a|'m a) ([a-zA-Z\s]+)/i,
  
  // Experience statements
  /(?:for|with) (\d+) years (?:of )?experience/i,
  
  // Location statements
  /(?:based in|live in|located in) ([a-zA-Z\s,]+)/i,
  
  // Skill statements
  /(?:expert in|specialize in|skilled at) ([a-zA-Z\s,]+)/i
];
```

### Preferences

```typescript
interface PreferenceExtraction {
  type: 'PREFERENCE';
  category: 'like' | 'dislike' | 'style' | 'requirement';
  confidence: number;
  
  examples: [
    "Prefers dark mode for coding",
    "Doesn't like meetings before 10 AM",
    "Prefers TypeScript over JavaScript",
    "Requires detailed comments in complex code"
  ];
}
```

**Extraction Patterns:**

```typescript
const preferencePatterns = [
  // Preference statements
  /I (?:prefer|like|love) ([^\.]+)/i,
  
  // Dislike statements
  /I (?:don't like|hate|dislike|can't stand) ([^\.]+)/i,
  
  // Style statements
  /I (?:always|usually|never) ([^\.]+)/i,
  
  // Requirement statements
  /I (?:need|require|must have) ([^\.]+)/i
];
```

### Goals & Plans

```typescript
interface GoalExtraction {
  type: 'GOAL';
  category: 'goal' | 'plan' | 'intention' | 'aspiration';
  confidence: number;
  timeframe?: 'short-term' | 'medium-term' | 'long-term';
  
  examples: [
    "Wants to learn machine learning in 2024",
    "Planning to migrate to microservices architecture",
    "Intends to improve test coverage to 80%",
    "Aspires to become a tech lead"
  ];
}
```

### Projects & Tasks

```typescript
interface ProjectExtraction {
  type: 'PROJECT';
  category: 'project' | 'task' | 'deliverable' | 'deadline';
  confidence: number;
  status?: 'active' | 'completed' | 'planned';
  
  examples: [
    "Working on user authentication feature",
    "Mobile app redesign in planning phase",
    "Need to deliver API documentation by end of month",
    "Infrastructure migration has 2 weeks remaining"
  ];
}
```

### Knowledge & Facts

```typescript
interface KnowledgeExtraction {
  type: 'SEMANTIC' | 'FACTUAL';
  category: 'knowledge' | 'fact' | 'concept' | 'understanding';
  confidence: number;
  domain?: string;
  
  examples: [
    "Python uses indentation to define code blocks",
    "React hooks must be called at the top level",
    "The API has a rate limit of 1000 requests per hour",
    "Database schema was last updated in January 2024"
  ];
}
```

### Procedures & Skills

```typescript
interface ProceduralExtraction {
  type: 'PROCEDURAL';
  category: 'howto' | 'skill' | 'workflow' | 'process';
  confidence: number;
  steps?: string[];
  
  examples: [
    "To restart the Node.js server, run Ctrl+C then npm start",
    "Deployment process: build → test → deploy to staging → verify → production",
    "When debugging React, start by checking component hierarchy in React DevTools",
    "Code review checklist: linting, tests, documentation, performance"
  ];
}
```

---

## Extraction Engine

### AI-Powered Extraction

Using LLMs to extract memories with high accuracy:

```typescript
interface ExtractionPrompt {
  systemPrompt: string;
  userPrompt: string;
  responseFormat: ResponseFormat;
}

const MEMORY_EXTRACTION_PROMPT = `You are an expert at extracting meaningful memories from AI conversations. Your task is to analyze the conversation and extract distinct, useful memories.

## Memory Types to Extract:

1. **Identity**: User's role, background, skills, experience
2. **Preferences**: Communication style, technical preferences, likes/dislikes
3. **Goals**: Stated goals, plans, intentions, aspirations
4. **Knowledge**: Factual statements, explanations, understandings
5. **Relationships**: Information about people, teams, organizations
6. **Projects**: Current or past projects, tasks, deliverables
7. **Procedures**: How-to knowledge, workflows, methods

## Output Format:

For each memory, provide:
{
  "content": "The actual memory (1-3 sentences)",
  "memoryType": "IDENTITY|PREFERENCE|GOAL|SEMANTIC|FACTUAL|PROCEDURAL|PROJECT|RELATIONSHIP",
  "category": "Specific category",
  "importance": 0.0-1.0,
  "confidence": 0.0-1.0,
  "tags": ["tag1", "tag2"],
  "evidence": ["Direct quote from conversation"]
}

## Rules:

- Only extract memories with confidence > 0.5
- Merge similar information into single memories
- Focus on personally relevant information
- Extract specific, actionable information
- Include evidence (direct quotes) for each memory

Conversation to analyze:
{conversation}
`;

async function extractMemoriesWithLLM(
  conversation: Message[]
): Promise<ExtractedMemory[]> {
  const response = await llmService.chat({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: MEMORY_EXTRACTION_PROMPT
      },
      {
        role: 'user',
        content: formatConversation(conversation)
      }
    ],
    response_format: { type: 'json_object' }
  });
  
  const result = JSON.parse(response.content);
  return result.memories.map(validateAndNormalizeMemory);
}
```

### Rule-Based Extraction

Fast, deterministic extraction for common patterns:

```typescript
interface RuleExtractor {
  pattern: RegExp;
  memoryType: MemoryType;
  category: string;
  transform: (match: RegExpMatchArray) => Partial<ExtractedMemory>;
}

const ruleExtractors: RuleExtractor[] = [
  {
    pattern: /I (?:work as|am a|'m a) ([a-zA-Z\s]+)/i,
    memoryType: 'IDENTITY',
    category: 'role',
    transform: (match) => ({
      content: `User works as ${match[1].trim()}`,
      importance: 0.8,
      confidence: 0.9
    })
  },
  {
    pattern: /I (?:prefer|like) ([^\.]+)/i,
    memoryType: 'PREFERENCE',
    category: 'like',
    transform: (match) => ({
      content: `User prefers ${match[1].trim()}`,
      importance: 0.6,
      confidence: 0.85
    })
  },
  {
    pattern: /I (?:want to|would like to|plan to) ([^\.]+)/i,
    memoryType: 'GOAL',
    category: 'goal',
    transform: (match) => ({
      content: `User wants to ${match[1].trim()}`,
      importance: 0.7,
      confidence: 0.8
    })
  }
];

function extractWithRules(text: string): ExtractedMemory[] {
  const memories: ExtractedMemory[] = [];
  
  for (const extractor of ruleExtractors) {
    const matches = text.matchAll(extractor.pattern);
    for (const match of matches) {
      const memory = extractor.transform(match);
      memories.push({
        ...memory,
        memoryType: extractor.memoryType,
        category: extractor.category,
        evidence: [match[0]]
      } as ExtractedMemory);
    }
  }
  
  return memories;
}
```

### Hybrid Extraction

Combine AI and rule-based extraction:

```typescript
async function hybridExtract(
  content: string
): Promise<ExtractedMemory[]> {
  // 1. Fast rule-based extraction
  const ruleMemories = extractWithRules(content);
  
  // 2. AI extraction for complex patterns
  const aiMemories = await extractMemoriesWithLLM(
    parseToMessages(content)
  );
  
  // 3. Merge and deduplicate
  const allMemories = [...ruleMemories, ...aiMemories];
  const merged = mergeSimilarMemories(allMemories);
  
  // 4. Filter by confidence
  return merged.filter(m => m.confidence > 0.5);
}
```

---

## Scoring & Ranking

### Confidence Scoring

```typescript
interface ConfidenceFactors {
  // Extraction method
  method: 'rule' | 'ai' | 'hybrid';
  methodConfidence: number;
  
  // Evidence quality
  evidenceCount: number;
  evidenceQuality: 'direct' | 'inferred' | 'implicit';
  
  // Content quality
  clarity: number;      // How clear/unambiguous
  specificity: number;  // How specific vs vague
  relevance: number;    // How relevant to user
  
  // Consistency
  consistentWithExisting: boolean;
  contradictionCount: number;
}

function calculateConfidence(
  factors: ConfidenceFactors
): number {
  let score = factors.methodConfidence;
  
  // Boost for multiple evidence pieces
  score += Math.min(0.1, factors.evidenceCount * 0.02);
  
  // Boost for direct evidence
  if (factors.evidenceQuality === 'direct') {
    score += 0.1;
  }
  
  // Boost for clarity and specificity
  score += (factors.clarity + factors.specificity) * 0.1;
  
  // Penalty for contradictions
  score -= factors.contradictionCount * 0.2;
  
  // Penalty for inconsistency
  if (!factors.consistentWithExisting) {
    score -= 0.1;
  }
  
  return Math.max(0, Math.min(1, score));
}
```

### Importance Scoring

```typescript
interface ImportanceFactors {
  memoryType: MemoryType;
  category: string;
  content: string;
  
  // User signals
  isPinned?: boolean;
  isExplicit?: boolean;  // User explicitly stated this
  
  // Content signals
  hasTemporalMarker: boolean;  // "currently", "planning to"
  hasIntensityMarker: boolean; // "always", "never", "strongly"
  isActionable: boolean;
}

function calculateImportance(
  factors: ImportanceFactors
): number {
  // Base importance by type
  const baseImportance: Record<MemoryType, number> = {
    'IDENTITY': 0.8,
    'PREFERENCE': 0.6,
    'GOAL': 0.7,
    'PROJECT': 0.6,
    'SEMANTIC': 0.5,
    'FACTUAL': 0.5,
    'PROCEDURAL': 0.6,
    'RELATIONSHIP': 0.7,
    'EPISODIC': 0.5
  };
  
  let score = baseImportance[factors.memoryType] || 0.5;
  
  // Boost for explicit statements
  if (factors.isExplicit) {
    score += 0.1;
  }
  
  // Boost for intensity markers
  if (factors.hasIntensityMarker) {
    score += 0.1;
  }
  
  // Boost for actionable content
  if (factors.isActionable) {
    score += 0.05;
  }
  
  // Cap at 1.0
  return Math.min(1.0, score);
}
```

---

## Validation & Filtering

### Validation Rules

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateMemory(
  memory: ExtractedMemory
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!memory.content || memory.content.trim().length === 0) {
    errors.push('Memory content is required');
  }
  
  if (!memory.memoryType) {
    errors.push('Memory type is required');
  }
  
  if (!memory.category) {
    errors.push('Memory category is required');
  }
  
  // Content length
  if (memory.content.length > 1000) {
    errors.push('Memory content too long (max 1000 characters)');
  }
  
  if (memory.content.length < 10) {
    warnings.push('Memory content is very short');
  }
  
  // Confidence threshold
  if (memory.confidence < 0.5) {
    warnings.push('Low confidence extraction');
  }
  
  // Importance range
  if (memory.importance < 0 || memory.importance > 1) {
    errors.push('Importance must be between 0 and 1');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

### Filtering Rules

```typescript
interface FilterConfig {
  minConfidence: number;
  minImportance: number;
  excludedTypes?: MemoryType[];
  excludedCategories?: string[];
  deduplicate: boolean;
}

function filterMemories(
  memories: ExtractedMemory[],
  config: FilterConfig
): ExtractedMemory[] {
  return memories.filter(memory => {
    // Confidence filter
    if (memory.confidence < config.minConfidence) {
      return false;
    }
    
    // Importance filter
    if (memory.importance < config.minImportance) {
      return false;
    }
    
    // Type filter
    if (config.excludedTypes?.includes(memory.memoryType)) {
      return false;
    }
    
    // Category filter
    if (config.excludedCategories?.includes(memory.category)) {
      return false;
    }
    
    return true;
  });
}
```

---

## Merging & Deduplication

### Merge Similar Memories

```typescript
interface MergeResult {
  mergedMemory: ExtractedMemory;
  sourceMemories: string[];  // IDs of merged memories
  mergeReason: string;
}

function mergeSimilarMemories(
  memories: ExtractedMemory[]
): ExtractedMemory[] {
  const merged: ExtractedMemory[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < memories.length; i++) {
    if (used.has(i)) continue;
    
    const current = memories[i];
    const similarIndices = findSimilarMemories(i, memories);
    
    if (similarIndices.length === 0) {
      merged.push(current);
    } else {
      // Merge with similar memories
      const similarMemories = [current, ...similarIndices.map(idx => memories[idx])];
      const mergedMemory = performMerge(similarMemories);
      merged.push(mergedMemory);
      
      used.add(i);
      similarIndices.forEach(idx => used.add(idx));
    }
  }
  
  return merged;
}

function findSimilarMemories(
  index: number,
  memories: ExtractedMemory[]
): number[] {
  const current = memories[index];
  const similar: number[] = [];
  
  for (let i = index + 1; i < memories.length; i++) {
    const other = memories[i];
    
    // Same type and category
    if (current.memoryType !== other.memoryType ||
        current.category !== other.category) {
      continue;
    }
    
    // High semantic similarity
    const similarity = calculateSemanticSimilarity(
      current.content,
      other.content
    );
    
    if (similarity > 0.85) {
      similar.push(i);
    }
  }
  
  return similar;
}
```

---

## Extraction Jobs

### Batch Extraction

```typescript
interface ExtractionJob {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Input
  input: {
    type: 'conversation' | 'document' | 'batch';
    sourceIds: string[];
  };
  
  // Progress
  progress: {
    total: number;
    processed: number;
    failed: number;
  };
  
  // Results
  results?: {
    extractedMemories: number;
    skippedItems: number;
  };
  
  // Metadata
  createdAt: ISO8601;
  startedAt?: ISO8601;
  completedAt?: ISO8601;
  error?: string;
}

async function createExtractionJob(
  userId: string,
  sourceIds: string[]
): Promise<ExtractionJob> {
  const job: ExtractionJob = {
    id: generateJobId(),
    userId,
    status: 'pending',
    input: {
      type: 'batch',
      sourceIds
    },
    progress: {
      total: sourceIds.length,
      processed: 0,
      failed: 0
    },
    createdAt: new Date().toISOString()
  };
  
  await extractionJobsStore.save(job);
  
  // Process asynchronously
  processExtractionJob(job).catch(console.error);
  
  return job;
}
```

---

## Implementation Reference

For implementation details, see the source code:

- **Extraction Engine**: `server/src/context/memory/memory-extraction-engine.ts`
- **Extraction Service**: `server/src/services/memory-extraction-service.ts`
- **Extraction Prompts**: `server/src/context/memory/memory-types.ts`
