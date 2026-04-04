import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { createHash } from 'crypto';
import { randomUUID } from 'crypto';
import {
  faker,
  createUser,
  createDevice,
  createConversation,
  createMessage,
  createACU,
  createMemory,
  createCaptureAttempt,
  createSyncCursor,
  createSyncOperation,
  createImportJob,
  createImportedConversation,
  createMemoryConflict,
  createEmptyUser,
  uuid,
  daysAgo,
  hoursAgo,
  randomInt,
  randomFloat,
} from './factories/seed-factory';

const connectionString = process.env.DATABASE_URL || 'postgresql://openscroll:openscroll_dev_password@localhost:5432/openscroll';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, errorFormat: 'minimal' });

interface SeedConfig {
  focus?: string;
  conversations?: number;
  providerOverrides?: Partial<Record<keyof typeof PROVIDERS, number>>;
  topicSlugs?: string[];
  memoryDepth?: 'light' | 'medium' | 'heavy';
}

const DEFAULT_CONFIG: SeedConfig = {
  focus: 'default',
  conversations: 320,
  memoryDepth: 'heavy',
};

function parseArgs(): SeedConfig {
  const args = process.argv.slice(2);
  const config: SeedConfig = { ...DEFAULT_CONFIG };

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--list-focuses')) {
    printFocusList();
    process.exit(0);
  }

  const focusArg = args.find(a => a.startsWith('--focus='));
  if (focusArg) {
    config.focus = focusArg.split('=')[1];
  }

  const convArg = args.find(a => a.startsWith('--conversations='));
  if (convArg) {
    const n = parseInt(convArg.split('=')[1], 10);
    if (!isNaN(n) && n > 0) config.conversations = n;
  }

  const depthArg = args.find(a => a.startsWith('--memory-depth='));
  if (depthArg) {
    const d = depthArg.split('=')[1] as 'light' | 'medium' | 'heavy';
    if (['light', 'medium', 'heavy'].includes(d)) config.memoryDepth = d;
  }

  return config;
}

function printHelp() {
  console.log(`
VIVIM Investor Seed Script

Usage:
  bun run prisma/seed-investor.ts [options]

Options:
  --focus=<id>         Focus area for tailored seed data
                       Available: knowledgeGraph, coreCapture, contextEngine,
                       forYouFeed, identityStorage, socialSharing, aiNative, fullJourney
  --conversations=N    Override total conversation count (default: 320)
  --memory-depth=<d>   Memory density: light, medium, heavy (default: heavy)
  --list-focuses       Show all available focus areas
  --help, -h           Show this help message

Examples:
  bun run prisma/seed-investor.ts                      # Full seed (320 convs)
  bun run prisma/seed-investor.ts --focus=knowledgeGraph   # Knowledge graph demo
  bun run prisma/seed-investor.ts --focus=coreCapture --conversations=200
`);
}

function printFocusList() {
  console.log('\nAvailable focus areas:');
  for (const [id, cfg] of Object.entries(FOCUS_SEED_CONFIGS)) {
    console.log(`  ${id.padEnd(20)} — ${cfg.description}`);
  }
  console.log('');
}

const FOCUS_SEED_CONFIGS: Record<string, {
  description: string;
  providers: Partial<Record<keyof typeof PROVIDERS, number>>;
  topicSlugs: string[];
  conversationMultiplier: number;
}> = {
  knowledgeGraph: {
    description: 'Knowledge graph & ACU relationships (heaviest topics)',
    providers: { chatgpt: 80, claude: 70, gemini: 40, deepseek: 30, grok: 20, mistral: 20 },
    topicSlugs: ['react', 'typescript', 'architecture', 'postgres', 'system_design', 'ai'],
    conversationMultiplier: 1.0,
  },
  coreCapture: {
    description: 'Multi-provider capture across all 6 providers',
    providers: { chatgpt: 60, claude: 50, gemini: 50, deepseek: 40, grok: 30, mistral: 30 },
    topicSlugs: ['react', 'typescript', 'startup', 'ai', 'career'],
    conversationMultiplier: 1.0,
  },
  contextEngine: {
    description: 'Deep context engine (memory-heavy, fewer providers)',
    providers: { chatgpt: 60, claude: 60, gemini: 40, deepseek: 20, grok: 10, mistral: 10 },
    topicSlugs: ['react', 'typescript', 'architecture', 'startup', 'ai'],
    conversationMultiplier: 0.75,
  },
  forYouFeed: {
    description: 'For You feed (topic diversity)',
    providers: { chatgpt: 70, claude: 60, gemini: 40, deepseek: 30, grok: 20, mistral: 20 },
    topicSlugs: ['react', 'typescript', 'startup', 'career', 'system_design'],
    conversationMultiplier: 0.9,
  },
  identityStorage: {
    description: 'Identity & storage (light seed, identity focus)',
    providers: { chatgpt: 50, claude: 40, gemini: 30, deepseek: 20, grok: 10, mistral: 10 },
    topicSlugs: ['startup', 'ai', 'react'],
    conversationMultiplier: 0.5,
  },
  socialSharing: {
    description: 'Social & sharing (circles, groups, friendships)',
    providers: { chatgpt: 50, claude: 50, gemini: 40, deepseek: 30, grok: 20, mistral: 10 },
    topicSlugs: ['startup', 'react', 'ai', 'system_design', 'career'],
    conversationMultiplier: 0.8,
  },
  aiNative: {
    description: 'AI native features (VIVIM AI, BYOK)',
    providers: { chatgpt: 70, claude: 60, gemini: 40, deepseek: 30, grok: 10, mistral: 30 },
    topicSlugs: ['react', 'typescript', 'architecture', 'startup', 'ai'],
    conversationMultiplier: 0.9,
  },
  fullJourney: {
    description: 'Full demo (maximum data across everything)',
    providers: { chatgpt: 90, claude: 80, gemini: 50, deepseek: 40, grok: 30, mistral: 30 },
    topicSlugs: ['react', 'typescript', 'architecture', 'postgres', 'startup', 'ai', 'system_design', 'career', 'rust', 'python'],
    conversationMultiplier: 1.0,
  },
};

const DEMO_USER = {
  did: 'did:key:demo-alex-chen',
  displayName: 'Alex Chen',
  handle: 'alexchen',
  email: 'alex@vivimdemo.io',
  avatarUrl: 'https://i.pravatar.cc/150?u=alex-chen-dev',
  trustScore: 92,
  settings: { theme: 'dark', developerMode: true, defaultView: 'timeline' },
  verificationLevel: 2,
};

interface ConversationData {
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
}

interface MessageData {
  id: string;
  role: string;
  author: string;
  parts: string;
  createdAt: Date;
  messageIndex: number;
  status: string;
  metadata: Record<string, unknown>;
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
  react: ['useState', 'useEffect', 'hooks', 'context', 'reducer', 'components', 'performance', 'testing'],
  typescript: ['generics', 'types', 'interfaces', 'type-safety', 'decorators', 'utility-types'],
  architecture: ['microservices', 'monolith', 'clean-code', 'ddd', 'cqrs', 'event-sourcing'],
  postgres: ['pgvector', 'indexes', 'query-optimization', 'schema-design', 'partitioning', 'replication'],
  rust: ['ownership', 'borrowing', 'lifetimes', 'traits', 'async', 'wasm'],
  python: ['pandas', 'numpy', 'pytorch', 'fastapi', 'async'],
  startup: ['fundraising', 'pitch', 'mvp', 'product-market-fit', 'growth', 'metrics'],
  ai: ['llm', 'embeddings', 'rag', 'fine-tuning', 'agents', 'vector-db'],
  system_design: ['scalability', 'caching', 'load-balancing', 'cdn', 'databases'],
  career: ['interviews', 'negotiation', 'leadership', 'remote-work'],
};

const TECH_COMPANIES = ['Google', 'Stripe', 'Meta', 'Amazon', 'Netflix', 'Airbnb', 'Uber', 'Notion', 'Linear', 'Vercel'];
const CONV_TOPICS = [
  ...Object.entries(TOPICS).map(([k, v]) => v.map(t => ({ topic: k, subtopic: t }))).flat(),
];

