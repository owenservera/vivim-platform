/**
 * Seed Factory Module
 * 
 * Provides factory functions for generating seed data with realistic,
 * Faker-powered mock data for all Prisma models.
 */

import { faker } from '@faker-js/faker';
import { createHash, randomUUID } from 'crypto';

// Re-export faker for use in seed files
export { faker };

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function uuid(): string {
  return randomUUID();
}

export function hash(str: string): string {
  return createHash('sha256').update(str).digest('hex');
}

export function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function hoursAgo(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// ============================================================================
// USER FACTORY
// ============================================================================

export interface UserData {
  did: string;
  displayName: string;
  handle: string;
  email: string;
  avatarUrl?: string;
  publicKey: string;
  verificationLevel?: number;
  trustScore?: number;
  settings?: Record<string, unknown>;
}

export function createUser(overrides: Partial<UserData> = {}): UserData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    did: `did:key:mock-${uuid().slice(0, 16)}`,
    displayName: `${firstName} ${lastName}`,
    handle: `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomInt(1, 99)}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    avatarUrl: faker.image.avatar(),
    publicKey: 'mock-public-key-' + uuid().slice(0, 16),
    verificationLevel: randomInt(0, 3),
    trustScore: randomFloat(60, 100),
    settings: { theme: 'dark' },
    ...overrides,
  };
}

// ============================================================================
// DEVICE FACTORY
// ============================================================================

export interface DeviceData {
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  platform: string;
  fingerprint: string;
  publicKey: string;
  isActive: boolean;
  isTrusted: boolean;
}

const DEVICE_TYPES = ['desktop', 'mobile', 'tablet', 'smartwatch'];
const PLATFORMS = ['ios', 'android', 'windows', 'macos', 'linux', 'web'];
const DEVICE_NAMES = [
  'MacBook Pro', 'iPhone 15 Pro', 'Samsung Galaxy S24', 'iPad Pro',
  'Windows Desktop', 'Linux Workstation', 'Chrome Browser', 'Safari Browser',
  'Pixel 8', 'OnePlus 12'
];

export function createDevice(userId: string, overrides: Partial<DeviceData> = {}): DeviceData {
  const platform = randomFrom(PLATFORMS);
  const deviceType = randomFrom(DEVICE_TYPES);
  
  return {
    userId,
    deviceId: uuid(),
    deviceName: randomFrom(DEVICE_NAMES),
    deviceType,
    platform,
    fingerprint: hash(uuid()),
    publicKey: 'device-key-' + uuid().slice(0, 16),
    isActive: true,
    isTrusted: Math.random() > 0.3,
    ...overrides,
  };
}

// ============================================================================
// CONVERSATION FACTORY
// ============================================================================

export interface ConversationData {
  id: string;
  provider: string;
  sourceUrl: string;
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  capturedAt: Date;
  messageCount: number;
  userMessageCount: number;
  aiMessageCount: number;
  totalWords: number;
  totalCharacters: number;
  totalCodeBlocks: number;
  totalImages: number;
  totalTables: number;
  totalLatexBlocks: number;
  totalMermaidDiagrams: number;
  totalToolCalls: number;
  tags: string[];
  ownerId?: string;
}

const PROVIDERS = {
  chatgpt: { name: 'ChatGPT', model: 'gpt-4o', baseUrl: 'https://chat.openai.com' },
  claude: { name: 'Claude', model: 'claude-3-5-sonnet', baseUrl: 'https://claude.ai' },
  gemini: { name: 'Gemini', model: 'gemini-1.5-pro', baseUrl: 'https://gemini.google.com' },
  deepseek: { name: 'DeepSeek', model: 'deepseek-coder', baseUrl: 'https://chat.deepseek.com' },
  grok: { name: 'Grok', model: 'grok-2', baseUrl: 'https://grok.com' },
  mistral: { name: 'Mistral', model: 'mistral-large', baseUrl: 'https://chat.mistral.ai' },
};

const TOPICS = {
  react: ['useState', 'useEffect', 'hooks', 'context', 'performance'],
  typescript: ['generics', 'types', 'interfaces', 'type-safety'],
  architecture: ['microservices', 'clean-code', 'ddd', 'cqrs'],
  postgres: ['pgvector', 'indexes', 'query-optimization'],
  startup: ['fundraising', 'pitch', 'mvp', 'metrics'],
  ai: ['llm', 'embeddings', 'rag', 'agents'],
};

export function createConversation(
  provider: keyof typeof PROVIDERS = 'chatgpt',
  overrides: Partial<ConversationData> = {}
): ConversationData {
  const p = PROVIDERS[provider];
  const topic = randomFrom(Object.keys(TOPICS));
  const subtopic = randomFrom(TOPICS[topic as keyof typeof TOPICS]);
  const id = uuid();
  const createdAt = daysAgo(randomInt(1, 180));
  const messageCount = randomInt(4, 20);
  
  return {
    id,
    provider,
    sourceUrl: `${p.baseUrl}/share/${id.slice(0, 8)}-${id.slice(8, 24)}`,
    title: `${faker.hacker.saySomething()} - ${topic} ${subtopic}`,
    model: p.model,
    createdAt,
    updatedAt: new Date(createdAt.getTime() + randomInt(15, 90) * 60 * 1000),
    capturedAt: new Date(),
    messageCount,
    userMessageCount: Math.ceil(messageCount / 2),
    aiMessageCount: Math.floor(messageCount / 2),
    totalWords: messageCount * randomInt(50, 200),
    totalCharacters: messageCount * randomInt(300, 1500),
    totalCodeBlocks: randomInt(0, 8),
    totalImages: randomInt(0, 3),
    totalTables: randomInt(0, 2),
    totalLatexBlocks: 0,
    totalMermaidDiagrams: randomInt(0, 2),
    totalToolCalls: randomInt(0, 3),
    tags: [topic, subtopic, provider],
    ownerId: undefined,
    ...overrides,
  };
}

// ============================================================================
// MESSAGE FACTORY
// ============================================================================

export interface MessageData {
  id: string;
  conversationId: string;
  role: string;
  author: string;
  parts: string;
  createdAt: Date;
  messageIndex: number;
  status: string;
  metadata: Record<string, unknown>;
}

const CODE_LANGS = ['typescript', 'javascript', 'python', 'rust', 'sql', 'bash', 'go', 'java'];
const USER_QUERIES = [
  'Can you help me understand {topic}?',
  "What's the best approach for {topic}?",
  'Show me an example of {topic} implementation',
  'How do I optimize {topic} for production?',
  "What's the difference between X and Y in {topic}?",
];

const AI_RESPONSES = [
  'Great question about {topic}! Here\'s a comprehensive explanation...\n\nThe key concept involves understanding the underlying principles.',
  'Here\'s a practical approach to {topic}:\n\nThe most effective strategy depends on your specific constraints.',
  'Let me show you a concrete example with code.',
];

export function createMessage(
  conversationId: string,
  index: number,
  createdAt: Date,
  topic: string,
  overrides: Partial<MessageData> = {}
): MessageData {
  const isUser = index % 2 === 0;
  const hasCode = !isUser && Math.random() > 0.5;
  
  let parts: object[];
  if (hasCode) {
    const lang = randomFrom(CODE_LANGS);
    parts = [
      { type: 'text', content: randomFrom(AI_RESPONSES).replace('{topic}', topic) },
      { type: 'code', language: lang, content: createCodeSnippet(lang) },
    ];
  } else {
    parts = [{
      type: 'text',
      content: isUser
        ? randomFrom(USER_QUERIES).replace('{topic}', topic)
        : randomFrom(AI_RESPONSES).replace('{topic}', topic),
    }];
  }

  return {
    id: uuid(),
    conversationId,
    role: isUser ? 'user' : 'assistant',
    author: isUser ? 'User' : 'AI Assistant',
    parts: JSON.stringify(parts),
    createdAt: new Date(createdAt.getTime() + index * randomInt(2, 8) * 60 * 1000),
    messageIndex: index,
    status: 'completed',
    metadata: {},
    ...overrides,
  };
}

function createCodeSnippet(lang: string): string {
  const snippets: Record<string, string[]> = {
    typescript: [
      `interface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nfunction createUser(data: Partial<User>): User {\n  return { id: crypto.randomUUID(), name: data.name ?? 'Anonymous', email: data.email ?? '' };\n}`,
      `type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };\n\nasync function fetchUser(id: string): Promise<Result<User>> {\n  try {\n    const response = await fetch(\`/api/users/\${id}\`);\n    return { ok: true, value: await response.json() };\n  } catch (error) {\n    return { ok: false, error: error as Error };\n  }\n}`,
    ],
    python: [
      `from dataclasses import dataclass\nfrom typing import Optional\n\n@dataclass\nclass User:\n    id: str\n    name: str\n    email: str\n\ndef create_user(name: str, email: str) -> User:\n    return User(id=str(uuid.uuid4()), name=name, email=email)`,
    ],
    rust: [
      `use std::sync::Arc;\n\npub struct Cache<K, V> {\n    data: Arc<HashMap<K, V>>,\n    ttl: Duration,\n}\n\nimpl<K: Clone + Hash + Eq, V: Clone> Cache<K, V> {\n    pub fn get(&self, key: &K) -> Option<V> {\n        self.data.get(key).cloned()\n    }\n}`,
    ],
    sql: [
      `-- Vector similarity search with pgvector\nSELECT id, content, 1 - (embedding <=> $1) AS similarity\nFROM memories\nWHERE 1 - (embedding <=> $1) > 0.7\nORDER BY embedding <=> $1\nLIMIT 10;`,
    ],
  };

  return randomFrom(snippets[lang] || snippets['typescript']);
}

