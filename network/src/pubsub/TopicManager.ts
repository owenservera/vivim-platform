import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('pubsub:topics');

export type TopicType = 'general' | 'circle' | 'user' | 'system' | 'discovery';

export interface TopicConfig {
  type: TopicType;
  circleId?: string;
  userId?: string;
  description?: string;
  ttl?: number;
  maxSize?: number;
}

export class TopicManager extends EventEmitter {
  private topics: Map<string, TopicConfig> = new Map();
  private topicAccess: Map<string, Set<string>> = new Map();

  createTopic(topicPath: string, config: TopicConfig): void {
    if (this.topics.has(topicPath)) {
      log.warn({ topicPath }, 'Topic already exists');
      return;
    }

    this.topics.set(topicPath, config);
    this.topicAccess.set(topicPath, new Set());

    log.info({ topicPath, type: config.type }, 'Topic created');
    this.emit('topic:created', { topicPath, config });
  }

  deleteTopic(topicPath: string): void {
    if (!this.topics.has(topicPath)) {
      log.warn({ topicPath }, 'Topic does not exist');
      return;
    }

    this.topics.delete(topicPath);
    this.topicAccess.delete(topicPath);

    log.info({ topicPath }, 'Topic deleted');
    this.emit('topic:deleted', { topicPath });
  }

  getTopicConfig(topicPath: string): TopicConfig | undefined {
    return this.topics.get(topicPath);
  }

  hasTopic(topicPath: string): boolean {
    return this.topics.has(topicPath);
  }

  grantAccess(topicPath: string, peerId: string): void {
    const access = this.topicAccess.get(topicPath);
    if (access) {
      access.add(peerId);
    }
  }

  revokeAccess(topicPath: string, peerId: string): void {
    const access = this.topicAccess.get(topicPath);
    if (access) {
      access.delete(peerId);
    }
  }

  hasAccess(topicPath: string, peerId: string): boolean {
    const config = this.topics.get(topicPath);
    if (!config) return false;

    if (config.type === 'general' || config.type === 'system') {
      return true;
    }

    const access = this.topicAccess.get(topicPath);
    return access?.has(peerId) || false;
  }

  getTopicsByType(type: TopicType): string[] {
    const result: string[] = [];
    for (const [path, config] of this.topics) {
      if (config.type === type) {
        result.push(path);
      }
    }
    return result;
  }

  getCircleTopics(circleId: string): string[] {
    const result: string[] = [];
    for (const [path, config] of this.topics) {
      if (config.circleId === circleId) {
        result.push(path);
      }
    }
    return result;
  }

  getUserTopics(userId: string): string[] {
    const result: string[] = [];
    for (const [path, config] of this.topics) {
      if (config.userId === userId) {
        result.push(path);
      }
    }
    return result;
  }

  static buildTopicPath(type: TopicType, ...parts: string[]): string {
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

  getAllTopics(): Map<string, TopicConfig> {
    return new Map(this.topics);
  }

  getTopicCount(): number {
    return this.topics.size;
  }
}

export const topicManager = new TopicManager();
