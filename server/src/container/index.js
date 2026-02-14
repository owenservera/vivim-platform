/**
 * Dependency Injection Container
 *
 * Simple DI container for managing service dependencies and lifecycle
 */

import { logger } from '../lib/logger.js';
import { getPrismaClient } from '../lib/database.js';

// ============================================================================
// SERVICE REGISTRY
// ============================================================================

class DIContainer {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
    this.singletons = new Map();
  }

  /**
   * Register a factory function for a service
   * @param {string} name - Service name
   * @param {Function} factory - Factory function
   * @param {Object} options - Options { singleton: true }
   */
  register(name, factory, options = {}) {
    this.factories.set(name, { factory, options });
    logger.debug({ service: name }, 'Service registered');
  }

  /**
   * Resolve a service instance
   * @param {string} name - Service name
   * @returns {any} Service instance
   */
  resolve(name) {
    // Check if already instantiated (singleton)
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Get factory
    const factoryDef = this.factories.get(name);
    if (!factoryDef) {
      throw new Error(`Service not registered: ${name}`);
    }

    // Create instance
    const instance = factoryDef.factory(this);

    // Store if singleton
    if (factoryDef.options.singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.factories.has(name);
  }

  /**
   * Clear all singleton instances (useful for testing)
   */
  clear() {
    this.singletons.clear();
    logger.debug('Container singletons cleared');
  }

  /**
   * Get all registered service names
   * @returns {Array<string>}
   */
  getRegisteredServices() {
    return Array.from(this.factories.keys());
  }
}

// ============================================================================
// GLOBAL CONTAINER INSTANCE
// ============================================================================

const container = new DIContainer();

// ============================================================================
// REGISTER CORE SERVICES
// ============================================================================

// Database
container.register('database', () => getPrismaClient(), { singleton: true });

// Logger
container.register('logger', () => logger, { singleton: true });

// Configuration
container.register('config', () => {
  const { config } = import('../config/index.js');
  return config;
}, { singleton: true });

// Conversation Repository
container.register('conversationRepository', (_c) => {
  const { createConversation, findConversationById, listConversations } = import('../repositories/ConversationRepository.js');
  return { createConversation, findConversationById, listConversations };
}, { singleton: true });

// Capture Attempt Repository
container.register('captureAttemptRepository', () => {
  return import('../repositories/CaptureAttemptRepository.js');
}, { singleton: true });

// Extractor Service
container.register('extractor', () => {
  return import('../services/extractor.js');
}, { singleton: false });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Register a service
 * @param {string} name - Service name
 * @param {Function} factory - Factory function
 * @param {Object} options - Options
 */
export function registerService(name, factory, options = {}) {
  container.register(name, factory, options);
}

/**
 * Resolve a service
 * @param {string} name - Service name
 * @returns {any} Service instance
 */
export function resolveService(name) {
  return container.resolve(name);
}

/**
 * Check if service exists
 * @param {string} name - Service name
 * @returns {boolean}
 */
export function hasService(name) {
  return container.has(name);
}

/**
 * Clear all singletons
 */
export function clearContainer() {
  container.clear();
}

/**
 * Get container instance
 * @returns {DIContainer}
 */
export function getContainer() {
  return container;
}

export default container;
