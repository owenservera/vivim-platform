import * as Y from 'yjs';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('crdt:team');
export class TeamCRDT {
    doc;
    docId;
    constructor(docId) {
        this.docId = docId;
        this.doc = new Y.Doc();
    }
    getDoc() {
        return this.doc;
    }
    getDocId() {
        return this.docId;
    }
    getName() {
        const name = this.doc.get('name');
        return name ? name.toString() : '';
    }
    setName(name) {
        const map = this.doc.getMap('teamData');
        const yName = map.get('name');
        if (!yName) {
            const newName = new Y.Text();
            newName.insert(0, name);
            map.set('name', newName);
        }
        else {
            yName.delete(0, yName.length);
            yName.insert(0, name);
        }
    }
    getDescription() {
        const desc = this.doc.get('description');
        return desc ? desc.toString() : '';
    }
    setDescription(description) {
        const map = this.doc.getMap('teamData');
        const yDesc = map.get('description');
        if (!yDesc) {
            const newDesc = new Y.Text();
            newDesc.insert(0, description);
            map.set('description', newDesc);
        }
        else {
            yDesc.delete(0, yDesc.length);
            yDesc.insert(0, description);
        }
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
        log.info({ memberId: member.id, role: member.role }, 'Member added to team');
    }
    removeMember(memberId) {
        const members = this.doc.getMap('members');
        members.delete(memberId);
        log.info({ memberId }, 'Member removed from team');
    }
    updateMemberRole(memberId, role) {
        const members = this.doc.getMap('members');
        const member = members.get(memberId);
        if (member) {
            members.set(memberId, { ...member, role });
        }
    }
    updateMemberTitle(memberId, title) {
        const members = this.doc.getMap('members');
        const member = members.get(memberId);
        if (member) {
            members.set(memberId, { ...member, title });
        }
    }
    getMember(did) {
        return this.getMembers().find(m => m.userDid === did);
    }
    isMember(did) {
        return this.getMembers().some(m => m.userDid === did);
    }
    isOwner(did) {
        const member = this.getMember(did);
        return member?.role === 'owner';
    }
    isAdmin(did) {
        const member = this.getMember(did);
        return member?.role === 'owner' || member?.role === 'admin';
    }
    getChannels() {
        const channels = this.doc.getArray('channels');
        return channels.toArray().sort((a, b) => a.sortOrder - b.sortOrder);
    }
    addChannel(channel) {
        const channels = this.doc.getArray('channels');
        channels.push([channel]);
        log.info({ channelId: channel.id }, 'Channel added to team');
    }
    removeChannel(channelId) {
        const channels = this.doc.getArray('channels');
        const index = channels.toArray().findIndex(c => c.id === channelId);
        if (index !== -1) {
            channels.delete(index, 1);
            log.info({ channelId }, 'Channel removed from team');
        }
    }
    getChannel(channelId) {
        return this.getChannels().find(c => c.id === channelId);
    }
    getMessages(channelId) {
        const messages = this.doc.getArray('messages');
        return messages.toArray().filter(m => m.channelId === channelId);
    }
    addMessage(message) {
        const messages = this.doc.getArray('messages');
        messages.push([message]);
        log.info({ messageId: message.id, channelId: message.channelId }, 'Message added');
    }
    deleteMessage(messageId) {
        const messages = this.doc.getArray('messages');
        const index = messages.toArray().findIndex(m => m.id === messageId);
        if (index !== -1) {
            messages.delete(index, 1);
            log.info({ messageId }, 'Message deleted');
        }
    }
    getMemberCount() {
        return this.getMembers().length;
    }
    getChannelCount() {
        return this.getChannels().length;
    }
    getSettings() {
        const settings = this.doc.getMap('settings');
        return {
            visibility: settings.get('visibility') || 'invite',
            type: settings.get('type') || 'project',
            allowGuestAccess: settings.get('allowGuestAccess') ?? false,
            requireApproval: settings.get('requireApproval') ?? true,
            maxMembers: settings.get('maxMembers'),
        };
    }
    updateSettings(updates) {
        const settings = this.doc.getMap('settings');
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                settings.set(key, value);
            }
        }
    }
}
//# sourceMappingURL=TeamCRDT.js.map