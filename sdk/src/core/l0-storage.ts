/**
 * L0 Core Storage - Roadmap Entry
 * 
 * This module implements the L0 (Layer 0) Core Storage entry for the VIVIM SDK.
 * Per the "1st on Chain Rule", L0.STORAGE is REQUIRED for any node to participate
 * in or connect to the VIVIM Chain of Trust.
 * 
 * This serves as the foundational document containing the development roadmap
 * that all nodes must have access to.
 * 
 * @packageDocumentation
 */

import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from 'uint8arrays';
import type { VivimSDK } from './sdk.js';
import { SDK_VERSION } from './constants.js';
import type { TrustLevel } from './anchor.js';

/**
 * L0 Document Types
 */
export const L0_DOCUMENT_TYPES = {
  ROADMAP: 'L0.ROADMAP',
  TRUST_REGISTRY: 'L0.TRUST_REGISTRY',
  ANCHOR_CHAIN: 'L0.ANCHOR_CHAIN',
  CONFIG: 'L0.CONFIG',
} as const;

/**
 * L0 Storage Entry Interface
 * Represents the schema for any L0 core storage document
 */
export interface L0StorageEntry<T = unknown> {
  // Document identification
  documentId: string;
  documentType: string;
  version: string;
  contentCid: string;
  
  // Trust information
  trustLevel: TrustLevel;
  anchorCid?: string;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  validFrom: number;
  expiresAt?: number;
  
  // Content
  content: T;
  
  // Dependencies
  requiresSdkVersion: string;
  requiresNetworkVersion?: string;
  
  // Integrity
  signature: string;
  previousCid?: string;
  merkleRoot: string;
}

/**
 * Roadmap Content Schema
 */
export interface RoadmapContent {
  title: string;
  version: string;
  executiveSummary: string;
  missionStatement: string;
  phases: RoadmapPhase[];
  architecture: ArchitectureOverview;
  chainOfTrust: ChainOfTrustSpec;
  securityConsiderations: string[];
  contributing: ContributingGuide;
  references: Reference[];
}

/**
 * Roadmap Phase
 */
export interface RoadmapPhase {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'planned' | 'deprecated';
  goals: string[];
  deliverables: Deliverable[];
  timeline?: string;
  dependencies?: string[];
}

/**
 * Deliverable
 */
export interface Deliverable {
  id: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  type: 'feature' | 'improvement' | 'bugfix' | 'documentation';
}

/**
 * Architecture Overview
 */
export interface ArchitectureOverview {
  layers: Layer[];
  components: Component[];
  dataFlow: string;
}

/**
 * Layer
 */
export interface Layer {
  name: string;
  description: string;
  components: string[];
}

/**
 * Component
 */
export interface Component {
  name: string;
  file: string;
  purpose: string;
  dependencies: string[];
}

/**
 * Chain of Trust Specification
 */
export interface ChainOfTrustSpec {
  trustLevels: TrustLevelSpec[];
  anchorProtocol: string;
  migrationPath: string;
}

/**
 * Trust Level Specification
 */
export interface TrustLevelSpec {
  level: TrustLevel;
  name: string;
  description: string;
  requirements: string[];
}

/**
 * Contributing Guide
 */
export interface ContributingGuide {
  developmentSetup: string[];
  codeStyle: string;
  testing: string;
  commitMessages: string;
}

/**
 * Reference
 */
export interface Reference {
  title: string;
  url: string;
  type: 'docs' | 'api' | 'guide';
}

/**
 * L0 Storage Manager
 * Manages L0 core storage entries for the SDK
 */
export class L0StorageManager {
  private sdk: VivimSDK;
  private entries: Map<string, L0StorageEntry> = new Map();
  private initialized = false;
  
  constructor(sdk: VivimSDK) {
    this.sdk = sdk;
  }
  
