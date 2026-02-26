/**
 * Calculate the CID (Content Identifier) for a given object.
 * Uses JSON codec and SHA-256 hash.
 */
export declare function calculateCID(data: any): Promise<string>;
/**
 * Generate a did:key from an Ed25519 public key.
 */
export declare function publicKeyToDID(publicKey: Uint8Array): string;
/**
 * Canonical JSON serialization (sorted keys).
 */
export declare function canonicalStringify(data: any): string;
/**
 * Resolve a DID to its public key.
 * Currently supports did:key with Ed25519.
 */
export declare function resolveDID(did: string): Uint8Array;
/**
 * Verify a signature for a given piece of data.
 */
export declare function verifySignature(data: any, signature: string, did: string): Promise<boolean>;
/**
 * Sign data using a private key.
 */
export declare function signData(data: any, privateKey: Uint8Array): Promise<string>;
//# sourceMappingURL=utils.d.ts.map