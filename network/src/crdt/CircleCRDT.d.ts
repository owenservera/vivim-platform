import type { CRDTSyncService } from './CRDTSyncService.js';
export interface CircleMember {
    id: string;
    did: string;
    displayName: string;
    avatar?: string;
    role: 'owner' | 'moderator' | 'member';
    joinedAt: number;
    permissions: {
        read: boolean;
        write: boolean;
        invite: boolean;
        remove: boolean;
    };
}
export interface CircleSettings {
    visibility: 'private' | 'circle' | 'public';
    sharingPolicy: 'owner-only' | 'moderators' | 'all-members';
    syncMode: 'realtime' | 'periodic' | 'manual';
    encryption: boolean;
    maxMembers?: number;
}
export declare class CircleCRDT {
    private doc;
    private docId;
    private syncService;
    constructor(docId: string, syncService: CRDTSyncService);
    initialize(): Promise<void>;
    private setupHandlers;
    getName(): string;
    setName(name: string): void;
    getDescription(): string;
    setDescription(description: string): void;
    getMembers(): CircleMember[];
    addMember(member: CircleMember): void;
    removeMember(memberId: string): void;
    updateMember(memberId: string, updates: Partial<CircleMember>): void;
    getSettings(): CircleSettings;
    updateSettings(updates: Partial<CircleSettings>): void;
    getContentRefs(): Array<{
        type: string;
        id: string;
    }>;
    addContentRef(type: string, id: string): void;
    removeContentRef(type: string, id: string): void;
    private emit;
}
//# sourceMappingURL=CircleCRDT.d.ts.map