function generateSourceUrl(provider: string, id: string): string {
  const urls: Record<string, string> = {
    chatgpt: `https://chat.openai.com/share/${id.slice(0, 8)}-${id.slice(8, 24)}`,
    claude: `https://claude.ai/share/${id.slice(0, 8)}-${id.slice(8, 24)}`,
    gemini: `https://gemini.google.com/share/${id.slice(0, 8)}`,
    deepseek: `https://chat.deepseek.com/share/${id.slice(0, 16)}`,
    grok: `https://grok.com/share/${id.slice(0, 8)}`,
    mistral: `https://chat.mistral.ai/share/${id.slice(0, 16)}`,
  };
  return urls[provider] || `https://example.com/${id}`;
}

function generateConversation(
  provider: keyof typeof PROVIDERS,
  topic: { topic: string; subtopic: string },
  daysOffset: number,
  quality: 'high' | 'medium' | 'low'
): { conv: ConversationData; messages: MessageData[] } {
  const id = uuid();
  const p = PROVIDERS[provider];
  const createdAt = daysAgo(daysOffset);
  const duration = quality === 'high' ? randomInt(30, 90) : quality === 'medium' ? randomInt(15, 45) : randomInt(5, 20);
  const updatedAt = new Date(createdAt.getTime() + duration * 60 * 1000);
  const capturedAt = new Date(updatedAt.getTime() + randomInt(1, 5) * 60 * 1000);

  const msgCount = quality === 'high' ? randomInt(8, 20) : quality === 'medium' ? randomInt(4, 12) : randomInt(2, 6);
  const userCount = Math.ceil(msgCount / 2);
  const aiCount = msgCount - userCount;

  const titleMap: Record<string, string[]> = {
    react: ['Building a React Component Library', 'React Performance Optimization', 'useEffect Deep Dive', 'State Management Patterns', 'React Server Components'],
    typescript: ['TypeScript Generics Mastery', 'Advanced Type Patterns', 'Type Safety in Production', 'Custom Utility Types', 'TypeScript Compiler Options'],
    architecture: ['System Architecture Review', 'Microservices vs Monolith', 'Clean Architecture Implementation', 'Event-Driven Design', 'API Design Principles'],
    postgres: ['PostgreSQL Performance Tuning', 'Index Optimization Strategies', 'pgvector for Semantic Search', 'Database Schema Design', 'Query Planning Deep Dive'],
    rust: ['Rust Ownership Model', 'Async Rust Patterns', 'Building CLI Tools in Rust', 'Memory Safety Techniques', 'Rust Web Development'],
    python: ['Python Data Processing', 'FastAPI Best Practices', 'Async Python Patterns', 'ML Pipeline Design', 'Python Performance'],
    startup: ['Fundraising Strategy', 'Pitch Deck Review', 'Product Roadmap Planning', 'Building in Public', 'Metrics That Matter'],
    ai: ['LLM Integration Patterns', 'RAG Architecture', 'Embedding Models Comparison', 'AI Agent Design', 'Prompt Engineering'],
    system_design: ['Scalability Patterns', 'Caching Strategies', 'Distributed Systems', 'CDN Configuration', 'Database Selection'],
    career: ['Interview Preparation', 'Salary Negotiation', 'Leadership Skills', 'Remote Work Balance', 'Career Growth'],
  };

  const titles = titleMap[topic.topic] || ['Technical Discussion'];
  const title = randomFrom(titles);

  const codeBlocks = quality === 'high' ? randomInt(2, 8) : quality === 'medium' ? randomInt(1, 4) : randomInt(0, 2);
  const images = topic.topic === 'ai' ? randomInt(0, 3) : 0;
  const tables = quality === 'high' ? randomInt(0, 2) : 0;
  const diagrams = quality === 'high' && (topic.topic === 'architecture' || topic.topic === 'system_design') ? randomInt(0, 2) : 0;

  const conv: ConversationData = {
    id,
    provider,
    sourceUrl: generateSourceUrl(provider, id),
    title,
    model: p.model,
    createdAt,
    updatedAt,
    capturedAt,
    messageCount: msgCount,
    userMessageCount: userCount,
    aiMessageCount: aiCount,
    totalWords: quality === 'high' ? randomInt(800, 3000) : quality === 'medium' ? randomInt(300, 1000) : randomInt(100, 400),
    totalCharacters: quality === 'high' ? randomInt(5000, 20000) : quality === 'medium' ? randomInt(2000, 8000) : randomInt(500, 2000),
    totalCodeBlocks: codeBlocks,
    totalImages: images,
    totalTables: tables,
    totalLatexBlocks: 0,
    totalMermaidDiagrams: diagrams,
    totalToolCalls: topic.topic === 'ai' ? randomInt(0, 3) : 0,
    tags: [topic.topic, topic.subtopic, provider],
  };

  const messages: MessageData[] = [];
  const codeLangs = ['typescript', 'javascript', 'python', 'rust', 'sql', 'bash', 'json', 'yaml', 'go'];

  for (let i = 0; i < msgCount; i++) {
    const isUser = i % 2 === 0;
    const role = isUser ? 'user' : 'assistant';
    const author = isUser ? 'Alex' : p.name;

    const userQueries = [
      `Can you help me understand ${topic.subtopic} in ${topic.topic}?`,
      `What's the best approach for ${topic.subtopic}?`,
      `Show me an example of ${topic.subtopic} implementation`,
      `How do I optimize ${topic.subtopic} for production?`,
      `What's the difference between X and Y in ${topic.subtopic}?`,
      `Can you explain ${topic.subtopic} in detail?`,
      `Help me debug this ${topic.subtopic} issue`,
      `What's the recommended pattern for ${topic.subtopic}?`,
    ];

    const aiResponses = [
      `Great question about ${topic.subtopic}! Here's a comprehensive explanation...\n\nThe key concept here involves understanding the underlying principles. Let me break it down:\n\n1. First principle: Always consider the tradeoffs\n2. Second principle: Performance matters\n3. Third principle: Maintainability is key`,
      `Here's a practical approach to ${topic.subtopic}:\n\nThe most effective strategy depends on your specific constraints, but generally you want to:\n\n- Start with the simplest solution\n- Measure before optimizing\n- Iterate based on real data`,
      `Let me show you a concrete example:\n\n\`\`\`${randomFrom(codeLangs)}\n// Example implementation\nfunction example() {\n  return "Hello, World!";\n}\n\`\`\`\n\nThis pattern is commonly used because it's both simple and effective.`,
    ];

    const codeSnippet = codeBlocks > 0 && !isUser && Math.random() > 0.5;
    let parts: object[];

    if (codeSnippet) {
      const lang = randomFrom(codeLangs);
      parts = [
        { type: 'text', content: randomFrom(aiResponses) },
        { type: 'code', language: lang, content: generateCodeSnippet(lang, topic) },
      ];
    } else {
      parts = [{ type: 'text', content: isUser ? randomFrom(userQueries) : randomFrom(aiResponses) }];
    }

    messages.push({
      id: uuid(),
      role,
      author,
      parts: JSON.stringify(parts),
      createdAt: new Date(createdAt.getTime() + i * randomInt(2, 8) * 60 * 1000),
      messageIndex: i,
      status: 'completed',
      metadata: {},
    });
  }

  return { conv, messages };
}

