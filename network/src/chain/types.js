/**
 * VIVIM Chain Core Types
 * Defines the fundamental data structures for the custom blockchain.
 */
export var EventType;
(function (EventType) {
    // Identity
    EventType["IDENTITY_CREATE"] = "identity:create";
    EventType["IDENTITY_UPDATE"] = "identity:update";
    // Conversations
    EventType["CONVERSATION_CREATE"] = "conversation:create";
    EventType["CONVERSATION_UPDATE"] = "conversation:update";
    EventType["CONVERSATION_DELETE"] = "conversation:delete";
    // Messages
    EventType["MESSAGE_CREATE"] = "message:create";
    // Atomic Chat Units
    EventType["ACU_CREATE"] = "acu:create";
    EventType["ACU_DERIVE"] = "acu:derive";
    EventType["ACU_SHARE"] = "acu:share";
    EventType["ACU_RATE"] = "acu:rate";
    // Memory Graph
    EventType["MEMORY_CREATE"] = "memory:create";
    EventType["MEMORY_LINK"] = "memory:link";
    EventType["MEMORY_UNLINK"] = "memory:unlink";
    // Social
    EventType["SOCIAL_FOLLOW"] = "social:follow";
    EventType["SOCIAL_UNFOLLOW"] = "social:unfollow";
    EventType["SOCIAL_FRIEND_REQUEST"] = "social:friend_request";
    EventType["SOCIAL_FRIEND_ACCEPT"] = "social:friend_accept";
    // Circles (groups)
    EventType["CIRCLE_CREATE"] = "circle:create";
    EventType["CIRCLE_ADD_MEMBER"] = "circle:add_member";
    EventType["CIRCLE_REMOVE_MEMBER"] = "circle:remove_member";
    EventType["CIRCLE_UPDATE"] = "circle:update";
    // Sync protocol
    EventType["SYNC_REQUEST"] = "sync:request";
    EventType["SYNC_RESPONSE"] = "sync:response";
    EventType["SYNC_VECTOR_EXCHANGE"] = "sync:vector_exchange";
    // Anchor
    EventType["ANCHOR"] = "system:anchor";
})(EventType || (EventType = {}));
export var EventScope;
(function (EventScope) {
    EventScope["PUBLIC"] = "public";
    EventScope["CIRCLE"] = "circle";
    EventScope["FRIENDS"] = "friends";
    EventScope["PRIVATE"] = "private";
    EventScope["SELF"] = "self";
})(EventScope || (EventScope = {}));
export var EntityType;
(function (EntityType) {
    EntityType["CONVERSATION"] = "conversation";
    EntityType["MESSAGE"] = "message";
    EntityType["ACU"] = "acu";
    EntityType["MEMORY"] = "memory";
    EntityType["CIRCLE"] = "circle";
    EntityType["PROFILE"] = "profile";
})(EntityType || (EntityType = {}));
//# sourceMappingURL=types.js.map