/**
 * Access Token Implementation
 * 
 * ERC-1155 based token representing time-limited or usage-limited access rights
 * Supports subscriptions, pay-per-use, and tiered access
 */

import { ERC1155 } from './erc1155.js';
import type {
  AccessToken,
  MintAccessTokenParams,
  AccessTokenType,
  AccessTokenStatus,
  TokenMetadata,
  TokenEventMap,
} from '../types.js';

/**
 * Access Token configuration
 */
export interface AccessTokenConfig {
  /** Base name for the token */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Platform wallet address */
  platformWallet: string;
  /** Platform fee percentage for transfers */
  platformFeePercent: number;
  /** Maximum royalty percentage */
  maxRoyaltyPercent: number;
  /** Default expiration time for tokens without explicit expiration (seconds) */
  defaultExpirationSeconds: number;
}

/**
 * Extended access token data
 */
interface AccessTokenData {
  // Content reference
  contentId: string;
  
  // Token type
  tokenType: AccessTokenType;
  
  // Temporal constraints
  expiresAt?: number;
  maxUses?: number;
  usesRemaining: number;
  
  // Permission scope
  permissions: string[];
  scope: string;
  
  // Economic properties
  pricePerUse?: bigint;
  isTransferable: boolean;
  royaltyPercent: number;
  originalCreator: string;
  
  // State
  status: AccessTokenStatus;
}

/**
 * Access Token
 * 
 * Represents access rights to content that can be:
 * - One-time use (single access)
 * - Subscription (recurring access)
 * - Tiered (multiple access levels)
 * - Pay-per-use (metered)
 * - Lifetime (unlimited access)
 */
export class AccessToken extends ERC1155 {
  // Configuration
  private readonly config: AccessTokenConfig;
  
  // Extended token data storage
  private readonly _tokenData: Map<bigint, AccessTokenData> = new Map();
  
  // Content registry: contentId -> owner
  private readonly _contentOwners: Map<string, string> = new Map();
  
  // Access log: tokenId -> usage history
  private readonly _accessLog: Map<bigint, { user: string; timestamp: number }[]> = new Map();
  
  constructor(config: AccessTokenConfig) {
    super(config.name, config.symbol, 0, 'access');
    this.config = config;
  }
  
  // ============================================
  // ACCESS TOKEN SPECIFIC METHODS
  // ============================================
  
  /**
   * Mint a new access token
   */
  async mint(params: MintAccessTokenParams): Promise<bigint> {
    // Validate royalty
    if (params.royaltyPercent > this.config.maxRoyaltyPercent) {
      throw new Error(
        `Royalty cannot exceed ${this.config.maxRoyaltyPercent}%`
      );
    }
    
    // Check if content exists and caller has permission to grant access
    const contentOwner = this._contentOwners.get(params.contentId);
    if (!contentOwner) {
      // Content not registered - allow minting but warn
      console.warn(`Content ${params.contentId} not registered. Registering...`);
      this._contentOwners.set(params.contentId, params.owner);
    }
    
    // Calculate expiration
    const expiresAt = params.expiresAt ?? (
      Date.now() + this.config.defaultExpirationSeconds * 1000
    );
    
    // Determine uses remaining
    const usesRemaining = params.maxUses ?? Infinity;
    
    // Generate token ID
    const tokenId = this._getNextTokenId();
    
    // Store extended data
    const tokenData: AccessTokenData = {
      contentId: params.contentId,
      tokenType: params.tokenType,
      expiresAt,
      maxUses: params.maxUses,
      usesRemaining: typeof usesRemaining === 'number' ? usesRemaining : Number.MAX_SAFE_INTEGER,
      permissions: params.permissions,
      scope: params.scope,
      pricePerUse: params.price,
      isTransferable: params.isTransferable,
      royaltyPercent: params.royaltyPercent,
      originalCreator: params.owner,
      status: 'active',
    };
    
    this._tokenData.set(tokenId, tokenData);
    
    // Set token metadata
    const metadata: TokenMetadata = {
      name: `Access: ${params.contentId.slice(0, 8)}...`,
      symbol: 'ACCESS',
      description: `Access token for ${params.tokenType} access to ${params.contentId}`,
      decimals: 0,
      attributes: [
        { trait_type: 'Type', value: params.tokenType },
        { trait_type: 'Max Uses', value: params.maxUses ?? 'Unlimited' },
        { trait_type: 'Transferable', value: params.isTransferable ? 'Yes' : 'No' },
        ...(params.tierLevel ? [{ trait_type: 'Tier Level', value: params.tierLevel }] : []),
      ],
      properties: {
        contentId: params.contentId,
        tokenType: params.tokenType,
        permissions: params.permissions,
      },
    };
    
    this.setTokenMetadata(tokenId, metadata);
    
    // Mint the token
    await this._mint(params.owner, tokenId, 1n, {
      contentId: params.contentId,
      tokenType: params.tokenType,
    });
    
    return tokenId;
  }
  
  /**
   * Use access token - consume one use
   */
  async use(tokenId: bigint, user: string): Promise<boolean> {
    const tokenData = this._getTokenData(tokenId);
    
    // Check expiration
    if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
      tokenData.status = 'expired';
      this._emit('token:transferred', {
        tokenId,
        from: user,
        to: 'expired',
        amount: 1n,
        timestamp: Date.now(),
      });
      return false;
    }
    
    // Check uses remaining
    if (tokenData.usesRemaining <= 0) {
      tokenData.status = 'used';
      this._emit('token:transferred', {
        tokenId,
        from: user,
        to: 'used',
        amount: 1n,
        timestamp: Date.now(),
      });
      return false;
    }
    
    // Log access
    this._logAccess(tokenId, user);
    