// ============================================================================
// ATOMIC CHAT UNIT (ACU) FACTORY
// ============================================================================

export interface ACUData {
  id: string;
  authorDid: string;
  content: string;
  language: string | null;
  type: string;
  category: string;
  conversationId: string;
  messageId: string;
  messageIndex: number;
  provider: string;
  model: string;
  sourceTimestamp: Date;
  signature: Buffer;
  embedding: number[];
  qualityOverall: number;
  contentRichness: number;
  structuralIntegrity: number;
  uniqueness: number;
  sharingPolicy: string;
  sharingCircles: string[];
  rediscoveryScore: number;
}

export function createACU(
  conversationId: string,
  messageId: string,
  messageIndex: number,
  content: string,
  provider: string,
  model: string,
  sourceTimestamp: Date,
  authorDid: string,
  overrides: Partial<ACUData> = {}
): ACUData {
  const hasCode = content.includes('```') || /function|const|let|def|class/i.test(content);
  const isQuestion = content.includes('?') && /what|how|why|can|should/i.test(content);
  const isAnswer = /the answer|therefore|conclusion|in summary/i.test(content);
  
  const quality = 60 + Math.min(content.length / 100, 20) + (hasCode ? 15 : 0) + (isQuestion ? 10 : 0);

  return {
    id: hash(content + conversationId + messageId),
    authorDid,
    content: content.substring(0, 1000),
    language: hasCode ? 'typescript' : null,
    type: hasCode ? 'code_snippet' : isQuestion ? 'question' : isAnswer ? 'answer' : 'statement',
    category: 'technical',
    conversationId,
    messageId,
    messageIndex,
    provider,
    model,
    sourceTimestamp,
    signature: Buffer.from('demo-sig-' + uuid().slice(0, 16)),
    embedding: [],
    qualityOverall: Math.min(quality, 100),
    contentRichness: Math.min(quality, 100),
    structuralIntegrity: randomFloat(85, 95),
    uniqueness: randomFloat(70, 95),
    sharingPolicy: 'self',
    sharingCircles: [],
    rediscoveryScore: Math.random() > 0.7 ? randomFloat(0.6, 1.0) : randomFloat(0, 0.5),
    ...overrides,
  };
}

