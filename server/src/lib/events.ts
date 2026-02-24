import { EventEmitter } from 'events';
import { logger } from './logger.js';

class AppEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }

  emit(event, ...args) {
    logger.debug({ event }, 'EventBus: emit');
    return super.emit(event, ...args);
  }
}

export const eventBus = new AppEventBus();

// Event Types
export const EVENTS = {
  // Entity Changes
  ENTITY_CREATED: 'entity:created',
  ENTITY_UPDATED: 'entity:updated',
  ENTITY_DELETED: 'entity:deleted',

  // System Events
  USER_CONNECTED: 'user:connected',
  USER_DISCONNECTED: 'user:disconnected',
};
