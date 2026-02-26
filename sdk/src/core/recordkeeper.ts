/**
 * VIVIM SDK - On-Chain Recordkeeping System
 * 
 * Provides cryptographic audit trail for all SDK operations.
 * Each SDK edit/modification is recorded on-chain for verification.
 */

import { EventEmitter } from 'events';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from 'uint8arrays';
import type { VivimSDK } from '../core/sdk.js';
import { generateId, signData, verifySignature, publicKeyToDID, calculateCID } from '../utils/crypto.js';

/**
 * SDK Operation Types
 */
export type SDKOperationType = 
  | 'node:create'
  | 'node:update'
  | 'node:delete'
  | 'node:register'
  | 'node:load'
  | 'extension:register'
  | 'extension:activate'
  | 'extension:deactivate'
  | 'config:update'
  | 'identity:create'
  | 'storage:store'
  | 'memory:create'
  | 'content:create'
  | 'social:follow'
  | 'circle:create';

/**
 * Operation Status
 */
export type OperationStatus = 'pending' | 'confirmed' | 'rejected' | 'superseded';

/**
 * SDK Operation - the core recordkeeping unit
 */
export interface SDKOperation {
  // Identity
  id: string;                          // CID of the operation
  type: SDKOperationType;
  author: string;                      // DID of the author
  
  // Content
  timestamp: number;                   // Unix timestamp
  payload: OperationPayload;
  previousOps: string[];              // CID of previous operations (chain)
  
  // Verification
  signature: string;
  merkleProof?: string;               // Proof in the operation chain
  
  // Status
  status: OperationStatus;
  confirmedAt?: number;
  blockNumber?: number;
}

/**
 * Operation payload
 */
export interface OperationPayload {
  // For node operations
  nodeId?: string;
  nodeDefinition?: Record<string, unknown>;
  
  // For config operations
  configKey?: string;
  configValue?: unknown;
  
  // For general operations
  data?: unknown;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

/**
 * Operation Chain
 */
export interface OperationChain {
  id: string;
  operations: string[];               // CIDs of operations
  merkleRoot: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Audit Entry
 */
export interface AuditEntry {
  operationId: string;
  type: SDKOperationType;
  author: string;
  timestamp: number;
  status: OperationStatus;
  blockNumber?: number;
  verified: boolean;
}

/**
 * Operation Filter
 */
export interface OperationFilter {
  types?: SDKOperationType[];
  authors?: string[];
  since?: number;
  until?: number;
  status?: OperationStatus[];
  limit?: number;
}

/**
 * Verification Result
 */
export interface VerificationResult {
  valid: boolean;
  chainValid: boolean;
  signatureValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * On-Chain Recordkeeping System
 */
export class OnChainRecordKeeper extends EventEmitter {
  private sdk: VivimSDK;
  private operations: Map<string, SDKOperation> = new Map();
  private chains: Map<string, OperationChain> = new Map();
  private currentChain: OperationChain | null = null;
  private pendingOps: SDKOperation[] = [];

  constructor(sdk: VivimSDK) {
    super();
    this.sdk = sdk;
  }

  // ============================================
  // OPERATION CREATION
  // ============================================

  /**
   * Create a new SDK operation
   */
  async createOperation(
    type: SDKOperationType,
    payload: OperationPayload,
    options?: {
      previousOps?: string[];
      chainId?: string;
    }
  ): Promise<SDKOperation> {
    const identity = this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity not initialized');
    }

    const now = Date.now();
    
    // Get previous operations for chain
    const previousOps = options?.previousOps || this.getLatestOperationCIDs(10);
    
    // Build operation data
    const operationData = {
      type,
      author: identity.did,
      timestamp: now,
      payload,
      previousOps,
    };

    // Sign the operation
    const signature = await this.sdk.sign(operationData);

    // Calculate CID for the operation
    const cid = await calculateCID({ ...operationData, signature });

    // Create operation
    const operation: SDKOperation = {
      id: cid,
      type,
      author: identity.did,
      timestamp: now,
      payload,
      previousOps,
      signature,
      status: 'pending',
    };

    // Store operation
    this.operations.set(cid, operation);
    this.pendingOps.push(operation);

    // Emit event
    this.emit('operation:created', operation);

    // Try to confirm if we have enough pending
    await this.tryConfirmOperations();

    return operation;
  }