function generateCodeSnippet(lang: string, topic: { topic: string; subtopic: string }): string {
  const snippets: Record<string, string[]> = {
    typescript: [
      `interface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\ntype UserRole = 'admin' | 'user' | 'guest';\n\nfunction createUser(data: Partial<User>): User {\n  return {\n    id: crypto.randomUUID(),\n    name: data.name ?? 'Anonymous',\n    email: data.email ?? '',\n  };\n}`,
      `type Result<T, E = Error> = \n  | { ok: true; value: T }\n  | { ok: false; error: E };\n\nasync function fetchUser(id: string): Promise<Result<User>> {\n  try {\n    const response = await fetch(\`/api/users/\${id}\`);\n    return { ok: true, value: await response.json() };\n  } catch (error) {\n    return { ok: false, error: error as Error };\n  }\n}`,
    ],
    python: [
      `from dataclasses import dataclass\nfrom typing import Optional\nimport asyncio\n\n@dataclass\nclass User:\n    id: str\n    name: str\n    email: str\n    \ndef create_user(name: str, email: str) -> User:\n    return User(\n        id=uuid.uuid4().hex,\n        name=name,\n        email=email\n    )\n\nasync def fetch_user(user_id: str) -> Optional[User]:\n    # Simulated async fetch\n    await asyncio.sleep(0.1)\n    return User(id=user_id, name="Test", email="test@example.com")`,
      `import pandas as pd\nfrom sklearn.model_selection import train_test_split\n\ndef prepare_data(df: pd.DataFrame) -> tuple:\n    X = df.drop('target', axis=1)\n    y = df['target']\n    return train_test_split(X, y, test_size=0.2, random_state=42)`,
    ],
    rust: [
      `use std::sync::Arc;\nuse tokio::sync::RwLock;\n\npub struct Cache<K, V> {\n    data: Arc<RwLock<HashMap<K, V>>>,\n    ttl: Duration,\n}\n\nimpl<K: Clone + Hash + Eq, V: Clone> Cache<K, V> {\n    pub async fn get(&self, key: &K) -> Option<V> {\n        let data = self.data.read().await;\n        data.get(key).cloned()\n    }\n}`,
    ],
    sql: [
      `-- Vector similarity search with pgvector\nSELECT id, content, \n       1 - (embedding <=> $1) AS similarity\nFROM memories\nWHERE 1 - (embedding <=> $1) > 0.7\nORDER BY embedding <=> $1\nLIMIT 10;`,
      `-- Optimize for read-heavy workload\nCREATE INDEX CONCURRENTLY idx_messages_created \nON messages(user_id, created_at DESC);\n\n-- Partial index for active conversations\nCREATE INDEX idx_active_conversations \nON conversations(updated_at DESC) \nWHERE state = 'ACTIVE';`,
    ],
  };

  const langSnippets = snippets[lang] || snippets['typescript'];
  return randomFrom(langSnippets);
}

function generateAcus(convs: ConversationData[], allMessages: Map<string, MessageData[]>): {
  acus: object[];
  links: object[];
} {
  const acus: object[] = [];
  const links: object[] = [];

  for (const conv of convs) {
    const messages = allMessages.get(conv.id) || [];
    let prevAcuId: string | null = null;

    for (const msg of messages) {
      if (msg.role === 'system') continue;

      const contentObj = JSON.parse(msg.parts);
      let content = '';
      let language = '';

      if (Array.isArray(contentObj)) {
        content = contentObj.map(p => p.content || '').join('\n');
        const codePart = contentObj.find((p: { type: string; language?: string }) => p.type === 'code');
        if (codePart?.language) language = codePart.language;
      } else {
        content = contentObj.content || '';
      }

      if (!content.trim() || content.length < 10) continue;

      const isQuestion = content.includes('?') && /what|how|why|can|should/i.test(content);
      const hasCode = !!language;
      const isAnswer = /the answer|therefore|conclusion|in summary/i.test(content);

      const quality = 60 + Math.min(content.length / 100, 20) + (hasCode ? 15 : 0) + (isQuestion ? 10 : 0);

      const acuId = hash(content + conv.id + msg.id);
      const rediscoveryScore = Math.random() > 0.7 ? 0.6 + Math.random() * 0.4 : Math.random() * 0.5;

      acus.push({
        id: acuId,
        authorDid: DEMO_USER.did,
        content: content.substring(0, 1000),
        language: language || null,
        type: hasCode ? 'code_snippet' : isQuestion ? 'question' : isAnswer ? 'answer' : 'statement',
        category: conv.tags[0] || 'general',
        conversationId: conv.id,
        messageId: msg.id,
        messageIndex: msg.messageIndex,
        provider: conv.provider,
        model: conv.model,
        sourceTimestamp: msg.createdAt,
        signature: Buffer.from('demo-sig-' + acuId.slice(0, 16)),
        qualityOverall: Math.min(quality, 100),
        contentRichness: Math.min(quality, 100),
        structuralIntegrity: 85 + Math.random() * 10,
        uniqueness: 70 + Math.random() * 25,
        sharingPolicy: 'self',
        sharingCircles: [],
        tags: [],
        createdAt: new Date(),
        indexedAt: new Date(),
        metadata: {},
        rediscoveryScore,
      });

      if (prevAcuId && Math.random() > 0.6) {
        const relations = ['explains', 'follows_up', 'related_to', 'supports', 'contrasts'];
        links.push({
          sourceId: prevAcuId,
          targetId: acuId,
          relation: randomFrom(relations),
          weight: 0.5 + Math.random() * 0.5,
          metadata: {},
        });
      }

      prevAcuId = acuId;
    }
  }

  return { acus, links };
}

