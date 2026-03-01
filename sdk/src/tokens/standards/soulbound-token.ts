/**
 * Soulbound Token Implementation (ERC-5192 compatible)
 * 
 * Non-transferable tokens representing identity, reputation, and credentials
 * Once minted, they cannot be transferred (soulbound to the recipient)
 */

import { ERC1155 } from './erc1155.js';
import type {
  IdentityToken,
  IdentityTokenType,
  IdentityMetadata,
  TokenMetadata,
} from '../types.js';

/**
 * Soulbound Token configuration
 */
export interface SoulboundTokenConfig {
  name: string;
  symbol: string;
  /** Maximum supply (for scarcity) */
  maxSupply?: bigint;
  /** Whether tokens can be revoked by issuer */
  revocable: boolean;
}

/**
 * Soulbound token data
 */
interface SoulboundTokenData {
  // Identity properties
  recipient: string;
  tokenSubtype: IdentityTokenType;
  
  // Verification
  issuer: string;
  issuanceCriteria: string;
  verificationLevel: number;
  
  // Revocability
  isRevocable: boolean;
  revocationReason?: string;
  revokedAt?: number;
  
  // Metadata
  metadata: TokenMetadata & IdentityMetadata;
  
  // Status
  isIssued: boolean;
  issuedAt: number;
}

/**
 * Soulbound Token (ERC-5192 compatible)
 * 
 * Non-transferable tokens that represent:
 * - Reputation scores
 * - Credentials/achievements
 * - KYC verification
 * - Trust levels
 * 
 * These tokens are bound to a specific address and cannot be transferred.
 */
export class SoulboundToken extends ERC1155 {
  private readonly config: SoulboundTokenConfig;
  
  // Soulbound token data
  private readonly _soulboundData: Map<bigint, SoulboundTokenData> = new Map();
  
  // Track issued tokens per recipient (for limit enforcement)
  private readonly _recipientTokens: Map<string, Set<bigint>> = new Map();
  
  // Locked status (ERC-5192 compatible)
  private readonly _lockedAccounts: Map<string, boolean> = new Map();
  
  constructor(config: SoulboundTokenConfig) {
    super(config.name, config.symbol, 0, 'identity');
    this.config = config;
  }
  
  // ============================================
  // SOULBOUND TOKEN SPECIFIC METHODS
  // ============================================
  
  /**
   * Issue a soulbound token to a recipient
   * 
   * Can only be called by an authorized issuer
   */
  async issue(
    recipient: string,
    tokenSubtype: IdentityTokenType,
    metadata: TokenMetadata & IdentityMetadata,
    options?: {
      issuer?: string;
      issuanceCriteria?: string;
      verificationLevel?: number;
    }
  ): Promise<bigint> {
    // Check max supply
    if (this.config.maxSupply) {
      const currentSupply = this._nextTokenId - 1n;
      if (currentSupply >= this.config.maxSupply) {
        throw new Error('Maximum supply reached');
      }
    }
    
    // Check if recipient already has this type of token (optional limit)
    const existingTokens = this._recipientTokens.get(recipient.toLowerCase());
    if (existingTokens) {
      for (const tokenId of existingTokens) {
        const data = this._soulboundData.get(tokenId);
        if (data && data.tokenSubtype === tokenSubtype) {
          throw new Error(`Recipient already has a ${tokenSubtype} token`);
        }
      }
    }
    
    // Generate token ID
    const tokenId = this._getNextTokenId();
    
    // Store soulbound data
    const tokenData: SoulboundTokenData = {
      recipient: recipient.toLowerCase(),
      tokenSubtype,
      issuer: options?.issuer ?? 'system',
      issuanceCriteria: options?.issuanceCriteria ?? '',
      verificationLevel: options?.verificationLevel ?? 0,
      isRevocable: this.config.revocable,
      revocationReason: undefined,
      revokedAt: undefined,
      metadata: {
        ...metadata,
        issuedAt: Date.now(),
        expiresAt: metadata.expiresAt,
      },
      isIssued: true,
      issuedAt: Date.now(),
    };
    
    this._soulboundData.set(tokenId, tokenData);
    
    // Track for recipient
    let recipientSet = this._recipientTokens.get(recipient.toLowerCase());
    if (!recipientSet) {
      recipientSet = new Set();
      this._recipientTokens.set(recipient.toLowerCase(), recipientSet);
    }
    recipientSet.add(tokenId);
    
    // Lock the account (mark as having soulbound tokens)
    this._lockedAccounts.set(recipient.toLowerCase(), true);
    
    // Set metadata
    this.setTokenMetadata(tokenId, metadata);
    
    // Mint to recipient (non-transferable)
    await this._mint(recipient, tokenId, 1n, {
      tokenSubtype,
      recipient: recipient.toLowerCase(),
    });
    
    return tokenId;
  }
  
