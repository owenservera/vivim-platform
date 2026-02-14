import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('federation:client');

export interface FederationConfig {
  instanceUrl: string;
  did?: string;
  signKey?: Uint8Array;
  verifyKey?: Uint8Array;
}

export interface FederationMessage {
  id: string;
  type: string;
  sourcePDS: string;
  sourceDID: string;
  targetPDS?: string;
  payload: unknown;
  timestamp: number;
  signature?: string;
}

export class FederationClient extends EventEmitter {
  private config: FederationConfig;
  private messageQueue: FederationMessage[] = [];
  private processing = false;

  constructor(config: FederationConfig) {
    super();
    this.config = config;
  }

  async sendActivity(
    targetInstance: string,
    activityType: string,
    payload: unknown
  ): Promise<void> {
    const message: FederationMessage = {
      id: crypto.randomUUID(),
      type: activityType,
      sourcePDS: this.config.instanceUrl,
      sourceDID: this.config.did || '',
      targetPDS: targetInstance,
      payload,
      timestamp: Date.now(),
    };

    if (this.config.signKey) {
      message.signature = await this.signMessage(message);
    }

    await this.deliverMessage(targetInstance, message);
    log.debug({ type: activityType, target: targetInstance }, 'Activity sent');
  }

  async requestSync(targetInstance: string, sinceTimestamp: number): Promise<void> {
    await this.sendActivity(targetInstance, 'sync.request', { since: sinceTimestamp });
  }

  async pushContent(
    targetInstance: string,
    contentId: string,
    content: unknown
  ): Promise<void> {
    await this.sendActivity(targetInstance, 'content.push', { contentId, content });
  }

  async inviteToCircle(
    targetInstance: string,
    circleId: string,
    userDid: string
  ): Promise<void> {
    await this.sendActivity(targetInstance, 'circle.invite', { circleId, userDid });
  }

  async followUser(targetInstance: string, userDid: string): Promise<void> {
    await this.sendActivity(targetInstance, 'follow', { userDid });
  }

  async unfollowUser(targetInstance: string, userDid: string): Promise<void> {
    await this.sendActivity(targetInstance, 'unfollow', { userDid });
  }

  private async deliverMessage(targetInstance: string, message: FederationMessage): Promise<void> {
    const inboxUrl = `${targetInstance}/api/v1/federation/inbox`;

    try {
      const response = await fetch(inboxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(message.signature ? { 'X-Signature': message.signature } : {}),
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.emit('message:sent', message);
    } catch (error) {
      log.error({
        target: targetInstance,
        error: (error as Error).message,
        messageId: message.id,
      }, 'Failed to deliver message');

      this.queueMessage(message);
      this.emit('message:failed', { message, error });
    }
  }

  private queueMessage(message: FederationMessage): void {
    this.messageQueue.push(message);
    if (this.messageQueue.length > 1000) {
      this.messageQueue.shift();
    }
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.messageQueue.length === 0) return;
    this.processing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue[0];
      if (message.targetPDS) {
        await this.deliverMessage(message.targetPDS, message);
      }
      this.messageQueue.shift();
    }

    this.processing = false;
  }

  private async signMessage(message: FederationMessage): Promise<string> {
    const data = JSON.stringify({
      type: message.type,
      sourceDID: message.sourceDID,
      timestamp: message.timestamp,
      payload: message.payload,
    });
    return btoa(data);
  }

  async verifySignature(message: FederationMessage, signature: string): Promise<boolean> {
    const expected = await this.signMessage(message);
    return signature === expected;
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }
}
