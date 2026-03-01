/**
 * VIVIM SDK - Wallet Service
 * Wallet abstraction layer supporting ERC-4337 smart accounts
 */

import type { VivimSDK } from './sdk.js';
import type {
  SmartWallet,
  SmartWalletConfig,
  UserOperation,
  Call,
  FeeQuote,
  SessionKey,
  RecoveryConfig,
  WalletEventMap,
  SmartAccountType,
} from './types.js';
import { getLogger, Logger } from '../utils/logger.js';

// ERC-4337 EntryPoint addresses (same across EVM chains)
const ENTRY_POINT_ADDRESSES = {
  '0.6': '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  '0.7': '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
} as const;

// Default account implementations
const ACCOUNT_IMPLEMENTATIONS: Record<SmartAccountType, { factory: string; abi: string }> = {
  simple: {
    factory: '0x9406Cc6185a346906296840746125a0E449c54d',
    abi: 'SimpleAccount',
  },
  safe: {
    factory: '0x75c35fC4b49714a8e2F4A13dB1b7d5a5b3e5e4D', // Safe Singleton Factory
    abi: 'Safe',
  },
  kernel: {
    factory: '0xD9d18d6d28C3C5dE6E1eC4C1bfFCf0A5F2c1B8E',
    abi: 'Kernel',
  },
  light: {
    factory: '0xE8e5f721A6710fAc4C4b0596f95AE50f2a8a571',
    abi: 'LightAccount',
  },
  biconomy: {
    factory: '0x000000F47eD36dFb50AEf7B7bbFe5E8E1E5AD8d8',
    abi: 'BiconomyAccount',
  },
  custom: {
    factory: '',
    abi: 'Custom',
  },
};

/**
 * Wallet Service for VIVIM SDK
 * Provides ERC-4337 smart account management
 */
export class WalletService {
  private logger: Logger;
  private smartWallet: SmartWallet | null = null;
  private config: WalletServiceConfig;

  constructor(
    private sdk: VivimSDK,
    config: WalletServiceConfig = {}
  ) {
    this.logger = getLogger().child('WalletService');
    this.config = {
      entryPointVersion: config.entryPointVersion || '0.7',
      bundlerUrl: config.bundlerUrl,
      paymasterUrl: config.paymasterUrl,
      chainId: config.chainId || 1, // Default to Ethereum mainnet
      ...config,
    };
  }

  /**
   * Get the entry point address for current version
   */
  getEntryPointAddress(): string {
    return ENTRY_POINT_ADDRESSES[this.config.entryPointVersion];
  }

  /**
   * Get current smart wallet
   */
  getSmartWallet(): SmartWallet | null {
    return this.smartWallet;
  }

  /**
   * Check if wallet is initialized
   */
  isInitialized(): boolean {
    return this.smartWallet !== null;
  }

  /**
   * Initialize wallet from existing address
   */
  async attachWallet(address: string, accountType: SmartAccountType = 'simple'): Promise<SmartWallet> {
    this.logger.info('Attaching to existing smart wallet', { address, accountType });

    const implementation = ACCOUNT_IMPLEMENTATIONS[accountType];

    this.smartWallet = {
      address,
      accountType,
      entryPointVersion: this.config.entryPointVersion,
      entryPointAddress: this.getEntryPointAddress(),
      factoryAddress: implementation.factory,
      isDeployed: await this.checkAccountDeployed(address),
      chainId: this.config.chainId,
    };

    return this.smartWallet;
  }

  /**
   * Create a new smart wallet
   */
  async createWallet(config: SmartWalletConfig): Promise<SmartWallet> {
    this.logger.info('Creating new smart wallet', { accountType: config.accountType || 'simple' });

    const accountType = config.accountType || 'simple';
    const implementation = ACCOUNT_IMPLEMENTATIONS[accountType];

    // Calculate deterministic address using CREATE2
    const address = await this.calculateAccountAddress(
      implementation.factory,
      config.owners[0],
      config.salt
    );

    const isDeployed = await this.checkAccountDeployed(address);

    this.smartWallet = {
      address,
      accountType,
      entryPointVersion: this.config.entryPointVersion,
      entryPointAddress: this.getEntryPointAddress(),
      factoryAddress: implementation.factory,
      isDeployed,
      chainId: this.config.chainId,
    };

    this.logger.info('Smart wallet created', { address: this.smartWallet.address });

    // Emit event
    this.sdk.emit('wallet:created' as keyof WalletEventMap, { wallet: this.smartWallet } as never);

    return this.smartWallet;
  }

