# Tokens

Tokens in VIVIM represent ownership, access rights, and programmable data on the user's personal blockchain.

## Token Standards

### 1. Access Tokens (`sdk/src/tokens/standards/access-token.ts`)
Time-limited, scoped tokens for authorizing external applications to access specific parts of the knowledge graph.

### 2. Storage Tokens (`sdk/src/tokens/standards/storage-token.ts`)
Represent allocated space and priority in the distributed storage network.

### 3. Soulbound Tokens (`sdk/src/tokens/standards/soulbound-token.ts`)
Non-transferable tokens representing identity, credentials, and reputation.

### 4. ERC-1155 Multi-Token (`sdk/src/tokens/standards/erc1155.ts`)
Standard for creating both fungible and non-fungible digital assets within VIVIM.

## Management

### Token Factory (`sdk/src/tokens/factory/token-factory.ts`)
A centralized utility for minting and deploying new tokens on the personal chain.

### Token Wallet (`sdk/src/tokens/wallet/token-wallet.ts`)
Manages the user's token balances and handles signing of token-related transactions.
