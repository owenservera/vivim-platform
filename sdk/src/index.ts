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

// Nodes
export * from './nodes/index.js';

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
export * from './mcp/index.js';
