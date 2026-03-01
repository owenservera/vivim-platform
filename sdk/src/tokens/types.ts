/**
 * VIVIM SDK Token Infrastructure
 * 
 * Token types and interfaces for the tokenization platform
 * Built on ERC-1155 multi-token standard with custom extensions
 */

// ============================================
// TOKEN TYPES
// ============================================

/**
 * Token type classification
 */
export type TokenType = 
  | 'storage'      // Represents stored data assets
  | 'access'       // Time/usage limited access rights
  | 'identity'     // Soulbound reputation/credentials
  | 'reputation'   // Network contribution tracking
  | 'governance'   // Voting power tokens
  | 'utility';     // Utility credits

/**
 * Token standard
 */
export type TokenStandard = 'ERC-20' | 'ERC-721' | 'ERC-1155' | 'ERC-5192';

/**
 * Token supply type
 */
export type SupplyType = 'finite' | 'infinite' | 'decaying';

/**
 * Core token interface
 */
export interface IToken {
  readonly tokenId: bigint;
  readonly tokenType: TokenType;
  readonly standard: TokenStandard;
  readonly owner: string;
  readonly totalSupply: bigint;
  readonly circulatingSupply: bigint;
  
  // Metadata
  metadata: TokenMetadata;
  
  // State
  isFrozen: boolean;
  isPaused: boolean;
  
  // Actions
  transfer(to: string, amount?: bigint): Promise<void>;
  approve(spender: string, amount?: bigint): Promise<void>;
}

/**
 * Token metadata standard
 */
export interface TokenMetadata {
  // Basic info
  name: string;
  symbol: string;
  description?: string;
  decimals: number;
  
  // Media
  image?: string;
  externalUrl?: string;
  
  // Attributes for NFT-like properties
  attributes?: TokenAttribute[];
  
  // Custom properties
  properties?: Record<string, unknown>;
}

/**
 * Token attribute (NFT-style)
 */
export interface TokenAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

/**
 * Token balance information
 */
export interface TokenBalance {
  owner: string;
  tokenId: bigint;
  balance: bigint;
  balanceNumeric: number;
  lastUpdated: number;
  
  // Locked/available breakdown
  locked: bigint;
  available: bigint;
}

/**
 * Token allowance
 */
export interface TokenAllowance {
  owner: string;
  spender: string;
  tokenId: bigint;
  amount: bigint;
}

/**
 * Token transfer event
 */
export interface TokenTransfer {
  tokenId: bigint;
  from: string;
  to: string;
  amount: bigint;
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
}

/**
 * Token approval event
 */
export interface TokenApproval {
  tokenId: bigint;
  owner: string;
  spender: string;
  amount: bigint;
  timestamp: number;
}

// ============================================
// STORAGE TOKEN TYPES
// ============================================

/**
 * Storage token - represents stored data assets
 */
export interface StorageToken extends IToken {
  readonly tokenType: 'storage';
  
  // Storage-specific properties
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
}

/**
 * Storage token mint parameters
 */
export interface MintStorageTokenParams {
  contentCid: string;
  sizeBytes: number;
  replicationFactor: number;
  durability: number;
  owner: string;
  monetizationTerms?: MonetizationTerms;
}

/**
 * Monetization terms for storage
 */
export interface MonetizationTerms {
  isMonetizable: boolean;
  pricePerByte?: bigint;
  allowedBuyers?: string[];
  revenueShare?: RevenueShare;
}

/**
 * Revenue share configuration
 */
export interface RevenueShare {
  creator: number;      // 0-100%
  platform: number;     // 0-100%
  provider: number;     // 0-100%
  contributors?: { did: string; percent: number }[];
}

/**
 * Storage token action type
 */
export type StorageTokenAction = 
  | 'mint'
  | 'renew'
  | 'transfer'
  | 'stake'
  | 'slash'
  | 'burn';

// ============================================
// ACCESS TOKEN TYPES
// ============================================

/**
 * Access token - time/usage limited access rights
 */
export interface AccessToken extends IToken {
  readonly tokenType: 'access';
  
  // Content reference
  contentId: string;
  
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
  
  // State
  status: AccessTokenStatus;
}

/**
 * Access token status
 */
export type AccessTokenStatus = 
  | 'active'
  | 'expired'
  | 'used'
  | 'revoked';

/**
 * Access token type
 */
export type AccessTokenType = 
  | 'one-time'        // Single use
  | 'subscription'    // Recurring access
  | 'tiered'         // Multiple access levels
  | 'pay-per-use'    // Metered
  | 'lifetime';      // Unlimited

/**
 * Access token mint parameters
 */
export interface MintAccessTokenParams {
  contentId: string;
  owner: string;
  tokenType: AccessTokenType;
  expiresAt?: number;
  maxUses?: number;
  tierLevel?: number;
  tierPrivileges?: string[];
  price?: bigint;
  isTransferable: boolean;
  royaltyPercent: number;
  permissions: string[];
  scope: string;
}

// ============================================
// IDENTITY TOKEN TYPES (Soulbound - ERC-5192)
// ============================================

