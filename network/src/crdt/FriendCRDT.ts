import * as Y from 'yjs';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('crdt:friend');

export interface FriendData {
  id: string;
  requesterDid: string;
  addresseeDid: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked' | 'cancelled';
  message?: string;
  requestedAt: number;
  respondedAt?: number;
  metadata: Record<string, unknown>;
}

export interface FriendSettings {
  notifyOnAccept: boolean;
  shareActivity: boolean;
  showInProfile: boolean;
}

export class FriendCRDT {
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

  getFriends(): FriendData[] {
    const friends = this.doc.getArray<FriendData>('friends');
    return friends.toArray();
  }

  getFriendsByStatus(status: FriendData['status']): FriendData[] {
    return this.getFriends().filter(f => f.status === status);
  }

  addFriend(friend: FriendData): void {
    const friends = this.doc.getArray<FriendData>('friends');
    const existing = friends.toArray();
    
    if (existing.some(f => f.id === friend.id)) {
      log.warn({ friendId: friend.id }, 'Friend already exists');
      return;
    }
    
    friends.push([friend]);
    log.info({ friendId: friend.id, status: friend.status }, 'Friend added');
  }

  updateFriendStatus(friendId: string, status: FriendData['status'], respondedAt?: number): void {
    const friends = this.doc.getArray<FriendData>('friends');
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

  removeFriend(friendId: string): void {
    const friends = this.doc.getArray<FriendData>('friends');
    const index = friends.toArray().findIndex(f => f.id === friendId);
    
    if (index !== -1) {
      friends.delete(index, 1);
      log.info({ friendId }, 'Friend removed');
    }
  }

  getPendingSent(): FriendData[] {
    return this.getFriendsByStatus('pending');
  }

  getPendingReceived(): FriendData[] {
    return this.getFriendsByStatus('pending');
  }

  getAcceptedFriends(): FriendData[] {
    return this.getFriendsByStatus('accepted');
  }

  areFriends(did1: string, did2: string): boolean {
    return this.getAcceptedFriends().some(f =>
      (f.requesterDid === did1 && f.addresseeDid === did2) ||
      (f.requesterDid === did2 && f.addresseeDid === did1)
    );
  }
}
