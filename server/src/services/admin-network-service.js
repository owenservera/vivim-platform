/**
 * Admin Network Service
 *
 * Provides real network telemetry for the admin panel.
 * When @vivim/network-engine (libp2p) is injected, it reads live peer data.
 * Otherwise, falls back to OS-level metrics (uptime, process, socket counts).
 */

import { logger } from '../lib/logger.js';
import os from 'os';

// Holds the injected libp2p NetworkNode instance (set from server.js)
let _networkNodeInstance = null;

/**
 * Called from server.js once the libp2p node is initialized.
 * @param {object} node - The NetworkNode / libp2p instance
 */
export function injectNetworkNode(node) {
  _networkNodeInstance = node;
  logger.info('AdminNetworkService: NetworkNode injected');
}

class AdminNetworkService {
  constructor() {
    // Fallback in-memory state (used when libp2p is not yet ready)
    this._nodes = [];
    this._connections = [];
    this._metrics = [];
    this._startTime = Date.now();
  }

  // ─── Internal helpers ────────────────────────────────────────────────────────

  /**
   * Try to get peers from the live libp2p node.
   * Returns an array of peer-like objects.
   */
  _getLiveNodes() {
    if (!_networkNodeInstance) return null;

    try {
      // libp2p exposes getPeers() → PeerId[]
      const peerIds = _networkNodeInstance.getPeers?.() ?? [];
      const connections = _networkNodeInstance.getConnections?.() ?? [];

      const peerMap = new Map();
      for (const conn of connections) {
        const id = conn.remotePeer?.toString?.() ?? 'unknown';
        if (!peerMap.has(id)) {
          peerMap.set(id, {
            id,
            address: conn.remoteAddr?.toString?.() ?? 'unknown',
            status: conn.stat?.status === 'open' ? 'online' : 'offline',
            latency: conn.stat?.timeline?.open
              ? Math.round(Date.now() - conn.stat.timeline.open)
              : null,
            direction: conn.stat?.direction ?? 'unknown',
            connectedAt: conn.stat?.timeline?.open ?? null,
            protocol: conn.remoteAddr?.protoNames?.()?.join(', ') ?? 'libp2p',
          });
        }
      }

      // Include peers without open connections
      for (const peerId of peerIds) {
        const id = peerId.toString();
        if (!peerMap.has(id)) {
          peerMap.set(id, {
            id,
            address: 'unknown',
            status: 'offline',
            latency: null,
            direction: 'unknown',
            connectedAt: null,
            protocol: 'libp2p',
          });
        }
      }

      return Array.from(peerMap.values());
    } catch (err) {
      logger.warn({ err: err.message }, 'AdminNetworkService: failed to read live peers');
      return null;
    }
  }

  /**
   * Try to get connections from the live libp2p node.
   */
  _getLiveConnections() {
    if (!_networkNodeInstance) return null;

    try {
      const conns = _networkNodeInstance.getConnections?.() ?? [];
      return conns.map((conn) => ({
        id: conn.id ?? crypto.randomUUID(),
        peerId: conn.remotePeer?.toString?.() ?? 'unknown',
        address: conn.remoteAddr?.toString?.() ?? 'unknown',
        status: conn.stat?.status === 'open' ? 'active' : 'closed',
        direction: conn.stat?.direction ?? 'unknown',
        latency: conn.stat?.timeline?.open
          ? Math.round(Date.now() - conn.stat.timeline.open)
          : null,
        openedAt: conn.stat?.timeline?.open ?? null,
        streams: conn.streams?.length ?? 0,
        protocol: conn.remoteAddr?.protoNames?.()?.join(', ') ?? 'libp2p',
      }));
    } catch (err) {
      logger.warn({ err: err.message }, 'AdminNetworkService: failed to read live connections');
      return null;
    }
  }

