import { EventEmitter } from 'events';
export type TopicType = 'general' | 'circle' | 'user' | 'system' | 'discovery';
export interface TopicConfig {
    type: TopicType;
    circleId?: string;
    userId?: string;
    description?: string;
    ttl?: number;
    maxSize?: number;
}
export declare class TopicManager extends EventEmitter {
    private topics;
    private topicAccess;
    createTopic(topicPath: string, config: TopicConfig): void;
    deleteTopic(topicPath: string): void;
    getTopicConfig(topicPath: string): TopicConfig | undefined;
    hasTopic(topicPath: string): boolean;
    grantAccess(topicPath: string, peerId: string): void;
    revokeAccess(topicPath: string, peerId: string): void;
    hasAccess(topicPath: string, peerId: string): boolean;
    getTopicsByType(type: TopicType): string[];
    getCircleTopics(circleId: string): string[];
    getUserTopics(userId: string): string[];
    static buildTopicPath(type: TopicType, ...parts: string[]): string;
    getAllTopics(): Map<string, TopicConfig>;
    getTopicCount(): number;
}
export declare const topicManager: TopicManager;
//# sourceMappingURL=TopicManager.d.ts.map