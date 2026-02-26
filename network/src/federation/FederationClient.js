import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('federation:client');
export class FederationClient extends EventEmitter {
    config;
    messageQueue = [];
    processing = false;
    constructor(config) {
        super();
        this.config = config;
    }
    async sendActivity(targetInstance, activityType, payload) {
        const message = {
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
    async requestSync(targetInstance, sinceTimestamp) {
        await this.sendActivity(targetInstance, 'sync.request', { since: sinceTimestamp });
    }
    async pushContent(targetInstance, contentId, content) {
        await this.sendActivity(targetInstance, 'content.push', { contentId, content });
    }
    async inviteToCircle(targetInstance, circleId, userDid) {
        await this.sendActivity(targetInstance, 'circle.invite', { circleId, userDid });
    }
    async followUser(targetInstance, userDid) {
        await this.sendActivity(targetInstance, 'follow', { userDid });
    }
    async unfollowUser(targetInstance, userDid) {
        await this.sendActivity(targetInstance, 'unfollow', { userDid });
    }
    async deliverMessage(targetInstance, message) {
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
        }
        catch (error) {
            log.error({
                target: targetInstance,
                error: error.message,
                messageId: message.id,
            }, 'Failed to deliver message');
            this.queueMessage(message);
            this.emit('message:failed', { message, error });
        }
    }
    queueMessage(message) {
        this.messageQueue.push(message);
        if (this.messageQueue.length > 1000) {
            this.messageQueue.shift();
        }
        this.processQueue();
    }
    async processQueue() {
        if (this.processing || this.messageQueue.length === 0)
            return;
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
    async signMessage(message) {
        const data = JSON.stringify({
            type: message.type,
            sourceDID: message.sourceDID,
            timestamp: message.timestamp,
            payload: message.payload,
        });
        return btoa(data);
    }
    async verifySignature(message, signature) {
        const expected = await this.signMessage(message);
        return signature === expected;
    }
    getQueueSize() {
        return this.messageQueue.length;
    }
}
//# sourceMappingURL=FederationClient.js.map