/**
 * Identity token - non-transferable reputation/credentials
 */
export interface IdentityToken extends IToken {
  readonly tokenType: 'identity';
  
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
  
  // Metadata extension
  metadata: TokenMetadata & IdentityMetadata;
}

/**
 * Identity token subtypes
 */
export type IdentityTokenType = 
  | 'reputation'
  | 'credential'
  | 'achievement'
  | 'kyc'
  | 'trust';

/**
 * Extended metadata for identity tokens
 */
export interface IdentityMetadata {
  // Identity-specific
  issuedAt: number;
  expiresAt?: number;
  evidence?: string;
  
  // Verification
  issuerName?: string;
  criteriaUrl?: string;
}

// ============================================
// REPUTATION TOKEN TYPES
// ============================================

/**
 * Reputation token - network contribution tracking
 */
export interface ReputationToken extends IToken {
  readonly tokenType: 'reputation';
  
  // Metrics
  storageProvided: bigint;
  contentCreated: number;
  successfulTransactions: number;
  trustScore: number;
  
  // History
  dailyMetrics: DailyMetric[];
  
  // Staking
  stakedAmount: bigint;
  slashingEvents: number;
}

/**
 * Daily reputation metric
 */
export interface DailyMetric {
  date: string;
  storageBytes: bigint;
  contentItems: number;
  transactions: number;
  reputationDelta: number;
}

// ============================================
// TOKEN FACTORY TYPES
// ============================================

/**
 * Token creation parameters
 */
export interface CreateTokenParams {
  name: string;
  symbol: string;
  description?: string;
  standard: TokenStandard;
  supplyType: SupplyType;
  initialSupply?: bigint;
  maxSupply?: bigint;
  decimals?: number;
  metadata?: Partial<TokenMetadata>;
}

/**
 * Token mint parameters
 */
export interface MintTokenParams {
  to: string;
  amount: bigint;
  data?: Record<string, unknown>;
}

/**
 * Token burn parameters
 */
export interface BurnTokenParams {
  from: string;
  amount: bigint;
  tokenId?: bigint;
}

// ============================================
// TOKEN REGISTRY TYPES
// ============================================

/**
 * Token registry entry
 */
export interface TokenRegistryEntry {
  // Identification
  tokenId: bigint;
  tokenAddress: string;
  tokenType: TokenType;
  standard: TokenStandard;
  
  // Metadata
  name: string;
  symbol: string;
  metadataUri: string;
  
  // Supply
  totalSupply: bigint;
  maxSupply?: bigint;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  
  // Status
  isVerified: boolean;
  isListed: boolean;
  listingStatus?: string;
}

/**
 * Token listing status
 */
export type TokenListingStatus = 
  | 'unlisted'
  | 'pending'
  | 'active'
  | 'suspended'
  | 'delisted';

// ============================================
// ECONOMY TYPES
// ============================================

/**
 * Token economics configuration
 */
export interface TokenEconomics {
  // Minting
  mintingEnabled: boolean;
  mintingFee?: bigint;
  
  // Burning
  burningEnabled: boolean;
  burningFee?: bigint;
  
  // Transfers
  transfersEnabled: boolean;
  transferFee?: bigint;
  
  // Staking
  stakingEnabled: boolean;
  minStake?: bigint;
  rewardApy?: number;
  
  // Slashing
  slashingEnabled: boolean;
  slashPercent?: number;
}

// ============================================
// EVENTS
// ============================================

/**
 * Token event types
 */
export interface TokenEventMap {
  'token:minted': { tokenId: bigint; owner: string; amount: bigint };
  'token:transferred': { tokenId: bigint; from: string; to: string; amount: bigint };
  'token:burned': { tokenId: bigint; from: string; amount: bigint };
  'token:approved': { owner: string; spender: string; amount: bigint };
  'token:paused': { tokenId: bigint };
  'token:unpaused': { tokenId: bigint };
  'token:frozen': { tokenId: bigint; account: string };
  'token:unfrozen': { tokenId: bigint; account: string };
  'token:slashed': { tokenId: bigint; account: string; amount: bigint; reason: string };
}

// ============================================
// ERROR TYPES
// ============================================

/**
 * Token error types
 */
export class TokenError extends Error {
  constructor(
    message: string,
    public code: TokenErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TokenError';
  }
}

export type TokenErrorCode = 
  | 'INSUFFICIENT_BALANCE'
  | 'INSUFFICIENT_ALLOWANCE'
  | 'TOKEN_NOT_FOUND'
  | 'TOKEN_PAUSED'
  | 'TOKEN_FROZEN'
  | 'TRANSFER_FAILED'
  | 'MINT_FAILED'
  | 'BURN_FAILED'
  | 'APPROVAL_FAILED'
  | 'SLASH_FAILED'
  | 'STAKE_FAILED'
  | 'INVALID_TOKEN_TYPE'
  | 'PERMISSION_DENIED'
  | 'EXPIRED'
  | 'USES_EXHAUSTED';