  /**
   * Record a node creation
   */
  async recordNodeCreate(nodeId: string, definition: Record<string, unknown>): Promise<SDKOperation> {
    return this.createOperation('node:create', {
      nodeId,
      nodeDefinition: definition,
      metadata: { version: definition.version },
    });
  }

  /**
   * Record a node update
   */
  async recordNodeUpdate(nodeId: string, changes: Record<string, unknown>): Promise<SDKOperation> {
    return this.createOperation('node:update', {
      nodeId,
      data: changes,
      metadata: { updatedAt: Date.now() },
    });
  }

  /**
   * Record a node deletion
   */
  async recordNodeDelete(nodeId: string): Promise<SDKOperation> {
    return this.createOperation('node:delete', {
      nodeId,
      metadata: { deletedAt: Date.now() },
    });
  }

  /**
   * Record extension registration
   */
  async recordExtensionRegister(extensionId: string, pointId: string): Promise<SDKOperation> {
    return this.createOperation('extension:register', {
      nodeId: extensionId,
      data: { extends: pointId },
      metadata: { registeredAt: Date.now() },
    });
  }

  /**
   * Record config update
   */
  async recordConfigUpdate(key: string, value: unknown): Promise<SDKOperation> {
    return this.createOperation('config:update', {
      configKey: key,
      configValue: value,
      metadata: { updatedAt: Date.now() },
    });
  }

  /**
   * Record memory creation (for SDK knowledge)
   */
  async recordMemoryCreate(memoryId: string, content: string): Promise<SDKOperation> {
    return this.createOperation('memory:create', {
      nodeId: memoryId,
      data: { content },
      metadata: { createdAt: Date.now() },
    });
  }

  /**
   * Record content creation
   */
  async recordContentCreate(contentId: string, contentType: string): Promise<SDKOperation> {
    return this.createOperation('content:create', {
      nodeId: contentId,
      data: { type: contentType },
      metadata: { createdAt: Date.now() },
    });
  }

  // ============================================
  // OPERATION CONFIRMATION
  // ============================================

  /**
   * Try to confirm pending operations
   */
  private async tryConfirmOperations(): Promise<void> {
    if (this.pendingOps.length < 1) return;

    // In a real implementation, this would submit to a blockchain
    // For now, we confirm locally
    for (const op of this.pendingOps) {
      op.status = 'confirmed';
      op.confirmedAt = Date.now();
      op.blockNumber = Math.floor(Date.now() / 1000); // Mock block number

      this.emit('operation:confirmed', op);
    }

    this.pendingOps = [];
  }

  /**
   * Confirm operations (manual)
   */
  async confirmOperations(operationIds: string[]): Promise<void> {
    for (const id of operationIds) {
      const op = this.operations.get(id);
      if (op && op.status === 'pending') {
        op.status = 'confirmed';
        op.confirmedAt = Date.now();
        op.blockNumber = Math.floor(Date.now() / 1000);
        this.emit('operation:confirmed', op);
      }
    }
  }

  // ============================================
  // OPERATION QUERY
  // ============================================

  /**
   * Get operation by CID
   */
  getOperation(cid: string): SDKOperation | null {
    return this.operations.get(cid) || null;
  }