  /**
   * Build process-level fallback metrics from the OS module.
   */
  _buildFallbackMetrics() {
    const uptimeMs = Date.now() - this._startTime;
    const netInterfaces = os.networkInterfaces();
    const interfaces = Object.entries(netInterfaces)
      .filter(([, addrs]) => addrs.some((a) => !a.internal))
      .map(([name, addrs]) => ({
        name,
        addresses: addrs.filter((a) => !a.internal).map((a) => a.address),
      }));

    return {
      timestamp: Date.now(),
      uptimeMs,
      pid: process.pid,
      networkInterfaces: interfaces,
      // libp2p not yet active
      libp2pActive: false,
      peerCount: this._nodes.filter((n) => n.status === 'online').length,
      connectionCount: this._connections.filter((c) => c.status === 'active').length,
      note: 'libp2p peer data unavailable — NetworkNode not yet injected',
    };
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Get all network nodes (peers).
   * @returns {Promise<Array>} Array of peer node objects
   */
  async getNodes() {
    try {
      const live = this._getLiveNodes();
      if (live !== null) {
        logger.info({ count: live.length }, 'AdminNetworkService: live peers fetched');
        return live;
      }
      logger.info({ count: this._nodes.length }, 'AdminNetworkService: returning cached nodes');
      return this._nodes;
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get network nodes');
      throw error;
    }
  }

  /**
   * Get node by ID.
   * @param {string} id - Node/peer ID
   * @returns {Promise<Object>} Node details
   */
  async getNode(id) {
    try {
      const nodes = await this.getNodes();
      const node = nodes.find((n) => n.id === id);
      if (!node) throw new Error(`Node not found: ${id}`);
      return node;
    } catch (error) {
      logger.error({ error: error.message, nodeId: id }, 'Failed to get node');
      throw error;
    }
  }

  /**
   * Get all network connections.
   * @returns {Promise<Array>} Array of connection objects
   */
  async getConnections() {
    try {
      const live = this._getLiveConnections();
      if (live !== null) {
        logger.info({ count: live.length }, 'AdminNetworkService: live connections fetched');
        return live;
      }
      logger.info({ count: this._connections.length }, 'AdminNetworkService: returning cached connections');
      return this._connections;
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get connections');
      throw error;
    }
  }

  /**
   * Get network metrics (historical or current snapshot).
   * @param {number} limit - Max number of metric records to return
   * @returns {Promise<Array>} Array of metric snapshots
   */
  async getMetrics(limit = 100) {
    try {
      // If libp2p is live, produce a current snapshot
      if (_networkNodeInstance) {
        const nodes = await this.getNodes();
        const connections = await this.getConnections();
        const snapshot = {
          timestamp: Date.now(),
          libp2pActive: true,
          peerCount: nodes.filter((n) => n.status === 'online').length,
          connectionCount: connections.filter((c) => c.status === 'active').length,
          avgLatency:
            connections.reduce((sum, c) => sum + (c.latency ?? 0), 0) /
            (connections.length || 1),
        };
        return [snapshot, ...this._metrics].slice(0, limit);
      }

      // Fallback: OS-level snapshot
      const fallback = this._buildFallbackMetrics();
      return [fallback, ...this._metrics].slice(0, limit);
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get metrics');
      throw error;
    }
  }

  /**
   * Get the most recent metric snapshot.
   * @returns {Promise<Object>} Latest metric snapshot
   */
  async getLatestMetrics() {
    const metrics = await this.getMetrics(1);
    if (!metrics.length) throw new Error('No metrics available');
    return metrics[0];
  }

  /**
   * Get aggregate network statistics.
   * @returns {Promise<Object>} Network summary
   */
  async getStats() {
    try {
      const [nodes, connections] = await Promise.all([
        this.getNodes(),
        this.getConnections(),
      ]);

      const activeNodes = nodes.filter((n) => n.status === 'online');
      const activeConns = connections.filter((c) => c.status === 'active');
      const avgLatency =
        activeConns.reduce((sum, c) => sum + (c.latency ?? 0), 0) /
        (activeConns.length || 1);

      return {
        totalNodes: nodes.length,
        activeNodes: activeNodes.length,
        totalConnections: connections.length,
        activeConnections: activeConns.length,
        avgLatency: Math.round(avgLatency),
        libp2pActive: !!_networkNodeInstance,
        serverUptime: process.uptime(),
        node: {
          id: _networkNodeInstance?.peerId?.toString?.() ?? null,
          status: _networkNodeInstance ? 'running' : 'not_initialized',
        },
      };
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get network stats');
      throw error;
    }
  }

  // ─── Setters for manual override / testing ───────────────────────────────────

  setNodes(nodes) {
    this._nodes = nodes;
  }

  setConnections(connections) {
    this._connections = connections;
  }

  setMetrics(metrics) {
    this._metrics = metrics;
  }
}

// Export singleton instance
export const adminNetworkService = new AdminNetworkService();

