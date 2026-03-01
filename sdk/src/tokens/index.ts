/**
 * VIVIM SDK - Token Infrastructure
 * 
 * Exports all token types and implementations
 */

// Types
export * from './types.js';

// Standards
export { ERC1155 } from './standards/erc1155.js';
export { StorageToken } from './standards/storage-token.js';
export type { StorageTokenConfig, StorageTokenData } from './standards/storage-token.js';
export { AccessToken } from './standards/access-token.js';
export type { AccessTokenConfig, AccessTokenData } from './standards/access-token.js';
export { SoulboundToken } from './standards/soulbound-token.js';
export type { SoulboundTokenConfig, SoulboundTokenData } from './standards/soulbound-token.js';

// Factory
export { TokenFactory } from './factory/token-factory.js';
export type { TokenFactoryConfig } from './factory/token-factory.js';

// Registry
export { TokenRegistry } from './registry/token-registry.js';
export type { TokenRegistryConfig } from './registry/token-registry.js';

// Wallet
export { TokenWallet } from './wallet/token-wallet.js';
export type { TokenWalletConfig } from './wallet/token-wallet.js';

// Version
export const TOKENS_VERSION = '1.0.0';
