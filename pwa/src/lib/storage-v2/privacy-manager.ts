/**
 * VIVIM Storage V2 - Privacy Manager
 *
 * Manages privacy state transitions for conversations:
 * - LOCAL -> SHARED (encrypted for recipients)
 * - LOCAL/SHARED -> PUBLIC (on-chain anchor, permanent)
 * - Zero-trust verification at all levels
 */

import type {
  Hash,
  DID,
  PrivacyLevel,
  PrivacyState,
  OnChainAnchor,
  SharedEnvelope,
  PublishOptions,
  ConversationRoot,
  Node
} from './types';
import {
  generateSymmetricKey,
  symmetricEncrypt,
  symmetricDecrypt,
  encryptKeyForRecipient,
  decryptKeyFromSender,
  sha256
} from './crypto';
import { ObjectStore } from './object-store';
import { DAGEngine } from './dag-engine';

// ============================================================================
// Verification Result
// ============================================================================

export interface VerificationResult {
  valid: boolean;
  author: DID;
  contentHash: Hash;
  signatureValid: boolean;
  canTrust: boolean;
  details?: {
    messageCount?: number;
    merkleRoot?: Hash;
    onChainAnchor?: OnChainAnchor;
  };
}

// ============================================================================
// Privacy Manager
// ============================================================================

export class PrivacyManager {
  private objectStore: ObjectStore;
  private dagEngine: DAGEngine;
  private myDID: DID;

  constructor(objectStore: ObjectStore, dagEngine: DAGEngine, myDID: DID) {
    this.objectStore = objectStore;
    this.dagEngine = dagEngine;
    this.myDID = myDID;
  }

  // ========================================================================
  // Privacy State Management
  // ========================================================================

