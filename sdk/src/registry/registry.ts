/**
 * Node Registry
 * Discovers and loads nodes from the network
 */

import type { APINodeDefinition, NodeInfo } from '../core/types.js';

/**
 * Node package info
 */
export interface NodePackageInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  type: 'api' | 'sdk' | 'network';
  capabilities: Array<{ id: string; name: string }>;
  downloads: number;
  stars: number;
  publishedAt: number;
  updatedAt: number;
}

/**
 * Version info
 */
export interface VersionInfo {
  version: string;
  publishedAt: number;
  changelog?: string;
  deprecated: boolean;
}

/**
 * Node search result
 */
export interface NodeSearchResult {
  id: string;
  name: string;
  description: string;
  type: 'api' | 'sdk' | 'network';
  relevance: number;
}

/**
 * Publish result
 */
export interface PublishResult {
  nodeId: string;
  version: string;
  cid: string;
  publishedAt: number;
}

/**
 * Install result
 */
export interface InstallResult {
  nodeId: string;
  version: string;
  path: string;
}

/**
 * Verification result
 */
export interface VerificationResult {
  verified: boolean;
  signature: string;
  publisher: string;
  timestamp: number;
}

/**
 * Trust score
 */
export interface TrustScore {
  score: number;
  factors: {
    downloads: number;
    stars: number;
    verifiedPublisher: boolean;
    age: number;
    issues: number;
  };
}

/**
 * Issue report
 */
export interface IssueReport {
  type: 'bug' | 'security' | 'malware' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Node Package (downloaded)
 */
export interface NodePackage {
  definition: APINodeDefinition;
  code: string;
  signature: string;
  cid: string;
}

/**
 * Local node info
 */
export interface LocalNodeInfo {
  id: string;
  version: string;
  path: string;
  installedAt: number;
  definition: APINodeDefinition;
}

/**
 * Node Registry Implementation
 */
export class NodeRegistry {
  private registryUrl: string;
  private localNodes: Map<string, LocalNodeInfo> = new Map();
  private trustedPublishers: Set<string> = new Set();
  private cache: Map<string, NodePackageInfo> = new Map();

  constructor(registryUrl = 'https://registry.vivim.net') {
    this.registryUrl = registryUrl;
  }

  // ============================================
  // LOCAL DISCOVERY
  // ============================================

  /**
   * List locally installed nodes
   */
  listLocal(): LocalNodeInfo[] {
    return Array.from(this.localNodes.values());
  }

  /**
   * Get node metadata
   */
  getMetadata(nodeId: string): APINodeDefinition | null {
    return this.localNodes.get(nodeId)?.definition || null;
  }

  /**
   * Register local node
   */
  registerLocal(node: LocalNodeInfo): void {
    this.localNodes.set(node.id, node);
  }

  /**
   * Unregister local node
   */
  unregisterLocal(nodeId: string): void {
    this.localNodes.delete(nodeId);
  }

  // ============================================
  // NETWORK DISCOVERY
  // ============================================

  /**
   * Find nodes on network by capability
   */
  async findByCapability(capability: string): Promise<NodeSearchResult[]> {
    // In production, this would query the registry
    // For now, return cached/installed nodes
    const results: NodeSearchResult[] = [];

    for (const node of this.localNodes.values()) {
      const hasCapability = node.definition.capabilities.some(
        c => c.id === capability || c.name.toLowerCase().includes(capability.toLowerCase())
      );

      if (hasCapability) {
        results.push({
          id: node.id,
          name: node.definition.name,
          description: node.definition.description,
          type: 'api',
          relevance: 1.0,
        });
      }
    }

    return results;
  }

  /**
   * Find nodes by publisher
   */
  async findByPublisher(publisherDid: string): Promise<NodeSearchResult[]> {
    const results: NodeSearchResult[] = [];

    for (const node of this.localNodes.values()) {
      if (node.definition.author === publisherDid) {
        results.push({
          id: node.id,
          name: node.definition.name,
          description: node.definition.description,
          type: 'api',
          relevance: 1.0,
        });
      }
    }

    return results;
  }

  /**
   * Search nodes
   */
  async search(query: string): Promise<NodeSearchResult[]> {
    const results: NodeSearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const node of this.localNodes.values()) {
      const matches =
        node.definition.name.toLowerCase().includes(lowerQuery) ||
        node.definition.description.toLowerCase().includes(lowerQuery) ||
        node.definition.capabilities.some(c =>
          c.name.toLowerCase().includes(lowerQuery)
        );

      if (matches) {
        results.push({
          id: node.id,
          name: node.definition.name,
          description: node.definition.description,
          type: 'api',
          relevance: 1.0,
        });
      }
    }

