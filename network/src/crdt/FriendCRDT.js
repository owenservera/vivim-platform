import * as Y from 'yjs';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('crdt:friend');
export class FriendCRDT {
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
    getFriends() {
        const friends = this.doc.getArray('friends');
        return friends.toArray();
    }
    getFriendsByStatus(status) {
        return this.getFriends().filter(f => f.status === status);
    }
    addFriend(friend) {
        const friends = this.doc.getArray('friends');
        const existing = friends.toArray();
        if (existing.some(f => f.id === friend.id)) {
            log.warn({ friendId: friend.id }, 'Friend already exists');
            return;
        }
        friends.push([friend]);
        log.info({ friendId: friend.id, status: friend.status }, 'Friend added');
    }
    updateFriendStatus(friendId, status, respondedAt) {
        const friends = this.doc.getArray('friends');
        const index = friends.toArray().findIndex(f => f.id === friendId);
        if (index === -1) {
            log.warn({ friendId }, 'Friend not found');
            return;
        }
        const friend = friends.get(index);
        friends.delete(index, 1);
        friends.insert(index, [{
                ...friend,
                status,
                respondedAt: respondedAt || Date.now()
            }]);
        log.info({ friendId, status }, 'Friend status updated');
    }
    removeFriend(friendId) {
        const friends = this.doc.getArray('friends');
        const index = friends.toArray().findIndex(f => f.id === friendId);
        if (index !== -1) {
            friends.delete(index, 1);
            log.info({ friendId }, 'Friend removed');
        }
    }
    getPendingSent() {
        return this.getFriendsByStatus('pending');
    }
    getPendingReceived() {
        return this.getFriendsByStatus('pending');
    }
    getAcceptedFriends() {
        return this.getFriendsByStatus('accepted');
    }
    areFriends(did1, did2) {
        return this.getAcceptedFriends().some(f => (f.requesterDid === did1 && f.addresseeDid === did2) ||
            (f.requesterDid === did2 && f.addresseeDid === did1));
    }
}
//# sourceMappingURL=FriendCRDT.js.map