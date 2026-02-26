/**
 * VIVIM Network Engine
 * Core exports for P2P and Federation Layer
 */
// P2P Networking
export { NetworkNode } from './p2p/NetworkNode.js';
export { ConnectionManager } from './p2p/ConnectionManager.js';
export { PeerDiscovery } from './p2p/PeerDiscovery.js';
// CRDT Synchronization
export { CRDTSyncService } from './crdt/CRDTSyncService.js';
export { Libp2pYjsProvider } from './crdt/Libp2pYjsProvider.js';
export { VectorClock } from './crdt/VectorClock.js';
export { ConversationCRDT } from './crdt/ConversationCRDT.js';
export { CircleCRDT } from './crdt/CircleCRDT.js';
export { FriendCRDT } from './crdt/FriendCRDT.js';
export { FollowCRDT } from './crdt/FollowCRDT.js';
export { GroupCRDT } from './crdt/GroupCRDT.js';
export { TeamCRDT } from './crdt/TeamCRDT.js';
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
// Blockchain Chain
export * from './chain/types.js';
export { VivimChainClient } from './chain/ChainClient.js';
export { EventStore } from './chain/EventStore.js';
export { StateMachine } from './chain/StateMachine.js';
export { EventHandlerRegistry } from './chain/EventHandler.js';
export { ChainDHT, CHAIN_DHT_KEYS } from './chain/ChainDHT.js';
export { GossipSync, GOSSIP_TOPICS } from './chain/GossipSync.js';
export { HLClock } from './chain/HLClock.js';
export * from './chain/utils.js';
// Storage
export { DistributedContentClient, ContentType } from './storage/DistributedContentClient.js';
// API Adapters
export { VivimChatRuntime } from './api/VivimChatRuntime.js';
// Utils
export { logger, createModuleLogger } from './utils/logger.js';
//# sourceMappingURL=index.js.map