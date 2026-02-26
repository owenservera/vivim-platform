import * as Y from 'yjs';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('crdt:group');
export class GroupCRDT {
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
        const map = this.doc.getMap('groupData');
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
        const map = this.doc.getMap('groupData');
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
        log.info({ memberId: member.id, role: member.role }, 'Member added to group');
    }
    removeMember(memberId) {
        const members = this.doc.getMap('members');
        members.delete(memberId);
        log.info({ memberId }, 'Member removed from group');
    }
    updateMemberRole(memberId, role) {
        const members = this.doc.getMap('members');
        const member = members.get(memberId);
        if (member) {
            members.set(memberId, { ...member, role });
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
    getPosts() {
        const posts = this.doc.getArray('posts');
        return posts.toArray();
    }
    addPost(post) {
        const posts = this.doc.getArray('posts');
        posts.push([post]);
        log.info({ postId: post.id }, 'Post added to group');
    }
    removePost(postId) {
        const posts = this.doc.getArray('posts');
        const index = posts.toArray().findIndex(p => p.id === postId);
        if (index !== -1) {
            posts.delete(index, 1);
            log.info({ postId }, 'Post removed from group');
        }
    }
    getMemberCount() {
        return this.getMembers().length;
    }
    getPostCount() {
        return this.getPosts().length;
    }
    getSettings() {
        const settings = this.doc.getMap('settings');
        return {
            visibility: settings.get('visibility') || 'approval',
            type: settings.get('type') || 'general',
            allowMemberInvite: settings.get('allowMemberInvite') ?? true,
            allowMemberPost: settings.get('allowMemberPost') ?? true,
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
//# sourceMappingURL=GroupCRDT.js.map