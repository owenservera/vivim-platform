/**
 * Token Registry
 * 
 * Registry for tracking all tokens and their metadata
 * Provides lookup and discovery functionality
 */

import type {
  TokenType,
  TokenStandard,
  TokenRegistryEntry,
  TokenListingStatus,
  TokenMetadata,
} from '../types.js';

/**
 * Token Registry Configuration
 */
export interface TokenRegistryConfig {
  /** Registry operator */
  operator: string;
  /** Verification required for listing */
  requireVerification: boolean;
  /** Minimum listing fee */
  listingFee?: bigint;
}

/**
 * Token Registry
 * 
 * Tracks all tokens in the ecosystem with metadata and listing status
 */
export class TokenRegistry {
  private readonly config: TokenRegistryConfig;
  
  // Token registry: tokenId -> entry
  private _registry: Map<bigint, TokenRegistryEntry> = new Map();
  
  // Content registry: contentId -> tokenId (for access tokens)
  private _contentRegistry: Map<string, bigint> = new Map();
  
  // CID registry: CID -> tokenId (for storage tokens)
  private _cidRegistry: Map<string, bigint> = new Map();
  
  // Owner registry: owner -> tokenIds
  private _ownerRegistry: Map<string, Set<bigint>> = new Map();
  
  // Type index: tokenType -> tokenIds
  private _typeIndex: Map<TokenType, Set<bigint>> = new Map();
  
  // Pending listings: tokenId -> entry
  private _pendingListings: Map<bigint, TokenRegistryEntry> = new Map();
  
  constructor(config: TokenRegistryConfig) {
    this.config = config;
  }
  
  // ============================================
  // REGISTRATION
  // ============================================
  
  /**
   * Register a new token
   */
  async register(params: {
    tokenId: bigint;
    tokenAddress: string;
    tokenType: TokenType;
    standard: TokenStandard;
    name: string;
    symbol: string;
    metadataUri: string;
    totalSupply: bigint;
    maxSupply?: bigint;
    owner: string;
  }): Promise<TokenRegistryEntry> {
    // Check if already registered
    if (this._registry.has(params.tokenId)) {
      throw new Error(`Token ${params.tokenId} is already registered`);
    }
    
    const entry: TokenRegistryEntry = {
      tokenId: params.tokenId,
      tokenAddress: params.tokenAddress,
      tokenType: params.tokenType,
      standard: params.standard,
      name: params.name,
      symbol: params.symbol,
      metadataUri: params.metadataUri,
      totalSupply: params.totalSupply,
      maxSupply: params.maxSupply,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isVerified: !this.config.requireVerification,
      isListed: !this.config.requireVerification,
      listingStatus: this.config.requireVerification ? 'pending' : 'active',
    };
    
    // Add to registry
    this._registry.set(params.tokenId, entry);
    
    // Update indexes
    this._updateIndexes(params.tokenId, entry, params.owner);
    
    // Handle pending verification
    if (this.config.requireVerification) {
      this._pendingListings.set(params.tokenId, entry);
    }
    
    return entry;
  }
  
  /**
   * Update token metadata
   */
  async updateMetadata(
    tokenId: bigint,
    metadata: Partial<TokenMetadata>
  ): Promise<void> {
    const entry = this._registry.get(tokenId);
    if (!entry) {
      throw new Error(`Token ${tokenId} not found in registry`);
    }
    
    // Update fields
    if (metadata.name) entry.name = metadata.name;
    if (metadata.symbol) entry.symbol = metadata.symbol;
    if (metadata.description) {
      entry.metadataUri = metadata.description; // Simplified
    }
    
    entry.updatedAt = Date.now();
  }
  
  /**
   * Update supply
   */
  async updateSupply(
    tokenId: bigint,
    totalSupply: bigint
  ): Promise<void> {
    const entry = this._registry.get(tokenId);
    if (!entry) {
      throw new Error(`Token ${tokenId} not found in registry`);
    }
    
    entry.totalSupply = totalSupply;
    entry.updatedAt = Date.now();
  }
  
  // ============================================
  // LOOKUP
  // ============================================
  
  /**
   * Get token by ID
   */
  get(tokenId: bigint): TokenRegistryEntry | undefined {
    return this._registry.get(tokenId);
  }
  
  /**
   * Get token by content ID (for access tokens)
   */
  getByContentId(contentId: string): TokenRegistryEntry | undefined {
    const tokenId = this._contentRegistry.get(contentId);
    if (!tokenId) return undefined;
    return this._registry.get(tokenId);
  }
  
  /**
   * Get token by content CID (for storage tokens)
   */
  getByCid(cid: string): TokenRegistryEntry | undefined {
    const tokenId = this._cidRegistry.get(cid);
    if (!tokenId) return undefined;
    return this._registry.get(tokenId);
  }
  
