/**
 * VIVIM Network Engine
 * Core exports for P2P and Federation Layer
 */

// P2P Networking
export { NetworkNode, type NetworkNodeConfig, type NetworkNodeInfo } from './p2p/NetworkNode.js';
export { ConnectionManager } from './p2p/ConnectionManager.js';
export { PeerDiscovery } from './p2p/PeerDiscovery.js';

// CRDT Synchronization
export { CRDTSyncService, type CRDTSyncConfig } from './crdt/CRDTSyncService.js';
export { VectorClock } from './crdt/VectorClock.js';
export { ConversationCRDT } from './crdt/ConversationCRDT.js';
export { CircleCRDT } from './crdt/CircleCRDT.js';

// Content Discovery (DHT)
export { DHTService } from './dht/DHTService.js';
export { ContentRegistry } from './dht/ContentRegistry.js';

// Pub/Sub
export { PubSubService } from './pubsub/PubSubService.js';
export { TopicManager } from './pubsub/TopicManager.js';

// Federation
export { FederationClient } from './federation/FederationClient.js';
export { FederationServer } from './federation/FederationServer.js';
export { InstanceDiscovery } from './federation/InstanceDiscovery.js';

// Security
export { E2EEncryption } from './security/E2EEncryption.js';
export { KeyManager } from './security/KeyManager.js';
export { CapabilityManager } from './security/CapabilityManager.js';

// Types
export type {
  PeerInfo,
  ConnectionState,
  Message,
  Protocol,
} from './types.js';

// Utils
export { Logger } from './utils/logger.js';
