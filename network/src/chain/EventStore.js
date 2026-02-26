import { EventEmitter } from 'events';
import { calculateCID, verifySignature } from './utils.js';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('chain:event-store');
/**
 * EventStore manages the lifecycle of ChainEvents.
 */
export class EventStore extends EventEmitter {
    storage;
    constructor(storage) {
        super();
        this.storage = storage;
    }
    /**
     * Process an incoming event from the network or local creation.
     */
    async processEvent(event) {
        try {
            // 1. Verify CID matches content
            const computedCID = await calculateCID({
                ...event,
                id: undefined,
                signature: undefined
            });
            // We check the signature against the hash of the content excluding id and signature
            // Wait, usually the CID is the hash of the signed event, but we need to sign the content first.
            // Standard approach: 
            // content = { type, author, timestamp, payload, ... }
            // signature = sign(content)
            // id = CID(content + signature)
            const contentToVerify = { ...event };
            delete contentToVerify.id;
            delete contentToVerify.signature;
            // 2. Verify Signature
            const isValidSignature = await verifySignature(contentToVerify, event.signature, event.author);
            if (!isValidSignature) {
                return { cid: event.id, accepted: false, error: 'Invalid signature' };
            }
            // 3. Verify CID (if provided)
            if (event.id && event.id !== computedCID) {
                // Logically the ID should be the CID of the signed event
                // Let's re-calculate CID of content + signature
                const signedContent = { ...contentToVerify, signature: event.signature };
                const finalCID = await calculateCID(signedContent);
                if (event.id !== finalCID) {
                    return { cid: event.id, accepted: false, error: 'CID mismatch' };
                }
            }
            // 4. Persistence
            await this.storage.saveEvent(event);
            log.info({ cid: event.id, type: event.type }, 'Event processed and saved');
            this.emit('event:processed', event);
            return { cid: event.id, accepted: true };
        }
        catch (error) {
            log.error({ error: error.message, cid: event.id }, 'Error processing event');
            return { cid: event.id, accepted: false, error: error.message };
        }
    }
    async getEvent(cid) {
        return this.storage.getEvent(cid);
    }
    async queryEvents(filter) {
        return this.storage.queryEvents(filter);
    }
}
//# sourceMappingURL=EventStore.js.map