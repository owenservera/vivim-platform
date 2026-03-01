/**
 * Token Factory
 * 
 * Central factory for creating and managing different token types
 * Provides a unified interface for token operations
 */

import { StorageToken, type StorageTokenConfig } from './standards/storage-token.js';
import { AccessToken, type AccessTokenConfig } from './standards/access-token.js';
import { SoulboundToken, type SoulboundTokenConfig } from './standards/soulbound-token.js';
import type {
  TokenType,
  TokenStandard,
  CreateTokenParams,
  MintTokenParams,
  MintStorageTokenParams,
  MintAccessTokenParams,
} from './types.js';

/**
 * Token Factory configuration
 */
export interface TokenFactoryConfig {
  /** Platform wallet for fee collection */
  platformWallet: string;
  /** Platform fee percentage */
  platformFeePercent: number;
  /** Default expiration for access tokens (seconds) */
  defaultAccessTokenExpiration: number;
  /** Minimum/maximum replication factors for storage */
  storageReplicationFactors?: {
    min: number;
    max: number;
  };
}

/**
 * Token Factory
 * 
 * Unified factory for creating and managing all token types:
 * - StorageToken: For stored data assets
 * - AccessToken: For time/usage limited access
 * - SoulboundToken: For identity/reputation
 */
export class TokenFactory {
  private readonly config: TokenFactoryConfig;
  
  // Token instances by type
  private _storageToken?: StorageToken;
  private _accessToken?: AccessToken;
  private _soulboundToken?: SoulboundToken;
  
  // Token address registry
  private _tokenAddresses: Map<TokenType, string> = new Map();
  
  constructor(config: TokenFactoryConfig) {
    this.config = config;
  }
  
  // ============================================
  // INITIALIZATION
  // ============================================
  
  /**
   * Initialize all token contracts
   */
  async initialize(): Promise<void> {
    // Initialize StorageToken
    this._storageToken = new StorageToken({
      name: 'VIVIM Storage Token',
      symbol: 'VSTOR',
      decimals: 0,
      platformWallet: this.config.platformWallet,
      platformFeePercent: this.config.platformFeePercent,
      minReplicationFactor: this.config.storageReplicationFactors?.min ?? 1,
      maxReplicationFactor: this.config.storageReplicationFactors?.max ?? 10,
    });
    
    // Initialize AccessToken
    this._accessToken = new AccessToken({
      name: 'VIVIM Access Token',
      symbol: 'VACC',
      platformWallet: this.config.platformWallet,
      platformFeePercent: this.config.platformFeePercent,
      maxRoyaltyPercent: 10,
      defaultExpirationSeconds: this.config.defaultAccessTokenExpiration,
    });
    
    // Initialize SoulboundToken
    this._soulboundToken = new SoulboundToken({
      name: 'VIVIM Identity Token',
      symbol: 'VID',
      maxSupply: undefined, // No limit
      revocable: true,
    });
  }
  
  /**
   * Get storage token instance
   */
  get storageToken(): StorageToken {
    if (!this._storageToken) {
      throw new Error('TokenFactory not initialized. Call initialize() first.');
    }
    return this._storageToken;
  }
  
  /**
   * Get access token instance
   */
  get accessToken(): AccessToken {
    if (!this._accessToken) {
      throw new Error('TokenFactory not initialized. Call initialize() first.');
    }
    return this._accessToken;
  }
  
  /**
   * Get soulbound token instance
   */
  get soulboundToken(): SoulboundToken {
    if (!this._soulboundToken) {
      throw new Error('TokenFactory not initialized. Call initialize() first.');
    }
    return this._soulboundToken;
  }
  
  // ============================================
  // STORAGE TOKEN OPERATIONS
  // ============================================
  
  /**
   * Mint a new storage token
   * 
   * Creates a token representing stored data
   */
  async mintStorageToken(params: MintStorageTokenParams): Promise<bigint> {
    return this.storageToken.mint(params);
  }
  
  /**
   * Renew storage token
   */
  async renewStorageToken(tokenId: bigint, durationSeconds: number): Promise<void> {
    return this.storageToken.renew(tokenId, durationSeconds);
  }
  
  /**
   * Stake storage tokens
   */
  async stakeStorageToken(tokenId: bigint, amount: bigint): Promise<void> {
    return this.storageToken.stake(tokenId, amount);
  }
  
  /**
   * Slash storage provider
   */
  async slashStorageToken(tokenId: bigint, reason: string): Promise<void> {
    return this.storageToken.slash(tokenId, reason);
  }
  
  /**
   * Verify storage
   */
  async verifyStorageToken(tokenId: bigint): Promise<boolean> {
    return this.storageToken.verify(tokenId);
  }
  
