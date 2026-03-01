/**
 * Token Wallet
 * 
 * User wallet for managing token balances and transactions
 * Integrates with the SDK's identity system
 */

import type {
  TokenType,
  TokenBalance,
  TokenAllowance,
  MintTokenParams,
  BurnTokenParams,
} from './types.js';
import { TokenFactory } from './factory/token-factory.js';

/**
 * Token Wallet Configuration
 */
export interface TokenWalletConfig {
  /** The DID/address of the wallet owner */
  owner: string;
  /** Token factory instance */
  tokenFactory: TokenFactory;
}

/**
 * Token Wallet
 * 
 * Manages a user's token balances across all token types:
 * - Storage tokens (NFT-like)
 * - Access tokens (usage-based)
 * - Identity tokens (soulbound)
 * - Reputation tokens (soulbound)
 */
export class TokenWallet {
  private readonly config: TokenWalletConfig;
  
  // Cached balances
  private _balanceCache: Map<string, bigint> = new Map();
  private _cacheExpiry: number = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds
  
  constructor(config: TokenWalletConfig) {
    this.config = config;
  }
  
  // ============================================
  // BALANCE QUERIES
  // ============================================
  
  /**
   * Get balance for a specific token
   */
  async balanceOf(tokenId: bigint, tokenType: TokenType): Promise<bigint> {
    const cacheKey = `${tokenType}-${tokenId}`;
    
    // Check cache
    if (Date.now() < this._cacheExpiry) {
      const cached = this._balanceCache.get(cacheKey);
      if (cached !== undefined) return cached;
    }
    
    // Get from token contract
    const token = this.config.tokenFactory.getToken(tokenType);
    const balance = await token.balanceOf(this.config.owner, tokenId);
    
    // Update cache
    this._balanceCache.set(cacheKey, balance);
    this._cacheExpiry = Date.now() + this.CACHE_TTL;
    
    return balance;
  }
  
  /**
   * Get all token balances for this wallet
   */
  async getAllBalances(): Promise<{
    storage: TokenBalance[];
    access: TokenBalance[];
    identity: TokenBalance[];
  }> {
    const [storage, access] = await Promise.all([
      this._getTokenBalances('storage'),
      this._getTokenBalances('access'),
    ]);
    
    // Identity tokens are non-transferable, get differently
    const identityTokens = this.config.tokenFactory.getSoulboundTokensOf(this.config.owner);
    const identity: TokenBalance[] = identityTokens.map(tokenId => ({
      owner: this.config.owner,
      tokenId,
      balance: 1n,
      balanceNumeric: 1,
      lastUpdated: Date.now(),
      locked: 0n,
      available: 1n,
    }));
    
    return { storage, access, identity };
  }
  
  /**
   * Get total value in storage tokens
   */
  async getStorageValue(): Promise<bigint> {
    const storageToken = this.config.tokenFactory.storageToken;
    
    // Get all tokens (simplified - would need pagination in production)
    let totalValue = 0n;
    const totalSupply = storageToken.totalSupply(1n);
    
    if (totalSupply > 0n) {
      const balance = await storageToken.balanceOf(this.config.owner, 1n);
      if (balance > 0n) {
        const tokenData = storageToken.getStorageToken(1n);
        if (tokenData) {
          totalValue = BigInt(tokenData.sizeBytes) * balance;
        }
      }
    }
    
    return totalValue;
  }
  
  // ============================================
  // ALLOWANCE QUERIES
  // ============================================
  
  /**
   * Get allowance for a spender
   */
  async allowanceOf(
    tokenId: bigint,
    spender: string,
    tokenType: TokenType
  ): Promise<bigint> {
    const token = this.config.tokenFactory.getToken(tokenType);
    return token.allowance(this.config.owner, spender, tokenId);
  }
  
  /**
   * Get all allowances
   */
  async getAllowances(tokenType: TokenType): Promise<TokenAllowance[]> {
    // Simplified - in production would query more comprehensively
    return [];
  }
  
  // ============================================
  // TRANSACTIONS
  // ============================================
  
