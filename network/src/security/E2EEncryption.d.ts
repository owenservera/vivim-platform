import { EventEmitter } from 'events';
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
export declare class E2EEncryption extends EventEmitter {
    private keyPair;
    private ecdh;
    private config;
    constructor(config?: E2EConfig);
    generateKeyPair(): KeyPair;
    setKeyPair(keyPair: KeyPair): void;
    encryptMessage(plaintext: string, recipientPublicKey: Uint8Array): Promise<EncryptedMessage>;
    decryptMessage(encrypted: EncryptedMessage, _senderPublicKey: Uint8Array): Promise<string>;
    private deriveKey;
    getPublicKey(): Uint8Array | null;
    computeSharedSecret(peerPublicKey: Uint8Array): Buffer | null;
}
//# sourceMappingURL=E2EEncryption.d.ts.map