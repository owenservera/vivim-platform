import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('pubsub:topics');
export class TopicManager extends EventEmitter {
    topics = new Map();
    topicAccess = new Map();
    createTopic(topicPath, config) {
        if (this.topics.has(topicPath)) {
            log.warn({ topicPath }, 'Topic already exists');
            return;
        }
        this.topics.set(topicPath, config);
        this.topicAccess.set(topicPath, new Set());
        log.info({ topicPath, type: config.type }, 'Topic created');
        this.emit('topic:created', { topicPath, config });
    }
    deleteTopic(topicPath) {
        if (!this.topics.has(topicPath)) {
            log.warn({ topicPath }, 'Topic does not exist');
            return;
        }
        this.topics.delete(topicPath);
        this.topicAccess.delete(topicPath);
        log.info({ topicPath }, 'Topic deleted');
        this.emit('topic:deleted', { topicPath });
    }
    getTopicConfig(topicPath) {
        return this.topics.get(topicPath);
    }
    hasTopic(topicPath) {
        return this.topics.has(topicPath);
    }
    grantAccess(topicPath, peerId) {
        const access = this.topicAccess.get(topicPath);
        if (access) {
            access.add(peerId);
        }
    }
    revokeAccess(topicPath, peerId) {
        const access = this.topicAccess.get(topicPath);
        if (access) {
            access.delete(peerId);
        }
    }
    hasAccess(topicPath, peerId) {
        const config = this.topics.get(topicPath);
        if (!config)
            return false;
        if (config.type === 'general' || config.type === 'system') {
            return true;
        }
        const access = this.topicAccess.get(topicPath);
        return access?.has(peerId) || false;
    }
    getTopicsByType(type) {
        const result = [];
        for (const [path, config] of this.topics) {
            if (config.type === type) {
                result.push(path);
            }
        }
        return result;
    }
    getCircleTopics(circleId) {
        const result = [];
        for (const [path, config] of this.topics) {
            if (config.circleId === circleId) {
                result.push(path);
            }
        }
        return result;
    }
    getUserTopics(userId) {
        const result = [];
        for (const [path, config] of this.topics) {
            if (config.userId === userId) {
                result.push(path);
            }
        }
        return result;
    }
    static buildTopicPath(type, ...parts) {
        const base = '/vivim';
        switch (type) {
            case 'circle':
                return `${base}/circles/${parts[0]}`;
            case 'user':
                return `${base}/users/${parts[0]}`;
            case 'system':
                return `${base}/system/${parts[0]}`;
            case 'discovery':
                return `${base}/discovery/${parts[0]}`;
            default:
                return `${base}/${parts[0]}`;
        }
    }
    getAllTopics() {
        return new Map(this.topics);
    }
    getTopicCount() {
        return this.topics.size;
    }
}
export const topicManager = new TopicManager();
//# sourceMappingURL=TopicManager.js.map