// ============================================================================
// MEMORY FACTORY
// ============================================================================

export interface MemoryData {
  userId: string;
  content: string;
  summary?: string;
  provenanceId?: string;
  provider?: string;
  sourceUrl?: string;
  sourceType: string;
  memoryType: string;
  category: string;
  tags: string[];
  importance: number;
  relevance: number;
  consolidationStatus: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verificationSource?: string;
  isActive: boolean;
  isPinned: boolean;
  occurredAt?: Date;
  validFrom?: Date;
}

const MEMORY_TYPES = ['EPISODIC', 'SEMANTIC', 'PROCEDURAL', 'FACTUAL', 'PREFERENCE', 'IDENTITY', 'RELATIONSHIP', 'GOAL'];
const MEMORY_TEMPLATES = {
  PREFERENCE: [
    'Prefers {tech} over alternatives for {useCase}',
    'Always uses {tech} for {context}',
    'Dislikes {tech} due to {reason}',
  ],
  FACTUAL: [
    'Works at {company} as {role}',
    'Has {years} years of experience in {field}',
    'Lives in {location}',
  ],
  IDENTITY: [
    'Is a {role} specializing in {field}',
    'Background in {field} with focus on {focus}',
    'Self-described {descriptor}',
  ],
  GOAL: [
    'Working towards {goal}',
    'Planning to {action} by {deadline}',
    'Interested in learning {skill}',
  ],
  EPISODIC: [
    'Met with {person} to discuss {topic}',
    'Attended {event} and learned about {insight}',
    'Completed {task} using {approach}',
  ],
};

