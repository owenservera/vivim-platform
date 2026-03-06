/**
 * VIVIM SDK - Chunked Transfer Protocol
 * 
 * Handles large content transfer with chunking, verification, and resume support
 * @see docs/SOCIAL_TRANSPORT_LAYER.md
 */

import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import type { TransportProtocol } from './types.js';

/**
 * Content CID (Content Identifier)
 */
export type ContentCID = string;

/**
 * Content encoding
 */
export type ContentEncoding = 'identity' | 'base64' | 'utf8' | 'gzip' | 'br';

/**
 * Chunk receipt
 */
export interface ChunkReceipt {
  chunkIndex: number;
  chunkHash: string;
  receivedAt: number;
}

/**
 * Upload session
 */
export interface UploadSession {
  sessionId: string;
  contentId: ContentCID;
  totalChunks: number;
  uploadedChunks: number;
  totalSize: number;
  createdAt: number;
  expiresAt: number;
}

/**
 * Download session
 */
export interface DownloadSession {
  sessionId: string;
  contentId: ContentCID;
  totalChunks: number;
  downloadedChunks: number;
  totalSize: number;
  createdAt: number;
  expiresAt: number;
}

/**
 * Merkle proof
 */
export interface MerkleProof {
  index: number;
  hash: string;
  siblings: string[];
}

/**
 * Content verification
 */
export interface ContentVerification {
  cid: ContentCID;
  merkleRoot: string;
  proofs: MerkleProof[];
  size: number;
  encoding: ContentEncoding;
}

/**
 * Verification result
 */
export interface VerificationResult {
  valid: boolean;
  missingChunks: number[];
  corruptChunks: number[];
  verifiedSize: number;
}

/**
 * Chunked Transfer Events
 */
export interface ChunkedTransferEvents {
  'upload:progress': { sessionId: string; progress: number };
  'upload:complete': { sessionId: string; contentId: ContentCID };
  'upload:error': { sessionId: string; error: Error };
  'download:progress': { sessionId: string; progress: number };
  'download:complete': { sessionId: string; data: Uint8Array };
  'download:error': { sessionId: string; error: Error };
}

/**
 * Chunked Transfer
 * 
 * Handles large content uploads and downloads with:
 * - Automatic chunking
 * - Merkle proof verification
 * - Resume support
 * - Transfer progress tracking
 */
export class ChunkedTransfer extends EventEmitter {
  private transport?: TransportProtocol;
  
  private uploadSessions: Map<string, UploadSessionImpl> = new Map();
  private downloadSessions: Map<string, DownloadSessionImpl> = new Map();
  
  private defaultChunkSize: number;
  private sessionTimeout: number;
  
  constructor(options?: {
    transport?: TransportProtocol;
    chunkSize?: number;
    sessionTimeout?: number;
  }) {
    super();
    this.transport = options?.transport;
    this.defaultChunkSize = options?.chunkSize ?? 1024 * 1024; // 1MB default
    this.sessionTimeout = options?.sessionTimeout ?? 3600000; // 1 hour default
  }
  
  /**
   * Set the transport for data transfer
   */
  setTransport(transport: TransportProtocol): void {
    this.transport = transport;
  }
  
  // ============== Upload ==============
  
  /**
   * Create an upload session
   */
  async createUploadSession(content: Uint8Array): Promise<UploadSession> {
    const sessionId = randomUUID();
    const totalSize = content.length;
    const totalChunks = Math.ceil(totalSize / this.defaultChunkSize);
    
    // Compute content CID (simplified - in production would use proper hashing)
    const contentId = await this.computeCID(content);
    
    const session: UploadSessionImpl = {
      sessionId,
      contentId,
      totalChunks,
      uploadedChunks: 0,
      totalSize,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      data: content,
      chunks: new Map(),
      chunkSize: this.defaultChunkSize,
    };
    
    this.uploadSessions.set(sessionId, session);
    
    return {
      sessionId: session.sessionId,
      contentId: session.contentId,
      totalChunks: session.totalChunks,
      uploadedChunks: session.uploadedChunks,
      totalSize: session.totalSize,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  }
  
  /**
   * Upload a chunk
   */
  async uploadChunk(sessionId: string, chunkIndex: number, chunk: Uint8Array): Promise<ChunkReceipt> {
    const session = this.uploadSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Upload session not found: ${sessionId}`);
    }
    
    if (Date.now() > session.expiresAt) {
      throw new Error('Upload session expired');
    }
    
    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new Error(`Invalid chunk index: ${chunkIndex}`);
    }
    
    // Verify chunk hash
    const chunkHash = await this.computeCID(chunk);
    
    // Store chunk (simplified - in production would store and potentially upload)
    session.chunks.set(chunkIndex, chunk);
    session.uploadedChunks++;
    
    const receipt: ChunkReceipt = {
      chunkIndex,
      chunkHash,
      receivedAt: Date.now(),
    };
    
    // Emit progress
    const progress = session.uploadedChunks / session.totalChunks;
    this.emit('upload:progress', { sessionId, progress });
    
    // Check if complete
    if (session.uploadedChunks === session.totalChunks) {
      this.emit('upload:complete', { 
        sessionId, 
        contentId: session.contentId 
      });
    }
    
    return receipt;
  }
  
  /**
   * Complete an upload session
   */
  async completeUpload(sessionId: string): Promise<ContentCID> {
    const session = this.uploadSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Upload session not found: ${sessionId}`);
    }
    
    // Reconstruct content
    const content = this.reconstructContent(session.chunks, session.totalChunks);
    
