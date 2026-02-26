/**
 * Network Graph Manager
 * Manages the network of connected nodes
 */

import { EventEmitter } from 'events';
import type { APINodeDefinition, EdgeDefinition, NodeInfo, NodeType, ValidationResult } from '../core/types.js';

/**
 * Node instance in the graph
 */
interface NodeInstance {
  id: string;
  type: NodeType;
  definition: APINodeDefinition;
  instance?: unknown;
  loadedAt: number;
  status: 'loading' | 'ready' | 'running' | 'stopped' | 'error';
}

/**
 * Edge instance in the graph
 */
interface EdgeInstance {
  id: string;
  from: string;
  to: string;
  definition: EdgeDefinition;
  createdAt: number;
}

/**
 * Capability info
 */
interface CapabilityInfo {
  nodeId: string;
  capabilityId: string;
  name: string;
  description: string;
}

/**
 * Graph JSON format
 */
interface GraphJSON {
  version: string;
  nodes: Array<{
    id: string;
    type: NodeType;
    definitionId: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    definition: EdgeDefinition;
  }>;
}

/**
 * Network Graph
 */
export class NetworkGraph extends EventEmitter {
  private nodes: Map<string, NodeInstance> = new Map();
  private edges: Map<string, EdgeInstance> = new Map();
  private nodeDefinitions: Map<string, APINodeDefinition> = new Map();
  private capabilityIndex: Map<string, Set<string>> = new Map();

  constructor() {
    super();
  }

  // ============================================
  // NODE OPERATIONS
  // ============================================