export function createMemory(
  userId: string,
  overrides: Partial<MemoryData> = {}
): MemoryData {
  const memoryType = randomFrom(MEMORY_TYPES) as keyof typeof MEMORY_TEMPLATES;
  const templates = MEMORY_TEMPLATES[memoryType as keyof typeof MEMORY_TEMPLATES] || MEMORY_TEMPLATES.FACTUAL;
  const template = randomFrom(templates);
  
  const content = template
    .replace('{tech}', randomFrom(['TypeScript', 'Python', 'Rust', 'React', 'PostgreSQL']))
    .replace('{useCase}', randomFrom(['frontend', 'backend', 'data processing', 'API development']))
    .replace('{context}', randomFrom(['new projects', 'prototyping', 'production']))
    .replace('{reason}', randomFrom(['complexity', 'performance issues', 'maintenance burden']))
    .replace('{company}', randomFrom(['Stripe', 'Google', 'Meta', 'Airbnb', 'Vercel']))
    .replace('{role}', randomFrom(['software engineer', 'product manager', 'designer']))
    .replace('{years}', String(randomInt(2, 15)))
    .replace('{field}', randomFrom(['software development', 'machine learning', 'distributed systems']))
    .replace('{location}', randomFrom(['San Francisco', 'New York', 'London', 'Berlin']))
    .replace('{descriptor}', randomFrom(['full-stack developer', 'backend specialist', 'devops engineer']))
    .replace('{goal}', randomFrom(['building a startup', 'learning AI', 'improving skills']))
    .replace('{action}', randomFrom(['launch product', 'get promotion', 'write article']))
    .replace('{deadline}', randomFrom(['Q2', 'end of year', 'next month']))
    .replace('{skill}', randomFrom(['Rust', 'Kubernetes', 'system design']))
    .replace('{person}', randomFrom(['Jordan', 'Sarah', 'Marcus']))
    .replace('{topic}', randomFrom(['fundraising', 'product', 'engineering']))
    .replace('{event}', randomFrom(['conference', 'meetup', 'workshop']))
    .replace('{insight}', randomFrom(['new trends', 'best practices', 'emerging tools']))
    .replace('{task}', randomFrom(['migration', 'refactoring', 'optimization']))
    .replace('{approach}', randomFrom(['incremental changes', 'big bang', 'parallel run']));

  const importance = randomFloat(0.3, 0.95);

  return {
    userId,
    content,
    summary: content.substring(0, 100) + '...',
    provenanceId: uuid(),
    provider: randomFrom(['chatgpt', 'claude', 'gemini', 'deepseek']),
    sourceType: 'conversation',
    memoryType,
    category: memoryType.toLowerCase(),
    tags: [memoryType.toLowerCase(), 'seed'],
    importance,
    relevance: randomFloat(0.5, 0.9),
    consolidationStatus: Math.random() > 0.3 ? 'CONSOLIDATED' : randomFrom(['RAW', 'CONSOLIDATING']),
    isVerified: Math.random() > 0.5,
    verifiedAt: Math.random() > 0.5 ? daysAgo(randomInt(1, 30)) : undefined,
    verificationSource: Math.random() > 0.5 ? 'explicit' : undefined,
    isActive: true,
    isPinned: importance > 0.85,
    occurredAt: daysAgo(randomInt(1, 180)),
    validFrom: daysAgo(randomInt(30, 180)),
    ...overrides,
  };
}

// ============================================================================
// CAPTURE ATTEMPT FACTORY
// ============================================================================

export interface CaptureAttemptData {
  sourceUrl: string;
  provider?: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  errorStack?: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
  conversationId?: string;
  retryCount: number;
  retryOf?: string;
}

