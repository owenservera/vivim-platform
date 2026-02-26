/**
 * VIVIM SDK Nodes Module Exports
 */

// Identity Node
export { IdentityNode, type IdentityNodeAPI, type Profile } from './identity-node.js';

// Storage Node
export {
  StorageNode,
  type StorageNodeAPI,
  type StoreOptions,
  type StorageResult,
  type PinInfo,
  type StorageDeal,
  type DealState,
  type ProviderInfo,
  type ProviderSearchOptions,
  type ProviderReputation,
  type StorageStatus,
  type DealOptions,
} from './storage-node.js';

// Content Node
export {
  ContentNode,
  type ContentNodeAPI,
  type ContentType,
  type ContentObject,
  type MediaMetadata,
  type Thumbnail,
  type ContentOptions,
  type FeedOptions,
  type SearchQuery,
  type ShareOptions,
  type VisibilitySettings,
  type ContentData,
  type PaginationOptions,
} from './content-node.js';

// Social Node
export {
  SocialNode,
  type SocialNodeAPI,
  type FriendStatus,
  type FollowStatus,
  type Circle,
  type CircleMember,
  type CircleOptions,
  type FriendInfo,
  type FriendRequest,
} from './social-node.js';

// AI Chat Node
export {
  AIChatNode,
  type AIChatNodeAPI,
  type Conversation,
  type Message,
  type ToolCall,
  type ConversationOptions,
  type MessageOptions,
  type ToolDefinition,
  type ContextItem,
  type MessageChunk,
  type ModelInfo,
  type ACUExtractionResult,
  type ExtractedACU,
} from './ai-chat-node.js';

// Memory Node
export {
  MemoryNode,
  type MemoryNodeAPI,
  type MemoryType,
  type Memory,
  type MemoryRelation,
  type MemoryQuery,
  type GraphOptions,
  type KnowledgeGraph,
  type GraphNode,
  type GraphEdge,
  type MemoryData,
  type MemoryStats,
  type ConsolidationStatus,
} from './memory-node.js';
