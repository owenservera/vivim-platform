export interface HighlightFlow {
  name: string;
  pages: Array<{
    path: string;
    label: string;
    wait?: number;
    notes?: string;
  }>;
  seedOverrides?: Partial<SeedWeights>;
}

export interface SeedWeights {
  conversations: number;
  topics: string[];
  providers: string[];
  memoryDepth: 'light' | 'medium' | 'heavy';
  circles: number;
  groups: number;
  friendships: number;
  notebooks: number;
}

export interface FocusArea {
  id: string;
  name: string;
  tagline: string;
  investorType: 'technical' | 'product' | 'business' | 'all';
  demoTime: string;
  narrative: {
    hook: string;
    body: string[];
    close: string;
  };
  flows: HighlightFlow[];
  seedWeights: SeedWeights;
  slideSlugs: string[];
  searchQueries: string[];
  screenshots: string[];
}

export const FOCUS_AREAS: Record<string, FocusArea> = {
  knowledgeGraph: {
    id: 'knowledgeGraph',
    name: 'Knowledge Graph',
    tagline: 'See your AI thinking become a living map',
    investorType: 'all',
    demoTime: '30-40s (core weapon)',
    narrative: {
      hook: "Most AI users have one tab open. Power users have nine. Nobody can find anything.",
      body: [
        "Every conversation you have — across ChatGPT, Claude, Gemini — gets auto-decomposed into atomic units of knowledge.",
        "VIVIM maps the relationships between all of them. What concepts repeat. What follows from what. What contradicts.",
        "This isn't just a search tool. It's a second brain that actually understands your AI thinking."
      ],
      close: "That's the graph. Every node is a thought. Every edge is a relationship. Your AI brain, visible."
    },
    flows: [
      {
        name: 'Canvas Graph',
        pages: [
          { path: '/archive', label: 'Archive - Canvas View', wait: 2000 },
          { path: '/archive?view=canvas', label: 'Force-directed canvas', wait: 5000, notes: 'Pre-position camera on largest cluster' },
          { path: '/conversation/:graph-seed-id', label: 'ACU Graph detail', wait: 3000 },
        ],
      },
      {
        name: 'ACU Relationships',
        pages: [
          { path: '/archive/search?q=react+hooks', label: 'Search for concept', wait: 3000 },
          { path: '/conversation/:acu-id', label: 'ACU detail with links', wait: 2000 },
        ],
      },
    ],
    seedWeights: {
      conversations: 320,
      topics: ['react', 'typescript', 'architecture', 'postgres', 'system_design'],
      providers: ['chatgpt', 'claude', 'gemini', 'deepseek'],
      memoryDepth: 'heavy',
      circles: 2,
      groups: 2,
      friendships: 3,
      notebooks: 3,
    },
    slideSlugs: [
      'problem-fragmented-ai',
      'solution-atomic-capture',
      'knowledge-graph-demo',
      'find-anything-instantly',
    ],
    searchQueries: ['react hooks architecture', 'postgres indexing', 'typescript generics'],
    screenshots: ['archive-canvas-full', 'acu-graph-detail', 'search-results-graph'],
  },

  coreCapture: {
    id: 'coreCapture',
    name: 'Core Capture',
    tagline: 'One tap. Nine providers. Your entire AI history, archived.',
    investorType: 'all',
    demoTime: '20-25s',
    narrative: {
      hook: "You use four AI assistants at work. None of them talk to each other. Your best thinking is scattered across browser tabs.",
      body: [
        "VIVIM captures from ChatGPT, Claude, Gemini, DeepSeek, Grok, Mistral, and more — with one browser extension click.",
        "It auto-extracts the actual knowledge from every conversation — not just the text, but the meaning.",
        "In two weeks of use, this user has 320 conversations archived. That's years of work you'd otherwise never see again."
      ],
      close: "One tap. Nine providers. Your AI history, owned forever."
    },
    flows: [
      {
        name: 'Archive Overview',
        pages: [
          { path: '/archive', label: 'Archive timeline', wait: 2000 },
          { path: '/archive?view=grid', label: 'Grid by provider', wait: 2000 },
          { path: '/archive/imported', label: 'Imported sources', wait: 2000 },
        ],
      },
      {
        name: 'Capture Flow',
        pages: [
          { path: '/capture', label: 'Capture page', wait: 2000 },
          { path: '/import', label: 'Import options', wait: 2000 },
        ],
      },
    ],
    seedWeights: {
      conversations: 320,
      topics: ['react', 'typescript', 'startup', 'ai', 'career'],
      providers: ['chatgpt', 'claude', 'gemini', 'deepseek', 'grok', 'mistral'],
      memoryDepth: 'medium',
      circles: 1,
      groups: 2,
      friendships: 2,
      notebooks: 1,
    },
    slideSlugs: [
      'problem-fragmented-ai',
      'nine-providers-one-tap',
      'archive-timeline',
      'auto-extracted-knowledge',
    ],
    searchQueries: ['react best practices', 'startup advice', 'career growth'],
    screenshots: ['archive-timeline-full', 'provider-grid', 'import-sources'],
  },

  contextEngine: {
    id: 'contextEngine',
    name: 'Context Engine',
    tagline: 'AI that actually knows who you are',
    investorType: 'technical',
    demoTime: '25-30s',
    narrative: {
      hook: "Every time you start a new AI conversation, you lose everything. Your context. Your history. Your identity.",
      body: [
        "VIVIM's Context Engine assembles everything relevant to every new conversation — your memories, your past conversations, your preferences.",
        "The Cockpit shows you exactly what's being sent: token budget, memory retrieval, topic detection, entity extraction.",
        "This is the moat. It's not just storage. It's a context layer that makes every AI interaction smarter than the last."
      ],
      close: "The more you use VIVIM, the smarter every AI becomes. Compound intelligence."
    },
    flows: [
      {
        name: 'Context Cockpit',
        pages: [
          { path: '/context-cockpit', label: 'Context cockpit - full view', wait: 3000 },
          { path: '/chat', label: 'VIVIM AI with context', wait: 2000 },
          { path: '/settings/context', label: 'Context recipes', wait: 2000 },
        ],
      },
    ],
    seedWeights: {
      conversations: 200,
      topics: ['react', 'typescript', 'architecture', 'startup', 'ai'],
      providers: ['chatgpt', 'claude'],
      memoryDepth: 'heavy',
      circles: 2,
      groups: 3,
      friendships: 5,
      notebooks: 3,
    },
    slideSlugs: [
      'problem-context-loss',
      'context-engine-overview',
      'context-cockpit',
      'compound-intelligence',
    ],
    searchQueries: ['react architecture', 'context window optimization', 'memory retrieval'],
    screenshots: ['context-cockpit-full', 'context-recipes', 'memory-retrieval'],
  },

  forYouFeed: {
    id: 'forYouFeed',
    name: 'For You Feed',
    tagline: 'Your AI thinking, curated for what matters today',
    investorType: 'product',
    demoTime: '20-25s',
    narrative: {
      hook: "Your AI conversations from six months ago probably have answers to problems you're solving right now. You just can't find them.",
      body: [
        "The For You feed uses everything VIVIM knows about you — topics, entities, conversation patterns — to surface the most relevant past thinking.",
        "Topic filters let you zoom in on specific areas: React patterns, startup strategy, Postgres optimization.",
        "It's like having a research assistant who read everything you ever wrote and knows exactly what you need."
      ],
      close: "Stop asking the same questions. Start finding the answers you already have."
    },
    flows: [
      {
        name: 'For You Feed',
        pages: [
          { path: '/for-you', label: 'For You feed', wait: 3000 },
          { path: '/for-you?topic=react', label: 'Filtered by topic', wait: 2000 },
          { path: '/analytics', label: 'Usage analytics', wait: 2000 },
        ],
      },
    ],
    seedWeights: {
      conversations: 250,
      topics: ['react', 'typescript', 'startup', 'career', 'system_design'],
      providers: ['chatgpt', 'claude', 'gemini', 'deepseek'],
      memoryDepth: 'medium',
      circles: 1,
      groups: 2,
      friendships: 3,
      notebooks: 2,
    },
    slideSlugs: [
      'problem-lost-knowledge',
      'for-you-feed',
      'topic-filtering',
      'never-ask-twice',
    ],
    searchQueries: ['react patterns', 'startup validation', 'career transition'],
    screenshots: ['for-you-feed', 'topic-filter-react', 'analytics-dashboard'],
  },

  identityStorage: {
    id: 'identityStorage',
    name: 'Identity & Storage',
    tagline: 'Your data. Your keys. Decentralized by design.',
    investorType: 'technical',
    demoTime: '20-25s',
    narrative: {
      hook: "Every AI platform you use today owns your data. Your prompts. Your thinking. VIVIM inverts that.",
      body: [
        "Built on DID (Decentralized Identity) — your identity is cryptographically yours.",
        "Storage dashboard shows exactly what's stored where, with full transparency.",
        "No vendor lock-in. Export everything. Migrate anytime. Your AI brain, portable."
      ],
      close: "Own your AI. Own your data. Own your identity."
    },
    flows: [
      {
        name: 'Identity & Storage',
        pages: [
          { path: '/identity', label: 'DID Identity setup', wait: 2000 },
          { path: '/storage', label: 'Storage dashboard', wait: 2000 },
          { path: '/account', label: 'Account & settings', wait: 2000 },
        ],
      },
    ],
    seedWeights: {
      conversations: 150,
      topics: ['react', 'startup', 'ai'],
      providers: ['chatgpt', 'claude'],
      memoryDepth: 'medium',
      circles: 1,
      groups: 1,
      friendships: 2,
      notebooks: 2,
    },
    slideSlugs: [
      'decentralized-identity',
      'storage-transparency',
      'your-data-your-keys',
      'portable-ai-brain',
    ],
    searchQueries: ['did identity', 'data portability'],
    screenshots: ['identity-setup', 'storage-dashboard', 'account-settings'],
  },

  socialSharing: {
    id: 'socialSharing',
    name: 'Social & Sharing',
    tagline: 'Share your AI brain. Learn from your circle.',
    investorType: 'business',
    demoTime: '20-25s',
    narrative: {
      hook: "Your startup's best AI learnings are in one person's head. What if the whole team could share?",
      body: [
        "Circles: private groups for teams, projects, or communities. Share curated knowledge instantly.",
        "Groups: public communities around topics. VIVIM users sharing insights on React, Postgres, startup.",
        "One-tap sharing with full attribution. The person who taught you something gets credit."
      ],
      close: "Network effects for AI knowledge. The more people share, the smarter everyone gets."
    },
    flows: [
      {
        name: 'Social Features',
        pages: [
          { path: '/archive/shared', label: 'Shared conversations', wait: 2000 },
          { path: '/settings/advanced', label: 'Sharing settings', wait: 2000 },
        ],
      },
    ],
    seedWeights: {
      conversations: 200,
      topics: ['startup', 'react', 'ai', 'system_design'],
      providers: ['chatgpt', 'claude', 'gemini'],
      memoryDepth: 'medium',
      circles: 3,
      groups: 4,
      friendships: 8,
      notebooks: 2,
    },
    slideSlugs: [
      'circles-teams',
      'groups-communities',
      'attributed-sharing',
      'network-effects',
    ],
    searchQueries: ['team knowledge sharing', 'react patterns'],
    screenshots: ['circles-list', 'groups-feed', 'shared-conversations'],
  },

  aiNative: {
    id: 'aiNative',
    name: 'AI Native',
    tagline: 'VIVIM AI — built on your memory, not just your prompt',
    investorType: 'product',
    demoTime: '25-30s',
    narrative: {
      hook: "Generic AI answers generic questions. VIVIM AI answers questions using everything you've ever learned.",
      body: [
        "Every answer draws from your archive, your memories, your past conversations.",
        "ACU extraction pulls atomic insights from every chat and makes them searchable.",
        "BYOK support: bring your own API key. Use VIVIM's context layer with your preferred AI."
      ],
      close: "Not another AI. An AI that knows you."
    },
    flows: [
      {
        name: 'VIVIM AI',
        pages: [
          { path: '/chat', label: 'VIVIM AI chat', wait: 2000 },
          { path: '/byok', label: 'BYOK configuration', wait: 2000 },
          { path: '/settings/providers', label: 'AI providers', wait: 2000 },
        ],
      },
    ],
    seedWeights: {
      conversations: 250,
      topics: ['react', 'typescript', 'architecture', 'startup', 'ai'],
      providers: ['chatgpt', 'claude', 'gemini'],
      memoryDepth: 'heavy',
      circles: 2,
      groups: 3,
      friendships: 3,
      notebooks: 3,
    },
    slideSlugs: [
      'vivim-ai-overview',
      'memory-grounded',
      'byok-flexibility',
      'acu-extraction',
    ],
    searchQueries: ['react context', 'startup strategy'],
    screenshots: ['vivim-ai-chat', 'byok-settings', 'provider-config'],
  },

  fullJourney: {
    id: 'fullJourney',
    name: 'Full Journey (All Features)',
    tagline: 'The complete VIVIM experience — end to end',
    investorType: 'all',
    demoTime: '90-120s',
    narrative: {
      hook: "Let me show you the full picture.",
      body: [
        "Capture. Organize. Understand. Share. Remember.",
        "This is what VIVIM looks like after three months of daily use."
      ],
      close: "That's VIVIM. Questions?"
    },
    flows: [
      { name: 'Onboarding', pages: [{ path: '/login', label: 'Login', wait: 2000 }, { path: '/archive', label: 'Archive home', wait: 2000 }] },
      { name: 'Core Features', pages: [{ path: '/archive', label: 'Archive', wait: 2000 }, { path: '/archive?view=canvas', label: 'Canvas', wait: 5000 }, { path: '/for-you', label: 'For You', wait: 3000 }] },
      { name: 'Context', pages: [{ path: '/context-cockpit', label: 'Cockpit', wait: 2000 }, { path: '/chat', label: 'VIVIM AI', wait: 2000 }] },
      { name: 'Social', pages: [{ path: '/archive/shared', label: 'Shared', wait: 2000 }] },
    ],
    seedWeights: {
      conversations: 320,
      topics: ['react', 'typescript', 'architecture', 'postgres', 'startup', 'ai', 'system_design', 'career'],
      providers: ['chatgpt', 'claude', 'gemini', 'deepseek', 'grok', 'mistral'],
      memoryDepth: 'heavy',
      circles: 3,
      groups: 4,
      friendships: 5,
      notebooks: 3,
    },
    slideSlugs: [
      'problem-fragmented-ai',
      'solution-overview',
      'nine-providers-one-tap',
      'knowledge-graph-demo',
      'context-engine-overview',
      'for-you-feed',
      'social-sharing',
      'full-demo-recap',
    ],
    searchQueries: ['react hooks', 'startup advice', 'postgres optimization', 'system design'],
    screenshots: ['archive-full', 'canvas-full', 'for-you-full', 'cockpit-full', 'social-full'],
  },
};

export const FOCUS_AREA_IDS = Object.keys(FOCUS_AREAS);
export const FOCUS_AREA_LIST = Object.values(FOCUS_AREAS);