  /**
   * Burn storage token
   */
  async burnStorageToken(tokenId: bigint): Promise<void> {
    return this.storageToken.burn(tokenId);
  }
  
  // ============================================
  // ACCESS TOKEN OPERATIONS
  // ============================================
  
  /**
   * Mint a new access token
   */
  async mintAccessToken(params: MintAccessTokenParams): Promise<bigint> {
    return this.accessToken.mint(params);
  }
  
  /**
   * Use access token
   */
  async useAccessToken(tokenId: bigint, user: string): Promise<boolean> {
    return this.accessToken.use(tokenId, user);
  }
  
  /**
   * Verify access token
   */
  async verifyAccessToken(tokenId: bigint, user: string): Promise<boolean> {
    return this.accessToken.verifyAccess(tokenId, user);
  }
  
  /**
   * Renew access token
   */
  async renewAccessToken(tokenId: bigint, additionalSeconds: number): Promise<void> {
    return this.accessToken.renew(tokenId, additionalSeconds);
  }
  
  /**
   * Revoke access token
   */
  async revokeAccessToken(tokenId: bigint): Promise<void> {
    return this.accessToken.revoke(tokenId);
  }
  
  /**
   * Delegate access token
   */
  async delegateAccessToken(
    tokenId: bigint,
    to: string,
    permissions: string[]
  ): Promise<void> {
    return this.accessToken.delegate(tokenId, to, permissions);
  }
  
  // ============================================
  // SOULBOUND TOKEN OPERATIONS
  // ============================================
  
  /**
   * Issue a soulbound token (identity/reputation)
   */
  async issueSoulboundToken(
    recipient: string,
    tokenSubtype: 'reputation' | 'credential' | 'achievement' | 'kyc' | 'trust',
    metadata: Parameters<typeof this.soulboundToken.issue>[2],
    options?: Parameters<typeof this.soulboundToken.issue>[3]
  ): Promise<bigint> {
    return this.soulboundToken.issue(recipient, tokenSubtype, metadata, options);
  }
  
  /**
   * Revoke a soulbound token
   */
  async revokeSoulboundToken(tokenId: bigint, reason?: string): Promise<void> {
    return this.soulboundToken.revoke(tokenId, reason);
  }
  
  /**
   * Check if account has soulbound tokens
   */
  hasSoulboundTokens(account: string): boolean {
    return this.soulboundToken.locked(account);
  }
  
  /**
   * Get soulbound token balance
   */
  getSoulboundBalance(account: string): number {
    return this.soulboundToken.soulboundBalanceOf(account);
  }
  
  /**
   * Get all soulbound tokens of an account
   */
  getSoulboundTokensOf(account: string): bigint[] {
    return this.soulboundToken.getTokensOf(account);
  }
  
  // ============================================
  // GENERIC TOKEN OPERATIONS
  // ============================================
  
  /**
   * Get token instance by type
   */
  getToken(type: TokenType): StorageToken | AccessToken | SoulboundToken {
    switch (type) {
      case 'storage':
        return this.storageToken;
      case 'access':
        return this.accessToken;
      case 'identity':
      case 'reputation':
        return this.soulboundToken;
      default:
        throw new Error(`Unknown token type: ${type}`);
    }
  }
  
  /**
   * Get token address by type
   */
  getTokenAddress(type: TokenType): string | undefined {
    return this._tokenAddresses.get(type);
  }
  
  /**
   * Set token address
   */
  setTokenAddress(type: TokenType, address: string): void {
    this._tokenAddresses.set(type, address);
  }
  
  /**
   * Get all token balances for an account
   */
  async getAllBalances(account: string): Promise<{
    storage: bigint;
    access: bigint;
    identity: number;
  }> {
    return {
      // Storage tokens (NFT - balance is 0 or 1)
      storage: await this.storageToken.balanceOf(account, 1n),
      // Access tokens
      access: await this.accessToken.balanceOf(account, 1n),
      // Identity tokens (non-NFT - count)
      identity: this.soulboundToken.soulboundBalanceOf(account),
    };
  }
  
  // ============================================
  // EVENTS
  // ============================================
  
  /**
   * Subscribe to storage token events
   */
  onStorageEvent<K extends string>(
    event: K,
    listener: (data: unknown) => void
  ): () => void {
    return this.storageToken.on(event as any, listener as any);
  }
  
  /**
   * Subscribe to access token events
   */
  onAccessEvent<K extends string>(
    event: K,
    listener: (data: unknown) => void
  ): () => void {
    return this.accessToken.on(event as any, listener as any);
  }
  
  /**
   * Subscribe to soulbound token events
   */
  onSoulboundEvent<K extends string>(
    event: K,
    listener: (data: unknown) => void
  ): () => void {
    return this.soulboundToken.on(event as any, listener as any);
  }
}
