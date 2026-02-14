export type ACUAction =
  | 'open'
  | 'continue'
  | 'reply'
  | 'fork'
  | 'archive'
  | 'pin'
  | 'tag'
  | 'bookmark'
  | 'delete'
  | 'duplicate'
  | 'merge'
  | 'split'
  | 'select';

export interface ACUActionConfig {
  id: ACUAction;
  label: string;
  icon: string;
  shortcut?: string;
  destructive?: boolean;
  requiresConfirmation?: boolean;
  premium?: boolean;
}

export const ACU_ACTIONS: Record<ACUAction, ACUActionConfig> = {
  open: { id: 'open', label: 'Open', icon: 'Eye', shortcut: '⌘O' },
  continue: { id: 'continue', label: 'Continue Chat', icon: 'MessageSquarePlus', shortcut: '⌘K' },
  reply: { id: 'reply', label: 'Quick Reply', icon: 'Reply' },
  fork: { id: 'fork', label: 'Fork ACU', icon: 'GitFork', shortcut: '⌘F' },
  archive: { id: 'archive', label: 'Archive', icon: 'Archive', shortcut: '⌘A' },
  pin: { id: 'pin', label: 'Pin', icon: 'Pin', shortcut: '⌘P' },
  tag: { id: 'tag', label: 'Add Tag', icon: 'Tag', shortcut: '⌘T' },
  bookmark: { id: 'bookmark', label: 'Bookmark', icon: 'Bookmark', shortcut: '⌘D' },
  delete: { id: 'delete', label: 'Delete', icon: 'Trash2', destructive: true, requiresConfirmation: true },
  duplicate: { id: 'duplicate', label: 'Duplicate', icon: 'Copy' },
  merge: { id: 'merge', label: 'Merge', icon: 'Merge', premium: true },
  split: { id: 'split', label: 'Split Thread', icon: 'Scissors', premium: true },
  select: { id: 'select', label: 'Select', icon: 'CheckSquare' },
};

export interface ACUTag {
  id: string;
  name: string;
  color: string;
  count?: number;
}

export interface ACUCollection {
  id: string;
  name: string;
  description?: string;
  acuIds: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  color?: string;
}

export interface ACUMetadata {
  tags: string[];
  collectionIds: string[];
  isPinned: boolean;
  isArchived: boolean;
  readStatus: 'unread' | 'read' | 'reading';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  customFields?: Record<string, string>;
}

export type ShareVisibility = 'private' | 'circle' | 'public' | 'link';

export interface ShareConfig {
  visibility: ShareVisibility;
  circleId?: string;
  expiresAt?: string;
  password?: string;
  allowComments: boolean;
  allowForks: boolean;
  attributionRequired: boolean;
}

export interface ShareLink {
  id: string;
  url: string;
  shortCode: string;
  visibility: ShareVisibility;
  createdAt: string;
  accessCount: number;
  expiresAt?: string;
}

export type SocialAction =
  | 'like'
  | 'comment'
  | 'fork'
  | 'remix'
  | 'share'
  | 'follow'
  | 'bookmark'
  | 'report';

export interface SocialReaction {
  type: 'like' | 'love' | 'laugh' | 'insightful' | 'curious';
  count: number;
  userReacted: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  replyTo?: string;
  reactions: SocialReaction[];
}

export interface ForkInfo {
  forkId: string;
  parentId: string;
  parentAuthorId?: string;
  parentAuthorName?: string;
  forkedAt: string;
  changes: 'minor' | 'major' | 'remix';
  attribution: string;
}

export interface RemixInfo {
  remixId: string;
  sourceIds: string[];
  remixType: 'blend' | 'mashup' | 'response' | 'critique';
  createdAt: string;
  authorId: string;
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberIds: string[];
  adminIds: string[];
  visibility: 'public' | 'private' | 'secret';
  createdAt: string;
  acuCount: number;
  settings: CircleSettings;
}

export interface CircleSettings {
  allowMemberSharing: boolean;
  allowExternalForks: boolean;
  requireApproval: boolean;
  defaultShareVisibility: ShareVisibility;
}