  /**
   * Get all tokens for an owner
   */
  getByOwner(owner: string): TokenRegistryEntry[] {
    const tokenIds = this._ownerRegistry.get(owner.toLowerCase());
    if (!tokenIds) return [];
    
    return Array.from(tokenIds)
      .map(id => this._registry.get(id))
      .filter((entry): entry is TokenRegistryEntry => entry !== undefined);
  }
  
  /**
   * Get all tokens of a type
   */
  getByType(tokenType: TokenType): TokenRegistryEntry[] {
    const tokenIds = this._typeIndex.get(tokenType);
    if (!tokenIds) return [];
    
    return Array.from(tokenIds)
      .map(id => this._registry.get(id))
      .filter((entry): entry is TokenRegistryEntry => entry !== undefined);
  }
  
  /**
   * Get all listed tokens
   */
  getListed(): TokenRegistryEntry[] {
    return Array.from(this._registry.values())
      .filter(entry => entry.isListed && entry.listingStatus === 'active');
  }
  
  /**
   * Get all verified tokens
   */
  getVerified(): TokenRegistryEntry[] {
    return Array.from(this._registry.values())
      .filter(entry => entry.isVerified);
  }
  
  /**
   * Get pending listings
   */
  getPendingListings(): TokenRegistryEntry[] {
    return Array.from(this._pendingListings.values());
  }
  
  // ============================================
  // LISTING MANAGEMENT
  // ============================================
  
  /**
   * Verify a token
   */
  async verify(tokenId: bigint): Promise<void> {
    const entry = this._registry.get(tokenId);
    if (!entry) {
      throw new Error(`Token ${tokenId} not found`);
    }
    
    entry.isVerified = true;
    entry.updatedAt = Date.now();
    
    // Move from pending to active if already listed
    if (this._pendingListings.has(tokenId)) {
      this._pendingListings.delete(tokenId);
      entry.listingStatus = 'active';
    }
  }
  
  /**
   * List a token
   */
  async list(tokenId: bigint, status?: TokenListingStatus): Promise<void> {
    const entry = this._registry.get(tokenId);
    if (!entry) {
      throw new Error(`Token ${tokenId} not found`);
    }
    
    if (!entry.isVerified && this.config.requireVerification) {
      throw new Error('Token must be verified before listing');
    }
    
    entry.isListed = true;
    entry.listingStatus = status ?? 'active';
    entry.updatedAt = Date.now();
  }
  
  /**
   * Delist a token
   */
  async delist(tokenId: bigint): Promise<void> {
    const entry = this._registry.get(tokenId);
    if (!entry) {
      throw new Error(`Token ${tokenId} not found`);
    }
    
    entry.isListed = false;
    entry.listingStatus = 'delisted';
    entry.updatedAt = Date.now();
  }
  
  /**
   * Suspend a token
   */
  async suspend(tokenId: bigint): Promise<void> {
    const entry = this._registry.get(tokenId);
    if (!entry) {
      throw new Error(`Token ${tokenId} not found`);
    }
    
    entry.isListed = false;
    entry.listingStatus = 'suspended';
    entry.updatedAt = Date.now();
  }
  
  // ============================================
  // CONTENT/CID REGISTRATION
  // ============================================
  
  /**
   * Register content ID mapping
   */
  registerContentId(tokenId: bigint, contentId: string): void {
    this._contentRegistry.set(contentId, tokenId);
  }
  
  /**
   * Register CID mapping
   */
  registerCid(tokenId: bigint, cid: string): void {
    this._cidRegistry.set(cid, tokenId);
  }
  
  // ============================================
  // QUERY
  // ============================================
  
  /**
   * Get total token count
   */
  get totalTokens(): number {
    return this._registry.size;
  }
  
  /**
   * Get token count by type
   */
  getCountByType(tokenType: TokenType): number {
    return this._typeIndex.get(tokenType)?.size ?? 0;
  }
  
  /**
   * Get total listed count
   */
  get totalListed(): number {
    return Array.from(this._registry.values())
      .filter(e => e.isListed)
      .length;
  }
  
  /**
   * Search tokens by name or symbol
   */
  search(query: string): TokenRegistryEntry[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this._registry.values())
      .filter(entry =>
        entry.name.toLowerCase().includes(lowerQuery) ||
        entry.symbol.toLowerCase().includes(lowerQuery)
      );
  }
  
  // ============================================
  // INTERNAL HELPERS
  // ============================================
  
  private _updateIndexes(
    tokenId: bigint,
    entry: TokenRegistryEntry,
    owner: string
  ): void {
    // Owner index
    const ownerLower = owner.toLowerCase();
    let ownerTokens = this._ownerRegistry.get(ownerLower);
    if (!ownerTokens) {
      ownerTokens = new Set();
      this._ownerRegistry.set(ownerLower, ownerTokens);
    }
    ownerTokens.add(tokenId);
    
    // Type index
    let typeTokens = this._typeIndex.get(entry.tokenType);
    if (!typeTokens) {
      typeTokens = new Set();
      this._typeIndex.set(entry.tokenType, typeTokens);
    }
    typeTokens.add(tokenId);
  }
}
