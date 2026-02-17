/**
 * Admin WebSocket Service
 *
 * Real-time event broadcasting for admin panel
 */

import { logger } from '../lib/logger.js';
import { EventEmitter } from 'events';

class AdminWsService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
    this.broadcastInterval = null;
  }

  /**
   * Initialize WebSocket service
   * @param {Object} httpServer - HTTP server instance
   */
  initialize(httpServer) {
    // TODO: Integrate WebSocket server
    // For now, we'll use event polling via REST endpoints
    logger.info('Admin WebSocket service initialized');

    // Start mock broadcast interval for testing
    this.startBroadcastInterval();
  }

  /**
   * Add a client connection
   * @param {Object} ws - WebSocket connection
   */
  addClient(ws) {
    this.clients.add(ws);

    ws.on('close', () => {
      this.clients.delete(ws);
      logger.info({ clientCount: this.clients.size }, 'Admin WebSocket client disconnected');
    });

    logger.info({ clientCount: this.clients.size }, 'Admin WebSocket client connected');
  }

  /**
   * Broadcast event to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcast(event, data) {
    const message = JSON.stringify({
      type: event,
      payload: data,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });

    // Also emit for local listeners
    this.emit(event, data);
  }

  /**
   * Broadcast network metrics
   * @param {Object} metrics - Network metrics
   */
  broadcastNetworkMetrics(metrics) {
    this.broadcast('network:metric', metrics);
  }

  /**
   * Broadcast system log
   * @param {Object} log - Log entry
   */
  broadcastSystemLog(log) {
    this.broadcast('system:log', log);
  }

  /**
   * Broadcast CRDT sync status
   * @param {Object} status - Sync status
   */
  broadcastCrdtSync(status) {
    this.broadcast('crdt:sync', status);
  }

  /**
   * Broadcast node status change
   * @param {Object} nodeStatus - Node status
   */
  broadcastNodeStatus(nodeStatus) {
    this.broadcast('network:node:status', nodeStatus);
  }

  /**
   * Start mock broadcast interval for testing
   */
  startBroadcastInterval() {
    // Broadcast mock network metrics every 2 seconds
    this.broadcastInterval = setInterval(() => {
      const mockMetric = {
        timestamp: new Date().toISOString(),
        peerCount: 7 + Math.floor(Math.random() * 3),
        connectionCount: 4 + Math.floor(Math.random() * 3),
        bandwidthIn: 1000000 + Math.random() * 2000000,
        bandwidthOut: 800000 + Math.random() * 1500000,
        latencyAvg: 20 + Math.random() * 40,
        dhtLookupTime: 10 + Math.random() * 30,
        messageQueueSize: Math.floor(Math.random() * 100),
        cacheHitRate: 0.7 + Math.random() * 0.25,
        errorRate: Math.random() * 0.05,
      };

      this.broadcastNetworkMetrics(mockMetric);
    }, 2000);

    logger.info('Mock broadcast interval started');
  }

  /**
   * Stop broadcast interval
   */
  stopBroadcastInterval() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
      logger.info('Mock broadcast interval stopped');
    }
  }

  /**
   * Get connected clients count
   * @returns {number} Number of connected clients
   */
  getClientCount() {
    return this.clients.size;
  }
}

// Export singleton instance
export const adminWsService = new AdminWsService();