  /**
   * Add node to graph
   */
  async addNode(node: NodeInstance): Promise<string> {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node already exists: ${node.id}`);
    }

    this.nodes.set(node.id, node);
    this.nodeDefinitions.set(node.definition.id, node.definition);

    // Index capabilities
    for (const cap of node.definition.capabilities) {
      if (!this.capabilityIndex.has(cap.id)) {
        this.capabilityIndex.set(cap.id, new Set());
      }
      this.capabilityIndex.get(cap.id)!.add(node.id);
    }

    this.emit('node:added', { nodeId: node.id });
    return node.id;
  }

  /**
   * Remove node from graph
   */
  async removeNode(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Remove from capability index
    for (const cap of node.definition.capabilities) {
      this.capabilityIndex.get(cap.id)?.delete(nodeId);
    }

    // Remove edges
    for (const [edgeId, edge] of this.edges.entries()) {
      if (edge.from === nodeId || edge.to === nodeId) {
        this.edges.delete(edgeId);
      }
    }

    this.nodes.delete(nodeId);
    this.emit('node:removed', { nodeId });
  }

  /**
   * Get node by ID
   */
  getNode<T = unknown>(nodeId: string): (NodeInstance & { instance?: T }) | undefined {
    return this.nodes.get(nodeId) as (NodeInstance & { instance?: T }) | undefined;
  }

  /**
   * Get all nodes
   */
  getNodes(): NodeInstance[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get nodes by type
   */
  getNodesByType(type: NodeType): NodeInstance[] {
    return Array.from(this.nodes.values()).filter(n => n.type === type);
  }

  // ============================================
  // EDGE OPERATIONS
  // ============================================

  /**
   * Connect two nodes
   */
  async addEdge(from: string, to: string, definition: EdgeDefinition): Promise<void> {
    if (!this.nodes.has(from)) {
      throw new Error(`Source node not found: ${from}`);
    }
    if (!this.nodes.has(to)) {
      throw new Error(`Target node not found: ${to}`);
    }

    const id = `${from}->${to}`;
    const edge: EdgeInstance = {
      id,
      from,
      to,
      definition,
      createdAt: Date.now(),
    };

    this.edges.set(id, edge);
    this.emit('edge:added', { from, to });
  }

  /**
   * Remove edge
   */
  async removeEdge(from: string, to: string): Promise<void> {
    const id = `${from}->${to}`;
    this.edges.delete(id);
    this.emit('edge:removed', { from, to });
  }

  /**
   * Get edges for node
   */
  getEdges(nodeId: string): EdgeInstance[] {
    return Array.from(this.edges.values()).filter(
      e => e.from === nodeId || e.to === nodeId
    );
  }

  /**
   * Get dependencies (upstream nodes)
   */
  getDependencies(nodeId: string): NodeInstance[] {
    const dependencies: NodeInstance[] = [];
    
    for (const edge of this.edges.values()) {
      if (edge.to === nodeId && edge.definition.type === 'dependency') {
        const dep = this.nodes.get(edge.from);
        if (dep) dependencies.push(dep);
      }
    }

    return dependencies;
  }

  /**
   * Get dependents (downstream nodes)
   */
  getDependents(nodeId: string): NodeInstance[] {
    const dependents: NodeInstance[] = [];
    
    for (const edge of this.edges.values()) {
      if (edge.from === nodeId && edge.definition.type === 'dependency') {
        const dep = this.nodes.get(edge.to);
        if (dep) dependents.push(dep);
      }
    }

    return dependents;
  }

  // ============================================
  // GRAPH TRAVERSAL
  // ============================================

  /**
   * Traverse graph
   */
  traverse(startId: string, direction: 'upstream' | 'downstream'): NodeInstance[] {
    const visited = new Set<string>();
    const result: NodeInstance[] = [];
    const queue = [startId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.nodes.get(current);
      if (node) result.push(node);

      const edges = this.getEdges(current);
      for (const edge of edges) {
        if (direction === 'upstream' && edge.to === current) {
          queue.push(edge.from);
        } else if (direction === 'downstream' && edge.from === current) {
          queue.push(edge.to);
        }
      }
    }

    return result;
  }

  /**
   * Find path between nodes
   */
  findPath(from: string, to: string): NodeInstance[] | null {
    const visited = new Set<string>();
    const queue: Array<{ id: string; path: NodeInstance[] }> = [
      { id: from, path: [] },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.id === to) {
        return current.path;
      }

      if (visited.has(current.id)) continue;
      visited.add(current.id);

      const node = this.nodes.get(current.id);
      if (!node) continue;

      for (const edge of this.edges.values()) {
        if (edge.from === current.id && !visited.has(edge.to)) {
          const nextNode = this.nodes.get(edge.to);
          if (nextNode) {
            queue.push({
              id: edge.to,
              path: [...current.path, nextNode],
            });
          }
        }
      }
    }

    return null;
  }

  /**
   * Get subgraph
   */
  getSubgraph(nodeIds: string[]): NetworkGraph {
    const subgraph = new NetworkGraph();

    for (const id of nodeIds) {
      const node = this.nodes.get(id);
      if (node) {
        subgraph.nodes.set(id, node);
      }
    }

    for (const edge of this.edges.values()) {
      if (nodeIds.includes(edge.from) && nodeIds.includes(edge.to)) {
        subgraph.edges.set(edge.id, edge);
      }
    }

    return subgraph;
  }

  // ============================================
  // CAPABILITY DISCOVERY
  // ============================================

  /**
   * Find nodes with capability
   */
  findByCapability(capabilityId: string): NodeInstance[] {
    const nodeIds = this.capabilityIndex.get(capabilityId);
    if (!nodeIds) return [];

    return Array.from(nodeIds)
      .map(id => this.nodes.get(id))
      .filter((n): n is NodeInstance => n !== undefined);
  }

  /**
   * Find nodes emitting event
   */
  findByEvent(eventType: string): NodeInstance[] {
    return Array.from(this.nodes.values()).filter(n =>
      n.definition.events.emits.includes(eventType)
    );
  }

  /**
   * Get all capabilities in graph
   */
  getAllCapabilities(): CapabilityInfo[] {
    const capabilities: CapabilityInfo[] = [];

    for (const node of this.nodes.values()) {
      for (const cap of node.definition.capabilities) {
        capabilities.push({
          nodeId: node.id,
          capabilityId: cap.id,
          name: cap.name,
          description: cap.description,
        });
      }
    }

    return capabilities;
  }

  // ============================================
  // GRAPH HEALTH
  // ============================================

  /**
   * Validate graph integrity
   */
  validate(): ValidationResult {
    const errors: Array<{ nodeId: string; message: string; code: string }> = [];
    const warnings: Array<{ nodeId: string; message: string; code: string }> = [];

    // Check for missing dependencies
    for (const node of this.nodes.values()) {
      for (const depId of node.definition.dependencies.nodes || []) {
        if (!this.nodes.has(depId)) {
          errors.push({
            nodeId: node.id,
            message: `Missing dependency: ${depId}`,
            code: 'MISSING_DEPENDENCY',
          });
        }
      }
    }

    // Check for orphan nodes
    for (const node of this.nodes.values()) {
      const edges = this.getEdges(node.id);
      if (edges.length === 0 && node.definition.dependencies.nodes?.length === 0) {
        warnings.push({
          nodeId: node.id,
          message: 'Node has no connections',
          code: 'ORPHAN_NODE',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check for cycles
   */
  hasCycles(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      for (const edge of this.edges.values()) {
        if (edge.from === nodeId) {
          if (!visited.has(edge.to)) {
            if (hasCycleDFS(edge.to)) return true;
          } else if (recursionStack.has(edge.to)) {
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) return true;
      }
    }

    return false;
  }

  /**
   * Get orphan nodes (no connections)
   */
  getOrphanNodes(): NodeInstance[] {
    return Array.from(this.nodes.values()).filter(node => {
      const edges = this.getEdges(node.id);
      return edges.length === 0;
    });
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  /**
   * Export graph to JSON
   */
  toJSON(): GraphJSON {
    return {
      version: '1.0.0',
      nodes: Array.from(this.nodes.values()).map(n => ({
        id: n.id,
        type: n.type,
        definitionId: n.definition.id,
      })),
      edges: Array.from(this.edges.values()).map(e => ({
        from: e.from,
        to: e.to,
        definition: e.definition,
      })),
    };
  }

  /**
   * Import graph from JSON
   */
  static fromJSON(json: GraphJSON, definitions: Map<string, APINodeDefinition>): NetworkGraph {
    const graph = new NetworkGraph();

    for (const nodeData of json.nodes) {
      const definition = definitions.get(nodeData.definitionId);
      if (definition) {
        graph.nodes.set(nodeData.id, {
          id: nodeData.id,
          type: nodeData.type,
          definition,
          loadedAt: Date.now(),
          status: 'ready',
        });
      }
    }

    for (const edgeData of json.edges) {
      graph.addEdge(edgeData.from, edgeData.to, edgeData.definition);
    }

    return graph;
  }
}
