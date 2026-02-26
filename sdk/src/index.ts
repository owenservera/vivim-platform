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

// Utilities
export * from './utils/index.js';

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
