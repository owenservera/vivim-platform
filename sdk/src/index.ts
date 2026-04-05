/**
 * VIVIM SDK - Distributed Social AI Network
 * 
 * Main entry point for the VIVIM SDK.
 */

// Core types and constants
export * from './core/index.js';

// Main SDK
export { VivimSDK } from './core/sdk.js';

// Resolve ambiguities by explicitly re-exporting conflicting names from core
export { 
  TrustLevel, 
  ValidationResult, 
  MessageDirection, 
  MessagePriority,
  MessageEnvelope,
  MessageFlags,
  Timestamp,
  PROTOCOL_VERSION
} from './core/index.js';

// Resolve Cache-related ambiguities from utils
export {
  CacheConfig,
  CacheEntry,
  createCache
} from './utils/index.js';

// Nodes (exclude conflicting permission/tool names)
export {
  IdentityNode,
  type IdentityNodeAPI,
  type Profile,
  StorageNode,
  type StorageNodeAPI,
  ContentNode,
  type ContentNodeAPI,
  SocialNode,
  type SocialNodeAPI,
  AIChatNode,
  type AIChatNodeAPI,
  MemoryNode,
  type MemoryNodeAPI,
  SovereignPermissionsNode,
  type SovereignPermissionsAPI,
  ChatLinkNexus,
  type ChatLinkNexusAPI,
  ChatVaultArchiver,
  type ChatVaultArchiverAPI,
  type PermissionRule as NodePermissionRule,
  type PermissionCheckResult as NodePermissionCheckResult,
  type PermissionContext as NodePermissionContext,
  type PermissionAction as NodePermissionAction,
} from './nodes/index.js';

// Protocols
export * from './protocols/index.js';

// Skills
export * from './skills/index.js';

// Utilities
export * from './utils/index.js';

// Apps
export * from './apps/index.js';

// Extension
export * from './extension/index.js';

// MCP
export {
  MCPServer,
  createMCPServerFromEnv,
  ToolRegistry as MCPToolRegistry,
  globalToolRegistry as globalMCPToolRegistry,
  StdioTransport,
  createStdioTransport,
} from './mcp/index.js';

export {
  type MCPToolDefinition,
  type MCPToolHandler,
  type MCPContext,
  type MCPResponse,
  type MCPConfig,
} from './mcp/types.js';

// Services (Memory, Compression, etc. — exclude conflicting names)
export {
  MemoryDirectoryManager,
  MemoryCommands,
  MemoryExtractor,
  SessionMemoryManager,
  MemoryUsageTracker,
  TeamMemorySync,
  ContextCompressionService,
  type MemoryScope,
  type MemoryFileInfo,
  type MemoryDirectory,
  type MemoryEntry as HierarchicalMemoryEntry,
  type MemoryMetadata,
  type MemoryQuery as HierarchicalMemoryQuery,
  type StorageAdapter,
  NoOpStorageAdapter,
  type CreateMemoryInput,
  type UpdateMemoryInput,
  type MemoryCandidate,
  type MemoryCandidateType,
  type ExtractionResult,
  type ExtractionRule,
  type SessionConfig,
  type SessionMemory,
  type MemoryUsageStats,
  type MemoryUsageSnapshot,
  type TeamSyncState,
  type SyncDelta,
  type SyncResult,
  type ConflictResolutionStrategy,
  type CompressionStrategy,
  type CompressionOptions,
  type CompressionResult,
  type CompressedMessage,
  type SummarizerFn,
} from './services/index.js';

// Plugins
export {
  PluginLoader,
  type PluginManifest,
  type PluginCapability,
  type InstalledPlugin,
  type PluginExports,
  type PluginContext,
  type PluginEvent,
  type PluginSourceType,
  type PluginStatus,
} from './plugins/index.js';

// Telemetry & Demo Engine
export {
  TelemetryHub,
  JourneyRunner,
  DemoEventBus,
  createInvestorPitchJourney,
  createOnboardingJourney,
  instrumentSDK,
  instrumentMemory,
  instrumentToolRegistry,
  instrumentAgentSpawner,
  instrumentTaskManager,
  instrumentMemoryExtractor,
  instrumentCompression,
  instrumentPluginLoader,
  type MetricType,
  type Metric,
  type CounterMetric,
  type GaugeMetric,
  type HistogramMetric,
  type EventLogEntry,
  type DashboardSummary,
  type DemoStep,
  type DemoStepStatus,
  type DemoJourney,
  type DemoState,
  type MagicMoment,
  type DemoEvent,
  type DemoEventType,
} from './telemetry/index.js';