    // Decrement uses
    if (tokenData.usesRemaining !== Number.MAX_SAFE_INTEGER) {
      tokenData.usesRemaining--;
    }
    
    // Update status if exhausted
    if (tokenData.usesRemaining <= 0) {
      tokenData.status = 'used';
    }
    
    this._emit('token:transferred', {
      tokenId,
      from: user,
      to: 'access',
      amount: 1n,
      timestamp: Date.now(),
    });
    
    return true;
  }
  
  /**
   * Verify if token grants access to content
   */
  async verifyAccess(tokenId: bigint, user: string): Promise<boolean> {
    try {
      const tokenData = this._getTokenData(tokenId);
      
      // Check status
      if (tokenData.status !== 'active') {
        return false;
      }
      
      // Check expiration
      if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
        return false;
      }
      
      // Check uses remaining
      if (tokenData.usesRemaining <= 0) {
        return false;
      }
      
      // Check if user is owner or has been granted access
      const owner = 'owner'; // Would be msg.sender
      if (owner.toLowerCase() === user.toLowerCase()) {
        return true;
      }
      
      // Check if user has used this token before
      const log = this._accessLog.get(tokenId);
      if (log) {
        return log.some(entry => entry.user.toLowerCase() === user.toLowerCase());
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Transfer access token (with royalty)
   */
  async transfer(
    from: string,
    to: string,
    tokenId: bigint,
    amount: bigint = 1n
  ): Promise<void> {
    const tokenData = this._getTokenData(tokenId);
    
    if (!tokenData.isTransferable) {
      throw new Error('This access token is non-transferable');
    }
    
    // Calculate royalty
    if (tokenData.pricePerUse && tokenData.royaltyPercent > 0) {
      const royalty = (tokenData.pricePerUse * BigInt(tokenData.royaltyPercent)) / 100n;
      
      // In production, this would process royalty payment
      // For now, just log it
      console.log(`Royalty of ${royalty} would be paid to ${tokenData.originalCreator}`);
    }
    
    await super.transfer(from, to, tokenId, amount);
  }
  
  /**
   * Renew access token - extend expiration
   */
  async renew(tokenId: bigint, additionalSeconds: number): Promise<void> {
    const tokenData = this._getTokenData(tokenId);
    
    // Calculate new expiration
    const currentExpiration = tokenData.expiresAt ?? Date.now();
    tokenData.expiresAt = currentExpiration + (additionalSeconds * 1000);
    
    // Reset status if it was expired
    if (tokenData.status === 'expired') {
      tokenData.status = 'active';
    }
    
    // If maxUses was exhausted, optionally reset
    // (this is a design choice - some implementations may not allow this)
  }
  
  /**
   * Revoke access token
   */
  async revoke(tokenId: bigint): Promise<void> {
    const tokenData = this._getTokenData(tokenId);
    
    // Only the creator can revoke
    const caller = 'owner'; // Would be msg.sender
    if (caller.toLowerCase() !== tokenData.originalCreator.toLowerCase()) {
      throw new Error('Only the creator can revoke this token');
    }
    
    tokenData.status = 'revoked';
    
    this._emit('token:transferred', {
      tokenId,
      from: 'active',
      to: 'revoked',
      amount: 1n,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Delegate access to another user
   */
  async delegate(
    tokenId: bigint,
    to: string,
    permissions: string[]
  ): Promise<void> {
    const tokenData = this._getTokenData(tokenId);
    
    // Check ownership
    const owner = 'owner'; // Would be msg.sender
    const ownerBalance = this.balanceOf(owner, tokenId);
    if (ownerBalance < 1n) {
      throw new Error('Not the token owner');
    }
    
    // In a real implementation, this would:
    // 1. Create a delegated token record
    // 2. Track delegation relationships
    // 3. Allow the delegate to use the token
    
    console.log(`Delegating token ${tokenId} to ${to} with permissions: ${permissions.join(', ')}`);
  }
  
  /**
   * Get access token details
   */
  getAccessToken(tokenId: bigint): AccessTokenData | undefined {
    return this._tokenData.get(tokenId);
  }
  
  /**
   * Get tokens for a specific content
   */
  getTokensForContent(contentId: string): bigint[] {
    const tokens: bigint[] = [];
    for (const [tokenId, data] of this._tokenData) {
      if (data.contentId === contentId) {
        tokens.push(tokenId);
      }
    }
    return tokens;
  }
  
  /**
   * Get access history for a token
   */
  getAccessHistory(tokenId: bigint): { user: string; timestamp: number }[] {
    return this._accessLog.get(tokenId) ?? [];
  }
  
  /**
   * Register content for access control
   */
  registerContent(contentId: string, owner: string): void {
    this._contentOwners.set(contentId, owner);
  }
  
  // ============================================
  // INTERNAL HELPERS
  // ============================================
  
  /**
   * Get next token ID
   */
  private _getNextTokenId(): bigint {
    return this._nextTokenId++;
  }
  
  /**
   * Get token data with validation
   */
  private _getTokenData(tokenId: bigint): AccessTokenData {
    const data = this._tokenData.get(tokenId);
    if (!data) {
      throw new Error(`Token ${tokenId} does not exist`);
    }
    return data;
  }
  
  /**
   * Log access event
   */
  private _logAccess(tokenId: bigint, user: string): void {
    let log = this._accessLog.get(tokenId);
    if (!log) {
      log = [];
      this._accessLog.set(tokenId, log);
    }
    
    log.push({
      user,
      timestamp: Date.now(),
    });
    
    // Keep only last 1000 entries per token
    if (log.length > 1000) {
      log.shift();
    }
  }
}

// Export types
export type { AccessTokenData };