export interface CircleInvite {
  id: string;
  circleId: string;
  invitedBy: string;
  inviteeEmail?: string;
  inviteCode: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface CircleMember {
  userId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
  contributionCount: number;
}

export type AIAction =
  | 'summarize'
  | 'expand'
  | 'simplify'
  | 'translate'
  | 'extract_insights'
  | 'generate_title'
  | 'generate_questions'
  | 'find_related'
  | 'check_contradictions'
  | 'continue_chat'
  | 'switch_model'
  | 'compare_models';

export interface AIActionConfig {
  id: AIAction;
  label: string;
  icon: string;
  description: string;
  requiresContent?: boolean;
  premium?: boolean;
}

export const AI_ACTIONS: Record<AIAction, AIActionConfig> = {
  summarize: {
    id: 'summarize',
    label: 'Summarize',
    icon: 'Text',
    description: 'Generate a concise summary',
  },
  expand: {
    id: 'expand',
    label: 'Expand',
    icon: 'Maximize2',
    description: 'Elaborate on key points',
  },
  simplify: {
    id: 'simplify',
    label: 'Simplify',
    icon: 'Minimize2',
    description: 'Make it easier to understand',
  },
  translate: {
    id: 'translate',
    label: 'Translate',
    icon: 'Languages',
    description: 'Convert to another language',
  },
  extract_insights: {
    id: 'extract_insights',
    label: 'Extract Insights',
    icon: 'Lightbulb',
    description: 'Pull out key takeaways',
  },
  generate_title: {
    id: 'generate_title',
    label: 'Generate Title',
    icon: 'Type',
    description: 'Auto-generate a title from content',
  },
  generate_questions: {
    id: 'generate_questions',
    label: 'Study Questions',
    icon: 'HelpCircle',
    description: 'Create questions for review',
  },
  find_related: {
    id: 'find_related',
    label: 'Find Related',
    icon: 'GitBranch',
    description: 'Discover similar conversations',
    premium: true,
  },
  check_contradictions: {
    id: 'check_contradictions',
    label: 'Check Facts',
    icon: 'ShieldCheck',
    description: 'Validate claims and spot contradictions',
    premium: true,
  },
  continue_chat: {
    id: 'continue_chat',
    label: 'Continue Chat',
    icon: 'MessageSquarePlus',
    description: 'Resume the conversation',
  },
  switch_model: {
    id: 'switch_model',
    label: 'Switch Model',
    icon: 'Zap',
    description: 'Continue with different AI',
  },
  compare_models: {
    id: 'compare_models',
    label: 'Compare Models',
    icon: 'Columns',
    description: 'Run across multiple AIs',
    premium: true,
  },
};

export interface AIResult {
  action: AIAction;
  content: string;
  metadata?: {
    model?: string;
    tokens?: number;
    confidence?: number;
  };
  createdAt: string;
}

export interface RelatedACU {
  acuId: string;
  title: string;
  similarity: number;
  reason: string;
}

export interface ContradictionCheck {
  claim: string;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
  explanation: string;
}

export interface ACULineage {
  acuId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  parentId?: string;
  forkChain: ForkInfo[];
  remixChain: RemixInfo[];
  contributors: string[];
  version: number;
}

export interface Attribution {
  originalAuthor: string;
  originalUrl?: string;
  license: 'cc0' | 'cc-by' | 'cc-by-sa' | 'proprietary';
  modifications: string[];
  forkedFrom?: string;
  remixedFrom?: string[];
}

export interface BatchOperation {
  type: 'archive' | 'delete' | 'tag' | 'move_to_collection' | 'share';
  acuIds: string[];
  params?: Record<string, unknown>;
}

export interface SelectionState {
  selectedIds: string[];
  isSelectMode: boolean;
  lastSelectedId?: string;
}

export interface SemanticSearchResult {
  acuId: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  semanticScore: number;
  keywords: string[];
}

export interface TopicCluster {
  id: string;
  name: string;
  description?: string;
  acuIds: string[];
  keywords: string[];
  centroid: number[];
}

export interface SearchFilters {
  providers?: string[];
  dateRange?: { from?: string; to?: string };
  tags?: string[];
  hasCode?: boolean;
  hasImages?: boolean;
  minQuality?: number;
  inCollection?: string;
}