  /**
   * Initialize L0 storage with the roadmap
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[L0Storage] Already initialized');
      return;
    }
    
    console.log('[L0Storage] 📦 Initializing L0 Core Storage...');
    
    // Load the roadmap into L0 storage
    await this.loadRoadmap();
    
    // Load trust registry
    await this.loadTrustRegistry();
    
    this.initialized = true;
    console.log('[L0Storage] ✅ L0 Core Storage initialized');
  }
  
  /**
   * Get an L0 storage entry by ID
   */
  getEntry<T = unknown>(documentId: string): L0StorageEntry<T> | null {
    return (this.entries.get(documentId) as L0StorageEntry<T>) || null;
  }
  
  /**
   * Get all L0 storage entries
   */
  getAllEntries(): L0StorageEntry[] {
    return Array.from(this.entries.values());
  }
  
  /**
   * Get the roadmap entry
   */
  getRoadmap(): L0StorageEntry<RoadmapContent> | null {
    return this.getEntry<RoadmapContent>(L0_DOCUMENT_TYPES.ROADMAP);
  }
  
  /**
   * Verify L0 storage integrity
   */
  async verifyIntegrity(): Promise<boolean> {
    const roadmap = this.getRoadmap();
    if (!roadmap) {
      console.error('[L0Storage] Roadmap not found');
      return false;
    }
    
    // Verify signature
    try {
      const valid = await this.sdk.verify(
        {
          documentId: roadmap.documentId,
          contentCid: roadmap.contentCid,
          merkleRoot: roadmap.merkleRoot,
          timestamp: roadmap.createdAt,
        },
        roadmap.signature,
        'L0.GENESIS' // Self-signed by genesis
      );
      
      return valid;
    } catch (error) {
      console.error('[L0Storage] Integrity verification failed:', error);
      return false;
    }
  }
  
