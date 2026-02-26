import { EventEmitter } from 'events';
import { randomBytes, createCipheriv, createDecipheriv, createECDH } from 'crypto';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('security:e2e');

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface EncryptedMessage {
  ephemeralPublicKey: Uint8Array;
  nonce: Uint8Array;
  ciphertext: Uint8Array;
  signature?: Uint8Array;
}

export interface E2EConfig {
  algorithm?: 'x25519' | 'secp256k1' | 'prime256v1';
  cipher?: 'aes-256-gcm' | 'chacha20-poly1305';
}

export class E2EEncryption extends EventEmitter {
  private keyPair: KeyPair | null = null;
  private ecdh: any; // Using any since ECDH types vary
  private config: E2EConfig;

  constructor(config: E2EConfig = {}) {
    super();
    this.config = {
      algorithm: 'prime256v1',
      cipher: 'aes-256-gcm',
      ...config,
    };
    this.ecdh = createECDH(this.config.algorithm || 'prime256v1');
  }

  generateKeyPair(): KeyPair {
    this.ecdh.generateKeys();
    const publicKey = this.ecdh.getPublicKey();
    const privateKey = this.ecdh.getPrivateKey();

    this.keyPair = { publicKey, privateKey };
    log.debug('Key pair generated');

    return this.keyPair;
  }

  setKeyPair(keyPair: KeyPair): void {
    this.keyPair = keyPair;
    this.ecdh.setPrivateKey(keyPair.privateKey);
  }

  async encryptMessage(
    plaintext: string,
    recipientPublicKey: Uint8Array
  ): Promise<EncryptedMessage> {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }

    const ephemeral = createECDH(this.config.algorithm || 'prime256v1');
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

  async decryptMessage(
    encrypted: EncryptedMessage,
    _senderPublicKey: Uint8Array
  ): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }

    const ephemeral = createECDH(this.config.algorithm || 'prime256v1');
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

  private deriveKey(sharedSecret: Buffer, purpose: string): Buffer {
    // Using a more standard KDF-like approach with HMAC-SHA256
    const info = Buffer.from(`vivim-${purpose}-v1`, 'utf8');
    const hmac = require('crypto').createHmac('sha256', sharedSecret);
    hmac.update(info);
    return hmac.digest().slice(0, 32);
  }

  getPublicKey(): Uint8Array | null {
    return this.keyPair?.publicKey || null;
  }

  computeSharedSecret(peerPublicKey: Uint8Array): Buffer | null {
    if (!this.keyPair) return null;
    return this.ecdh.computeSecret(peerPublicKey);
  }
}
