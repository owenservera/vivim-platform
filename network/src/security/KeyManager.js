import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import * as ed25519 from '@noble/ed25519';
import { E2EEncryption } from './E2EEncryption.js';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('security:keys');
export class KeyManager extends EventEmitter {
    keys = new Map();
    encryption;
    activeKeyId = null;
    constructor() {
        super();
        this.encryption = new E2EEncryption();
    }
    generateKey(type) {
        const id = randomBytes(16).toString('hex');
        let publicKey;
        let privateKey;
        if (type === 'encryption') {
            const keyPair = this.encryption.generateKeyPair();
            publicKey = keyPair.publicKey;
            privateKey = keyPair.privateKey;
        }
        else {
            // Use ed25519 for signing and identity
            privateKey = ed25519.utils.randomPrivateKey();
            publicKey = ed25519.getPublicKey(privateKey);
        }
        const record = {
            id,
            type,
            publicKey,
            privateKey,
            createdAt: Date.now(),
        };
        this.keys.set(id, record);
        if (type === 'encryption' && !this.activeKeyId) {
            this.activeKeyId = id;
            this.encryption.setKeyPair({ publicKey, privateKey });
        }
        log.info({ id, type }, 'Key generated');
        this.emit('key:generated', record);
        return record;
    }
    importKey(id, type, publicKey, privateKey) {
        const record = {
            id,
            type,
            publicKey,
            privateKey,
            createdAt: Date.now(),
        };
        this.keys.set(id, record);
        if (type === 'encryption' && !this.activeKeyId) {
            this.activeKeyId = id;
            if (privateKey) {
                this.encryption.setKeyPair({ publicKey, privateKey });
            }
        }
        log.info({ id, type }, 'Key imported');
        return record;
    }
    getKey(id) {
        return this.keys.get(id);
    }
    getActiveKey() {
        return this.activeKeyId ? this.keys.get(this.activeKeyId) : undefined;
    }
    setActiveKey(id) {
        const key = this.keys.get(id);
        if (!key) {
            throw new Error(`Key ${id} not found`);
        }
        this.activeKeyId = id;
        if (key.type === 'encryption' && key.privateKey) {
            this.encryption.setKeyPair({ publicKey: key.publicKey, privateKey: key.privateKey });
        }
        log.info({ id }, 'Active key set');
    }
    deleteKey(id) {
        const key = this.keys.get(id);
        if (!key)
            return;
        if (this.activeKeyId === id) {
            this.activeKeyId = null;
        }
        this.keys.delete(id);
        log.info({ id }, 'Key deleted');
        this.emit('key:deleted', { id });
    }
    getKeysByType(type) {
        return Array.from(this.keys.values()).filter((k) => k.type === type);
    }
    getEncryption() {
        return this.encryption;
    }
    exportPublicKey(id) {
        const key = this.keys.get(id);
        if (!key)
            return undefined;
        return Buffer.from(key.publicKey).toString('base64');
    }
    hasKey(id) {
        return this.keys.has(id);
    }
    getKeyCount() {
        return this.keys.size;
    }
}
//# sourceMappingURL=KeyManager.js.map