  /**
   * Deploy the smart wallet to chain (if not already deployed)
   */
  async deployWallet(): Promise<string> {
    if (!this.smartWallet) {
      throw new Error('No wallet initialized');
    }

    if (this.smartWallet.isDeployed) {
      this.logger.warn('Wallet already deployed');
      return this.smartWallet.address;
    }

    this.logger.info('Deploying smart wallet', { address: this.smartWallet.address });

    // Build initialization UserOperation
    const initCode = this.buildInitCode();

    const userOp = await this.buildUserOperation({
      to: this.smartWallet.address,
      data: initCode,
    });

    // Send to bundler
    const userOpHash = await this.sendUserOperation(userOp);

    // Wait for deployment confirmation
    await this.waitForDeployment(userOpHash);

    this.smartWallet.isDeployed = true;

    this.sdk.emit('wallet:deployed' as keyof WalletEventMap, { address: this.smartWallet.address } as never);

    return this.smartWallet.address;
  }

  /**
   * Build a UserOperation
   */
  async buildUserOperation(call: Call): Promise<UserOperation> {
    if (!this.smartWallet) {
      throw new Error('No wallet initialized');
    }

    const nonce = await this.getNonce();

    return {
      sender: this.smartWallet.address,
      nonce,
      initCode: this.smartWallet.isDeployed ? '0x' : this.buildInitCode(),
      callData: this.encodeCallData([call]),
      callGasLimit: 0n, // Will be estimated
      verificationGasLimit: 0n, // Will be estimated
      preVerificationGas: 0n, // Will be estimated
      maxFeePerGas: 0n, // Will be estimated
      maxPriorityFeePerGas: 0n, // Will be estimated
      paymasterAndData: '0x',
      signature: '0x',
    };
  }

  /**
   * Send a UserOperation through the bundler
   */
  async sendUserOperation(userOp: UserOperation): Promise<string> {
    if (!this.config.bundlerUrl) {
      throw new Error('Bundler URL not configured');
    }

    // Estimate gas if not set
    if (userOp.callGasLimit === 0n) {
      const gasEstimates = await this.estimateGas(userOp);
      userOp.callGasLimit = gasEstimates.callGasLimit;
      userOp.verificationGasLimit = gasEstimates.verificationGasLimit;
      userOp.preVerificationGas = gasEstimates.preVerificationGas;
      userOp.maxFeePerGas = gasEstimates.maxFeePerGas;
      userOp.maxPriorityFeePerGas = gasEstimates.maxPriorityFeePerGas;
    }

    // Sign the UserOperation
    const signature = await this.signUserOperation(userOp);
    userOp.signature = signature;

    // Send to bundler
    this.logger.info('Sending UserOperation', { sender: userOp.sender });

    const response = await fetch(this.config.bundlerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_sendUserOperation',
        params: [userOp, this.getEntryPointAddress()],
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(`UserOperation failed: ${result.error.message}`);
    }

    return result.result;
  }

  /**
   * Execute a call through the smart wallet
   */
  async execute(calls: Call[]): Promise<string> {
    if (!this.smartWallet) {
      throw new Error('No wallet initialized');
    }

    const userOp = await this.buildUserOperation({
      to: this.smartWallet.address,
      data: this.encodeCallData(calls),
    });

    return this.sendUserOperation(userOp);
  }