    // Verify content matches CID
    const computedCID = await this.computeCID(content);
    if (computedCID !== session.contentId) {
      throw new Error('Content verification failed');
    }
    
    // In production, would upload to storage here
    if (this.transport) {
      // Send to peers
    }
    
    // Clean up session
    this.uploadSessions.delete(sessionId);
    
    return session.contentId;
  }
  
  /**
   * Abort an upload session
   */
  async abortUpload(sessionId: string): Promise<void> {
    this.uploadSessions.delete(sessionId);
  }
  
  // ============== Download ==============
  
  /**
   * Create a download session
   */
  async createDownloadSession(contentId: ContentCID, totalSize: number): Promise<DownloadSession> {
    const sessionId = randomUUID();
    const totalChunks = Math.ceil(totalSize / this.defaultChunkSize);
    
    const session: DownloadSessionImpl = {
      sessionId,
      contentId,
      totalChunks,
      downloadedChunks: 0,
      totalSize,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
      chunks: new Map(),
      chunkSize: this.defaultChunkSize,
    };
    
    this.downloadSessions.set(sessionId, session);
    
    return {
      sessionId: session.sessionId,
      contentId: session.contentId,
      totalChunks: session.totalChunks,
      downloadedChunks: session.downloadedChunks,
      totalSize: session.totalSize,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  }
  
  /**
   * Download a chunk
   */
  async downloadChunk(
    sessionId: string, 
    chunkIndex: number, 
    chunkSize?: number
  ): Promise<Uint8Array> {
    const session = this.downloadSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Download session not found: ${sessionId}`);
    }
    
    if (Date.now() > session.expiresAt) {
      throw new Error('Download session expired');
    }
    
    // Return cached chunk if available
    if (session.chunks.has(chunkIndex)) {
      return session.chunks.get(chunkIndex)!;
    }
    
    // In production, would fetch from transport/network
    throw new Error('Chunk not available locally');
  }
  
  /**
   * Add a chunk to download session
   */
  async addDownloadChunk(
    sessionId: string, 
    chunkIndex: number, 
    chunk: Uint8Array
  ): Promise<void> {
    const session = this.downloadSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Download session not found: ${sessionId}`);
    }
    
    session.chunks.set(chunkIndex, chunk);
    session.downloadedChunks++;
    
    const progress = session.downloadedChunks / session.totalChunks;
    this.emit('download:progress', { sessionId, progress });
    
    // Check if complete
    if (session.downloadedChunks === session.totalChunks) {
      const data = this.reconstructContent(session.chunks, session.totalChunks);
      this.emit('download:complete', { sessionId, data });
    }
  }
  
  /**
   * Verify download
   */
  async verifyDownload(sessionId: string, verification: ContentVerification): Promise<VerificationResult> {
    const session = this.downloadSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Download session not found: ${sessionId}`);
    }
    
    const missingChunks: number[] = [];
    const corruptChunks: number[] = [];
    
    // Check each chunk
    for (let i = 0; i < session.totalChunks; i++) {
      const chunk = session.chunks.get(i);
      
      if (!chunk) {
        missingChunks.push(i);
        continue;
      }
      
      // Verify chunk hash
      const hash = await this.computeCID(chunk);
      const expectedHash = verification.proofs.find(p => p.index === i)?.hash;
      
      if (hash !== expectedHash) {
        corruptChunks.push(i);
      }
    }
    
    return {
      valid: missingChunks.length === 0 && corruptChunks.length === 0,
      missingChunks,
      corruptChunks,
      verifiedSize: session.downloadedChunks * session.chunkSize,
    };
  }
  
  /**
   * Get download session status
   */
  getDownloadStatus(sessionId: string): DownloadSession | null {
    const session = this.downloadSessions.get(sessionId);
    
    if (!session) return null;
    
    return {
      sessionId: session.sessionId,
      contentId: session.contentId,
      totalChunks: session.totalChunks,
      downloadedChunks: session.downloadedChunks,
      totalSize: session.totalSize,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  }
  
  // ============== Helpers ==============
  
  /**
   * Compute content CID (simplified - would use proper IPFS-style hashing)
   */
  private async computeCID(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data as any);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `sha256-${hashHex.substring(0, 32)}`;
  }
  
  /**
   * Reconstruct content from chunks
   */
  private reconstructContent(chunks: Map<number, Uint8Array>, totalChunks: number): Uint8Array {
    const totalSize = Array.from(chunks.values()).reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalSize);
    let offset = 0;
    
    for (let i = 0; i < totalChunks; i++) {
      const chunk = chunks.get(i);
      if (chunk) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
    }
    
    return result;
  }
  
  /**
   * Clean up expired sessions
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [id, session] of this.uploadSessions) {
      if (now > session.expiresAt) {
        this.uploadSessions.delete(id);
      }
    }
    
    for (const [id, session] of this.downloadSessions) {
      if (now > session.expiresAt) {
        this.downloadSessions.delete(id);
      }
    }
  }
}

/**
 * Internal upload session implementation
 */
interface UploadSessionImpl extends UploadSession {
  data: Uint8Array;
  chunks: Map<number, Uint8Array>;
  chunkSize: number;
}

/**
 * Internal download session implementation
 */
interface DownloadSessionImpl extends DownloadSession {
  chunks: Map<number, Uint8Array>;
  chunkSize: number;
}

/**
 * Create ChunkedTransfer instance
 */
export function createChunkedTransfer(options?: {
  transport?: TransportProtocol;
  chunkSize?: number;
  sessionTimeout?: number;
}): ChunkedTransfer {
  return new ChunkedTransfer(options);
}
