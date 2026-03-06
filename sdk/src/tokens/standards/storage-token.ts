/**
 * Storage Token Implementation
 * 
 * ERC-1155 based token representing stored data assets
 * Supports storage providers, staking, and slashing
 */

import { ERC1155 } from './erc1155.js';
import type {
  MintStorageTokenParams,
  MonetizationTerms,
  RevenueShare,
  TokenMetadata,
  TokenEventMap,
} from '../types.js';

/**
 * Storage Token configuration
 */
export interface StorageTokenConfig {
  /** Base name for the token */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Decimals (usually 0 for NFTs, 18 for fungible) */
  decimals?: number;
  /** Platform wallet address for fees */
  platformWallet: string;
  /** Platform fee percentage (0-100) */
  platformFeePercent: number;
  /** Minimum replication factor */
  minReplicationFactor: number;
  /** Maximum replication factor */
  maxReplicationFactor: number;
}

/**
 * Extended storage token data
 */
interface StorageTokenData {
  // Storage properties
  contentCid: string;
  sizeBytes: number;
  replicationFactor: number;
  durability: number;
  redundancyLevel: 'basic' | 'standard' | 'enhanced';
  
  // Provider info
  storageProvider: string;
  expirationDate?: number;
  renewalCost: bigint;
  
  // State
  isPinned: boolean;
  isBackedUp: boolean;
  lastVerification: number;
  
  // Monetization
  monetization?: MonetizationTerms;
  isStaked: boolean;
  stakeAmount?: bigint;
}

/**
 * Storage Token
 * 
 * Represents stored data assets that can be:
 * - Minted when data is stored
 * - Transferred between owners
 * - Staked as collateral by providers
 * - Slashed for data loss
 * - Burned when data is deleted
 */
export class StorageToken extends ERC1155 {
  // Configuration
  private readonly config: StorageTokenConfig;
  
  // Extended token data storage
  private readonly _tokenData: Map<bigint, StorageTokenData> = new Map();
  
  // Stake tracking
  private readonly _stakes: Map<string, bigint> = new Map();
  
  // Default renewal cost per byte per second (in wei)
  private readonly DEFAULT_RENEWAL_COST_PER_BYTE_SEC = 1n;
  
  // Slash percentage for data loss
  private readonly SLASH_PERCENT = 10;
  
  constructor(config: StorageTokenConfig) {
    super(config.name, config.symbol, config.decimals ?? 0, 'storage');
    this.config = config;
  }
  
  // ============================================
  // STORAGE TOKEN SPECIFIC METHODS
  // ============================================
  
  /**
   * Mint a new storage token
   * 
   * Called when data is stored to create a token representing that asset
   */
  async mint(params: MintStorageTokenParams): Promise<bigint> {
    // Validate replication factor
    if (params.replicationFactor < this.config.minReplicationFactor) {
      throw new Error(
        `Replication factor must be at least ${this.config.minReplicationFactor}`
      );
    }
    
    if (params.replicationFactor > this.config.maxReplicationFactor) {
      throw new Error(
        `Replication factor cannot exceed ${this.config.maxReplicationFactor}`
      );
    }
    
    // Validate durability
    if (params.durability < 0 || params.durability > 100) {
      throw new Error('Durability must be between 0 and 100');
    }
    
    // Generate token ID
    const tokenId = this._getNextTokenId();
    
    // Calculate initial renewal cost (1 year)
    const renewalCost = this._calculateRenewalCost(params.sizeBytes, 365 * 24 * 60 * 60);
    
    // Set expiration date (default 1 year from now)
    const expirationDate = Date.now() + (365 * 24 * 60 * 60 * 1000);
    
    // Store extended data
    const tokenData: StorageTokenData = {
      contentCid: params.contentCid,
      sizeBytes: params.sizeBytes,
      replicationFactor: params.replicationFactor,
      durability: params.durability,
      redundancyLevel: this._getRedundancyLevel(params.replicationFactor),
      storageProvider: params.owner, // Initially the owner is the provider
      expirationDate,
      renewalCost,
      isPinned: false,
      isBackedUp: false,
      lastVerification: Date.now(),
      monetization: params.monetizationTerms,
      isStaked: false,
    };
    
    this._tokenData.set(tokenId, tokenData);
    
    // Set token metadata
    const metadata: TokenMetadata = {
      name: `Storage Token: ${params.contentCid.slice(0, 8)}...`,
      symbol: 'STOR',
      description: `Storage token for content ${params.contentCid}`,
      decimals: 0,
      image: undefined,
      attributes: [
        { trait_type: 'Size (bytes)', value: params.sizeBytes },
        { trait_type: 'Replication', value: params.replicationFactor },
        { trait_type: 'Durability (%)', value: params.durability },
        { trait_type: 'Redundancy', value: tokenData.redundancyLevel },
      ],
      properties: {
        contentCid: params.contentCid,
        sizeBytes: params.sizeBytes,
      },
    };
    
    this.setTokenMetadata(tokenId, metadata);
    
    // Mint the token
    await this._mint(params.owner, tokenId, 1n, {
      contentCid: params.contentCid,
    });
    
    return tokenId;
  }
  