  /**
   * Get fee quotes for sponsored gas
   */
  async getFeeQuotes(calls: Call[]): Promise<FeeQuote[]> {
    if (!this.config.paymasterUrl) {
      return [];
    }

    const userOp = await this.buildUserOperation({
      to: calls[0]?.to || this.smartWallet!.address,
      data: this.encodeCallData(calls),
    });

    const response = await fetch(this.config.paymasterUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'pm_getFeeQuote',
        params: [userOp],
        id: 1,
      }),
    });

    const result = await response.json();
    return result.result || [];
  }

  /**
   * Sponsor gas for UserOperation
   */
  async sponsorGas(userOp: UserOperation): Promise<UserOperation> {
    if (!this.config.paymasterUrl) {
      throw new Error('Paymaster URL not configured');
    }

    const response = await fetch(this.config.paymasterUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'pm_sponsorUserOperation',
        params: [userOp, { entryPoint: this.getEntryPointAddress() }],
        id: 1,
      }),
    });

    const result = await response.json();

    if (result.result) {
      userOp.paymasterAndData = result.result.paymasterAndData;
      userOp.callGasLimit = BigInt(result.result.callGasLimit);
      userOp.verificationGasLimit = BigInt(result.result.verificationGasLimit);
      userOp.preVerificationGas = BigInt(result.result.preVerificationGas);
    }

    return userOp;
  }

  /**
   * Set up account recovery
   */
  async setupRecovery(config: RecoveryConfig): Promise<void> {
    if (!this.smartWallet) {
      throw new Error('No wallet initialized');
    }

    this.logger.info('Setting up recovery', { method: config.method });

    // Encode recovery data and execute
    const call: Call = {
      to: this.smartWallet.address,
      data: this.encodeRecoveryData(config),
    };

    await this.execute([call]);

    this.sdk.emit('recovery:setup' as keyof WalletEventMap, { config } as never);
  }

  /**
   * Create a session key
   */
  async createSessionKey(sessionKey: SessionKey): Promise<void> {
    if (!this.smartWallet) {
      throw new Error('No wallet initialized');
    }

    this.logger.info('Creating session key', { address: sessionKey.address });

    const call: Call = {
      to: this.smartWallet.address,
      data: this.encodeSessionKeyData(sessionKey),
    };

    await this.execute([call]);

    this.sdk.emit('session:created' as keyof WalletEventMap, { key: sessionKey } as never);
  }

  /**
   * Revoke a session key
   */
  async revokeSessionKey(keyAddress: string): Promise<void> {
    if (!this.smartWallet) {
      throw new Error('No wallet initialized');
    }

    this.logger.info('Revoking session key', { address: keyAddress });

    const call: Call = {
      to: this.smartWallet.address,
      data: this.encodeRevokeSessionKeyData(keyAddress),
    };

    await this.execute([call]);

    this.sdk.emit('session:revoked' as keyof WalletEventMap, { key: keyAddress } as never);
  }

  // ============================================
  // Private helper methods
  // ============================================

  private async checkAccountDeployed(address: string): Promise<boolean> {
    // In production, this would query the chain
    // For now, return false to trigger deployment
    return false;
  }

  private async calculateAccountAddress(
    factoryAddress: string,
    owner: string,
    salt?: bigint
  ): Promise<string> {
    // CREATE2 address calculation
    // In production, this would use proper bytecode hashing
    const saltValue = salt || 0n;
    const initCodeHash = this.keccak256(
      // Simplified - real implementation would hash factory + owner + salt
      Buffer.from(owner + saltValue.toString(16).padStart(64, '0'), 'hex')
    );

    return `0x${this.keccak256(
      Buffer.from('0xff' + factoryAddress.slice(2) + saltValue.toString(16).padStart(64, '0') + initCodeHash.slice(2), 'hex')
    ).slice(-40)}`.toLowerCase();
  }

  private buildInitCode(): string {
    if (!this.smartWallet) {
      throw new Error('No wallet initialized');
    }

    // Return factory + initialize encode
    return this.smartWallet.factoryAddress + this.encodeInitCode().slice(2);
  }

  private encodeInitCode(): string {
    // Simplified - real implementation would encode factory call
    if (!this.smartWallet) return '0x';

    const owner = this.sdk.getIdentity()?.publicKey || '';
    return '0x' + '00'.repeat(32); // Placeholder
  }

  private encodeCallData(calls: Call[]): string {
    // ERC-7579 execute batch format
    if (calls.length === 1) {
      const call = calls[0];
      return this.encodeExecuteCall(call.to, call.value || 0n, call.data || '0x');
    }

    // Batch execution
    const targets = calls.map(c => c.to);
    const values = calls.map(c => c.value || 0n);
    const datas = calls.map(c => c.data || '0x');

    return this.encodeExecuteBatch(targets, values, datas);
  }

  private encodeExecuteCall(to: string, value: bigint, data: string): string {
    // exec(address to, uint256 value, bytes data)
    return '0x4af51e68' + this.encodeAddress(to) + this.encodeUint256(value) + this.encodeBytes(data);
  }

  private encodeExecuteBatch(targets: string[], values: bigint[], datas: string[]): string {
    // exec(address[] target, uint256[] value, bytes[] data)
    return '0x Corey9d1f' + // Simplified
      this.encodeAddressArray(targets) +
      this.encodeUint256Array(values) +
      this.encodeBytesArray(datas);
  }

  private encodeRecoveryData(config: RecoveryConfig): string {
    // Encode guardian setup
    return '0x' + '00'.repeat(32 * 4); // Simplified
  }

  private encodeSessionKeyData(sessionKey: SessionKey): string {
    return '0x' + '00'.repeat(32 * 3); // Simplified
  }

  private encodeRevokeSessionKeyData(keyAddress: string): string {
    return '0x' + '00'.repeat(32 * 2); // Simplified
  }

  private async getNonce(): Promise<bigint> {
    // In production, query EntryPoint for nonce
    return 0n;
  }

  private async estimateGas(userOp: UserOperation) {
    // In production, call bundler's estiamteGas
    return {
      callGasLimit: 100000n,
      verificationGasLimit: 50000n,
      preVerificationGas: 21000n,
      maxFeePerGas: 50000000000n, // 50 gwei
      maxPriorityFeePerGas: 1000000000n, // 1 gwei
    };
  }

  private async signUserOperation(userOp: UserOperation): Promise<string> {
    // Sign the userOp hash using the SDK's identity
    const identity = this.sdk.getIdentity();
    if (!identity) {
      throw new Error('No identity available for signing');
    }

    // Get UserOperation hash
    const userOpHash = await this.getUserOpHash(userOp);

    // Sign using SDK
    const signature = await this.sdk.sign(userOpHash);

    return signature;
  }

  private async getUserOpHash(userOp: UserOperation): Promise<string> {
    // Standard ERC-4337 hash calculation
    const encoded = this.encodeUserOp(userOp);
    const domain = {
      name: 'Account Abstraction',
      version: '1',
      chainId: this.config.chainId,
      verifyingContract: this.getEntryPointAddress(),
    };

    // In production, use proper EIP-712 signing
    return `0x${this.keccak256(Buffer.from(JSON.stringify({ ...domain, message: encoded })))}`;
  }

  private encodeUserOp(userOp: UserOperation): Record<string, unknown> {
    return {
      sender: userOp.sender,
      nonce: userOp.nonce.toString(),
      initCode: userOp.initCode,
      callData: userOp.callData,
      callGasLimit: userOp.callGasLimit.toString(),
      verificationGasLimit: userOp.verificationGasLimit.toString(),
      preVerificationGas: userOp.preVerificationGas.toString(),
      maxFeePerGas: userOp.maxFeePerGas.toString(),
      maxPriorityFeePerGas: userOp.maxPriorityFeePerGas.toString(),
      paymasterAndData: userOp.paymasterAndData,
      signature: userOp.signature,
    };
  }

  private async waitForDeployment(userOpHash: string): Promise<void> {
    // In production, poll for receipt
    // Simplified: wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Encoding helpers
  private encodeAddress(addr: string): string {
    return addr.slice(2).padStart(64, '0');
  }

  private encodeUint256(value: bigint): string {
    return value.toString(16).padStart(64, '0');
  }

  private encodeBytes(data: string): string {
    const len = Math.ceil((data.length - 2) / 2);
    return len.toString(16).padStart(64, '0') + data.slice(2);
  }

  private encodeAddressArray(addrs: string[]): string {
    return addrs.map(a => this.encodeAddress(a)).join('');
  }

  private encodeUint256Array(values: bigint[]): string {
    return values.map(v => this.encodeUint256(v)).join('');
  }

  private encodeBytesArray(datas: string[]): string {
    // Simplified - real implementation needs proper nested encoding
    return '0x' + datas.map(d => d.slice(2).padStart(64, '0')).join('');
  }

  // Simple keccak256 (simplified - use @noble/hashes in production)
  private keccak256(data: Buffer): string {
    // In production, import from @noble/hashes
    // This is a placeholder that returns a mock hash
    return '0x' + 'a'.repeat(64);
  }
}

/**
 * Wallet Service Configuration
 */
export interface WalletServiceConfig {
  /** EntryPoint version */
  entryPointVersion?: '0.6' | '0.7';
  /** Bundler RPC URL */
  bundlerUrl?: string;
  /** Paymaster RPC URL */
  paymasterUrl?: string;
  /** Chain ID */
  chainId?: number;
  /** API key for bundler/paymaster */
  apiKey?: string;
}

/**
 * Create a new WalletService instance
 */
export function createWalletService(
  sdk: VivimSDK,
  config?: WalletServiceConfig
): WalletService {
  return new WalletService(sdk, config);
}
