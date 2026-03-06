/**
 * ERC-1155 Multi-Token Standard Implementation
 * 
 * Base class implementing the ERC-1155 multi-token standard
 * Supports both fungible and non-fungible tokens
 */

import { TokenError } from '../types.js';
import type {
  TokenType,
  TokenStandard,
  TokenMetadata,
  TokenBalance,
  TokenAllowance,
  TokenEventMap,
  TokenErrorCode,
} from '../types.js';

// ERC-1155 Interface identifiers
const ERC1155_INTERFACE_ID = '0x4e2312e0';
const ERC165_INTERFACE_ID = '0x01ffc9a7';

/**
 * ERC-1155 Token implementation
 * 
 * Supports:
 * - Multiple token types (fungible and NFT)
 * - Batch transfers
 * - Operator approvals
 * - Metadata URIs
 */
export abstract class ERC1155 {
  // Token identification
  public readonly tokenType: TokenType;
  public readonly standard: TokenStandard = 'ERC-1155';
  
  // Token metadata
  protected _name: string;
  protected _symbol: string;
  protected _decimals: number;
  
  // Supply tracking
  protected _totalSupply: Map<bigint, bigint> = new Map();
  protected _circulatingSupply: Map<bigint, bigint> = new Map();
  
  // Account balances: owner -> tokenId -> balance
  protected _balances: Map<string, Map<bigint, bigint>> = new Map();
  
  // Operator approvals: owner -> operator -> approved
  protected _operatorApprovals: Map<string, Set<string>> = new Map();
  
  // Token approvals (for specific tokens): owner -> spender -> tokenId -> amount
  protected _tokenApprovals: Map<string, Map<string, Map<bigint, bigint>>> = new Map();
  
  // Token metadata: tokenId -> metadata
  protected _tokenMetadata: Map<bigint, TokenMetadata> = new Map();
  
  // Base URI for metadata
  protected _baseUri: string = '';
  
  // Contract state
  protected _paused: boolean = false;
  protected _frozenAccounts: Set<string> = new Set();
  
  // Event listeners
  protected _events: Map<string, Set<(...args: unknown[]) => void>> = new Map();
  
  // Token next ID counter
  protected _nextTokenId: bigint = 1n;
  
  constructor(name: string, symbol: string, decimals: number = 18, tokenType: TokenType) {
    this._name = name;
    this._symbol = symbol;
    this._decimals = decimals;
    this.tokenType = tokenType;
  }
  
  // ============================================
  // READ METHODS
  // ============================================
  
  /**
   * Get token name
   */
  get name(): string {
    return this._name;
  }
  
  /**
   * Get token symbol
   */
  get symbol(): string {
    return this._symbol;
  }
  
  /**
   * Get decimals
   */
  get decimals(): number {
    return this._decimals;
  }
  
  /**
   * Check if contract is paused
   */
  get paused(): boolean {
    return this._paused;
  }
  
  /**
   * Get total supply for a token
   */
  totalSupply(tokenId: bigint): bigint {
    return this._totalSupply.get(tokenId) ?? 0n;
  }
  
  /**
   * Get circulating supply for a token
   */
  circulatingSupply(tokenId: bigint): bigint {
    return this._circulatingSupply.get(tokenId) ?? 0n;
  }
  
  /**
   * Get balance of an account for a specific token
   */
  balanceOf(account: string, tokenId: bigint): bigint {
    this._requireNotFrozen(account);
    const accountBalances = this._balances.get(account.toLowerCase());
    if (!accountBalances) return 0n;
    return accountBalances.get(tokenId) ?? 0n;
  }
  
  /**
   * Get balance of multiple accounts for multiple tokens (batch)
   */
  balanceOfBatch(accounts: string[], tokenIds: bigint[]): bigint[] {
    if (accounts.length) {
      throw new Error('Accounts and tokenIds length !== tokenIds.length mismatch');
    }
    
    return accounts.map((account, i) => 
      this.balanceOf(account, tokenIds[i])
    );
  }
  
  /**
   * Check if an operator is approved for all tokens of an account
   */
  isApprovedForAll(account: string, operator: string): boolean {
    const accountOperators = this._operatorApprovals.get(account.toLowerCase());
    return accountOperators?.has(operator.toLowerCase()) ?? false;
  }
  
  /**
   * Get allowance for a specific token and spender
   */
  allowance(owner: string, spender: string, tokenId: bigint): bigint {
    const ownerLower = owner.toLowerCase();
    const spenderLower = spender.toLowerCase();
    
    const ownerApprovals = this._tokenApprovals.get(ownerLower);
    if (!ownerApprovals) return 0n;
    
    const spenderApprovals = ownerApprovals.get(spenderLower);
    if (!spenderApprovals) return 0n;
    
    return spenderApprovals.get(tokenId) ?? 0n;
  }
  
  /**
   * Get token metadata
   */
  getTokenMetadata(tokenId: bigint): TokenMetadata | undefined {
    return this._tokenMetadata.get(tokenId);
  }
  