  /**
   * Renew storage - extend expiration date
   */
  async renew(tokenId: bigint, durationSeconds: number): Promise<void> {
    const tokenData = this._getTokenData(tokenId);
    
    // Calculate renewal cost
    const cost = this._calculateRenewalCost(tokenData.sizeBytes, durationSeconds);
    
    // In a real implementation, this would process payment
    // For now, we just extend the expiration
    tokenData.expirationDate = (tokenData.expirationDate ?? Date.now()) + (durationSeconds * 1000);
    tokenData.renewalCost = this._calculateRenewalCost(
      tokenData.sizeBytes,
      365 * 24 * 60 * 60
    );
    
    this._emit('token:transferred', {
      tokenId,
      from: 'system',
      to: 'system',
      amount: 0n,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Transfer storage token (with permission check)
   */
  async transfer(
    from: string,
    to: string,
    tokenId: bigint,
    amount: bigint = 1n
  ): Promise<void> {
    // Check that storage token can be transferred
    const tokenData = this._getTokenData(tokenId);
    
    if (tokenData.monetization?.isMonetizable === false) {
      throw new Error('This storage token is not transferable');
    }
    
    await super.transfer(from, to, tokenId, amount);
    
    // Update storage provider if this is the full transfer
    if (amount === 1n) {
      const data = this._tokenData.get(tokenId);
      if (data) {
        data.storageProvider = to.toLowerCase();
      }
    }
  }
  
  /**
   * Stake storage tokens as collateral
   * 
   * Storage providers stake tokens to demonstrate commitment
   */
  async stake(tokenId: bigint, amount: bigint): Promise<void> {
    const tokenData = this._getTokenData(tokenId);
    
    // Check ownership
    const ownerBalance = this.balanceOf('owner', tokenId); // Would be msg.sender
    if (ownerBalance < amount) {
      throw new Error('Insufficient balance to stake');
    }
    
    // Lock tokens as stake
    const currentStake = this._stakes.get('owner') ?? 0n; // Would be msg.sender
    this._stakes.set('owner', currentStake + amount);
    
    // Mark token as staked
    tokenData.isStaked = true;
    tokenData.stakeAmount = (tokenData.stakeAmount ?? 0n) + amount;
    
    this._emit('token:transferred', {
      tokenId,
      from: 'staking',
      to: 'staking',
      amount,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Slash - penalize provider for data loss or downtime
   */
  async slash(tokenId: bigint, reason: string): Promise<void> {
    const tokenData = this._getTokenData(tokenId);
    
    if (!tokenData.isStaked || !tokenData.stakeAmount) {
      throw new Error('Cannot slash: token is not staked');
    }
    
    // Calculate slash amount
    const slashAmount = (tokenData.stakeAmount * BigInt(this.SLASH_PERCENT)) / 100n;
    
    // Reduce stake
    tokenData.stakeAmount -= slashAmount;
    
    if (tokenData.stakeAmount === 0n) {
      tokenData.isStaked = false;
    }
    
    // Emit slash event
    this._emit('token:slashed', {
      tokenId,
      account: tokenData.storageProvider,
      amount: slashAmount,
      reason,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Verify storage - check that data is still available
   */
  async verify(tokenId: bigint): Promise<boolean> {
    const tokenData = this._getTokenData(tokenId);
    
    // In a real implementation, this would:
    // 1. Check if content is still retrievable via contentCid
    // 2. Check provider uptime
    // 3. Verify data integrity
    
    // For now, just update verification timestamp
    tokenData.lastVerification = Date.now();
    
    return true;
  }
  
  /**
   * Burn storage token - delete the associated data
   */
  async burn(tokenId: bigint): Promise<void> {
    const tokenData = this._getTokenData(tokenId);
    
    // Check if staked - cannot burn staked tokens
    if (tokenData.isStaked) {
      throw new Error('Cannot burn staked tokens. Unstake first.');
    }
    
    // Burn the token
    await this._burn('owner', tokenId, 1n); // Would be msg.sender
    
    // Remove extended data
    this._tokenData.delete(tokenId);
  }
  
  /**
   * Get storage token details
   */
  getStorageToken(tokenId: bigint): StorageTokenData | undefined {
    return this._tokenData.get(tokenId);
  }
  
  /**
   * Get storage token by content CID
   */
  getTokenByContentCid(contentCid: string): bigint | undefined {
    for (const [tokenId, data] of this._tokenData) {
      if (data.contentCid === contentCid) {
        return tokenId;
      }
    }
    return undefined;
  }
  
  /**
   * Get total storage capacity from all tokens
   */
  getTotalStorageCapacity(): bigint {
    let total = 0n;
    for (const data of this._tokenData.values()) {
      total += BigInt(data.sizeBytes);
    }
    return total;
  }
  
  /**
   * Calculate dynamic price based on demand
   */
  async calculateDynamicPrice(
    contentCid: string,
    durationSeconds: number
  ): Promise<bigint> {
    const tokenId = this.getTokenByContentCid(contentCid);
    if (!tokenId) {
      throw new Error('Content not found');
    }
    
    const tokenData = this._tokenData.get(tokenId);
    if (!tokenData) {
      throw new Error('Token data not found');
    }
    
    // Base price
    const basePrice = this._calculateRenewalCost(tokenData.sizeBytes, durationSeconds);
    
    // Demand factor (simplified - in production would be more complex)
    const demandFactor = await this._getDemandFactor(contentCid);
    
    // Scarcity factor based on replication
    const scarcityFactor = 1 + (10 - tokenData.replicationFactor) / 10;
    
    return basePrice * BigInt(Math.floor(demandFactor * scarcityFactor * 100)) / 100n;
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
  private _getTokenData(tokenId: bigint): StorageTokenData {
    const data = this._tokenData.get(tokenId);
    if (!data) {
      throw new Error(`Token ${tokenId} does not exist`);
    }
    return data;
  }
  
  /**
   * Calculate renewal cost
   */
  private _calculateRenewalCost(sizeBytes: number, durationSeconds: number): bigint {
    return (
      BigInt(sizeBytes) *
      BigInt(durationSeconds) *
      this.DEFAULT_RENEWAL_COST_PER_BYTE_SEC
    );
  }
  
  /**
   * Get redundancy level based on replication factor
   */
  private _getRedundancyLevel(replicationFactor: number): 'basic' | 'standard' | 'enhanced' {
    if (replicationFactor <= 2) return 'basic';
    if (replicationFactor <= 5) return 'standard';
    return 'enhanced';
  }
  
  /**
   * Get demand factor (simplified)
   */
  private async _getDemandFactor(contentCid: string): Promise<number> {
    // In production, this would query actual demand metrics
    // For now, return a default value
    return 1.0;
  }
}

// Export types
export type { StorageTokenData };
