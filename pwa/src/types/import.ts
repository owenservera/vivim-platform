export type ImportPhase = 'upload' | 'scanning' | 'configure' | 'processing' | 'completed' | 'error';

export type ImportTier = 
  | 'TIER_0_CORE'
  | 'TIER_1_ACU'
  | 'TIER_2_MEMORY'
  | 'TIER_3_CONTEXT'
  | 'TIER_4_INDEX';

export type ImportJobStatus = 
  | 'PENDING'
  | 'SCANNING'
  | 'WAITING_FOR_USER'
  | 'PROCESSING'
  | 'TIER_COMPLETE'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PAUSED';

export interface Tier0Config {
  enabled: true;
  skipDuplicates: boolean;
  validateSchema: boolean;
}

export interface Tier1Config {
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
  minContentLength: number;
  extractCode: boolean;
  extractThinking: boolean;
}

export interface Tier2Config {
  enabled: boolean;
  depth: 'basic' | 'deep';
  extractFacts: boolean;
  extractPreferences: boolean;
  extractGoals: boolean;
}

export interface Tier3Config {
  enabled: boolean;
  mergeStrategy: 'aggressive' | 'conservative';
  updateTopics: boolean;
  updateEntities: boolean;
}

export interface Tier4Config {
  enabled: boolean;
  async: boolean;
  priority: 'high' | 'low';
}

export interface ImportTierConfig {
  tier0: Tier0Config;
  tier1?: Tier1Config;
  tier2?: Tier2Config;
  tier3?: Tier3Config;
  tier4?: Tier4Config;
}

export interface IntelligentOptions {
  prioritizeRecent: boolean;
  recentPercentage: number;
  skipShortConversations: boolean;
  minMessages: number;
  detectAndMergeDuplicates: boolean;
  parallelProcessing: boolean;
  maxConcurrency: number;
}

export interface ImportScanResult {
  totalConversations: number;
  totalMessages: number;
  estimatedSize: number;
  providers: string[];
  dateRange: {
    earliest: string;
    latest: string;
  };
  conversationSizeDistribution: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  estimatedProcessingTime: {
    tier0: string;
    tier1: string;
    tier2: string;
    tier3: string;
    tier4: string;
  };
}

export interface TierProgress {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  conversationsProcessed?: number;
  totalConversations?: number;
  tierSpecificProgress?: number;
  timeElapsed?: string;
  estimatedRemaining?: string;
  stats?: Record<string, number>;
  error?: string;
}

export interface ImportJob {
  id: string;
  status: ImportJobStatus;
  currentTier: ImportTier | null;
  fileName: string;
  totalConversations: number;
  processedConversations: number;
  failedConversations: number;
  progress: number;
  tierProgress?: Record<ImportTier, TierProgress>;
  acuGenerated?: number;
  memoriesExtracted?: number;
  contextEnriched?: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  errors: Array<{
    stage: string;
    message: string;
    timestamp: string;
  }>;
}

export const DEFAULT_TIER_CONFIG: ImportTierConfig = {
  tier0: {
    enabled: true,
    skipDuplicates: true,
    validateSchema: true,
  },
  tier1: {
    enabled: false,
    priority: 'medium',
    minContentLength: 20,
    extractCode: true,
    extractThinking: false,
  },
  tier2: {
    enabled: false,
    depth: 'basic',
    extractFacts: true,
    extractPreferences: true,
    extractGoals: true,
  },
  tier3: {
    enabled: false,
    mergeStrategy: 'conservative',
    updateTopics: true,
    updateEntities: true,
  },
  tier4: {
    enabled: false,
    async: true,
    priority: 'low',
  },
};

export const DEFAULT_INTELLIGENT_OPTIONS: IntelligentOptions = {
  prioritizeRecent: false,
  recentPercentage: 20,
  skipShortConversations: false,
  minMessages: 3,
  detectAndMergeDuplicates: true,
  parallelProcessing: false,
  maxConcurrency: 3,
};

export const TIER_LABELS: Record<ImportTier, string> = {
  TIER_0_CORE: 'Core Import',
  TIER_1_ACU: 'ACU Generation',
  TIER_2_MEMORY: 'Memory Extraction',
  TIER_3_CONTEXT: 'Context Enrichment',
  TIER_4_INDEX: 'Index Building',
};

export const TIER_DESCRIPTIONS: Record<ImportTier, string> = {
  TIER_0_CORE: 'Parse and store all conversations in the database',
  TIER_1_ACU: 'Extract knowledge units from conversation messages',
  TIER_2_MEMORY: 'Extract facts, preferences, and goals from content',
  TIER_3_CONTEXT: 'Build knowledge graph connections',
  TIER_4_INDEX: 'Build search indexes for fast retrieval',
};