  /**
   * Get URI for token metadata
   */
  uri(tokenId: bigint): string {
    const metadata = this._tokenMetadata.get(tokenId);
    if (!metadata) {
      return `${this._baseUri}${tokenId}`;
    }
    
    // Replace {id} in URI template if present
    const uri = metadata.properties?.['uri'] as string | undefined 
      ?? `${this._baseUri}${tokenId}`;
    
    return uri.replace('{id}', tokenId.toString(16).padStart(64, '0'));
  }
  
  /**
   * Check if account is frozen
   */
  isFrozen(account: string): boolean {
    return this._frozenAccounts.has(account.toLowerCase());
  }
  
  // ============================================
  // WRITE METHODS
  // ============================================
  
  /**
   * Transfer tokens from one account to another
   */
  async transfer(from: string, to: string, tokenId: bigint, amount: bigint): Promise<void> {
    this._requireNotPaused();
    this._requireNotFrozen(from);
    this._requireNotFrozen(to);
    
    const senderLower = from.toLowerCase();
    const recipientLower = to.toLowerCase();
    
    // Check if caller is owner or approved
    // Note: In real implementation, this would check msg.sender
    const caller = from; // Simplified for SDK
    
    if (caller.toLowerCase() !== senderLower) {
      // Check operator approval
      if (!this.isApprovedForAll(senderLower, caller)) {
        // Check specific token approval
        const approvedAmount = this.allowance(senderLower, caller, tokenId);
        if (approvedAmount < amount) {
          throw this._createError('INSUFFICIENT_ALLOWANCE', 'Insufficient allowance');
        }
      }
    }
    
    // Check balance
    const senderBalance = this.balanceOf(senderLower, tokenId);
    if (senderBalance < amount) {
      throw this._createError('INSUFFICIENT_BALANCE', 'Insufficient balance');
    }
    
    // Update balances
    this._subtractBalance(senderLower, tokenId, amount);
    this._addBalance(recipientLower, tokenId, amount);
    
    // Emit transfer event
    this._emit('token:transferred', {
      tokenId,
      from: senderLower,
      to: recipientLower,
      amount,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Batch transfer multiple tokens
   */
  async transferBatch(
    from: string,
    to: string,
    tokenIds: bigint[],
    amounts: bigint[]
  ): Promise<void> {
    if (tokenIds.length !== amounts.length) {
      throw new Error('TokenIds and amounts length mismatch');
    }
    
    for (let i = 0; i < tokenIds.length; i++) {
      await this.transfer(from, to, tokenIds[i], amounts[i]);
    }
  }
  
  /**
   * Approve an operator to manage all tokens
   */
  async setApprovalForAll(operator: string, approved: boolean): Promise<void> {
    this._requireNotPaused();
    
    const ownerLower = 'owner'; // Would be msg.sender in real implementation
    const operatorLower = operator.toLowerCase();
    
    let accountOperators = this._operatorApprovals.get(ownerLower);
    if (!accountOperators) {
      accountOperators = new Set();
      this._operatorApprovals.set(ownerLower, accountOperators);
    }
    
    if (approved) {
      accountOperators.add(operatorLower);
    } else {
      accountOperators.delete(operatorLower);
    }
    
    this._emit('token:approved', {
      owner: ownerLower,
      spender: operatorLower,
      amount: approved ? BigInt(-1) : 0n,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Approve a specific amount for a spender
   */
  async approve(spender: string, tokenId: bigint, amount: bigint): Promise<void> {
    this._requireNotPaused();
    
    const ownerLower = 'owner'; // Would be msg.sender in real implementation
    const spenderLower = spender.toLowerCase();
    
    let ownerApprovals = this._tokenApprovals.get(ownerLower);
    if (!ownerApprovals) {
      ownerApprovals = new Map();
      this._tokenApprovals.set(ownerLower, ownerApprovals);
    }
    
    let spenderApprovals = ownerApprovals.get(spenderLower);
    if (!spenderApprovals) {
      spenderApprovals = new Map();
      ownerApprovals.set(spenderLower, spenderApprovals);
    }
    
    spenderApprovals.set(tokenId, amount);
    
    this._emit('token:approved', {
      owner: ownerLower,
      spender: spenderLower,
      amount,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Mint new tokens
   */
  async _mint(to: string, tokenId: bigint, amount: bigint, data?: Record<string, unknown>): Promise<bigint> {
    this._requireNotPaused();
    this._requireNotFrozen(to);
    
    const recipientLower = to.toLowerCase();
    
    // Update supplies
    const currentTotal = this._totalSupply.get(tokenId) ?? 0n;
    this._totalSupply.set(tokenId, currentTotal + amount);
    
    const currentCirculating = this._circulatingSupply.get(tokenId) ?? 0n;
    this._circulatingSupply.set(tokenId, currentCirculating + amount);
    
    // Update balance
    this._addBalance(recipientLower, tokenId, amount);
    
    // Emit mint event
    this._emit('token:minted', {
      tokenId,
      owner: recipientLower,
      amount,
      timestamp: Date.now(),
    });
    
    return tokenId;
  }
  
  /**
   * Burn tokens
   */
  async _burn(from: string, tokenId: bigint, amount: bigint): Promise<void> {
    this._requireNotPaused();
    this._requireNotFrozen(from);
    
    const fromLower = from.toLowerCase();
    
    // Check balance
    const fromBalance = this.balanceOf(fromLower, tokenId);
    if (fromBalance < amount) {
      throw this._createError('INSUFFICIENT_BALANCE', 'Insufficient balance to burn');
    }
    
    // Update supplies
    const currentTotal = this._totalSupply.get(tokenId) ?? 0n;
    this._totalSupply.set(tokenId, currentTotal - amount);
    
    const currentCirculating = this._circulatingSupply.get(tokenId) ?? 0n;
    this._circulatingSupply.set(tokenId, currentCirculating - amount);
    
    // Update balance
    this._subtractBalance(fromLower, tokenId, amount);
    
    // Emit burn event
    this._emit('token:burned', {
      tokenId,
      from: fromLower,
      amount,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Pause token transfers
   */
  async pause(): Promise<void> {
    this._paused = true;
    this._emit('token:paused', { tokenId: 0n });
  }
  
  /**
   * Unpause token transfers
   */
  async unpause(): Promise<void> {
    this._paused = false;
    this._emit('token:unpaused', { tokenId: 0n });
  }
  
  /**
   * Freeze an account
   */
  async freezeAccount(account: string): Promise<void> {
    this._frozenAccounts.add(account.toLowerCase());
    this._emit('token:frozen', { tokenId: 0n, account: account.toLowerCase() });
  }
  
  /**
   * Unfreeze an account
   */
  async unfreezeAccount(account: string): Promise<void> {
    this._frozenAccounts.delete(account.toLowerCase());
    this._emit('token:unfrozen', { tokenId: 0n, account: account.toLowerCase() });
  }
  
  /**
   * Set base URI for metadata
   */
  setBaseUri(uri: string): void {
    this._baseUri = uri;
  }
  
  /**
   * Set token metadata
   */
  setTokenMetadata(tokenId: bigint, metadata: TokenMetadata): void {
    this._tokenMetadata.set(tokenId, metadata);
  }
  
  // ============================================
  // INTERNAL HELPERS
  // ============================================
  
  /**
   * Add to account balance
   */
  protected _addBalance(account: string, tokenId: bigint, amount: bigint): void {
    let accountBalances = this._balances.get(account);
    if (!accountBalances) {
      accountBalances = new Map();
      this._balances.set(account, accountBalances);
    }
    
    const currentBalance = accountBalances.get(tokenId) ?? 0n;
    accountBalances.set(tokenId, currentBalance + amount);
  }
  
  /**
   * Subtract from account balance
   */
  protected _subtractBalance(account: string, tokenId: bigint, amount: bigint): void {
    const accountBalances = this._balances.get(account);
    if (!accountBalances) {
      throw this._createError('INSUFFICIENT_BALANCE', 'Account has no balance');
    }
    
    const currentBalance = accountBalances.get(tokenId) ?? 0n;
    const newBalance = currentBalance - amount;
    
    if (newBalance === 0n) {
      accountBalances.delete(tokenId);
    } else {
      accountBalances.set(tokenId, newBalance);
    }
  }
  
  /**
   * Require contract is not paused
   */
  protected _requireNotPaused(): void {
    if (this._paused) {
      throw this._createError('TOKEN_PAUSED', 'Token transfers are paused');
    }
  }
  
  /**
   * Require account is not frozen
   */
  protected _requireNotFrozen(account: string): void {
    if (this._frozenAccounts.has(account.toLowerCase())) {
      throw this._createError('TOKEN_FROZEN', 'Account is frozen');
    }
  }
  
  /**
   * Create token error
   */
  protected _createError(code: TokenErrorCode, message: string): TokenError {
    return new TokenError(message, code);
  }
  
  // ============================================
  // EVENT SYSTEM
  // ============================================
  
  /**
   * Subscribe to token events
   */
  on<K extends keyof TokenEventMap>(
    event: K,
    listener: (data: TokenEventMap[K]) => void
  ): () => void {
    let eventListeners = this._events.get(event);
    if (!eventListeners) {
      eventListeners = new Set();
      this._events.set(event, eventListeners);
    }
    
    eventListeners.add(listener as (...args: unknown[]) => void);
    
    // Return unsubscribe function
    return () => {
      eventListeners?.delete(listener as (...args: unknown[]) => void);
    };
  }
  
  /**
   * Emit an event
   */
  protected _emit<K extends keyof TokenEventMap>(
    event: K,
    data: TokenEventMap[K]
  ): void {
    const eventListeners = this._events.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      }
    }
  }
  
  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this._events.clear();
  }
}

// Export interface for type checking
export type { IToken } from '../types.js';
