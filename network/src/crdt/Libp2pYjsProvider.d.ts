/**
 * Libp2p Yjs Provider
 *
 * A Yjs provider that uses libp2p GossipSub for update propagation.
 * This enables truly decentralized P2P synchronization without a signaling server.
 */
import * as Y from 'yjs';
import { EventEmitter } from 'events';
import type { NetworkNode } from '../p2p/NetworkNode.js';
export interface Libp2pYjsProviderConfig {
    roomName: string;
    doc: Y.Doc;
    node: NetworkNode;
}
export declare class Libp2pYjsProvider extends EventEmitter {
    private roomName;
    private doc;
    private node;
    private topic;
    private isDestroyed;
    constructor(config: Libp2pYjsProviderConfig);
    private init;
    private subscribe;
    private onDocUpdate;
    private broadcast;
    private broadcastStateVector;
    destroy(): void;
}
//# sourceMappingURL=Libp2pYjsProvider.d.ts.map