import * as Y from 'yjs';
export interface GroupMemberData {
    id: string;
    userDid: string;
    displayName: string;
    avatar?: string;
    role: 'owner' | 'admin' | 'moderator' | 'member';
    notifyOnPost: boolean;
    showInFeed: boolean;
    postCount: number;
    joinedAt: number;
    metadata: Record<string, unknown>;
}
export interface GroupPostData {
    id: string;
    groupId: string;
    authorDid: string;
    content: string;
    contentType: string;
    acuId?: string;
    attachments: Record<string, unknown>[];
    likeCount: number;
    commentCount: number;
    createdAt: number;
    updatedAt: number;
    metadata: Record<string, unknown>;
}
export interface GroupSettings {
    visibility: 'public' | 'approval' | 'private';
    type: 'general' | 'study' | 'project' | 'community';
    allowMemberInvite: boolean;
    allowMemberPost: boolean;
    maxMembers?: number;
}
export declare class GroupCRDT {
    private doc;
    private docId;
    constructor(docId: string);
    getDoc(): Y.Doc;
    getDocId(): string;
    getName(): string;
    setName(name: string): void;
    getDescription(): string;
    setDescription(description: string): void;
    getMembers(): GroupMemberData[];
    addMember(member: GroupMemberData): void;
    removeMember(memberId: string): void;
    updateMemberRole(memberId: string, role: GroupMemberData['role']): void;
    getMember(did: string): GroupMemberData | undefined;
    isMember(did: string): boolean;
    isOwner(did: string): boolean;
    isAdmin(did: string): boolean;
    getPosts(): GroupPostData[];
    addPost(post: GroupPostData): void;
    removePost(postId: string): void;
    getMemberCount(): number;
    getPostCount(): number;
    getSettings(): GroupSettings;
    updateSettings(updates: Partial<GroupSettings>): void;
}
//# sourceMappingURL=GroupCRDT.d.ts.map