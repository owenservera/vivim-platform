/**
 * Context WebSocket Service
 * 
 * Provides real-time context updates to connected clients.
 * Uses Server-Sent Events (SSE) for simplicity.
 */

import { getContextEventBus } from '../context/index.js';
import { feedContextIntegration } from '../services/feed-context-integration.js';

const eventBus = getContextEventBus();

const clients = new Map<string, Set<(data: any) => void>>();

export function addContextClient(userId: string, sendFn: (data: any) => void) {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(sendFn);
}

export function removeContextClient(userId: string, sendFn: (data: any) => void) {
  const userClients = clients.get(userId);
  if (userClients) {
    userClients.delete(sendFn);
    if (userClients.size === 0) {
      clients.delete(userId);
    }
  }
}

function broadcastToUser(userId: string, event: string, data: any) {
  const userClients = clients.get(userId);
  if (userClients) {
    const message = JSON.stringify({ event, data, timestamp: Date.now() });
    userClients.forEach(sendFn => {
      try {
        sendFn(message);
      } catch (error) {
        console.error('SSE send failed:', error);
      }
    });
  }
}

eventBus.on('feed:engagement', async (userId, event) => {
  broadcastToUser(userId, 'engagement', event);
  
  const state = await feedContextIntegration.getContextState(userId);
  if (state.success) {
    broadcastToUser(userId, 'context_update', state.state);
  }
});

eventBus.on('context:updated', (userId, event) => {
  broadcastToUser(userId, 'context_refresh', event);
});

eventBus.on('memory:created', (userId, event) => {
  broadcastToUser(userId, 'memory_created', event);
});

export const contextWS = { addContextClient, removeContextClient };
export default contextWS;