const CAPTURE_ERRORS = [
  { code: 'AUTH_REQUIRED', message: 'Authentication required to access this conversation' },
  { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
  { code: 'INVALID_URL', message: 'The provided URL is not a valid conversation link' },
  { code: 'SESSION_EXPIRED', message: 'Your session has expired. Please log in again.' },
  { code: 'CONTENT_UNAVAILABLE', message: 'This conversation is no longer available' },
  { code: 'PARSE_ERROR', message: 'Failed to parse conversation structure' },
  { code: 'NETWORK_ERROR', message: 'Network connection failed' },
  { code: 'TIMEOUT', message: 'Request timed out after 30 seconds' },
];

export function createCaptureAttempt(
  sourceUrl: string,
  overrides: Partial<CaptureAttemptData> = {}
): CaptureAttemptData {
  const startedAt = hoursAgo(randomInt(1, 168));
  const status = randomFrom(['success', 'success', 'success', 'failed', 'partial']); // Weighted toward success
  const errorInfo = randomFrom(CAPTURE_ERRORS);

  return {
    sourceUrl,
    provider: new URL(sourceUrl).hostname.split('.')[0],
    status: status === 'success' ? 'completed' : status === 'partial' ? 'partial' : 'failed',
    errorCode: status !== 'success' ? errorInfo.code : undefined,
    errorMessage: status !== 'success' ? errorInfo.message : undefined,
    errorStack: status === 'failed' ? `Error: ${errorInfo.message}\n    at CaptureService.capture (capture.ts:142)\n    at async processRequest (server.ts:89)` : undefined,
    startedAt,
    completedAt: new Date(startedAt.getTime() + randomInt(1, 30) * 1000),
    duration: randomInt(1, 30) * 1000,
    ipAddress: faker.internet.ip(),
    userAgent: faker.internet.userAgent(),
    conversationId: status === 'success' ? uuid() : undefined,
    retryCount: status === 'failed' ? randomInt(1, 3) : 0,
    retryOf: undefined,
    ...overrides,
  };
}

// ============================================================================
// SYNC FACTORY
// ============================================================================

export interface SyncCursorData {
  userId: string;
  deviceDid: string;
  tableName: string;
  lastSyncId?: string;
  lastSyncAt: Date;
  vectorClock: Record<string, number>;
}

export interface SyncOperationData {
  authorDid: string;
  deviceDid: string;
  tableName: string;
  recordId: string;
  entityType?: string;
  entityId?: string;
  operation: string;
  payload: Record<string, unknown>;
  hlcTimestamp: string;
  vectorClock: Record<string, number>;
  isProcessed: boolean;
}

const SYNC_TABLE_NAMES = ['conversations', 'messages', 'memories', 'acu_links', 'notebooks'];

export function createSyncCursor(userId: string, deviceDid: string, overrides: Partial<SyncCursorData> = {}): SyncCursorData {
  return {
    userId,
    deviceDid,
    tableName: randomFrom(SYNC_TABLE_NAMES),
    lastSyncId: uuid(),
    lastSyncAt: hoursAgo(randomInt(1, 72)),
    vectorClock: { [deviceDid]: Date.now() },
    ...overrides,
  };
}

export function createSyncOperation(authorDid: string, deviceDid: string, overrides: Partial<SyncOperationData> = {}): SyncOperationData {
  const tableName = randomFrom(SYNC_TABLE_NAMES);
  const operation = randomFrom(['CREATE', 'UPDATE', 'DELETE']);
  
  return {
    authorDid,
    deviceDid,
    tableName,
    recordId: uuid(),
    entityType: tableName,
    entityId: uuid(),
    operation,
    payload: { data: faker.lorem.sentence(), timestamp: Date.now() },
    hlcTimestamp: `${Date.now()}-${deviceDid.slice(0, 8)}`,
    vectorClock: { [deviceDid]: Date.now() },
    isProcessed: Math.random() > 0.1,
    ...overrides,
  };
}

// ============================================================================
// IMPORT FACTORY
// ============================================================================

export interface ImportJobData {
  userId?: string;
  status: string;
  tierConfig: Record<string, boolean>;
  currentTier?: string;
  sourceProvider: string;
  format: string;
  fileHash: string;
  fileName: string;
  fileSize: number;
  totalConversations: number;
  processedConversations: number;
  failedConversations: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ImportedConversationData {
  importJobId: string;
  sourceId: string;
  sourceUrl?: string;
  title: string;
  provider: string;
  state: string;
  messageCount: number;
  importedAt?: Date;
}

export function createImportJob(userId: string | undefined, overrides: Partial<ImportJobData> = {}): ImportJobData {
  const formats = ['json', 'html', 'markdown', 'csv'];
  const providers = ['chatgpt', 'claude', 'gemini', 'claude', 'chatgpt'];
  
  return {
    userId,
    status: randomFrom(['PENDING', 'PROCESSING', 'COMPLETED', 'COMPLETED', 'FAILED']),
    tierConfig: { TIER_0: true, TIER_1: true, TIER_2: Math.random() > 0.3, TIER_3: Math.random() > 0.5 },
    sourceProvider: randomFrom(providers),
    format: randomFrom(formats),
    fileHash: hash(uuid()),
    fileName: `${faker.lorem.word()}_export.${randomFrom(formats)}`,
    fileSize: randomInt(100000, 5000000),
    totalConversations: randomInt(5, 100),
    processedConversations: 0,
    failedConversations: 0,
    startedAt: hoursAgo(randomInt(1, 48)),
    completedAt: undefined,
    ...overrides,
  };
}

export function createImportedConversation(
  importJobId: string,
  overrides: Partial<ImportedConversationData> = {}
): ImportedConversationData {
  const provider = randomFrom(['chatgpt', 'claude', 'gemini']);
  const states = ['VALIDATING', 'STORED', 'ACU_GENERATED', 'MEMORY_EXTRACTED', 'COMPLETED'];
  
  return {
    importJobId,
    sourceId: uuid(),
    sourceUrl: `https://${provider}.ai/share/${uuid().slice(0, 8)}`,
    title: faker.lorem.sentence({ min: 3, max: 8 }),
    provider,
    state: randomFrom(states),
    messageCount: randomInt(5, 50),
    importedAt: hoursAgo(randomInt(1, 24)),
    ...overrides,
  };
}

// ============================================================================
// MEMORY CONFLICT FACTORY
// ============================================================================

export interface MemoryConflictData {
  userId: string;
  memoryId1: string;
  memoryId2: string;
  conflictType: string;
  confidence: number;
  explanation: string;
  suggestedResolution: string;
  isResolved: boolean;
  resolvedAt?: Date;
  resolutionMethod?: string;
  resolvedBy?: string;
}

const CONFLICT_TYPES = ['contradiction', 'outdated', 'duplicate'];
const RESOLUTIONS = ['merge', 'archive', 'keep_newest', 'manual'];

export function createMemoryConflict(userId: string, overrides: Partial<MemoryConflictData> = {}): MemoryConflictData {
  const conflictType = randomFrom(CONFLICT_TYPES);
  
  return {
    userId,
    memoryId1: uuid(),
    memoryId2: uuid(),
    conflictType,
    confidence: randomFloat(0.5, 0.95),
    explanation: `Detected ${conflictType} between two memories about the same topic. ` +
      `One memory suggests ${faker.lorem.sentence()} while another indicates ${faker.lorem.sentence()}.`,
    suggestedResolution: randomFrom(RESOLUTIONS),
    isResolved: Math.random() > 0.6,
    resolvedAt: undefined,
    resolutionMethod: undefined,
    resolvedBy: undefined,
    ...overrides,
  };
}

// ============================================================================
// EDGE CASE FACTORIES
// ============================================================================

/**
 * Create empty/minimal state data
 */
export function createEmptyUser(overrides: Partial<UserData> = {}): UserData {
  return {
    did: `did:key:empty-${uuid().slice(0, 8)}`,
    displayName: 'New User',
    handle: 'newuser',
    email: 'newuser@example.com',
    publicKey: 'empty-key',
    ...overrides,
  };
}

/**
 * Create user with suspended status
 */
export function createSuspendedUser(overrides: Partial<UserData> = {}): UserData {
  return createUser({
    settings: { status: 'SUSPENDED', suspensionReason: 'Terms of service violation' },
    trustScore: 0,
    ...overrides,
  });
}

/**
 * Create failing capture attempt with max retries
 */
export function createFailingCaptureAttempt(sourceUrl: string): CaptureAttemptData {
  return createCaptureAttempt(sourceUrl, {
    status: 'failed',
    retryCount: 3,
    errorCode: 'MAX_RETRIES_EXCEEDED',
    errorMessage: 'Failed after maximum retry attempts',
    completedAt: hoursAgo(1),
    duration: 90000,
  });
}

/**
 * Create long-running import job
 */
export function createLongRunningImportJob(userId: string): ImportJobData {
  return createImportJob(userId, {
    status: 'PROCESSING',
    currentTier: 'TIER_2',
    processedConversations: 45,
    startedAt: hoursAgo(2),
    completedAt: undefined,
  });
}
