import { EventEmitter } from 'events';
import { VivimChainClient } from '@vivim/network-engine';
import { E2EEncryption } from '@vivim/network-engine';
import { KeyManager } from '@vivim/network-engine';
import { EventScope, ChainEvent } from '@vivim/network-engine';

/**
 * On-chain Telemetry interface mapping core cryptographic primitives
 */
export interface CryptoTelemetryPayload {
  operation: 'key_generation' | 'ecdh_exchange' | 'signature_verify' | 'ucan_delegation' | 'encryption' | 'decryption';
  status: 'SUCCESS' | 'FAILURE';
  latencyMs: number;
  orchestratorDid: string;
  targetEntityDid?: string;
  algorithms: string[];
  failureReason?: string;
}

export interface CryptoEngineConfig {
  chainClient: VivimChainClient;
  e2eConfig?: any; // e2econfig fallback
}

/**
 * {crypto-engine} Node / Application
 * 
 * Centralized Protocol Abstraction Graph that wraps all native VIVIM cryptography primitives
 * and explicitly translates their execution metadata directly onto the blockchain as 
 * verifyable, distributed "audit:crypto" events.
 */
export class CryptoEngineApp extends EventEmitter {
  private chainClient: VivimChainClient;
  
  // Internal Sub-Modules abstracted by this centralized graph
  private encryptionLayer: E2EEncryption;
  private keyManager: KeyManager;

  public appDid: string | null = null;
  
  // Custom topic for streaming raw telemetry unburdened from the main event stream
  public readonly TELEMETRY_TOPIC = '/vivim/telemetry/crypto/v1';

  constructor(config: CryptoEngineConfig) {
    super();
    this.chainClient = config.chainClient;
    
    // Abstracting underlying specific network tools
    this.encryptionLayer = new E2EEncryption(config.e2eConfig || { algorithm: 'secp256k1', cipher: 'aes-256-gcm' });
    this.keyManager = new KeyManager();
  }

  /**
   * Initializes the Orchestrator, establishing its blockchain lifecycle
   */
  async start() {
    console.log('[Crypto-Engine] 🔐 Aligning Centralized Cryptographic Protocol Graph...');
    
    this.appDid = await this.chainClient.initializeIdentity();
    
    // Explicitly seed the E2E layer with our network identity
    const identityKey = this.keyManager.getKeysByType('identity')[0];
    if (identityKey && identityKey.privateKey) {
      this.encryptionLayer.setKeyPair(identityKey as unknown as any);
    }

    this.subscribeToNetworkEnforcement();
    
    console.log(`[Crypto-Engine] 🌐 Telemetry streams bound to network. Target DID: ${this.appDid}`);
  }

  /**
   * Primary Protocol: Encrypting Data centrally with streaming audit logging
   */
  async e2eEncryptContent(plaintext: string, recipientPublicKey: Uint8Array): Promise<any> {
    const startTime = performance.now();
    let status: 'SUCCESS' | 'FAILURE' = 'SUCCESS';
    let errorMessage: string | undefined;

    try {
      const result = await this.encryptionLayer.encryptMessage(plaintext, recipientPublicKey);
      return result;
    } catch (e: any) {
      status = 'FAILURE';
      errorMessage = e.message;
      throw e;
    } finally {
      // Defer streaming log so it doesn't block crypto speed loops
      this.streamTelemetry({
        operation: 'encryption',
        algorithms: ['aes-256-gcm', 'secp256k1'],
        status,
        latencyMs: performance.now() - startTime,
        orchestratorDid: this.appDid || 'genesis',
        targetEntityDid: this.toHex(recipientPublicKey).substring(0, 16),
        ...(errorMessage ? { failureReason: errorMessage } : {})
      });
    }
  }

  /**
   * Primary Protocol: Decrypt data centrally with streaming logging
   */
  async e2eDecryptContent(encryptedMessage: any, senderPublicKey: Uint8Array): Promise<string> {
    const startTime = performance.now();
    let status: 'SUCCESS' | 'FAILURE' = 'SUCCESS';
    let errorMessage: string | undefined;

    try {
      const plaintext = await this.encryptionLayer.decryptMessage(encryptedMessage, senderPublicKey);
      return plaintext;
    } catch (e: any) {
      status = 'FAILURE';
      errorMessage = e.message;
      throw e;
    } finally {
      this.streamTelemetry({
        operation: 'decryption',
        algorithms: ['aes-256-gcm', 'secp256k1'],
        status,
        latencyMs: performance.now() - startTime,
        orchestratorDid: this.appDid || 'genesis',
        targetEntityDid: this.toHex(senderPublicKey).substring(0, 16),
        ...(errorMessage ? { failureReason: errorMessage } : {})
      });
    }
  }

  /**
   * Graph Network Core: Generates native secure channel metadata securely logged
   */
  async deriveEcdhExchange(peerPublicKey: Uint8Array): Promise<Buffer | null> {
    const startTime = performance.now();
    
    const sharedSecret = this.encryptionLayer.computeSharedSecret(peerPublicKey);
    
    this.streamTelemetry({
      operation: 'ecdh_exchange',
      algorithms: ['secp256k1'],
      status: sharedSecret ? 'SUCCESS' : 'FAILURE',
      latencyMs: performance.now() - startTime,
      orchestratorDid: this.appDid || 'genesis',
      targetEntityDid: this.toHex(peerPublicKey).substring(0, 16),
    });

    return sharedSecret;
  }

  /**
   * Converts the internal payload into an immutable blockchain event
   * and streams it out onto the network fabric using GossipSub mechanisms natively.
   */
  private async streamTelemetry(payload: CryptoTelemetryPayload) {
    try {
      const telemetryEvent = await this.chainClient.createEvent({
        // Uses the arbitrary `audit:crypto` event type pattern
        type: 'audit:crypto' as any,
        payload,
        scope: EventScope.PUBLIC,
        tags: ['crypto', 'telemetry', `status:${payload.status}`, `op:${payload.operation}`]
      });

      console.log(`[Crypto-Engine 🪵] -> Streamed [${payload.operation}] Event (${payload.latencyMs.toFixed(2)}ms): ${payload.status}`);

      // Publish directly to the local DAG (EventStore) & Gossip Network
      await this.chainClient.submitEvent(telemetryEvent);
    } catch (e) {
      console.error(`[Crypto-Engine] ⚠️ Failed to log telemetry:`, e);
    }
  }

  /**
   * Subscribes to the network to detect anomaly rules
   */
  private subscribeToNetworkEnforcement() {
    this.chainClient.on('event:received', (event: ChainEvent) => {
      if ((event.type as any) === 'audit:crypto') {
        const payload = event.payload as CryptoTelemetryPayload;
        // Basic AI / Rule Based Network Enforcement 
        // e.g. Automatically revoking nodes firing multiple FAILURE operations quickly
        if (payload.status === 'FAILURE' && payload.operation === 'signature_verify') {
          console.warn(`[Crypto-Engine Warning] Network anomaly detected from ${payload.orchestratorDid}. Reason: ${payload.failureReason}`);
        }
      }
    });
  }

  // Helper
  private toHex(arr: Uint8Array) {
    return Buffer.from(arr).toString('hex');
  }
}
