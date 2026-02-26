import { EventEmitter } from 'events';
import { E2EEncryption } from './E2EEncryption.js';
export interface KeyRecord {
    id: string;
    type: 'encryption' | 'signing' | 'identity';
    publicKey: Uint8Array;
    privateKey?: Uint8Array;
    createdAt: number;
    expiresAt?: number;
    metadata?: Record<string, unknown>;
}
export declare class KeyManager extends EventEmitter {
    private keys;
    private encryption;
    private activeKeyId;
    constructor();
    generateKey(type: KeyRecord['type']): KeyRecord;
    importKey(id: string, type: KeyRecord['type'], publicKey: Uint8Array, privateKey?: Uint8Array): KeyRecord;
    getKey(id: string): KeyRecord | undefined;
    getActiveKey(): KeyRecord | undefined;
    setActiveKey(id: string): void;
    deleteKey(id: string): void;
    getKeysByType(type: KeyRecord['type']): KeyRecord[];
    getEncryption(): E2EEncryption;
    exportPublicKey(id: string): string | undefined;
    hasKey(id: string): boolean;
    getKeyCount(): number;
}
//# sourceMappingURL=KeyManager.d.ts.map