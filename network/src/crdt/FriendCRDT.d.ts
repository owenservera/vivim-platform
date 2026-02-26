import * as Y from 'yjs';
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
export declare class FriendCRDT {
    private doc;
    private docId;
    constructor(docId: string);
    getDoc(): Y.Doc;
    getDocId(): string;
    getFriends(): FriendData[];
    getFriendsByStatus(status: FriendData['status']): FriendData[];
    addFriend(friend: FriendData): void;
    updateFriendStatus(friendId: string, status: FriendData['status'], respondedAt?: number): void;
    removeFriend(friendId: string): void;
    getPendingSent(): FriendData[];
    getPendingReceived(): FriendData[];
    getAcceptedFriends(): FriendData[];
    areFriends(did1: string, did2: string): boolean;
}
//# sourceMappingURL=FriendCRDT.d.ts.map