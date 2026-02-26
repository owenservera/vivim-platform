import * as Y from 'yjs';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('crdt:circle');
export class CircleCRDT {
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
            docType: 'circle',
            p2pEnabled: true,
            signalingServers: ['wss://signaling.vivim.net'],
        });
        this.doc = this.syncService.getDocument(this.docId);
        this.setupHandlers();
        log.info({ docId: this.docId }, 'CircleCRDT initialized');
    }
    setupHandlers() {
        const name = this.doc.get('name');
        const description = this.doc.get('description');
        const members = this.doc.getMap('members');
        const settings = this.doc.getMap('settings');
        const contentRefs = this.doc.getArray('contentRefs');
        name.observe(() => {
            this.emit('name:change', name.toString());
        });
        description.observe(() => {
            this.emit('description:change', description.toString());
        });
        members.observe(() => {
            const memberList = [];
            members.forEach((value) => memberList.push(value));
            this.emit('members:change', memberList);
        });
        settings.observe(() => {
            const circleSettings = {};
            settings.forEach((value, key) => {
                circleSettings[key] = value;
            });
            this.emit('settings:change', circleSettings);
        });
        contentRefs.observe(() => {
            this.emit('content:change', contentRefs.toArray());
        });
    }
    getName() {
        const name = this.doc.get('name');
        return name.toString();
    }
    setName(name) {
        const yName = this.doc.get('name');
        yName.delete(0, yName.length);
        yName.insert(0, name);
    }
    getDescription() {
        const description = this.doc.get('description');
        return description.toString();
    }
    setDescription(description) {
        const yDesc = this.doc.get('description');
        yDesc.delete(0, yDesc.length);
        yDesc.insert(0, description);
    }
    getMembers() {
        const members = this.doc.getMap('members');
        const result = [];
        members.forEach((value) => result.push(value));
        return result;
    }
    addMember(member) {
        const members = this.doc.getMap('members');
        members.set(member.id, member);
        log.debug({ docId: this.docId, memberId: member.id }, 'Member added');
    }
    removeMember(memberId) {
        const members = this.doc.getMap('members');
        members.delete(memberId);
        log.debug({ docId: this.docId, memberId }, 'Member removed');
    }
    updateMember(memberId, updates) {
        const members = this.doc.getMap('members');
        const existing = members.get(memberId);
        if (existing) {
            members.set(memberId, { ...existing, ...updates });
        }
    }
    getSettings() {
        const settings = this.doc.getMap('settings');
        const result = {
            visibility: settings.get('visibility') || 'private',
            sharingPolicy: settings.get('sharingPolicy') || 'owner-only',
            syncMode: settings.get('syncMode') || 'realtime',
            encryption: settings.get('encryption') ?? true,
            maxMembers: settings.get('maxMembers'),
        };
        return result;
    }
    updateSettings(updates) {
        const settings = this.doc.getMap('settings');
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                settings.set(key, value);
            }
        }
    }
    getContentRefs() {
        const contentRefs = this.doc.getArray('contentRefs');
        return contentRefs.toArray();
    }
    addContentRef(type, id) {
        const contentRefs = this.doc.getArray('contentRefs');
        const existing = contentRefs.toArray();
        if (!existing.some((ref) => ref.type === type && ref.id === id)) {
            contentRefs.push([{ type, id }]);
        }
    }
    removeContentRef(type, id) {
        const contentRefs = this.doc.getArray('contentRefs');
        const index = contentRefs.toArray().findIndex((ref) => ref.type === type && ref.id === id);
        if (index !== -1) {
            contentRefs.delete(index, 1);
        }
    }
    emit(event, data) {
        log.debug({ docId: this.docId, event, data }, 'Emitting event');
    }
}
//# sourceMappingURL=CircleCRDT.js.map