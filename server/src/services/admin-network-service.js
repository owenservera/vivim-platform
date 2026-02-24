/**
 * Admin Network Service
 *
 * Wrapper service for network package integration
 * TODO: Integrate with network/src/p2p/NetworkNode.ts
 */

import { logger } from '../lib/logger.js';

class AdminNetworkService {
  constructor() {
    this.nodes = [];
    this.connections = [];
    this.metrics = [];
  }

  /**
   * Get all network nodes
   * @returns {Promise<Array>} Array of network nodes
   */
  async getNodes() {
    try {
      // TODO: Integrate with NetworkNode package
      // const nodes = await networkNode.getPeers();
      logger.info('Fetching network nodes');

      return this.nodes;
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get network nodes');
      throw error;
    }
  }

  /**
   * Get node by ID
   * @param {string} id - Node ID
   * @returns {Promise<Object>} Node details
   */
  async getNode(id) {
    try {
      const node = this.nodes.find((n) => n.id === id);
      if (!node) {
        throw new Error(`Node not found: ${id}`);
      }
      return node;
    } catch (error) {
      logger.error({ error: error.message, nodeId: id }, 'Failed to get node');
      throw error;
    }
  }

  /**
   * Get all network connections
   * @returns {Promise<Array>} Array of connections
   */
  async getConnections() {
    try {
      // TODO: Integrate with NetworkNode package
      logger.info('Fetching network connections');

      return this.connections;
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get connections');
      throw error;
    }
  }

  /**
   * Get network metrics
   * @param {number} limit - Number of metrics to return
   * @returns {Promise<Array>} Array of metrics
   */
  async getMetrics(limit = 100) {
    try {
      // TODO: Integrate with NetworkNode package
      logger.info({ limit }, 'Fetching network metrics');

      return this.metrics.slice(0, limit);
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get metrics');
      throw error;
    }
  }

  /**
   * Get latest network metrics
   * @returns {Promise<Object>} Latest metrics
   */
  async getLatestMetrics() {
    try {
      if (this.metrics.length === 0) {
        throw new Error('No metrics available');
      }
      return this.metrics[0];
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get latest metrics');
      throw error;
    }
  }

  /**
   * Get network statistics
   * @returns {Promise<Object>} Network statistics
   */
  async getStats() {
    try {
      return {
        totalNodes: this.nodes.length,
        activeNodes: this.nodes.filter((n) => n.status === 'online').length,
        totalConnections: this.connections.length,
        activeConnections: this.connections.filter((c) => c.status === 'active').length,
        avgLatency:
          this.connections.reduce((sum, c) => sum + (c.latency || 0), 0) /
          (this.connections.length || 1),
        totalBandwidth: this.connections.reduce((sum, c) => sum + (c.bandwidth || 0), 0),
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get network stats');
      throw error;
    }
  }

  /**
   * Update nodes (for testing/integration)
   * @param {Array} nodes - Array of nodes
   */
  setNodes(nodes) {
    this.nodes = nodes;
  }

  /**
   * Update connections (for testing/integration)
   * @param {Array} connections - Array of connections
   */
  setConnections(connections) {
    this.connections = connections;
  }

  /**
   * Update metrics (for testing/integration)
   * @param {Array} metrics - Array of metrics
   */
  setMetrics(metrics) {
    this.metrics = metrics;
  }
}

// Export singleton instance
export const adminNetworkService = new AdminNetworkService();
