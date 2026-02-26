/**
 * VIVIM SDK
 * 
 * Open-Source E2E Self-Contained Toolkit for Decentralized Applications
 * 
 * @packageDocumentation
 */

// Main SDK
export { VivimSDK } from './core/sdk.js';

// Core types and constants
export * from './core/index.js';

// Nodes
export * from './nodes/index.js';

// Graph
export * from './graph/index.js';

// Registry
export * from './registry/index.js';

// Extension
export * from './extension/index.js';

// Apps
export * from './apps/ai-documentation/index.js';
export * from './apps/ai-git/index.js';
export * from './apps/crypto-engine/index.js';
export * from './apps/acu-processor/index.js';
export * from './apps/omni-feed/index.js';
export * from './apps/circle-engine/index.js';
export * from './apps/assistant-engine/index.js';
export * from './apps/tool-engine/index.js';
export * from './apps/public-dashboard/index.js';
export * from './apps/publishing-agent/index.js';
export * from './apps/roadmap-engine/index.js';

// Utilities
export * from './utils/index.js';

// Protocols (Exit Node, Sync)
export * from './protocols/index.js';
export * from './utils/index.js';

// Assistant & Tool UI standard types
export * from './core/assistant.js';
export { VivimAssistantRuntime } from './core/assistant-runtime.js';

// Re-export commonly used types
export type {
  Identity,
  VivimSDKConfig,
  APINodeDefinition,
  NodeInfo,
  SDKEventMap,
} from './core/types.js';

// Version
export const SDK_VERSION = '1.0.0';
