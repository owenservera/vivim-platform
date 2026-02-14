import * as Y from 'yjs';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('crdt:follow');

export interface FollowData {
  id: string;
  followerDid: string;
  followingDid: string;
  status: 'pending' | 'active' | 'blocked';
  notifyOnPost: boolean;
  showInFeed: boolean;
  createdAt: number;
  metadata: Record<string, unknown>;
}

export class FollowCRDT {
  private doc: Y.Doc;
  private docId: string;

  constructor(docId: string) {
    this.docId = docId;
    this.doc = new Y.Doc();
  }

  getDoc(): Y.Doc {
    return this.doc;
  }

  getDocId(): string {
    return this.docId;
  }

  getFollows(): FollowData[] {
    const follows = this.doc.getArray<FollowData>('follows');
    return follows.toArray();
  }

  getFollowsByStatus(status: FollowData['status']): FollowData[] {
    return this.getFollows().filter(f => f.status === status);
  }

  addFollow(follow: FollowData): void {
    const follows = this.doc.getArray<FollowData>('follows');
    const existing = follows.toArray();
    
    if (existing.some(f => f.id === follow.id)) {
      log.warn({ followId: follow.id }, 'Follow already exists');
      return;
    }
    
    follows.push([follow]);
    log.info({ followId: follow.id, status: follow.status }, 'Follow added');
  }

  updateFollowStatus(followId: string, status: FollowData['status']): void {
    const follows = this.doc.getArray<FollowData>('follows');
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

  updateNotificationSettings(followId: string, notifyOnPost: boolean, showInFeed: boolean): void {
    const follows = this.doc.getArray<FollowData>('follows');
    const index = follows.toArray().findIndex(f => f.id === followId);
    
    if (index === -1) return;
    
    const follow = follows.get(index);
    follows.delete(index, 1);
    follows.insert(index, [{ ...follow, notifyOnPost, showInFeed }]);
  }

  removeFollow(followId: string): void {
    const follows = this.doc.getArray<FollowData>('follows');
    const index = follows.toArray().findIndex(f => f.id === followId);
    
    if (index !== -1) {
      follows.delete(index, 1);
      log.info({ followId }, 'Follow removed');
    }
  }

  getFollowers(did: string): FollowData[] {
    return this.getFollowsByStatus('active').filter(f => f.followingDid === did);
  }

  getFollowing(did: string): FollowData[] {
    return this.getFollowsByStatus('active').filter(f => f.followerDid === did);
  }

  isFollowing(followerDid: string, followingDid: string): boolean {
    return this.getFollowsByStatus('active').some(
      f => f.followerDid === followerDid && f.followingDid === followingDid
    );
  }

  getFollowerCount(did: string): number {
    return this.getFollowers(did).length;
  }

  getFollowingCount(did: string): number {
    return this.getFollowing(did).length;
  }
}
