import * as Y from 'yjs';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('crdt:follow');
export class FollowCRDT {
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
    getFollows() {
        const follows = this.doc.getArray('follows');
        return follows.toArray();
    }
    getFollowsByStatus(status) {
        return this.getFollows().filter(f => f.status === status);
    }
    addFollow(follow) {
        const follows = this.doc.getArray('follows');
        const existing = follows.toArray();
        if (existing.some(f => f.id === follow.id)) {
            log.warn({ followId: follow.id }, 'Follow already exists');
            return;
        }
        follows.push([follow]);
        log.info({ followId: follow.id, status: follow.status }, 'Follow added');
    }
    updateFollowStatus(followId, status) {
        const follows = this.doc.getArray('follows');
        const index = follows.toArray().findIndex(f => f.id === followId);
        if (index === -1) {
            log.warn({ followId }, 'Follow not found');
            return;
        }
        const follow = follows.get(index);
        follows.delete(index, 1);
        follows.insert(index, [{ ...follow, status }]);
        log.info({ followId, status }, 'Follow status updated');
    }
    updateNotificationSettings(followId, notifyOnPost, showInFeed) {
        const follows = this.doc.getArray('follows');
        const index = follows.toArray().findIndex(f => f.id === followId);
        if (index === -1)
            return;
        const follow = follows.get(index);
        follows.delete(index, 1);
        follows.insert(index, [{ ...follow, notifyOnPost, showInFeed }]);
    }
    removeFollow(followId) {
        const follows = this.doc.getArray('follows');
        const index = follows.toArray().findIndex(f => f.id === followId);
        if (index !== -1) {
            follows.delete(index, 1);
            log.info({ followId }, 'Follow removed');
        }
    }
    getFollowers(did) {
        return this.getFollowsByStatus('active').filter(f => f.followingDid === did);
    }
    getFollowing(did) {
        return this.getFollowsByStatus('active').filter(f => f.followerDid === did);
    }
    isFollowing(followerDid, followingDid) {
        return this.getFollowsByStatus('active').some(f => f.followerDid === followerDid && f.followingDid === followingDid);
    }
    getFollowerCount(did) {
        return this.getFollowers(did).length;
    }
    getFollowingCount(did) {
        return this.getFollowing(did).length;
    }
}
//# sourceMappingURL=FollowCRDT.js.map