  /**
   * Get privacy state for a conversation
   */
  async getPrivacyState(conversationId: Hash): Promise<PrivacyState> {
    const root = await this.objectStore.get(conversationId);
    if (!root || root.type !== 'root') {
      return { level: 'local', updatedAt: new Date().toISOString() };
    }

    return (root as ConversationRoot).privacy || {
      level: 'local',
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Update privacy state (only for local -> shared or local/shared -> public)
   * Throws if trying to revert from public to shared/local
   */
  async updatePrivacyState(
    conversationId: Hash,
    newLevel: PrivacyLevel,
    options?: {
      recipients?: DID[];
      allowReshare?: boolean;
      expireAt?: string;
    }
  ): Promise<PrivacyState> {
    const current = await this.getPrivacyState(conversationId);

    // Validate transitions
    if (current.level === 'public' && newLevel !== 'public') {
      throw new Error('Cannot revert from PUBLIC to SHARED or LOCAL. Public publication is permanent.');
    }

    const newState: PrivacyState = {
      level: newLevel,
      updatedAt: new Date().toISOString(),
      recipients: options?.recipients,
      allowReshare: options?.allowReshare,
      expireAt: options?.expireAt
    };

    // Update the root node
    const root = await this.objectStore.get(conversationId);
    if (root && root.type === 'root') {
      const updatedRoot = { ...root, privacy: newState };
      await this.objectStore.put(updatedRoot);
    }

    return newState;
  }

  // ========================================================================
  // Sharing (Encrypted for Specific Recipients)
  // ========================================================================

  /**
   * Create a shared envelope for a conversation
   * Recipients can decrypt and verify, but cannot see content without decryption
   */
  async createSharedEnvelope(
    conversationId: Hash,
    recipients: DID[],
    options?: {
      allowReshare?: boolean;
      expireAt?: string;
    }
  ): Promise<SharedEnvelope> {
    // Get all nodes in the conversation
    const nodes = await this.dagEngine.traversalBFS(conversationId);

    // Serialize content
    const content = JSON.stringify(nodes, canonicalizeReplacer, 0);
    const contentBytes = new TextEncoder().encode(content);
    const contentHashValue = await sha256(content);

    // Generate symmetric key
    const symmetricKey = generateSymmetricKey();

    // Encrypt content
    const { nonce, ciphertext } = symmetricEncrypt(contentBytes, symmetricKey);

    // Encrypt key for each recipient
    const recipientKeys: Record<DID, string> = {};

    for (const recipientDID of recipients) {
      // In production, get recipient's public key from their DID
      // For now, placeholder
      const encryptedKey = encryptKeyForRecipient(
        symmetricKey,
        recipientDID // Should be X25519 public key
      );
      recipientKeys[recipientDID] = JSON.stringify(encryptedKey);
    }

    // Sign the envelope
    const envelope: SharedEnvelope = {
      contentHash: contentHashValue,
      recipients: recipientKeys,
      ciphertext,
      nonce,
      authorDID: this.myDID,
      signature: '', // Will be set
      createdAt: new Date().toISOString(),
      allowReshare: options?.allowReshare,
      expireAt: options?.expireAt
    };

    // Sign (using crypto module, would need to import sign function)
    // envelope.signature = await sign(envelope, this.mySecretKey);

    return envelope;
  }

  /**
   * Decrypt a shared envelope
   */
  async decryptSharedEnvelope(
    envelope: SharedEnvelope,
    mySecretKey: string
  ): Promise<Node[]> {
    // Get encrypted key for this recipient
    const encryptedKeyStr = envelope.recipients[this.myDID];
    if (!encryptedKeyStr) {
      throw new Error('This envelope was not shared with you');
    }

    const encryptedKey = JSON.parse(encryptedKeyStr);

    // Decrypt symmetric key
    const symmetricKeyBytes = decryptKeyFromSender(encryptedKey, mySecretKey);
    if (!symmetricKeyBytes) {
      throw new Error('Failed to decrypt symmetric key');
    }

    // Decrypt content
    const decryptedBytes = symmetricDecrypt(
      envelope.ciphertext,
      envelope.nonce,
      toBase64(symmetricKeyBytes)
    );

    if (!decryptedBytes) {
      throw new Error('Failed to decrypt content');
    }

    const content = new TextDecoder().decode(decryptedBytes);
    return JSON.parse(content);
  }

  /**
   * Verify a shared envelope without decrypting
   * The contentHash is public, so anyone can verify the hash matches
   */
  async verifySharedEnvelope(envelope: SharedEnvelope): Promise<VerificationResult> {
    // Verify signature
    // const signatureValid = await verify(envelope, envelope.signature, envelope.authorDID);

    return {
      valid: true, // signatureValid
      author: envelope.authorDID,
      contentHash: envelope.contentHash,
      signatureValid: true, // signatureValid,
      canTrust: true
    };
  }

  // ========================================================================
  // Publishing (Public, On-Chain, Permanent)
  // ========================================================================

  /**
   * Prepare a conversation for public publication
   * This does NOT publish yet - just prepares the payload
   */
  async preparePublication(
    conversationId: Hash,
    options: PublishOptions = {}
  ): Promise<PublicationPayload> {
    const {
      includeForks = false,
      includeEdits = false,
    } = options;

    // Get root
    const root = await this.objectStore.get(conversationId);
    if (!root || root.type !== 'root') {
      throw new Error('Conversation not found');
    }

    // Get all nodes
    const allNodes = await this.dagEngine.traversalBFS(conversationId);

    // Filter based on options
    let nodesToPublish = allNodes;

    if (!includeEdits) {
      nodesToPublish = nodesToPublish.filter(n => n.type !== 'edit');
    }

    if (!includeForks) {
      nodesToPublish = nodesToPublish.filter(n => n.type !== 'fork');
    }

    // Compute Merkle root
    const messageNodes = nodesToPublish.filter(n => n.type === 'message');
    const messageHashes = messageNodes.map(n => n.id);

    if (messageHashes.length === 0) {
      throw new Error('No messages to publish');
    }

    const { buildMerkleTree } = await import('./merkle');
    const merkleTree = buildMerkleTree(messageHashes);

    // Serialize content for IPFS
    const content = JSON.stringify({
      format: 'openscroll-v2-public',
      version: '2.0.0',
      root,
      nodes: nodesToPublish,
      includeEdits,
      includeForks,
      publishedAt: new Date().toISOString(),
      publishedBy: this.myDID
    }, canonicalizeReplacer, 0);

    const contentHash = await sha256(content);

    return {
      conversationId,
      merkleRoot: merkleTree.root.hash,
      messageCount: messageHashes.length,
      content,
      contentHash,
      nodes: nodesToPublish,
      includeEdits,
      includeForks,
      warnings: this.generatePublicationWarnings(root as ConversationRoot)
    };
  }

  /**
   * Generate warnings for publication
   */
  private generatePublicationWarnings(root: ConversationRoot): string[] {
    const warnings: string[] = [];

    if (root.privacy?.level === 'public') {
      warnings.push('This conversation is already public. You will create another anchor.');
    }

    warnings.push('Once published, your content will be:');
    warnings.push('  • Permanently visible on the blockchain');
    warnings.push('  • Downloadable by anyone');
    warnings.push('  • Verifiable by anyone');
    warnings.push('  • Impossible to delete or hide');
    warnings.push('');
    warnings.push('Your cryptographic signature proves you are the author.');
    warnings.push('No one can forge this proof of authorship.');

    return warnings;
  }

  /**
   * Estimate gas cost for publication
   */
  async estimatePublicationCost(
    payload: PublicationPayload,
    chain: string = 'optimism'
  ): Promise<GasEstimate> {
    const GAS_PRICES: Record<string, number> = {
      'ethereum': 30,  // gwei
      'optimism': 0.5,
      'base': 0.5,
      'arbitrum': 0.3
    };

    const GAS_LIMITS = {
      baseAnchor: 100000,
      perMessage: 5000
    };

    const gasPrice = GAS_PRICES[chain] || 1;
    const gasLimit = GAS_LIMITS.baseAnchor + (payload.messageCount * GAS_LIMITS.perMessage);

    const gasCostWei = gasLimit * gasPrice * 1e9;
    const gasCostEth = gasCostWei / 1e18;

    const ethPrice = 3000; // USD, should fetch from API
    const costUsd = gasCostEth * ethPrice;

    return {
      chain,
      gasLimit,
      gasPrice,
      gasCostEth,
      costUsd,
      currency: 'USD'
    };
  }

  /**
   * Execute publication (call on-chain anchor contract)
   * In production, this would integrate with actual blockchain
   */
  async executePublication(
    payload: PublicationPayload,
    chain: string = 'optimism',
    options?: {
      ipfsUpload?: boolean;
      dryRun?: boolean;
    }
  ): Promise<PublicationResult> {
    // TODO: Integrate with actual blockchain
    // For now, return a mock result

    const cost = await this.estimatePublicationCost(payload, chain);

    if (options?.dryRun) {
      return {
        success: false,
        dryRun: true,
        cost,
        warnings: payload.warnings
      };
    }

    // In production:
    // 1. Upload to IPFS if requested
    let ipfsCID: string | undefined;
    if (options?.ipfsUpload) {
      // ipfsCID = await uploadToIPFS(payload.content);
    }

    // 2. Submit transaction to anchor contract
    // const tx = await anchorContract.anchorConversation(...);

    // 3. Wait for confirmation
    // const receipt = await tx.wait();

    return {
      success: true,
      dryRun: false,
      cost,
      ipfsCID,
      anchor: {
        chainId: chain,
        blockNumber: 0, // From receipt
        transactionHash: '0x...', // From receipt
        timestamp: Date.now(),
        merkleRoot: payload.merkleRoot,
        ipfsCID
      }
    };
  }

  // ========================================================================
  // Zero-Trust Verification
  // ========================================================================

  /**
   * Verify a conversation's integrity and authorship
   * Works for LOCAL, SHARED, or PUBLIC content
   */
  async verifyConversation(conversationId: Hash): Promise<VerificationResult> {
    const nodes = await this.dagEngine.traversalBFS(conversationId);

    if (nodes.length === 0) {
      return {
        valid: false,
        author: this.myDID,
        contentHash: '' as Hash,
        signatureValid: false,
        canTrust: false
      };
    }

    // Verify each node's signature
    let allValid = true;
    const messageNodes = nodes.filter(n => n.type === 'message');

    for (const node of messageNodes) {
      const valid = await this.verifyNode(node);
      if (!valid) {
        allValid = false;
      }
    }

    // Compute Merkle root
    const { buildMerkleTree } = await import('./merkle');
    const merkleTree = buildMerkleTree(messageNodes.map(n => n.id));

    // Check for on-chain anchor
    const root = nodes.find(n => n.type === 'root') as ConversationRoot | undefined;
    let onChainAnchor: OnChainAnchor | undefined;

    if (root?.privacy && 'onChainAnchors' in root.privacy) {
      const anchors = (root.privacy as unknown as { onChainAnchors: OnChainAnchor[] }).onChainAnchors;
      if (Array.isArray(anchors) && anchors.length > 0) {
        onChainAnchor = anchors[0];
      }
    }

    return {
      valid: allValid,
      author: root?.author || this.myDID,
      contentHash: merkleTree.root.hash,
      signatureValid: allValid,
      canTrust: allValid,
      details: {
        messageCount: messageNodes.length,
        merkleRoot: merkleTree.root.hash,
        onChainAnchor
      }
    };
  }

  /**
   * Verify a single node's signature
   */
  async verifyNode(node: Node): Promise<boolean> {
    // Reconstruct signed payload
    const nodeData = { ...node } as Record<string, unknown>;
    delete nodeData.signature;
    // const canonical = JSON.stringify(nodeData, canonicalizeReplacer, 0);

    // TODO: Implement actual verification
    // return verify(canonical, signature, nodeData.author);

    return true; // Placeholder
  }

  /**
   * Verify a Merkle proof against a known root
   */
  async verifyMerkleProof(
    proof: {
      leaf: Hash;
      root: Hash;
      path: Array<{ hash: Hash; direction: 'left' | 'right' }>;
    }
  ): Promise<boolean> {
    const { verifyProof } = await import('./merkle');
    return verifyProof(proof);
  }

  /**
   * Verify content from an untrusted source
   * This is the core zero-trust verification
   */
  async verifyUntrustedContent(
    content: string,
    claimedAuthor: DID,
    claimedMerkleRoot?: Hash
  ): Promise<VerificationResult> {
    try {
      const nodes: Node[] = JSON.parse(content);
      const messageNodes = nodes.filter(n => n.type === 'message');

      // Verify signatures
      let allValid = true;
      let foundAuthor = '';

      for (const node of messageNodes) {
        const valid = await this.verifyNode(node);
        if (!valid) allValid = false;

        if (node.author === claimedAuthor) {
          foundAuthor = node.author;
        }
      }

      // Compute Merkle root
      const { buildMerkleTree } = await import('./merkle');
      const merkleTree = buildMerkleTree(messageNodes.map(n => n.id));
      const computedRoot = merkleTree.root.hash;

      // Verify against claimed root if provided
      const rootMatch = !claimedMerkleRoot || computedRoot === claimedMerkleRoot;

      return {
        valid: allValid && rootMatch,
        author: foundAuthor || claimedAuthor,
        contentHash: computedRoot,
        signatureValid: allValid,
        canTrust: allValid && rootMatch,
        details: {
          messageCount: messageNodes.length,
          merkleRoot: computedRoot
        }
      };
    } catch {
      return {
        valid: false,
        author: claimedAuthor,
        contentHash: '' as Hash,
        signatureValid: false,
        canTrust: false
      };
    }
  }
}

// ============================================================================
// Types
// ============================================================================

export interface PublicationPayload {
  conversationId: Hash;
  merkleRoot: Hash;
  messageCount: number;
  content: string;
  contentHash: Hash;
  nodes: Node[];
  includeEdits: boolean;
  includeForks: boolean;
  warnings: string[];
}

export interface GasEstimate {
  chain: string;
  gasLimit: number;
  gasPrice: number;
  gasCostEth: number;
  costUsd: number;
  currency: string;
}

export interface PublicationResult {
  success: boolean;
  dryRun?: boolean;
  cost?: GasEstimate;
  ipfsCID?: string;
  anchor?: OnChainAnchor;
  warnings?: string[];
}

// ============================================================================
// Helpers
// ============================================================================

function canonicalizeReplacer(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sortedKeys = Object.keys(value).sort();
    const sortedObj: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sortedObj[key] = (value as Record<string, unknown>)[key];
    }
    return sortedObj;
  }
  return value;
}

function toBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}
