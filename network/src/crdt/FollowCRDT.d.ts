import * as Y from 'yjs';
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
export declare class FollowCRDT {
    private doc;
    private docId;
    constructor(docId: string);
    getDoc(): Y.Doc;
    getDocId(): string;
    getFollows(): FollowData[];
    getFollowsByStatus(status: FollowData['status']): FollowData[];
    addFollow(follow: FollowData): void;
    updateFollowStatus(followId: string, status: FollowData['status']): void;
    updateNotificationSettings(followId: string, notifyOnPost: boolean, showInFeed: boolean): void;
    removeFollow(followId: string): void;
    getFollowers(did: string): FollowData[];
    getFollowing(did: string): FollowData[];
    isFollowing(followerDid: string, followingDid: string): boolean;
    getFollowerCount(did: string): number;
    getFollowingCount(did: string): number;
}
//# sourceMappingURL=FollowCRDT.d.ts.map