import * as Y from 'yjs';
export interface TeamMemberData {
    id: string;
    userDid: string;
    displayName: string;
    avatar?: string;
    role: 'owner' | 'admin' | 'member' | 'guest';
    title?: string;
    notifyAll: boolean;
    notifyMentions: boolean;
    messageCount: number;
    lastActiveAt?: number;
    joinedAt: number;
    metadata: Record<string, unknown>;
}
export interface ChannelData {
    id: string;
    name: string;
    description?: string;
    type: 'public' | 'private' | 'direct';
    sortOrder: number;
    memberCount: number;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
    metadata: Record<string, unknown>;
}
export interface ChannelMessageData {
    id: string;
    channelId: string;
    authorDid: string;
    content: string;
    contentType: string;
    parentId?: string;
    editedAt?: number;
    reactions: Record<string, string[]>;
    createdAt: number;
    metadata: Record<string, unknown>;
}
export interface TeamSettings {
    visibility: 'open' | 'invite';
    type: 'work' | 'project' | 'personal';
    allowGuestAccess: boolean;
    requireApproval: boolean;
    maxMembers?: number;
}
export declare class TeamCRDT {
    private doc;
    private docId;
    constructor(docId: string);
    getDoc(): Y.Doc;
    getDocId(): string;
    getName(): string;
    setName(name: string): void;
    getDescription(): string;
    setDescription(description: string): void;
    getMembers(): TeamMemberData[];
    addMember(member: TeamMemberData): void;
    removeMember(memberId: string): void;
    updateMemberRole(memberId: string, role: TeamMemberData['role']): void;
    updateMemberTitle(memberId: string, title: string): void;
    getMember(did: string): TeamMemberData | undefined;
    isMember(did: string): boolean;
    isOwner(did: string): boolean;
    isAdmin(did: string): boolean;
    getChannels(): ChannelData[];
    addChannel(channel: ChannelData): void;
    removeChannel(channelId: string): void;
    getChannel(channelId: string): ChannelData | undefined;
    getMessages(channelId: string): ChannelMessageData[];
    addMessage(message: ChannelMessageData): void;
    deleteMessage(messageId: string): void;
    getMemberCount(): number;
    getChannelCount(): number;
    getSettings(): TeamSettings;
    updateSettings(updates: Partial<TeamSettings>): void;
}
//# sourceMappingURL=TeamCRDT.d.ts.map