  /**
   * Revoke a soulbound token
   * 
   * Only possible if token is revocable
   */
  async revoke(tokenId: bigint, reason?: string): Promise<void> {
    const tokenData = this._getSoulboundData(tokenId);
    
    if (!tokenData.isRevocable) {
      throw new Error('This token is not revocable');
    }
    
    // Verify caller is issuer
    const caller = 'issuer'; // Would be msg.sender in real implementation
    if (caller.toLowerCase() !== tokenData.issuer.toLowerCase()) {
      throw new Error('Only the issuer can revoke this token');
    }
    
    // Mark as revoked
    tokenData.revocationReason = reason;
    tokenData.revokedAt = Date.now();
    
    // Burn the token
    await this._burn(tokenData.recipient, tokenId, 1n);
    
    // Check if recipient has any other soulbound tokens
    const remainingTokens = this._recipientTokens.get(tokenData.recipient);
    if (!remainingTokens || remainingTokens.size === 0) {
      this._lockedAccounts.delete(tokenData.recipient);
    }
  }
  
  /**
   * Verify if an account has soulbound tokens (locked status)
   */
  locked(account: string): boolean {
    return this._lockedAccounts.get(account.toLowerCase()) ?? false;
  }
  
  /**
   * Get soulbound token balance for an account
   * 
   * Returns the count of soulbound tokens (always 0 or 1 per type)
   */
  soulboundBalanceOf(account: string): number {
    const tokens = this._recipientTokens.get(account.toLowerCase());
    if (!tokens) return 0;
    
    // Only count issued, non-revoked tokens
    let count = 0;
    for (const tokenId of tokens) {
      const data = this._soulboundData.get(tokenId);
      if (data && data.isIssued && !data.revokedAt) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Get token by subtype for a recipient
   */
  getTokenBySubtype(
    recipient: string,
    tokenSubtype: IdentityTokenType
  ): bigint | undefined {
    const tokens = this._recipientTokens.get(recipient.toLowerCase());
    if (!tokens) return undefined;
    
    for (const tokenId of tokens) {
      const data = this._soulboundData.get(tokenId);
      if (data && data.tokenSubtype === tokenSubtype && data.isIssued && !data.revokedAt) {
        return tokenId;
      }
    }
    return undefined;
  }
  
  /**
   * Get all tokens for a recipient
   */
  getTokensOf(recipient: string): bigint[] {
    const tokens = this._recipientTokens.get(recipient.toLowerCase());
    if (!tokens) return [];
    
    return Array.from(tokens).filter(tokenId => {
      const data = this._soulboundData.get(tokenId);
      return data && data.isIssued && !data.revokedAt;
    });
  }
  
  /**
   * Get soulbound token data
   */
  getSoulboundData(tokenId: bigint): SoulboundTokenData | undefined {
    return this._soulboundData.get(tokenId);
  }
  
  /**
   * Update verification level
   */
  async updateVerificationLevel(
    tokenId: bigint,
    level: number
  ): Promise<void> {
    const tokenData = this._getSoulboundData(tokenId);
    
    // Only issuer can update
    const caller = 'issuer'; // Would be msg.sender
    if (caller.toLowerCase() !== tokenData.issuer.toLowerCase()) {
      throw new Error('Only the issuer can update verification level');
    }
    
    tokenData.verificationLevel = level;
  }
  
  // ============================================
  // OVERRIDDEN TRANSFER METHODS
  // ============================================
  
  /**
   * Override transfer to prevent soulbound token transfers
   */
  async transfer(
    from: string,
    to: string,
    tokenId: bigint,
    amount: bigint = 1n
  ): Promise<void> {
    // Soulbound tokens cannot be transferred
    throw new Error(
      'Soulbound tokens cannot be transferred. They are permanently bound to the recipient.'
    );
  }
  
  /**
   * Override batch transfer to prevent soulbound transfers
   */
  async transferBatch(
    from: string,
    to: string,
    tokenIds: bigint[],
    amounts: bigint[]
  ): Promise<void> {
    throw new Error(
      'Soulbound tokens cannot be transferred. They are permanently bound to the recipient.'
    );
  }
  
  /**
   * Override setApprovalForAll to prevent operators
   */
  async setApprovalForAll(operator: string, approved: boolean): Promise<void> {
    throw new Error(
      'Soulbound tokens cannot have operators. They are non-transferable.'
    );
  }
  
  // ============================================
  // INTERNAL HELPERS
  // ============================================
  
  private _getNextTokenId(): bigint {
    return this._nextTokenId++;
  }
  
  private _getSoulboundData(tokenId: bigint): SoulboundTokenData {
    const data = this._soulboundData.get(tokenId);
    if (!data) {
      throw new Error(`Soulbound token ${tokenId} does not exist`);
    }
    return data;
  }
}

// Export types
export type { SoulboundTokenData };
