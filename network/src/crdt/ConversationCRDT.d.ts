import type { CRDTSyncService } from './CRDTSyncService.js';
export interface Message {
    id: string;
    authorId: string;
    content: string;
    timestamp: number;
    type: 'text' | 'image' | 'file' | 'system';
    metadata?: Record<string, unknown>;
}
export interface Participant {
    id: string;
    did: string;
    displayName: string;
    avatar?: string;
    role: 'owner' | 'moderator' | 'member';
    joinedAt: number;
}
export declare class ConversationCRDT {
    private doc;
    private docId;
    private syncService;
    constructor(docId: string, syncService: CRDTSyncService);
    initialize(): Promise<void>;
    private setupHandlers;
    getTitle(): string;
    setTitle(title: string): void;
    getMessages(): Message[];
    addMessage(message: Message): void;
    deleteMessage(messageId: string): void;
    getParticipants(): Participant[];
    addParticipant(participant: Participant): void;
    removeParticipant(participantId: string): void;
    updateParticipant(participantId: string, updates: Partial<Participant>): void;
    getMetadata<T = Record<string, unknown>>(): T;
    setMetadata(key: string, value: unknown): void;
    private emit;
}
//# sourceMappingURL=ConversationCRDT.d.ts.map