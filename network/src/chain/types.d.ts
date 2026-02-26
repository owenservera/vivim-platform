/**
 * VIVIM Chain Core Types
 * Defines the fundamental data structures for the custom blockchain.
 */
export declare enum EventType {
    IDENTITY_CREATE = "identity:create",
    IDENTITY_UPDATE = "identity:update",
    CONVERSATION_CREATE = "conversation:create",
    CONVERSATION_UPDATE = "conversation:update",
    CONVERSATION_DELETE = "conversation:delete",
    MESSAGE_CREATE = "message:create",
    ACU_CREATE = "acu:create",
    ACU_DERIVE = "acu:derive",
    ACU_SHARE = "acu:share",
    ACU_RATE = "acu:rate",
    MEMORY_CREATE = "memory:create",
    MEMORY_LINK = "memory:link",
    MEMORY_UNLINK = "memory:unlink",
    SOCIAL_FOLLOW = "social:follow",
    SOCIAL_UNFOLLOW = "social:unfollow",
    SOCIAL_FRIEND_REQUEST = "social:friend_request",
    SOCIAL_FRIEND_ACCEPT = "social:friend_accept",
    CIRCLE_CREATE = "circle:create",
    CIRCLE_ADD_MEMBER = "circle:add_member",
    CIRCLE_REMOVE_MEMBER = "circle:remove_member",
    CIRCLE_UPDATE = "circle:update",
    SYNC_REQUEST = "sync:request",
    SYNC_RESPONSE = "sync:response",
    SYNC_VECTOR_EXCHANGE = "sync:vector_exchange",
    ANCHOR = "system:anchor"
}
export declare enum EventScope {
    PUBLIC = "public",
    CIRCLE = "circle",
    FRIENDS = "friends",
    PRIVATE = "private",
    SELF = "self"
}
export interface ChainEvent {
    id: string;
    type: EventType;
    author: string;
    timestamp: string;
    payload: any;
    cid?: string;
    version: number;
    vectorClock: Record<string, number>;
    parentIds: string[];
    entityId?: string;
    prevVersion?: string;
    signature: string;
    delegation?: string;
    tags?: string[];
    scope: EventScope;
}
export interface Block {
    id: string;
    number: number;
    timestamp: number;
    events: string[];
    merkleRoot: string;
    author: string;
    signature: string;
    prevBlock: string;
    anchor?: {
        chain: string;
        txHash: string;
        blockNumber: number;
    };
}
export declare enum EntityType {
    CONVERSATION = "conversation",
    MESSAGE = "message",
    ACU = "acu",
    MEMORY = "memory",
    CIRCLE = "circle",
    PROFILE = "profile"
}
export interface EntityState {
    id: string;
    type: EntityType;
    version: number;
    state: any;
    createdBy: string;
    createdAt: number;
    updatedBy: string;
    updatedAt: number;
    eventLog: string[];
    vectorClock: Record<string, number>;
}
//# sourceMappingURL=types.d.ts.map