  /**
   * Query operations
   */
  queryOperations(filter: OperationFilter): SDKOperation[] {
    let results = Array.from(this.operations.values());

    if (filter.types && filter.types.length > 0) {
      results = results.filter(op => filter.types!.includes(op.type));
    }

    if (filter.authors && filter.authors.length > 0) {
      results = results.filter(op => filter.authors!.includes(op.author));
    }

    if (filter.since) {
      results = results.filter(op => op.timestamp >= filter.since!);
    }

    if (filter.until) {
      results = results.filter(op => op.timestamp <= filter.until!);
    }

    if (filter.status && filter.status.length > 0) {
      results = results.filter(op => filter.status!.includes(op.status));
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp - a.timestamp);

    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  /**
   * Get latest operation CIDs
   */
  private getLatestOperationCIDs(limit: number): string[] {
    const ops = this.queryOperations({ limit });
    return ops.map(op => op.id);
  }

  /**
   * Get operation chain for an operation
   */
  getOperationChain(operationId: string): SDKOperation[] {
    const chain: SDKOperation[] = [];
    let currentId: string | undefined = operationId;

    while (currentId) {
      const op = this.operations.get(currentId);
      if (!op) break;
      
      chain.unshift(op);
      currentId = op.previousOps[0];
    }

    return chain;
  }

  // ============================================
  // VERIFICATION
  // ============================================

  /**
   * Verify an operation
   */
  async verifyOperation(operationId: string): Promise<VerificationResult> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      return {
        valid: false,
        chainValid: false,
        signatureValid: false,
        errors: ['Operation not found'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Verify signature
    let signatureValid = false;
    try {
      const dataToVerify = {
        type: operation.type,
        author: operation.author,
        timestamp: operation.timestamp,
        payload: operation.payload,
        previousOps: operation.previousOps,
      };
      signatureValid = await this.sdk.verify(dataToVerify, operation.signature, operation.author);
    } catch (e) {
      errors.push(`Signature verification failed: ${e}`);
    }

    // Verify chain
    let chainValid = true;
    if (operation.previousOps.length > 0) {
      for (const prevId of operation.previousOps) {
        const prevOp = this.operations.get(prevId);
        if (!prevOp) {
          chainValid = false;
          warnings.push(`Previous operation not found: ${prevId}`);
        }
      }
    }

    // Verify status
    if (operation.status !== 'confirmed') {
      warnings.push(`Operation status is ${operation.status}, expected confirmed`);
    }

    return {
      valid: errors.length === 0 && signatureValid && chainValid,
      chainValid,
      signatureValid,
      errors,
      warnings,
    };
  }

  /**
   * Verify entire operation chain
   */
  async verifyChain(operationId: string): Promise<VerificationResult> {
    const chain = this.getOperationChain(operationId);
    
    let allValid = true;
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const op of chain) {
      const result = await this.verifyOperation(op.id);
      if (!result.valid) allValid = false;
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      valid: allValid,
      chainValid: allValid,
      signatureValid: allValid,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  // ============================================
  // AUDIT
  // ============================================

  /**
   * Get audit trail
   */
  getAuditTrail(filter: OperationFilter = {}): AuditEntry[] {
    const ops = this.queryOperations(filter);
    
    return ops.map(op => ({
      operationId: op.id,
      type: op.type,
      author: op.author,
      timestamp: op.timestamp,
      status: op.status,
      blockNumber: op.blockNumber,
      verified: op.status === 'confirmed',
    }));
  }

  /**
   * Get operations by author
   */
  getOperationsByAuthor(did: string): SDKOperation[] {
    return this.queryOperations({ authors: [did] });
  }

  /**
   * Get operations by type
   */
  getOperationsByType(type: SDKOperationType): SDKOperation[] {
    return this.queryOperations({ types: [type] });
  }

  // ============================================
  // EXPORT
  // ============================================

  /**
   * Export operations to JSON
   */
  exportOperations(filter: OperationFilter = {}): string {
    const ops = this.queryOperations(filter);
    return JSON.stringify(ops, null, 2);
  }

  /**
   * Export audit trail
   */
  exportAuditTrail(filter: OperationFilter = {}): string {
    const entries = this.getAuditTrail(filter);
    return JSON.stringify(entries, null, 2);
  }

  // ============================================
  // STATS
  // ============================================

  /**
   * Get statistics
   */
  getStats(): {
    totalOperations: number;
    confirmedOperations: number;
    pendingOperations: number;
    byType: Record<SDKOperationType, number>;
    byAuthor: Record<string, number>;
  } {
    const ops = Array.from(this.operations.values());
    
    const byType: Record<string, number> = {};
    const byAuthor: Record<string, number> = {};

    for (const op of ops) {
      byType[op.type] = (byType[op.type] || 0) + 1;
      byAuthor[op.author] = (byAuthor[op.author] || 0) + 1;
    }

    return {
      totalOperations: ops.length,
      confirmedOperations: ops.filter(o => o.status === 'confirmed').length,
      pendingOperations: ops.filter(o => o.status === 'pending').length,
      byType: byType as Record<SDKOperationType, number>,
      byAuthor,
    };
  }
}

/**
 * Decorator to automatically record SDK operations
 */
export function recordOperation(type: SDKOperationType) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

 async function (...args: unknown[]) {
      const record    descriptor.value =Keeper = (this as any).recordKeeper as OnChainRecordKeeper;
      
      if (recordKeeper) {
        try {
          await recordKeeper.createOperation(type, {
            data: { method: propertyKey, args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) },
            metadata: { target: propertyKey },
          });
        } catch (e) {
          console.warn('Failed to record operation:', e);
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