  /**
   * Check if a specific document type exists in L0 storage
   */
  hasDocument(documentType: string): boolean {
    for (const entry of this.entries.values()) {
      if (entry.documentType === documentType) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get documents by type
   */
  getDocumentsByType<T = unknown>(documentType: string): L0StorageEntry<T>[] {
    const results: L0StorageEntry<T>[] = [];
    for (const entry of this.entries.values()) {
      if (entry.documentType === documentType) {
        results.push(entry as L0StorageEntry<T>);
      }
    }
    return results;
  }
  
  /**
   * Load the roadmap into L0 storage
   */
  private async loadRoadmap(): Promise<void> {
    const roadmapContent: RoadmapContent = {
      title: 'VIVIM SDK Development Roadmap',
      version: '1.0.0',
      executiveSummary: 'The VIVIM SDK is a comprehensive, Bun-native toolkit for building decentralized, local-first applications with AI capabilities.',
      missionStatement: 'Own Your AI | Share Your AI | Evolve Your AI',
      phases: [
        {
          id: 'phase-1',
          name: 'Foundation',
          status: 'completed',
          goals: ['Core SDK implementation', 'Identity system', 'Basic storage node', 'Chain client'],
          deliverables: [
            { id: 'd1', description: '@vivim/sdk v1.0.0', status: 'completed', type: 'feature' },
            { id: 'd2', description: 'Built-in nodes (6 nodes)', status: 'completed', type: 'feature' },
            { id: 'd3', description: 'Apps (11 apps)', status: 'completed', type: 'feature' },
            { id: 'd4', description: 'Bun-native packaging', status: 'completed', type: 'feature' },
          ],
          timeline: 'Q1 2026'
        },
        {
          id: 'phase-2',
          name: 'Network Maturity',
          status: 'in-progress',
          goals: ['Full Exit Node Protocol', 'Clone registration', 'State sync', 'DHT discovery'],
          deliverables: [
            { id: 'd5', description: 'ExitNodeService class', status: 'in-progress', type: 'feature' },
            { id: 'd6', description: 'SyncProtocol implementation', status: 'planned', type: 'feature' },
            { id: 'd7', description: 'Clone management CLI', status: 'planned', type: 'feature' },
          ],
          timeline: 'Q2 2026'
        },
        {
          id: 'phase-3',
          name: 'Decentralization',
          status: 'planned',
          goals: ['Multiple primary nodes', 'State sharding', 'Cross-primary sync'],
          deliverables: [
            { id: 'd8', description: 'Federated network support', status: 'planned', type: 'feature' },
            { id: 'd9', description: 'Sharding strategy', status: 'planned', type: 'feature' },
          ],
          timeline: 'Q3-Q4 2026'
        },
        {
          id: 'phase-4',
          name: 'Full Distribution',
          status: 'planned',
          goals: ['No central authority', 'Full P2P', 'L1 anchoring'],
          deliverables: [
            { id: 'd10', description: 'Distributed state management', status: 'planned', type: 'feature' },
            { id: 'd11', description: 'Storage deals marketplace', status: 'planned', type: 'feature' },
          ],
          timeline: '2027'
        }
      ],
      architecture: {
        layers: [
          { name: 'L0 Core Storage', description: 'Genesis roadmap, trust registry, anchor chain', components: ['L0StorageManager'] },
          { name: 'On-Chain Layer', description: 'Identity anchor, trust registry, anchor state', components: ['AnchorProtocol', 'TrustRegistry'] },
          { name: 'SDK Core', description: 'VivimSDK, Network Engine, Graph Manager', components: ['VivimSDK', 'NetworkEngine', 'GraphManager'] },
          { name: 'Nodes Layer', description: 'Identity, Storage, Content, Social, AIChat, Memory', components: ['IdentityNode', 'StorageNode', 'ContentNode', 'SocialNode', 'AIChatNode', 'MemoryNode'] },
          { name: 'Apps Layer', description: 'ACU Processor, OmniFeed, Circle Engine, etc.', components: ['ACUProcessor', 'OmniFeed', 'CircleEngine'] },
        ],
        components: [
          { name: 'VivimSDK', file: 'src/core/sdk.ts', purpose: 'Main orchestration layer', dependencies: ['identity-node', 'storage-node'] },
          { name: 'AnchorProtocol', file: 'src/core/anchor.ts', purpose: 'Chain of trust state anchoring', dependencies: ['VivimSDK'] },
          { name: 'OnChainRecordKeeper', file: 'src/core/recordkeeper.ts', purpose: 'Cryptographic audit trail', dependencies: ['VivimSDK'] },
          { name: 'StorageNode', file: 'src/nodes/storage-node.ts', purpose: 'Distributed content storage', dependencies: ['VivimSDK'] },
        ],
        dataFlow: 'Apps → Nodes → SDK Core → On-Chain Layer → L0 Core Storage'
      },
      chainOfTrust: {
        trustLevels: [
          { level: 'genesis', name: 'GENESIS', description: 'Root anchor node', requirements: ['Initial network bootstrap'] },
          { level: 'bootstrap', name: 'BOOTSTRAP', description: 'Relay/bridge nodes', requirements: ['Network infrastructure'] },
          { level: 'primary', name: 'PRIMARY', description: 'Main SDK instances', requirements: ['Full identity', 'Storage'] },
          { level: 'secondary', name: 'SECONDARY', description: 'Verified clones', requirements: ['Trust delegation from primary'] },
          { level: 'unverified', name: 'UNVERIFIED', description: 'New nodes', requirements: ['Initial state', 'No trust'] },
          { level: 'suspended', name: 'SUSPENDED', description: 'Revoked trust', requirements: ['Trust revoked'] },
        ],
        anchorProtocol: 'AnchorProtocol provides on-chain state anchoring with merkle roots',
        migrationPath: 'Stage 1: Centralized → Stage 2: Federated → Stage 3: Distributed → Stage 4: Decentralized'
      },
      securityConsiderations: [
        'Clone Impersonation prevention via identity verification',
        'State Tampering protection via merkle verification',
        'Trust Delegation Abuse prevention via signature verification',
        'Replay Attack protection via timestamps and nonces'
      ],
      contributing: {
        developmentSetup: ['bun install', 'bun run dev', 'bun run build', 'bun run test'],
        codeStyle: 'TypeScript strict mode, ESLint + Prettier',
        testing: 'Vitest for unit and integration tests',
        commitMessages: 'Conventional commits format'
      },
      references: [
        { title: 'Core Primitive Node Design', url: './CORE_PRIMITIVE_NODE_DESIGN.md', type: 'docs' },
        { title: 'SDK README', url: '../README.md', type: 'docs' },
        { title: 'Bun Integration', url: './BUN_INTEGRATION.md', type: 'guide' },
      ]
    };
    
    // Create L0 entry
    const entry = await this.createL0Entry(
      L0_DOCUMENT_TYPES.ROADMAP,
      'L0.ROADMAP.V1',
      roadmapContent
    );
    
    this.entries.set(entry.documentId, entry);
    console.log(`[L0Storage] 📄 Loaded roadmap: ${entry.contentCid}`);
  }
  
  /**
   * Load trust registry into L0 storage
   */
  private async loadTrustRegistry(): Promise<void> {
    const registryContent = {
      name: 'VIVIM Trust Registry',
      version: '1.0.0',
      description: 'Registry of trusted nodes and their trust levels',
      entries: [
        {
          did: 'L0.GENESIS',
          trustLevel: 'genesis',
          name: 'L0 Core Storage',
          capabilities: ['*'],
          validFrom: Date.now()
        }
      ]
    };
    
    const entry = await this.createL0Entry(
      L0_DOCUMENT_TYPES.TRUST_REGISTRY,
      'L0.TRUST_REGISTRY.V1',
      registryContent
    );
    
    this.entries.set(entry.documentId, entry);
    console.log(`[L0Storage] 🔐 Loaded trust registry: ${entry.contentCid}`);
  }
  
  /**
   * Create an L0 storage entry
   */
  private async createL0Entry<T>(
    documentType: string,
    documentId: string,
    content: T
  ): Promise<L0StorageEntry<T>> {
    const now = Date.now();
    const contentJson = JSON.stringify(content);
    const contentCid = this.calculateCid(contentJson);
    const merkleRoot = this.calculateMerkleRoot(content);
    
    // Create entry data for signing
    const entryData = {
      documentId,
      documentType,
      contentCid,
      merkleRoot,
      timestamp: now,
    };
    
    // Self-sign the entry (in production, would use actual signing key)
    const signature = await this.sdk.sign(entryData);
    
    const entry: L0StorageEntry<T> = {
      documentId,
      documentType,
      version: '1.0.0',
      contentCid,
      trustLevel: 'genesis', // L0 entries are always genesis level
      createdAt: now,
      updatedAt: now,
      validFrom: now,
      content,
      requiresSdkVersion: SDK_VERSION,
      signature,
      merkleRoot,
    };
    
    return entry;
  }
  
  /**
   * Calculate content CID
   */
  private calculateCid(content: string): string {
    const hash = sha256(new TextEncoder().encode(content));
    const hashHex = bytesToHex(hash);
    return `Qm${hashHex.substring(0, 44)}`;
  }
  
  /**
   * Calculate merkle root from content
   */
  private calculateMerkleRoot(content: unknown): string {
    const contentJson = JSON.stringify(content);
    const hash = sha256(new TextEncoder().encode(contentJson));
    return bytesToHex(hash);
  }
  
  /**
   * Export L0 storage for verification
   */
  exportL0Storage(): string {
    return JSON.stringify(Array.from(this.entries.values()), null, 2);
  }
}

/**
 * Create an L0 Storage Manager instance
 */
export function createL0StorageManager(sdk: VivimSDK): L0StorageManager {
  return new L0StorageManager(sdk);
}