    return results;
  }

  /**
   * Get node from network
   */
  async fetch(nodeId: string): Promise<NodePackage | null> {
    // In production, this would fetch from IPFS/HTTP
    const local = this.localNodes.get(nodeId);
    if (!local) return null;

    return {
      definition: local.definition,
      code: '// Node code would be fetched from network',
      signature: 'signature-would-be-here',
      cid: local.id,
    };
  }

  // ============================================
  // REGISTRY OPERATIONS
  // ============================================

  /**
   * Publish node to registry
   */
  async publish(packagePath: string, options: {
    access: 'public' | 'restricted';
    tag?: string;
  }): Promise<PublishResult> {
    // In production, this would:
    // 1. Build the package
    // 2. Sign it
    // 3. Upload to IPFS
    // 4. Register with the registry

    console.log(`Publishing node from ${packagePath}`, options);

    return {
      nodeId: 'published-node-id',
      version: '1.0.0',
      cid: 'bafy...',
      publishedAt: Date.now(),
    };
  }

  /**
   * Unpublish node
   */
  async unpublish(nodeId: string): Promise<void> {
    console.log(`Unpublishing node: ${nodeId}`);
  }

  /**
   * Get node stats
   */
  async getStats(nodeId: string): Promise<{
    downloads: number;
    stars: number;
    forks: number;
    issues: number;
  }> {
    return {
      downloads: this.cache.get(nodeId)?.downloads || 0,
      stars: this.cache.get(nodeId)?.stars || 0,
      forks: 0,
      issues: 0,
    };
  }

  // ============================================
  // INSTALL MANAGEMENT
  // ============================================

  /**
   * Install node
   */
  async install(nodeId: string, version?: string): Promise<InstallResult> {
    // In production, this would:
    // 1. Fetch from registry
    // 2. Verify signature
    // 3. Extract to node_modules
    // 4. Register locally

    const pkg = await this.fetch(nodeId);
    if (!pkg) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    const localInfo: LocalNodeInfo = {
      id: nodeId,
      version: version || pkg.definition.version,
      path: `./nodes/${nodeId}`,
      installedAt: Date.now(),
      definition: pkg.definition,
    };

    this.localNodes.set(nodeId, localInfo);

    return {
      nodeId,
      version: localInfo.version,
      path: localInfo.path,
    };
  }

  /**
   * Update node
   */
  async update(nodeId: string): Promise<InstallResult> {
    const local = this.localNodes.get(nodeId);
    if (!local) {
      throw new Error(`Node not installed: ${nodeId}`);
    }

    // In production, would check for newer version
    return this.install(nodeId);
  }

  /**
   * Uninstall node
   */
  async uninstall(nodeId: string): Promise<void> {
    this.localNodes.delete(nodeId);
  }

  // ============================================
  // TRUST & VERIFICATION
  // ============================================

  /**
   * Verify node authenticity
   */
  async verify(nodeId: string, version: string): Promise<VerificationResult> {
    const local = this.localNodes.get(nodeId);
    if (!local) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // In production, would verify signature
    return {
      verified: true,
      signature: 'verified-signature',
      publisher: local.definition.author,
      timestamp: local.installedAt,
    };
  }

  /**
   * Get trust score
   */
  async getTrustScore(nodeId: string): Promise<TrustScore> {
    const stats = await this.getStats(nodeId);
    const local = this.localNodes.get(nodeId);

    const score = Math.min(100,
      (stats.downloads / 1000) * 20 +
      (stats.stars / 100) * 30 +
      (this.isTrusted(local?.definition.author || '') ? 30 : 0) +
      (local ? 20 : 0)
    );

    return {
      score,
      factors: {
        downloads: stats.downloads,
        stars: stats.stars,
        verifiedPublisher: this.isTrusted(local?.definition.author || ''),
        age: local ? Date.now() - local.installedAt : 0,
        issues: stats.issues,
      },
    };
  }

  /**
   * Report issue
   */
  async reportIssue(nodeId: string, issue: IssueReport): Promise<void> {
    console.log(`Issue reported for ${nodeId}:`, issue);
  }

  /**
   * Add trusted publisher
   */
  addTrustedPublisher(did: string): void {
    this.trustedPublishers.add(did);
  }

  /**
   * Remove trusted publisher
   */
  removeTrustedPublisher(did: string): void {
    this.trustedPublishers.delete(did);
  }

  /**
   * Check if publisher is trusted
   */
  isTrusted(did: string): boolean {
    return this.trustedPublishers.has(did);
  }
}