async function main(config: SeedConfig = DEFAULT_CONFIG) {
  const focusConfig = FOCUS_SEED_CONFIGS[config.focus || 'default'];
  const totalConvs = config.conversations ?? 320;

  console.log('🌱 Seeding VIVIM Investor Demo...\n');
  console.log(`   Focus: ${config.focus || 'default'}${focusConfig ? ` — ${focusConfig.description}` : ''}`);
  console.log(`   Conversations: ${totalConvs}\n`);
  const startTime = Date.now();

  console.log('Clearing existing demo data...');
  await prisma.$executeRaw`TRUNCATE TABLE users, atomic_chat_units, acu_links, messages, conversations, topic_conversations, topic_profiles, entity_profiles, context_bundles, memories, user_facts, circles, circle_members, notebooks, notebook_entries, friends, follows, groups, group_members, team_members, user_context_settings, client_presence, custom_instructions, sharing_policies, provider_stats, capture_attempts, sync_operations, peer_connections RESTART IDENTITY CASCADE`.catch(() => {});
  console.log('✅ Cleared existing data\n');

  console.log('Creating demo user: Alex Chen...');
  const user = await prisma.user.create({
    data: {
      did: DEMO_USER.did,
      displayName: DEMO_USER.displayName,
      handle: DEMO_USER.handle,
      email: DEMO_USER.email,
      avatarUrl: DEMO_USER.avatarUrl,
      publicKey: 'demo-public-key-' + uuid().slice(0, 16),
      settings: DEMO_USER.settings,
      trustScore: DEMO_USER.trustScore,
      verificationLevel: DEMO_USER.verificationLevel,
      emailVerified: true,
    },
  });
  console.log(`✅ Created user: ${user.displayName} (${user.did})\n`);

  const focusProviders = focusConfig?.providers ?? {
    chatgpt: 90, claude: 80, gemini: 50, deepseek: 40, grok: 30, mistral: 30,
  };
  const focusTopics = focusConfig?.topicSlugs ?? Object.keys(TOPICS);
  const multiplier = focusConfig?.conversationMultiplier ?? 1.0;

  const scaleFactor = (totalConvs / 320) * multiplier;
  const providerDistribution: Array<{ provider: keyof typeof PROVIDERS; count: number }> = [];
  let remaining = totalConvs;

  const providerKeys = Object.keys(focusProviders) as Array<keyof typeof PROVIDERS>;
  const totalProviderWeight = providerKeys.reduce((sum, k) => sum + (focusProviders[k] ?? 0), 0);

  for (let i = 0; i < providerKeys.length; i++) {
    const k = providerKeys[i];
    const weight = focusProviders[k] ?? 0;
    const count = i === providerKeys.length - 1
      ? remaining
      : Math.max(5, Math.round((weight / totalProviderWeight) * totalConvs));
    if (count > 0) {
      providerDistribution.push({ provider: k, count: Math.min(count, remaining) });
      remaining -= Math.min(count, remaining);
    }
  }

  const filteredTopics = focusTopics
    .map(slug => {
      const subs = TOPICS[slug as keyof typeof TOPICS];
      if (!subs) return null;
      return subs.map(sub => ({ topic: slug, subtopic: sub }));
    })
    .filter(Boolean)
    .flat() as Array<{ topic: string; subtopic: string }>;

  let conversations: ConversationData[] = [];
  let ownedConversations: (ConversationData & { ownerId: string })[] = [];
  const allMessages = new Map<string, MessageData[]>();

  console.log('Generating conversations...');
  let convIndex = 0;

  for (const { provider, count } of providerDistribution) {
    console.log(`  ${PROVIDERS[provider].name}: ${count} conversations`);
    
    for (let i = 0; i < count; i++) {
      const daysOffset = randomInt(1, 180);
      const topic = randomFrom(filteredTopics);
      const quality: 'high' | 'medium' | 'low' = convIndex < 50 ? 'high' : convIndex < 150 ? 'medium' : 'low';
      
      const { conv, messages } = generateConversation(provider, topic, daysOffset, quality);
      conversations.push(conv);
      allMessages.set(conv.id, messages);
      convIndex++;
    }
  }

  console.log(`✅ Generated ${conversations.length} conversations\n`);

  console.log('Injecting owner references...');
  ownedConversations = conversations.map(conv => ({ ...conv, ownerId: user.id }));
  console.log(`✅ Owner set on ${ownedConversations.length} conversations\n`);

  console.log('Creating conversations in database...');
  const batchSize = 50;
  for (let i = 0; i < ownedConversations.length; i += batchSize) {
    const batch = ownedConversations.slice(i, i + batchSize);
    await prisma.conversation.createMany({ data: batch });
    if ((i + batchSize) % 100 === 0) {
      console.log(`  Created ${i + batchSize}/${ownedConversations.length}...`);
    }
  }
  console.log('✅ Conversations created\n');

  console.log('Creating messages...');
  let msgCount = 0;
  for (const [convId, messages] of allMessages) {
    await prisma.message.createMany({
      data: messages.map(m => ({ ...m, conversationId: convId })),
    });
    msgCount += messages.length;
  }
  console.log(`✅ Created ${msgCount} messages\n`);

  console.log('Generating ACUs and relationships...');
  const { acus, links } = generateAcus(conversations, allMessages);

  for (let i = 0; i < acus.length; i += 100) {
    const batch = acus.slice(i, i + 100);
    await prisma.atomicChatUnit.createMany({ data: batch });
  }
  console.log(`✅ Created ${acus.length} ACUs`);

  for (let i = 0; i < links.length; i += 100) {
    const batch = links.slice(i, i + 100);
    await prisma.acuLink.createMany({ data: batch });
  }
  console.log(`✅ Created ${links.length} ACU relationships\n`);

  console.log('Creating topic profiles...');
  const topicSlugs = [...new Set(conversations.map(c => c.tags[0]))].filter(Boolean);
  const topicProfiles = [];
  for (const slug of topicSlugs) {
    const convs = conversations.filter(c => c.tags.includes(slug));
    const created = await prisma.topicProfile.create({
      data: {
        userId: user.id,
        slug,
        label: slug.replace(/_/g, ' '),
        aliases: [],
        domain: 'technology',
        totalConversations: convs.length,
        totalAcus: acus.filter(a => (a as { category: string }).category === slug).length,
        totalMessages: convs.reduce((s, c) => s + c.messageCount, 0),
        totalTokensSpent: convs.reduce((s, c) => s + c.totalWords * 1.3, 0),
        avgSessionDepth: convs.reduce((s, c) => s + c.messageCount, 0) / convs.length,
        firstEngagedAt: convs.reduce((earliest, c) => c.createdAt < earliest ? c.createdAt : earliest, convs[0].createdAt),
        lastEngagedAt: convs.reduce((latest, c) => c.updatedAt > latest ? c.updatedAt : latest, convs[0].updatedAt),
        engagementStreak: randomInt(3, 30),
        peakHour: randomInt(9, 21),
        proficiencyLevel: slug === 'typescript' || slug === 'react' ? 'expert' : slug === 'ai' ? 'advanced' : 'intermediate',
        proficiencySignals: [],
        importanceScore: 0.5 + Math.random() * 0.5,
        isDirty: false,
        contextVersion: 1,
      },
    });
    topicProfiles.push(created);
  }
  console.log(`✅ Created ${topicProfiles.length} topic profiles\n`);

  console.log('Creating entity profiles...');
  const entities = [
    { name: 'Stripe', type: 'company', relationship: 'interested_in', sentiment: 0.8 },
    { name: 'Jordan Lee', type: 'person', relationship: 'co-founder', sentiment: 0.9 },
    { name: 'First Close Ventures', type: 'investor', relationship: 'investor', sentiment: 0.7 },
    { name: 'San Francisco', type: 'location', relationship: 'based_in', sentiment: 0.5 },
    { name: 'B2B SaaS', type: 'product', relationship: 'building', sentiment: 0.8 },
  ];
  const entityProfiles = entities.map(e => ({
    userId: user.id,
    name: e.name,
    type: e.type,
    aliases: [],
    relationship: e.relationship,
    sentiment: e.sentiment,
    facts: JSON.stringify([{ fact: `Alex is ${e.relationship} ${e.name}`, source: 'conversation' }]),
    mentionCount: randomInt(5, 30),
    conversationCount: randomInt(3, 15),
    lastMentionedAt: daysAgo(randomInt(1, 30)),
    firstMentionedAt: daysAgo(randomInt(60, 180)),
    importanceScore: 0.6 + Math.random() * 0.4,
    isDirty: false,
    contextVersion: 1,
  }));
  await prisma.entityProfile.createMany({ data: entityProfiles });
  console.log(`✅ Created ${entityProfiles.length} entity profiles\n`);

  console.log('Creating memories...');
  const memories = [
    { content: 'Alex prefers TypeScript over JavaScript for all new projects', type: 'PREFERENCE', importance: 0.85 },
    { content: 'Alex is building a B2B SaaS startup in stealth mode', type: 'GOAL', importance: 0.95 },
    { content: 'Alex has interviewed at Google and Stripe in the past year', type: 'EPISODIC', importance: 0.7 },
    { content: 'Alex is skeptical of microservices for early-stage products', type: 'PREFERENCE', importance: 0.75 },
    { content: 'Alex uses Postgres + pgvector for production vector workloads', type: 'FACTUAL', importance: 0.9 },
    { content: 'Alex lives in San Francisco and works remotely', type: 'IDENTITY', importance: 0.6 },
    { content: 'Alex has a background in distributed systems', type: 'IDENTITY', importance: 0.8 },
    { content: 'Alex co-founded a previous startup that failed in 2023', type: 'EPISODIC', importance: 0.65 },
  ];

  const memoryData = memories.map((m, i) => ({
    userId: user.id,
    content: m.content,
    memoryType: m.type,
    category: m.type.toLowerCase(),
    importance: m.importance,
    relevance: 0.8 + Math.random() * 0.2,
    consolidationStatus: 'CONSOLIDATED',
    isVerified: true,
    verifiedAt: daysAgo(randomInt(1, 14)),
    verificationSource: 'explicit',
    isActive: true,
    isPinned: i < 3,
    provider: 'manual',
    sourceType: 'manual',
    tags: [m.type.toLowerCase()],
    occurredAt: daysAgo(randomInt(7, 90)),
    validFrom: daysAgo(randomInt(30, 180)),
  }));

  for (let i = 0; i < memoryData.length; i += 50) {
    await prisma.memory.createMany({ data: memoryData.slice(i, i + 50) });
  }
  console.log(`✅ Created ${memoryData.length} memories\n`);

  console.log('Creating circles...');
  const circleDefs = [
    { name: 'Founders Circle', description: 'Stealth mode founders sharing learnings', isPublic: false },
    { name: 'SF Engineering', description: 'Bay Area engineering community', isPublic: true },
  ];
  const circles = [];
  for (const circle of circleDefs) {
    const created = await prisma.circle.create({
      data: {
        ownerId: user.id,
        name: circle.name,
        description: circle.description,
        isPublic: circle.isPublic,
      },
    });
    circles.push(created);
  }
  console.log(`✅ Created ${circles.length} circles\n`);

  console.log('Creating notebooks...');
  const notebookDefs = [
    { name: 'Architecture Patterns', description: 'System design references', color: '#3B82F6' },
    { name: 'Code Snippets', description: 'Reusable code', color: '#10B981' },
    { name: 'Startup Ideas', description: 'Product concepts', color: '#F59E0B' },
  ];
  const notebooks = [];
  for (const nb of notebookDefs) {
    const created = await prisma.notebook.create({
      data: {
        ownerId: user.id,
        name: nb.name,
        description: nb.description,
        color: nb.color,
        isDefault: nb.name === 'Code Snippets',
      },
    });
    notebooks.push(created);
  }
  console.log(`✅ Created ${notebooks.length} notebooks\n`);

  console.log('Creating groups...');
  const groupDefs = [
    { name: 'Build In Public', type: 'PROJECT' as const, visibility: 'PUBLIC' as const, memberCount: 234 },
    { name: 'PGVector Users', type: 'COMMUNITY' as const, visibility: 'PUBLIC' as const, memberCount: 567 },
    { name: 'Startup Founders SF', type: 'GENERAL' as const, visibility: 'APPROVAL' as const, memberCount: 89 },
  ];
  const groups = await Promise.all(
    groupDefs.map(async (g) => prisma.group.create({
      data: {
        ownerId: user.id,
        name: g.name,
        type: g.type,
        visibility: g.visibility,
        memberCount: g.memberCount,
        description: g.name + ' group',
      },
    }))
  );
  console.log(`✅ Created ${groups.length} groups\n`);

  console.log('Creating user context settings...');
  await prisma.userContextSettings.create({
    data: {
      userId: user.id,
      maxContextTokens: 16000,
      responseStyle: 'concise',
      memoryThreshold: 'moderate',
      enablePredictions: true,
      enableJitRetrieval: true,
      enableCompression: true,
      enableEntityContext: true,
      enableTopicContext: true,
      prioritizeLatency: false,
      cacheAggressively: true,
    },
  });
  console.log('✅ Created user context settings\n');

  console.log('Creating client presence...');
  await prisma.clientPresence.create({
    data: {
      userId: user.id,
      deviceId: 'demo-device-' + uuid().slice(0, 8),
      activeConversationId: conversations[0]?.id,
      visibleConversationIds: conversations.slice(0, 10).map(c => c.id),
      isOnline: true,
      predictedTopics: ['typescript', 'react', 'architecture'],
      predictedEntities: ['Stripe', 'Jordan Lee'],
    },
  });
  console.log('✅ Created client presence\n');

  console.log('Creating custom instructions...');
  const instructions = [
    { content: 'Alex prefers concise, technical responses with code examples', scope: 'global', priority: 10 },
    { content: 'When discussing startups, focus on metrics and execution', scope: 'startup', priority: 5 },
    { content: 'Code examples should use TypeScript by default', scope: 'coding', priority: 8 },
  ];
  for (const inst of instructions) {
    await prisma.customInstruction.create({
      data: {
        userId: user.id,
        content: inst.content,
        scope: inst.scope,
        topicTags: [inst.scope],
        priority: inst.priority,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${instructions.length} custom instructions\n`);

  console.log('Creating mock users (25 users for social features)...');
  const mockUsers = [
    { displayName: 'Jordan Lee', handle: 'jordanlee', email: 'jordan@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=jordan', trust: 88, role: 'co-founder' },
    { displayName: 'Sarah Kim', handle: 'sarahkim', email: 'sarah@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=sarah', trust: 95, role: 'investor' },
    { displayName: 'Marcus Johnson', handle: 'marcusj', email: 'marcus@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=marcus', trust: 82, role: 'developer' },
    { displayName: 'Priya Sharma', handle: 'priyasharma', email: 'priya@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=priya', trust: 91, role: 'designer' },
    { displayName: 'David Chen', handle: 'davidchen', email: 'david@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=david', trust: 78, role: 'developer' },
    { displayName: 'Emma Wilson', handle: 'emmawilson', email: 'emma@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=emma', trust: 85, role: 'founder' },
    { displayName: 'Liam O\'Brien', handle: 'liamobrien', email: 'liam@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=liam', trust: 73, role: 'developer' },
    { displayName: 'Sofia Martinez', handle: 'sofiam', email: 'sofia@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=sofia', trust: 90, role: 'product' },
    { displayName: 'Noah Park', handle: 'noahpark', email: 'noah@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=noah', trust: 87, role: 'investor' },
    { displayName: 'Ava Thompson', handle: 'avathompson', email: 'ava@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=ava', trust: 94, role: 'founder' },
    { displayName: 'Ethan Rivera', handle: 'ethanr', email: 'ethan@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=ethan', trust: 80, role: 'developer' },
    { displayName: 'Mia Zhang', handle: 'miazhang', email: 'mia@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=mia', trust: 89, role: 'designer' },
    { displayName: 'Lucas Anderson', handle: 'lucasand', email: 'lucas@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=lucas', trust: 76, role: 'developer' },
    { displayName: 'Isabella Brooks', handle: 'isabellab', email: 'isabella@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=isabella', trust: 92, role: 'founder' },
    { displayName: 'James Wright', handle: 'jameswright', email: 'james@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=james', role: 'developer' },
    { displayName: 'Charlotte Davis', handle: 'charlotted', email: 'charlotte@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=charlotte', role: 'product' },
    { displayName: 'Benjamin Moore', handle: 'benmoore', email: 'ben@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=ben', role: 'developer' },
    { displayName: 'Amelia Taylor', handle: 'ameliat', email: 'amelia@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=amelia', role: 'founder' },
    { displayName: 'Henry Jackson', handle: 'henryj', email: 'henry@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=henry', role: 'developer' },
    { displayName: 'Evelyn White', handle: 'evelynw', email: 'evelyn@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=evelyn', role: 'designer' },
    { displayName: 'Alexander Harris', handle: 'alexh', email: 'alexh@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=alexh', role: 'developer' },
    { displayName: 'Scarlett Martin', handle: 'scarlettm', email: 'scarlett@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=scarlett', role: 'product' },
    { displayName: 'Daniel Garcia', handle: 'danielg', email: 'daniel@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=daniel', role: 'investor' },
    { displayName: 'Grace Lee', handle: 'gracelee', email: 'grace@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=grace', role: 'founder' },
    { displayName: 'Owen Martinez', handle: 'owenm', email: 'owen@vivimdemo.io', avatar: 'https://i.pravatar.cc/150?u=owen', role: 'developer' },
  ];

  const createdMockUsers = [];
  for (const mu of mockUsers) {
    const created = await prisma.user.create({
      data: {
        did: 'did:key:mock-' + uuid().slice(0, 16),
        displayName: mu.displayName,
        handle: mu.handle,
        email: mu.email,
        avatarUrl: mu.avatar,
        publicKey: 'mock-key-' + uuid().slice(0, 16),
        emailVerified: true,
        verificationLevel: 1,
        trustScore: mu.trust ?? 75,
        status: 'ACTIVE',
        settings: { role: mu.role, theme: 'dark' },
      },
    });
    createdMockUsers.push(created);
  }
  console.log(`✅ Created ${createdMockUsers.length} mock users\n`);

  console.log('Creating friendships (Alex Chen <-> mock users)...');
  const friendRecords = [];
  for (let i = 0; i < 8; i++) {
    const friend = createdMockUsers[i];
    friendRecords.push({
      requesterId: user.id,
      addresseeId: friend.id,
      status: 'ACCEPTED',
      requestedAt: daysAgo(randomInt(7, 90)),
      respondedAt: daysAgo(randomInt(1, 30)),
    });
    friendRecords.push({
      requesterId: friend.id,
      addresseeId: user.id,
      status: 'ACCEPTED',
      requestedAt: daysAgo(randomInt(7, 90)),
      respondedAt: daysAgo(randomInt(1, 30)),
    });
  }
  await prisma.friend.createMany({ data: friendRecords });
  console.log(`✅ Created ${friendRecords.length} friendships\n`);

  console.log('Creating follow relationships...');
  const followRecords = [];
  for (let i = 8; i < 20; i++) {
    const u = createdMockUsers[i];
    followRecords.push({
      followerId: user.id,
      followingId: u.id,
      status: 'ACTIVE',
      notifyOnPost: i % 3 === 0,
      showInFeed: true,
    });
  }
  for (let i = 0; i < 12; i++) {
    const u = createdMockUsers[i];
    followRecords.push({
      followerId: u.id,
      followingId: user.id,
      status: 'ACTIVE',
      notifyOnPost: Math.random() > 0.5,
      showInFeed: true,
    });
  }
  await prisma.follow.createMany({ data: followRecords });
  console.log(`✅ Created ${followRecords.length} follow relationships\n`);

  console.log('Creating team structure...');
  const team = await prisma.team.create({
    data: {
      ownerId: user.id,
      name: 'VIVIM Founders',
      description: 'Core team collaboration',
      type: 'PROJECT',
      visibility: 'INVITE',
      isPersonal: false,
      memberCount: 5,
    },
  });
  const teamMembers = [{ userId: user.id, role: 'OWNER' as const }];
  for (let i = 0; i < 4; i++) {
    const u = createdMockUsers[i];
    teamMembers.push({ userId: u.id, role: i === 0 ? 'ADMIN' as const : 'MEMBER' as const });
  }
  for (const tm of teamMembers) {
    await prisma.teamMember.create({ data: { teamId: team.id, userId: tm.userId, role: tm.role } });
  }
  const channels = [
    { name: 'general', description: 'General discussion', type: 'PUBLIC' as const },
    { name: 'engineering', description: 'Engineering updates', type: 'PUBLIC' as const },
    { name: 'product', description: 'Product feedback', type: 'PUBLIC' as const },
    { name: 'investors', description: 'Investor updates', type: 'PRIVATE' as const },
  ];
  const channelMessages = [];
  for (const ch of channels) {
    const channel = await prisma.teamChannel.create({
      data: { teamId: team.id, name: ch.name, description: ch.description, type: ch.type, sortOrder: channels.indexOf(ch) },
    });
    for (let m = 0; m < randomInt(3, 8); m++) {
      const author = m % 2 === 0 ? user : createdMockUsers[m % 4];
      channelMessages.push({
        channelId: channel.id,
        authorId: author.id,
        content: m === 0 ? `Welcome to #${ch.name}! This is the start of our ${ch.description}.` : [
          `Great progress on the ${['API design', 'auth flow', 'database schema', 'UI components', 'deployment pipeline'][m % 5]}!`,
          `Has anyone reviewed the latest ${['security audit', 'performance metrics', 'user feedback', 'market analysis'][m % 4]}?`,
          `I just pushed the ${['v0.3', 'beta build', 'staging deploy', 'hotfix', 'new feature'][m % 5]} — feedback welcome.`,
          `Syncing on the ${['roadmap priorities', 'team capacity', 'investor deck', 'launch timeline'][m % 4]} tomorrow.`,
          `The ${['demo is looking sharp', 'metrics are trending up', 'investor call went well', 'new hire starting Monday'][m % 4]}!`,
        ][m % 5],
        contentType: 'text',
        createdAt: hoursAgo(randomInt(1, 72)),
      });
    }
  }
  await prisma.channelMessage.createMany({ data: channelMessages });
  console.log(`✅ Created team with ${channels.length} channels, ${channelMessages.length} messages\n`);

  console.log('Creating group posts (activity feed)...');
  const groupPosts = [];
  const insightThemes = ['insight about TypeScript patterns', 'architecture decision record', 'performance optimization guide', 'team retrospective notes'];
  const questionThemes = ['React Server Components', 'Bun runtime', 'pgvector extension', 'CRDT sync library'];
  const updateThemes = ['weekly standup notes', 'sprint review deck', 'product roadmap update', 'investor update'];
  const recommendationThemes = ['infra scaling', 'hiring engineers', 'fundraising advisors', 'design systems'];
  const statusThemes = ['latest build is looking great', 'demo went really well', 'metrics are improving', 'team is firing on all cylinders'];

  for (const group of groups) {
    for (let p = 0; p < randomInt(5, 12); p++) {
      const author = p % 3 === 0 ? user : createdMockUsers[p % createdMockUsers.length];
      const insightTheme = insightThemes[p % insightThemes.length];
      const questionTheme = questionThemes[p % questionThemes.length];
      const updateTheme = updateThemes[p % updateThemes.length];
      const recommendationTheme = recommendationThemes[p % recommendationThemes.length];
      const statusTheme = statusThemes[p % statusThemes.length];

      const contentLines = [
        'Just shared a new ' + insightTheme + ' in this group.',
        'Has anyone tried to new ' + questionTheme + ' yet?',
        'Posted our ' + updateTheme + ' — feedback appreciated!',
        'Looking for recommendations on ' + recommendationTheme + '.',
        'The ' + statusTheme + '!',
      ];

      groupPosts.push({
        groupId: group.id,
        authorId: author.id,
        content: contentLines.join('\n'),
        likeCount: randomInt(2, 25),
        commentCount: randomInt(0, 8),
        contentType: 'text',
        createdAt: hoursAgo(randomInt(1, 168)),
      });
    }
  }
  await prisma.groupPost.createMany({ data: groupPosts });
  console.log(`✅ Created ${groupPosts.length} group posts\n`);

  console.log('Creating circle memberships...');
  const circleMembers = [];
  for (let i = 0; i < 10; i++) {
    const u = createdMockUsers[i];
    circleMembers.push({
      circleId: circles[0].id,
      userId: u.id,
      role: i < 2 ? 'admin' : 'member',
      canInvite: i < 2,
      canShare: true,
      joinedAt: daysAgo(randomInt(1, 60)),
    });
  }
  for (let i = 5; i < 15; i++) {
    const u = createdMockUsers[i % createdMockUsers.length];
    circleMembers.push({
      circleId: circles[1].id,
      userId: u.id,
      role: 'member',
      canInvite: false,
      canShare: true,
      joinedAt: daysAgo(randomInt(1, 60)),
    });
  }
  await prisma.circleMember.createMany({ data: circleMembers });
  console.log(`✅ Created ${circleMembers.length} circle memberships\n`);

  console.log('Creating notebook entries...');
  const notebookEntries = [];
  for (const nb of notebooks) {
    for (let e = 0; e < randomInt(3, 8); e++) {
      const acuIndex = (e + acus.length - 1) % acus.length;
      const acu = acus.length > 0 ? acus[acuIndex] : undefined;
      if (acu && acu.id) {
        notebookEntries.push({
          notebookId: nb.id,
          acuId: acu.id,
          sortOrder: e,
        });
      }
    }
  }
  await prisma.notebookEntry.createMany({ data: notebookEntries });
  console.log(`✅ Created ${notebookEntries.length} notebook entries\n`);

  console.log('Creating topic-conversation links...');
  const topicConvs = [];
  for (const conv of conversations) {
    for (const tag of conv.tags.slice(0, 2)) {
      const tp = topicProfiles.find(p => p.slug === tag);
      if (tp) {
        topicConvs.push({
          topicId: tp.id,
          conversationId: conv.id,
          relevanceScore: 0.5 + Math.random() * 0.5,
        });
      }
    }
  }
  for (let i = 0; i < topicConvs.length; i += 200) {
    await prisma.topicConversation.createMany({ data: topicConvs.slice(i, i + 200) });
  }
  console.log(`✅ Created ${topicConvs.length} topic-conversation links\n`);

  console.log('Creating conversation compactions (summaries)...');
  const compactions = [];
  for (const conv of conversations.slice(0, 60)) {
    if (conv.messageCount >= 5) {
      compactions.push({
        conversationId: conv.id,
        fromMessageIndex: 0,
        toMessageIndex: Math.min(conv.messageCount - 1, randomInt(3, 8)),
        originalTokenCount: conv.totalWords * 2,
        compactedTokenCount: randomInt(50, 200),
        summary: [
          `Explored ${conv.tags[0]} concepts with focus on ${conv.tags[1] || 'practical applications'}. Key insights include patterns for production use and common pitfalls to avoid.`,
          `Deep dive into ${conv.tags[0]}. Discussed tradeoffs between different approaches, reviewed code examples, and identified best practices for ${conv.provider}.`,
          `Technical discussion on ${conv.tags[0]}. Covered ${conv.tags[1] || 'implementation strategies'}, with actionable takeaways and next steps for follow-up.`,
        ][Math.floor(Math.random() * 3)],
        keyDecisions: JSON.stringify([
          { decision: 'Use TypeScript for type safety', rationale: 'Catches errors at compile time' },
          { decision: `Leverage ${conv.provider} for ${conv.tags[0]}`, rationale: 'Best model for this use case' },
        ]),
        openQuestions: JSON.stringify([
          { question: `How does ${conv.tags[0]} scale in production?` },
          { question: 'What are the cost implications at scale?' },
        ]),
        codeArtifacts: JSON.stringify([]),
        compressionRatio: 0.15 + Math.random() * 0.25,
        compactionLevel: 1,
        createdAt: conv.updatedAt,
      });
    }
  }
  await prisma.conversationCompaction.createMany({ data: compactions });
  console.log(`✅ Created ${compactions.length} conversation compactions\n`);

  console.log('Creating context bundles...');
  const bundles = [];
  for (const tp of topicProfiles.slice(0, 5)) {
    bundles.push({
      userId: user.id,
      bundleType: 'topic',
      topicProfileId: tp.id,
      compiledPrompt: `You are helping Alex with ${tp.label}. Context: ${tp.totalConversations} conversations explored. Key focus on ${tp.slug} patterns and best practices.`,
      tokenCount: randomInt(200, 800),
      composition: JSON.stringify({ topics: [tp.slug], priority: tp.importanceScore }),
      priority: tp.importanceScore,
      isDirty: false,
      useCount: randomInt(5, 30),
      hitCount: randomInt(3, 20),
      missCount: randomInt(0, 5),
      lastUsedAt: hoursAgo(randomInt(1, 48)),
    });
  }
  for (const ep of entityProfiles.slice(0, 3)) {
    bundles.push({
      userId: user.id,
      bundleType: 'entity',
      entityProfileId: ep.id,
      compiledPrompt: `Context about ${ep.name}: ${ep.relationship}. Mentioned in ${ep.conversationCount} conversations.`,
      tokenCount: randomInt(100, 400),
      composition: JSON.stringify({ entities: [ep.name], type: ep.type }),
      priority: ep.importanceScore,
      isDirty: false,
      useCount: randomInt(2, 15),
      hitCount: randomInt(1, 10),
    });
  }
  for (const conv of ownedConversations.slice(0, 5)) {
    bundles.push({
      userId: user.id,
      bundleType: 'conversation',
      conversationId: conv.id,
      compiledPrompt: `Recent conversation about ${conv.title}. ${conv.messageCount} messages, last active ${daysAgo(0).toLocaleDateString()}.`,
      tokenCount: randomInt(150, 600),
      composition: JSON.stringify({ conversation: conv.id, recency: 'recent' }),
      priority: 0.4,
      isDirty: false,
      useCount: randomInt(1, 8),
    });
  }
  await prisma.contextBundle.createMany({ data: bundles });
  console.log(`✅ Created ${bundles.length} context bundles\n`);

  console.log('Creating sharing policies...');
  const policies = [];
  const sharedConvs = ownedConversations.slice(0, 10);
  for (const conv of sharedConvs) {
    const policy = await prisma.sharingPolicy.create({
      data: {
        contentId: conv.id,
        contentType: 'conversation',
        ownerId: user.id,
        audience: JSON.stringify({ type: 'circle', circleIds: [circles[0].id] }),
        permissions: JSON.stringify({ view: true, annotate: false, reshare: false }),
        status: 'active',
        createdBy: user.id,
      },
    });
    const stakeholderUser = createdMockUsers[Math.floor(Math.random() * 5)];
    await prisma.contentStakeholder.create({
      data: {
        policyId: policy.id,
        userId: stakeholderUser.id,
        role: 'contributor',
        contribution: JSON.stringify({ conversations: randomInt(1, 3) }),
        privacySettings: JSON.stringify({ hideMessages: false }),
        influenceScore: randomInt(30, 70),
      },
    });
    policies.push(policy);
  }
  console.log(`✅ Created ${policies.length} sharing policies with stakeholders\n`);

  console.log('Creating memory relationships (memory graph)...');
  const memoryRels = [];
  const memPairs = memoryData.slice(0, 12);
  for (let i = 0; i < memPairs.length; i++) {
    for (let j = i + 1; j < memPairs.length; j++) {
      if (Math.random() > 0.5) {
        memoryRels.push({
          userId: user.id,
          sourceMemoryId: memPairs[i].id || uuid(),
          targetMemoryId: memPairs[j].id || uuid(),
          relationshipType: ['similar', 'related_to', 'supports'][Math.floor(Math.random() * 3)],
          strength: 0.3 + Math.random() * 0.7,
        });
      }
    }
  }
  await prisma.memoryRelationship.createMany({ data: memoryRels });
  console.log(`✅ Created ${memoryRels.length} memory relationships\n`);

  console.log('Creating AI personas...');
  const personas = [
    { name: 'Code Reviewer', trigger: 'review', description: 'Strict technical reviewer for code quality', systemPrompt: 'You are a senior engineer reviewing code. Be thorough, cite best practices, and suggest specific improvements.', type: 'review', provider: 'openai', model: 'gpt-4o' },
    { name: 'Startup Advisor', trigger: 'startup', description: 'Guides on startup strategy and fundraising', systemPrompt: 'You are a seasoned startup founder advising on go-to-market, fundraising, and team building.', type: 'advisor', provider: 'anthropic', model: 'claude-3-5-sonnet' },
    { name: 'Architecture Expert', trigger: 'arch', description: 'Deep system design and architecture guidance', systemPrompt: 'You are a distributed systems expert. Provide detailed architecture recommendations with tradeoffs.', type: 'expert', provider: 'google', model: 'gemini-1.5-pro' },
  ];
  for (const p of personas) {
    await prisma.aiPersona.create({
      data: {
        ownerId: user.id,
        name: p.name,
        description: p.description,
        trigger: p.trigger,
        type: p.type,
        systemPrompt: p.systemPrompt,
        provider: p.provider,
        model: p.model,
        includeOwnerContext: true,
      },
    });
  }
  console.log(`✅ Created ${personas.length} AI personas\n`);

  console.log('Creating user facts...');
  const facts = [
    { content: 'Alex is building a B2B SaaS in stealth mode, targeting the developer tools market', category: 'startup' },
    { content: 'Previously co-founded a startup in 2021 that failed due to poor product-market fit', category: 'career' },
    { content: 'Strong preference for TypeScript over JavaScript for all projects', category: 'preference' },
    { content: 'Background in distributed systems and database engineering', category: 'identity' },
    { content: 'Based in San Francisco, works remotely with distributed team', category: 'identity' },
    { content: 'Currently raising a seed round from First Close Ventures', category: 'startup' },
    { content: 'Has 8 years of engineering experience at Google and Stripe', category: 'career' },
    { content: 'Passionate about AI/ML and its applications in developer tooling', category: 'interest' },
    { content: 'Prefers async communication and documentation over meetings', category: 'preference' },
    { content: 'Uses Postgres + pgvector for all production data needs', category: 'preference' },
  ];
  const factRecords = facts.map(f => ({
    userId: user.id,
    content: f.content,
    category: f.category,
    source: 'conversation',
  }));
  await prisma.userFact.createMany({ data: factRecords });
  console.log(`✅ Created ${factRecords.length} user facts\n`);

  console.log('Creating provider statistics...');
  const providerStats = Object.entries(PROVIDERS).map(([key, p]) => ({
    provider: key,
    totalCaptures: randomInt(50, 150),
    successfulCaptures: randomInt(40, 130),
    failedCaptures: randomInt(5, 20),
    avgDuration: randomInt(3000, 15000),
    avgMessageCount: randomInt(5, 20),
    avgTokenCount: randomInt(1000, 8000),
    totalMessages: randomInt(500, 3000),
    totalCodeBlocks: randomInt(50, 300),
    totalImages: randomInt(0, 50),
    totalToolCalls: randomInt(10, 80),
    lastCaptureAt: hoursAgo(randomInt(1, 72)),
  }));
  await prisma.providerStats.createMany({ data: providerStats });
  console.log(`✅ Created ${providerStats.length} provider stats\n`);

  console.log('Creating capture attempts...');
  const captureAttempts = [];
  for (const conv of conversations.slice(0, 20)) {
    captureAttempts.push({
      sourceUrl: conv.sourceUrl,
      provider: conv.provider,
      status: 'COMPLETED',
      startedAt: conv.capturedAt,
      completedAt: conv.capturedAt,
      duration: randomInt(2000, 20000),
      conversationId: conv.id,
      retryCount: 0,
    });
  }
  await prisma.captureAttempt.createMany({ data: captureAttempts });
  console.log(`✅ Created ${captureAttempts.length} capture attempts\n`);

  console.log('Creating sync operations (P2P activity)...');
  const syncOps = [];
  for (let i = 0; i < 30; i++) {
    const u = i % 5 === 0 ? user : createdMockUsers[i % 10];
    syncOps.push({
      authorDid: u.did,
      deviceDid: 'device-' + uuid().slice(0, 8),
      tableName: ['memories', 'atomic_chat_units', 'conversations'][i % 3],
      recordId: uuid(),
      entityType: ['memory', 'acu', 'conversation'][i % 3],
      operation: ['CREATE', 'UPDATE', 'SHARE'][i % 3],
      payload: JSON.stringify({ timestamp: new Date().toISOString(), source: 'sync' }),
      hlcTimestamp: Date.now().toString() + '-' + i,
      isProcessed: i < 20,
    });
  }
  await prisma.syncOperation.createMany({ data: syncOps });
  console.log(`✅ Created ${syncOps.length} sync operations\n`);

  console.log('Creating peer connections...');
  const peers = [];
  for (let i = 0; i < 8; i++) {
    const u = createdMockUsers[i];
    peers.push({
      initiatorDid: user.did,
      targetDid: u.did,
      status: i < 5 ? 'CONNECTED' : 'PENDING',
      trustLevel: ['trusted', 'verified', 'acquaintance'][i % 3],
    });
  }
  await prisma.peerConnection.createMany({ data: peers });
  console.log(`✅ Created ${peers.length} peer connections\n`);

  console.log('Creating memory conflicts (for demo interest)...');
  if (memoryData.length >= 4) {
    const conflicts = [
      {
        userId: user.id,
        memoryId1: memoryData[0].id || uuid(),
        memoryId2: memoryData[1].id || uuid(),
        conflictType: 'contradiction',
        confidence: 0.75,
        explanation: 'Memory says Alex prefers TypeScript, but also indicates JavaScript experience. Need clarification.',
        suggestedResolution: 'manual',
        isResolved: false,
      },
      {
        userId: user.id,
        memoryId1: memoryData[2].id || uuid(),
        memoryId2: memoryData[3].id || uuid(),
        conflictType: 'outdated',
        confidence: 0.6,
        explanation: 'Earlier memory suggests microservices preference, but recent conversations favor monolith.',
        suggestedResolution: 'keep_newest',
        isResolved: false,
      },
    ];
    await prisma.memoryConflict.createMany({ data: conflicts });
    console.log(`✅ Created ${conflicts.length} memory conflicts\n`);
  }

  console.log('Creating failed jobs (realistic async system)...');
  const failedJobs = [];
  for (let i = 0; i < 5; i++) {
    failedJobs.push({
      jobType: ['EMBEDDING', 'EXTRACTION', 'CONSOLIDATION'][i % 3],
      payload: JSON.stringify({ conversationId: uuid(), attempt: i + 1 }),
      errorMessage: [
        'Embedding API rate limit exceeded',
        'Failed to parse response: unexpected token',
        'Context window exceeded for conversation',
      ][i % 3],
      retryCount: i % 3 === 0 ? 3 : 1,
    });
  }
  await prisma.failedJob.createMany({ data: failedJobs });
  console.log(`✅ Created ${failedJobs.length} failed jobs\n`);

  console.log('Creating memory extraction jobs...');
  const extractionJobs = [];
  for (const conv of ownedConversations.slice(0, 20)) {
    extractionJobs.push({
      userId: user.id,
      conversationId: conv.id,
      status: conv.messageCount > 8 ? 'COMPLETED' : 'PROCESSING',
      priority: conv.messageCount > 8 ? 1 : 0,
      messageRange: JSON.stringify({ from: 0, to: Math.min(conv.messageCount - 1, 10) }),
      extractedMemories: JSON.stringify([{ content: `Learned about ${conv.tags[0]}`, type: 'semantic' }]),
      attempts: 1,
      startedAt: hoursAgo(randomInt(1, 24)),
      completedAt: hoursAgo(randomInt(0, 12)),
    });
  }
  await prisma.memoryExtractionJob.createMany({ data: extractionJobs });
  console.log(`✅ Created ${extractionJobs.length} memory extraction jobs\n`);

  console.log('Creating memory analytics...');
  await prisma.memoryAnalytics.create({
    data: {
      userId: user.id,
      totalMemories: memoryData.length,
      memoriesByType: JSON.stringify({ EPISODIC: 3, FACTUAL: 2, PREFERENCE: 2, IDENTITY: 1, GOAL: 1 }),
      memoriesByCategory: JSON.stringify({ startup: 3, career: 2, technology: 2, identity: 1 }),
      memoriesCreatedToday: randomInt(1, 5),
      memoriesCreatedThisWeek: randomInt(5, 15),
      memoriesCreatedThisMonth: randomInt(20, 50),
      criticalCount: 2,
      highCount: 3,
      mediumCount: 2,
      lowCount: 1,
      totalAccesses: randomInt(50, 200),
      avgRelevance: 0.65,
      consolidatedCount: memoryData.filter(m => m.consolidationStatus === 'CONSOLIDATED').length,
      mergedCount: randomInt(0, 3),
      lastExtractionAt: hoursAgo(randomInt(1, 12)),
      lastConsolidationAt: hoursAgo(randomInt(12, 48)),
      lastCleanupAt: daysAgo(randomInt(1, 7)),
    },
  });
  console.log('✅ Created memory analytics\n');

  console.log('Updating group member counts...');
  const groupMemberCounts = await Promise.all(
    groups.map(async (g) => ({
      id: g.id,
      count: await prisma.groupMember.count({ where: { groupId: g.id } }),
    }))
  );
  for (const gmc of groupMemberCounts) {
    await prisma.group.update({ where: { id: gmc.id }, data: { memberCount: gmc.count } });
  }
  console.log('Updated group member counts\n');

  const duration = Date.now() - startTime;

  console.log('═'.repeat(60));
  console.log('✅ Investor demo seeded successfully!');
  console.log('═'.repeat(60));
  console.log(`\nDemo user: ${user.displayName} <${user.email}>`);
  console.log(`DID: ${user.did}`);
  console.log(`\nData summary:`);
  console.log(`  • ${conversations.length} conversations`);
  console.log(`  • ${msgCount} messages`);
  console.log(`  • ${acus.length} ACUs`);
  console.log(`  • ${links.length} ACU relationships`);
  console.log(`  • ${topicProfiles.length} topic profiles`);
  console.log(`  • ${entityProfiles.length} entity profiles`);
  console.log(`  • ${memoryData.length} memories`);
  console.log(`  • ${circles.length} circles + ${circleMembers.length} memberships`);
  console.log(`  • ${notebooks.length} notebooks + ${notebookEntries.length} entries`);
  console.log(`  • ${groups.length} groups + ${groupPosts.length} posts`);
  console.log(`  • ${topicConvs.length} topic links`);
  console.log(`  • ${compactions.length} conversation compactions`);
  console.log(`  • ${bundles.length} context bundles`);
  console.log(`  • ${policies.length} sharing policies`);
  console.log(`  • ${memoryRels.length} memory relationships`);
  console.log(`  • ${personas.length} AI personas`);
  console.log(`  • ${factRecords.length} user facts`);
  console.log(`  • 1 team + ${channels.length} channels + ${channelMessages.length} messages`);
  console.log(`  • ${createdMockUsers.length} mock users + ${friendRecords.length} friendships + ${followRecords.length} follows`);
  console.log(`  • ${peers.length} peer connections`);
  console.log(`  • ${providerStats.length} provider stats`);
  console.log(`  • ${captureAttempts.length} capture attempts`);
  console.log(`  • ${syncOps.length} sync operations`);
  console.log(`  • ${extractionJobs.length} extraction jobs`);
  console.log(`  • 1 memory analytics record`);
  console.log(`\n⏱️  Seed completed in ${duration}ms`);
  console.log(`\n💡 Tip: Pre-compute embeddings before demo for fast graph rendering`);
}

const config = parseArgs();
main(config)
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
