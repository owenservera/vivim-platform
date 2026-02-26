import { EventEmitter } from 'events';
export interface ContentRef {
    id: string;
    type: 'conversation' | 'acu' | 'circle' | 'profile' | 'media';
    ownerId: string;
    size?: number;
    mimeType?: string;
    encryption?: string;
    createdAt: number;
    updatedAt: number;
}
export declare class ContentRegistry extends EventEmitter {
    private contentRefs;
    private ownerIndex;
    private typeIndex;
    registerContent(ref: ContentRef): void;
    unregisterContent(contentId: string): void;
    getContent(contentId: string): ContentRef | undefined;
    getContentByOwner(ownerId: string): ContentRef[];
    getContentByType(type: string): ContentRef[];
    searchContent(query: {
        ownerId?: string;
        type?: string;
        mimeType?: string;
        fromTimestamp?: number;
        toTimestamp?: number;
        limit?: number;
        offset?: number;
    }): ContentRef[];
    updateContent(contentId: string, updates: Partial<ContentRef>): void;
    exists(contentId: string): boolean;
    getCount(): {
        total: number;
        byType: Record<string, number>;
        byOwner: number;
    };
    clear(): void;
}
export declare const contentRegistry: ContentRegistry;
//# sourceMappingURL=ContentRegistry.d.ts.map