import * as Y from 'yjs';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('crdt:conversation');
export class ConversationCRDT {
    doc;
    docId;
    syncService;
    constructor(docId, syncService) {
        this.docId = docId;
        this.syncService = syncService;
        this.doc = syncService.getDocument(docId) || new Y.Doc();
    }
    async initialize() {
        await this.syncService.createDocument({
            docId: this.docId,
            docType: 'conversation',
            p2pEnabled: true,
            signalingServers: ['wss://signaling.vivim.net'],
        });
        this.doc = this.syncService.getDocument(this.docId);
        this.setupHandlers();
        log.info({ docId: this.docId }, 'ConversationCRDT initialized');
    }
    setupHandlers() {
        const title = this.doc.get('title');
        const messages = this.doc.getArray('messages');
        const participants = this.doc.getMap('participants');
        const metadata = this.doc.getMap('metadata');
        title.observe(() => {
            this.emit('title:change', title.toString());
        });
        messages.observe(() => {
            this.emit('messages:change', messages.toArray());
        });
        participants.observe(() => {
            const parts = [];
            participants.forEach((value) => parts.push(value));
            this.emit('participants:change', parts);
        });
        metadata.observe(() => {
            const meta = {};
            metadata.forEach((value, key) => {
                meta[key] = value;
            });
            this.emit('metadata:change', meta);
        });
    }
    getTitle() {
        const title = this.doc.get('title');
        return title.toString();
    }
    setTitle(title) {
        const yTitle = this.doc.get('title');
        yTitle.delete(0, yTitle.length);
        yTitle.insert(0, title);
    }
    getMessages() {
        const messages = this.doc.getArray('messages');
        return messages.toArray();
    }
    addMessage(message) {
        const messages = this.doc.getArray('messages');
        messages.push([message]);
        log.debug({ docId: this.docId, messageId: message.id }, 'Message added');
    }
    deleteMessage(messageId) {
        const messages = this.doc.getArray('messages');
        const index = messages.toArray().findIndex((m) => m.id === messageId);
        if (index !== -1) {
            messages.delete(index, 1);
        }
    }
    getParticipants() {
        const participants = this.doc.getMap('participants');
        const result = [];
        participants.forEach((value) => result.push(value));
        return result;
    }
    addParticipant(participant) {
        const participants = this.doc.getMap('participants');
        participants.set(participant.id, participant);
    }
    removeParticipant(participantId) {
        const participants = this.doc.getMap('participants');
        participants.delete(participantId);
    }
    updateParticipant(participantId, updates) {
        const participants = this.doc.getMap('participants');
        const existing = participants.get(participantId);
        if (existing) {
            participants.set(participantId, { ...existing, ...updates });
        }
    }
    getMetadata() {
        const metadata = this.doc.getMap('metadata');
        const result = {};
        metadata.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }
    setMetadata(key, value) {
        const metadata = this.doc.getMap('metadata');
        metadata.set(key, value);
    }
    emit(event, data) {
        log.debug({ docId: this.docId, event, data }, 'Emitting event');
    }
}
//# sourceMappingURL=ConversationCRDT.js.map