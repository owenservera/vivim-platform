/**
 * DID Service for VIVIM PWA
 * 
 * Manages Decentralized Identifiers (DIDs) for the user.
 * Currently supports did:key using ed25519.
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { useIdentityStore } from '../../stores';
import { logger } from '../logger';

// Set up noble-ed25519 with sha512
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

const log = logger.child({ module: 'did-service' });

class DIDService {
  private static instance: DIDService;
  
  static getInstance(): DIDService {
    if (!DIDService.instance) {
      DIDService.instance = new DIDService();
    }
    return DIDService.instance;
  }

  /**
   * Generate a new DID and store it locally
   */
  async createIdentity(): Promise<string> {
    try {
      log.info('Creating new decentralized identity...');
      
      // Generate random private key
      const privKey = ed.utils.randomPrivateKey();
      const pubKey = await ed.getPublicKeyAsync(privKey);
      
      // did:key format
      // In a real implementation, we would use multicodec prefixing
      // For now, simple hex for internal use
      const did = `did:key:z${this.bufToHex(pubKey)}`;
      
      // Store in Identity Store (Persisted in IndexedDB/LocalStorage via Zustand)
      // Note: We'd want to store the private key securely (WebCrypto or encrypted IndexedDB)
      // For this implementation, we'll store it in the store
      useIdentityStore.getState().setDid(did);
      
      log.info({ did }, 'Identity created');
      return did;
    } catch (error) {
      log.error({ error }, 'Failed to create identity');
      throw error;
    }
  }

  /**
   * Sign a message with the user's private key
   */
  async sign(message: Uint8Array, privKey: Uint8Array): Promise<Uint8Array> {
    return await ed.signAsync(message, privKey);
  }

  /**
   * Verify a signature
   */
  async verify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
    return await ed.verifyAsync(signature, message, publicKey);
  }

  private bufToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export const didService = DIDService.getInstance();
export default didService;