  /**
   * Transfer tokens
   */
  async transfer(
    tokenId: bigint,
    to: string,
    amount: bigint,
    tokenType: TokenType
  ): Promise<void> {
    const token = this.config.tokenFactory.getToken(tokenType);
    await token.transfer(this.config.owner, to, tokenId, amount);
    this._invalidateCache();
  }
  
  /**
   * Approve a spender
   */
  async approve(
    tokenId: bigint,
    spender: string,
    amount: bigint,
    tokenType: TokenType
  ): Promise<void> {
    const token = this.config.tokenFactory.getToken(tokenType);
    await token.approve(spender, tokenId, amount);
  }
  
  /**
   * Set approval for all (operator)
   */
  async setApprovalForAll(
    operator: string,
    approved: boolean,
    tokenType: TokenType
  ): Promise<void> {
    const token = this.config.tokenFactory.getToken(tokenType);
    await token.setApprovalForAll(operator, approved);
  }
  
  // ============================================
  // STORAGE TOKEN OPERATIONS
  // ============================================
  
  /**
   * Mint storage token
   */
  async mintStorageToken(params: {
    contentCid: string;
    sizeBytes: number;
    replicationFactor: number;
    durability: number;
    monetizationTerms?: {
      isMonetizable: boolean;
      pricePerByte?: bigint;
    };
  }): Promise<bigint> {
    const tokenId = await this.config.tokenFactory.mintStorageToken({
      ...params,
      owner: this.config.owner,
    });
    
    this._invalidateCache();
    return tokenId;
  }
  
  /**
   * Stake storage token
   */
  async stakeStorage(tokenId: bigint, amount: bigint): Promise<void> {
    await this.config.tokenFactory.stakeStorageToken(tokenId, amount);
    this._invalidateCache();
  }
  
  /**
   * Renew storage
   */
  async renewStorage(tokenId: bigint, durationSeconds: number): Promise<void> {
    await this.config.tokenFactory.renewStorageToken(tokenId, durationSeconds);
  }
  
  // ============================================
  // ACCESS TOKEN OPERATIONS
  // ============================================
  
  /**
   * Mint access token
   */
  async mintAccessToken(params: {
    contentId: string;
    tokenType: 'one-time' | 'subscription' | 'tiered' | 'pay-per-use' | 'lifetime';
    expiresAt?: number;
    maxUses?: number;
    price?: bigint;
    isTransferable: boolean;
    royaltyPercent: number;
    permissions: string[];
    scope: string;
  }): Promise<bigint> {
    const tokenId = await this.config.tokenFactory.mintAccessToken({
      ...params,
      owner: this.config.owner,
    });
    
    this._invalidateCache();
    return tokenId;
  }
  
  /**
   * Use access token
   */
  async useAccessToken(tokenId: bigint): Promise<boolean> {
    const result = await this.config.tokenFactory.useAccessToken(
      tokenId,
      this.config.owner
    );
    
    this._invalidateCache();
    return result;
  }
  
  /**
   * Verify access
   */
  async verifyAccess(tokenId: bigint): Promise<boolean> {
    return this.config.tokenFactory.verifyAccessToken(tokenId, this.config.owner);
  }
  
  /**
   * Delegate access token
   */
  async delegateAccess(
    tokenId: bigint,
    to: string,
    permissions: string[]
  ): Promise<void> {
    await this.config.tokenFactory.delegateAccessToken(tokenId, to, permissions);
  }
  
  // ============================================
  // IDENTITY/REPUTATION OPERATIONS
  // ============================================
  
  /**
   * Get identity tokens
   */
  getIdentityTokens(): bigint[] {
    return this.config.tokenFactory.getSoulboundTokensOf(this.config.owner);
  }
  
  /**
   * Check if has identity tokens
   */
  hasIdentity(): boolean {
    return this.config.tokenFactory.hasSoulboundTokens(this.config.owner);
  }
  
  // ============================================
  // UTILITY
  // ============================================
  
  /**
   * Invalidate balance cache
   */
  private _invalidateCache(): void {
    this._balanceCache.clear();
    this._cacheExpiry = 0;
  }
  
  /**
   * Get owner address
   */
  get owner(): string {
    return this.config.owner;
  }
  
  /**
   * Get token factory
   */
  get tokenFactory(): TokenFactory {
    return this.config.tokenFactory;
  }
}
