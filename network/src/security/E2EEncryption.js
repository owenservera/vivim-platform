import { EventEmitter } from 'events';
import { randomBytes, createCipheriv, createDecipheriv, createECDH } from 'crypto';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('security:e2e');
export class E2EEncryption extends EventEmitter {
    keyPair = null;
    ecdh; // Using any since ECDH types vary
    config;
    constructor(config = {}) {
        super();
        this.config = {
            algorithm: 'secp256k1',
            cipher: 'aes-256-gcm',
            ...config,
        };
        this.ecdh = createECDH(this.config.algorithm || 'secp256k1');
    }
    generateKeyPair() {
        this.ecdh.generateKeys();
        const publicKey = this.ecdh.getPublicKey();
        const privateKey = this.ecdh.getPrivateKey();
        this.keyPair = { publicKey, privateKey };
        log.debug('Key pair generated');
        return this.keyPair;
    }
    setKeyPair(keyPair) {
        this.keyPair = keyPair;
        this.ecdh.setPrivateKey(keyPair.privateKey);
    }
    async encryptMessage(plaintext, recipientPublicKey) {
        if (!this.keyPair) {
            throw new Error('Key pair not initialized');
        }
        const ephemeral = createECDH(this.config.algorithm || 'x25519');
        ephemeral.generateKeys();
        const sharedSecret = ephemeral.computeSecret(recipientPublicKey);
        const encryptionKey = this.deriveKey(sharedSecret, 'encryption');
        const nonce = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', encryptionKey, nonce);
        const ciphertext = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        return {
            ephemeralPublicKey: ephemeral.getPublicKey(),
            nonce,
            ciphertext: Buffer.concat([ciphertext, authTag]),
        };
    }
    async decryptMessage(encrypted, _senderPublicKey) {
        if (!this.keyPair) {
            throw new Error('Key pair not initialized');
        }
        const ephemeral = createECDH(this.config.algorithm || 'x25519');
        ephemeral.setPrivateKey(this.keyPair.privateKey);
        const sharedSecret = ephemeral.computeSecret(encrypted.ephemeralPublicKey);
        const decryptionKey = this.deriveKey(sharedSecret, 'decryption');
        const decipher = createDecipheriv('aes-256-gcm', decryptionKey, encrypted.nonce);
        const authTag = encrypted.ciphertext.slice(-16);
        const ciphertext = encrypted.ciphertext.slice(0, -16);
        decipher.setAuthTag(authTag);
        const plaintext = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]).toString('utf8');
        return plaintext;
    }
    deriveKey(sharedSecret, purpose) {
        // Using a more standard KDF-like approach with HMAC-SHA256
        const info = Buffer.from(`vivim-${purpose}-v1`, 'utf8');
        const hmac = require('crypto').createHmac('sha256', sharedSecret);
        hmac.update(info);
        return hmac.digest().slice(0, 32);
    }
    getPublicKey() {
        return this.keyPair?.publicKey || null;
    }
    computeSharedSecret(peerPublicKey) {
        if (!this.keyPair)
            return null;
        return this.ecdh.computeSecret(peerPublicKey);
    }
}
//# sourceMappingURL=E2EEncryption.js.map