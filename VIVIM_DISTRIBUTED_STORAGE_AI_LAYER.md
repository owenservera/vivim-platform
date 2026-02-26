# VIVIM Distributed Storage & AI Interaction Layer

## Complete Design for Instagram-Scale Distributed Storage + assistant-ui/tool-ui Integration

---

# PART 1: DISTRIBUTED STORAGE LAYER

## 1.1 Vision: Instagram on the Blockchain

The goal is to enable fully distributed, on-chain public storage for content - like Instagram but without central servers. When content is "posted to the network," it becomes:

1. **Content-Addressed** - Stored by CID, retrievable from any peer
2. **Permanently Available** - Replicated across storage providers
3. **On-Chain Referenced** - Metadata anchored to blockchain for discoverability
4. **Economically Sustainable** - Storage providers incentivized to persist data

## 1.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VIVIM DISTRIBUTED STORAGE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        APPLICATION LAYER                             │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │  Feed     │  │  Profile  │  │  Explore  │  │  Search   │        │   │
│  │  │  View     │  │  View     │  │  View     │  │  View     │        │   │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘        │   │
│  └────────┼──────────────┼──────────────┼──────────────┼───────────────┘   │
│           │              │              │              │                    │
│  ┌────────▼──────────────▼──────────────▼──────────────▼───────────────┐   │
│  │                     CONTENT ACCESS LAYER                             │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │   │
│  │  │ ContentClient  │  │ StorageDeals   │  │ RetrievalMarket│        │   │
│  │  │ (Unified API)  │  │ Manager        │  │ Client         │        │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        STORAGE LAYER                                 │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ IPFS/Helia  │  │   DWN       │  │   Cache     │  │   Local     │ │   │
│  │  │ (Public)    │  │ (Private)   │  │  (Edge)     │  │ (IndexedDB) │ │   │
│  │  │             │  │             │  │             │  │             │ │   │
│  │  │ Hot: Yes    │  │ Hot: Yes    │  │ Hot: Yes    │  │ Hot: Yes    │ │   │
│  │  │ Perm: File  │  │ Perm: Sync  │  │ Perm: TTL   │  │ Perm: User  │ │   │
│  │  │             │  │             │  │             │  │             │ │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │   │
│  │         │                │                │                │        │   │
│  └─────────┼────────────────┼────────────────┼────────────────┼────────┘   │
│            │                │                │                │             │
│  ┌─────────▼────────────────▼────────────────▼────────────────▼────────┐   │
│  │                     PROVIDER NETWORK                                 │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ Storage     │  │ Retrieval   │  │ Indexer     │  │ Anchor      │ │   │
│  │  │ Providers   │  │ Providers   │  │ Nodes       │  │ Service     │ │   │
│  │  │ (Filecoin)  │  │ (Saturn)    │  │ (DHT)       │  │ (Blockchain)│ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       ON-CHAIN LAYER                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ Content     │  │ Storage     │  │ Payment     │  │ Governance  │ │   │
│  │  │ Registry    │  │ Deals       │  │ Channels    │  │ (DAO)       │ │   │
│  │  │ (Smart Cont)│  │ (FVM)       │  │ (State Ch)  │  │             │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.3 Storage Tiers

### Tier 1: Hot Storage (Immediate Access)

| Storage Type | Use Case | Latency | Persistence | Cost |
|-------------|----------|---------|-------------|------|
| **Local (IndexedDB)** | User's own content | <1ms | Until cleared | Free |
| **DWN (Personal)** | Private user data | 10-50ms | User-controlled | Free |
| **P2P Cache (Memory)** | Recently accessed | 50-200ms | TTL-based | Free |
| **Edge CDN** | Popular content | 50-100ms | TTL + Pin | Low |

### Tier 2: Warm Storage (IPFS Network)

| Storage Type | Use Case | Latency | Persistence | Cost |
|-------------|----------|---------|-------------|------|
| **IPFS (Pinned)** | Active public content | 100ms-2s | Until unpinned | Provider-dependent |
| **IPFS (MFS)** | User's file system | 100ms-2s | User-controlled | Free |
| **Libp2p Bitswap** | P2P retrieval | Variable | No guarantee | Free |

### Tier 3: Cold Storage (Permanent)

| Storage Type | Use Case | Latency | Persistence | Cost |
|-------------|----------|---------|-------------|------|
| **Filecoin Deals** | Permanent archival | Minutes-hours | Contract-based | FIL |
| **Arweave** | Permanent storage | Seconds | 200+ years | AR |
| **On-Chain Anchor** | Metadata only | Block time | Indefinite | Gas |

## 1.4 Content Lifecycle

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   CREATE     │────▶│    STORE     │────▶│   PUBLISH    │────▶│   PRESERVE   │
│   (Local)    │     │   (IPFS)     │     │   (Network)  │     │   (Filecoin) │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
  User creates        CID generated        DHT announcement    Storage deal
  content locally     IPFS add/pin         GossipSub broadcast  SLA contract
  IndexedDB store     Local pin set        Registry update      Payment escrow
```

## 1.5 Core Data Structures

### Content Object

```typescript
interface ContentObject {
  // === Identity ===
  cid: string;                    // IPFS CID (content-addressed)
  id: string;                     // UUID for internal reference
  
  // === Content ===
  type: ContentType;
  media: MediaMetadata;
  text?: string;
  
  // === Authorship ===
  author: string;                 // DID of creator
  signature: string;              // Ed25519 signature over CID
  timestamp: number;
  
  // === Access Control ===
  visibility: 'public' | 'circle' | 'friends' | 'private';
  encryption?: {
    algorithm: 'xchacha20-poly1305';
    encryptedKey: string;         // Encrypted for each recipient
    recipients: string[];         // DIDs with access
  };
  
  // === Storage ===
  storage: StorageInfo;
  
  // === Discovery ===
  tags: string[];
  mentions: string[];             // DIDs mentioned
  location?: GeoLocation;
  
  // === Engagement ===
  interactions: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
}

enum ContentType {
  POST = 'post',                  // Text + optional media
  IMAGE = 'image',                // Single image
  VIDEO = 'video',                // Video content
  AUDIO = 'audio',                // Audio content
  GALLERY = 'gallery',            // Multiple images
  ARTICLE = 'article',            // Long-form text
  ACU = 'acu',                    // Atomic Chat Unit
  MEMORY = 'memory',              // Knowledge fragment
  CONVERSATION = 'conversation',  // AI conversation
}

interface MediaMetadata {
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;              // For video/audio
  thumbnails: Thumbnail[];
  transcoded?: TranscodedVersion[];
}

interface Thumbnail {
  cid: string;
  width: number;
  height: number;
  quality: 'low' | 'medium' | 'high';
}

interface TranscodedVersion {
  cid: string;
  resolution: string;             // '720p', '1080p', '4k'
  bitrate: number;
  codec: string;
}
```

### Storage Deal Structure

```typescript
interface StorageDeal {
  // === Deal Identity ===
  dealId: string;
  cid: string;                    // Content being stored
  
  // === Parties ===
  client: string;                 // DID of content owner
  provider: string;               // Peer ID of storage provider
  
  // === Terms ===
  pieceSize: number;              // Size in bytes
  duration: number;               // Duration in blocks/days
  price: bigint;                  // Price per epoch
  collateral: bigint;             // Provider's collateral
  
  // === State ===
  state: DealState;
  createdAt: number;
  startsAt: number;
  expiresAt: number;
  
  // === On-Chain Reference ===
  chainRef?: {
    chain: 'filecoin' | 'arweave' | 'polygon';
    txHash: string;
    contractAddress: string;
    dealIdOnChain: string;
  };
  
  // === Proofs ===
  proofs: StorageProof[];
}

enum DealState {
  PROPOSED = 'proposed',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SLASHED = 'slashed',            // Provider failed
  COMPLETED = 'completed',
}

interface StorageProof {
  epoch: number;
  proofType: 'WindowPoSt' | 'Seal';
  submittedAt: number;
  verified: boolean;
}
```

## 1.6 Content Client API

```typescript
class DistributedContentClient {
  // ============================================
  // CONTENT CREATION
  // ============================================
  
  /**
   * Create content with automatic storage tier selection
   */
  async createContent(options: {
    type: ContentType;
    media?: File | Blob;
    text?: string;
    visibility: 'public' | 'circle' | 'friends' | 'private';
    circleIds?: string[];
    tags?: string[];
    mentions?: string[];
    location?: GeoLocation;
  }): Promise<ContentObject>;
  
  /**
   * Upload media to IPFS with transcoding
   */
  async uploadMedia(file: File, options?: {
    transcode?: boolean;
    generateThumbnails?: boolean;
    maxResolution?: string;
  }): Promise<{
    cid: string;
    thumbnails: Thumbnail[];
    transcoded?: TranscodedVersion[];
  }>;
  
  // ============================================
  // STORAGE MANAGEMENT
  // ============================================
  
  /**
   * Pin content to local storage
   */
  async pinContent(cid: string): Promise<void>;
  
  /**
   * Unpin content from local storage
   */
  async unpinContent(cid: string): Promise<void>;
  
  /**
   * Create storage deal for permanent storage
   */
  async createStorageDeal(cid: string, options: {
    duration: number;             // Days
    provider?: string;            // Preferred provider
    maxPrice?: bigint;
    replication?: number;         // Number of providers
  }): Promise<StorageDeal>;
  
  /**
   * Get storage status for content
   */
  async getStorageStatus(cid: string): Promise<{
    localPinned: boolean;
    ipfsProviders: string[];
    filecoinDeals: StorageDeal[];
    availability: number;         // 0-100%
  }>;
  
  // ============================================
  // CONTENT RETRIEVAL
  // ============================================
  
  /**
   * Get content by CID
   */
  async getContent(cid: string): Promise<ContentObject>;
  
  /**
   * Get media stream (for video/audio)
   */
  async getMediaStream(cid: string): Promise<ReadableStream>;
  
  /**
   * Get thumbnail
   */
  async getThumbnail(cid: string, quality?: 'low' | 'medium' | 'high'): Promise<Blob>;
  
  /**
   * Preload content for offline access
   */
  async preloadContent(cid: string): Promise<void>;
  
  // ============================================
  // DISCOVERY & FEED
  // ============================================
  
  /**
   * Get feed for user
   */
  async getFeed(options?: {
    type?: 'following' | 'discover' | 'trending';
    cursor?: string;
    limit?: number;
  }): Promise<ContentObject[]>;
  
  /**
   * Get content by author
   */
  async getAuthorContent(did: string, options?: {
    type?: ContentType[];
    limit?: number;
    cursor?: string;
  }): Promise<ContentObject[]>;
  
  /**
   * Search content
   */
  async searchContent(query: {
    text?: string;
    tags?: string[];
    type?: ContentType[];
    author?: string;
    dateRange?: { from: number; to: number };
  }): Promise<ContentObject[]>;
  
  /**
   * Get content by location
   */
  async getContentByLocation(bounds: GeoBounds, options?: {
    type?: ContentType[];
    limit?: number;
  }): Promise<ContentObject[]>;
  
  // ============================================
  // INTERACTIONS
  // ============================================
  
  /**
   * Like content
   */
  async likeContent(cid: string): Promise<void>;
  
  /**
   * Unlike content
   */
  async unlikeContent(cid: string): Promise<void>;
  
  /**
   * Comment on content
   */
  async comment(cid: string, text: string, options?: {
    visibility: 'public' | 'circle' | 'friends';
  }): Promise<ContentObject>;
  
  /**
   * Share content
   */
  async shareContent(cid: string, options: {
    type: 'repost' | 'quote';
    text?: string;
  }): Promise<ContentObject>;
  
  /**
   * Save content to collection
   */
  async saveContent(cid: string, collectionId?: string): Promise<void>;
  
  // ============================================
  // STORAGE PROVIDER INTERACTION
  // ============================================
  
  /**
   * Find storage providers
   */
  async findStorageProviders(options?: {
    minReplication?: number;
    maxPrice?: bigint;
    region?: string;
  }): Promise<StorageProviderInfo[]>;
  
  /**
   * Get provider reputation
   */
  async getProviderReputation(providerId: string): Promise<{
    score: number;
    uptime: number;
    totalDeals: number;
    slashedDeals: number;
    avgResponseTime: number;
  }>;
}

// ============================================
// SUPPORTING TYPES
// ============================================

interface StorageProviderInfo {
  peerId: string;
  multiaddrs: string[];
  region: string;
  pricePerGiBPerEpoch: bigint;
  minDealSize: number;
  maxDealDuration: number;
  reputation: number;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

interface GeoBounds {
  northEast: GeoLocation;
  southWest: GeoLocation;
}
```

## 1.7 On-Chain Content Registry

```typescript
// Smart contract interface for content registry
interface ContentRegistryContract {
  // === Content Registration ===
  
  /**
   * Register content on-chain
   * Creates immutable record of content existence
   */
  registerContent(params: {
    cid: string;
    author: string;
    contentType: string;
    visibility: number;           // Enum encoded
    encrypted: boolean;
    tags: string[];
  }): Promise<{ txHash: string; blockNumber: number }>;
  
  /**
   * Update content metadata (only by author)
   */
  updateContent(cid: string, updates: {
    tags?: string[];
    visibility?: number;
  }): Promise<{ txHash: string }>;
  
  /**
   * Transfer content ownership
   */
  transferOwnership(cid: string, newAuthor: string): Promise<{ txHash: string }>;
  
  // === Storage Deals ===
  
  /**
   * Propose storage deal
   */
  proposeDeal(params: {
    cid: string;
    provider: string;
    duration: number;
    price: bigint;
    collateral: bigint;
  }): Promise<{ dealId: string }>;
  
  /**
   * Accept storage deal (provider only)
   */
  acceptDeal(dealId: string): Promise<{ txHash: string }>;
  
  /**
   * Submit storage proof
   */
  submitProof(dealId: string, proof: StorageProof): Promise<{ verified: boolean }>;
  
  /**
   * Slash provider for failed proof
   */
  slashProvider(dealId: string, reason: string): Promise<{ slashedAmount: bigint }>;
  
  // === Payment Channels ===
  
  /**
   * Open payment channel for storage
   */
  openPaymentChannel(params: {
    provider: string;
    amount: bigint;
    duration: number;
  }): Promise<{ channelId: string }>;
  
  /**
   * Claim payment from channel
   */
  claimPayment(channelId: string, amount: bigint): Promise<{ txHash: string }>;
  
  // === Query Functions ===
  
  /**
   * Get content metadata
   */
  getContent(cid: string): Promise<{
    author: string;
    registeredAt: number;
    contentType: string;
    visibility: number;
    dealCount: number;
  }>;
  
  /**
   * Get deals for content
   */
  getContentDeals(cid: string): Promise<string[]>;
  
  /**
   * Get deal details
   */
  getDeal(dealId: string): Promise<StorageDeal>;
  
  /**
   * Get author's content
   */
  getAuthorContent(author: string, offset: number, limit: number): Promise<string[]>;
}
```

## 1.8 Storage Deal Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          STORAGE DEAL LIFECYCLE                              │
└──────────────────────────────────────────────────────────────────────────────┘

Content Owner                          Storage Provider                    On-Chain
     │                                      │                                  │
     │  1. Request Deal                     │                                  │
     │  (CID, Duration, Price)              │                                  │
     │─────────────────────────────────────▶│                                  │
     │                                      │                                  │
     │  2. Deal Proposal                    │                                  │
     │  (Terms, Collateral)                 │                                  │
     │◀─────────────────────────────────────│                                  │
     │                                      │                                  │
     │                                      │  3. Publish Deal Proposal        │
     │                                      │─────────────────────────────────▶│
     │                                      │                                  │
     │                                      │  4. Deal Published               │
     │                                      │  (dealId, Activation)            │
     │                                      │◀─────────────────────────────────│
     │                                      │                                  │
     │  5. Transfer Data                    │                                  │
     │  (IPFS GraphSync)                    │                                  │
     │─────────────────────────────────────▶│                                  │
     │                                      │                                  │
     │                                      │  6. Seal Data (Proof-of-Replication)
     │                                      │─────────────────────────────────▶│
     │                                      │                                  │
     │  7. Deal Active                      │                                  │
     │◀─────────────────────────────────────│                                  │
     │                                      │                                  │
     │                                      │  8. Submit WindowPoSt            │
     │                                      │  (Periodic Proofs)               │
     │                                      │─────────────────────────────────▶│
     │                                      │                                  │
     │                                      │  9. Verify & Pay                 │
     │                                      │◀─────────────────────────────────│
     │                                      │                                  │
     │  ... (Duration Passes) ...           │                                  │
     │                                      │                                  │
     │                                      │  10. Deal Expires                │
     │                                      │─────────────────────────────────▶│
     │                                      │                                  │
     │  11. Data Retrieved or Renewed       │                                  │
     │◀─────────────────────────────────────│                                  │
     │                                      │                                  │
```

---

# PART 2: AI INTERACTION LAYER (assistant-ui + tool-ui)

## 2.1 Overview

The AI Interaction Layer bridges VIVIM's blockchain capabilities with the UI libraries:

- **assistant-ui-VIVIM**: Chat interface components
- **tool-ui-VIVIM**: Tool call rendering components

This layer enables:
1. AI conversations stored as on-chain events
2. Tool calls that interact with the blockchain
3. Distributed memory/knowledge integration
4. P2P AI assistant capabilities

## 2.2 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI INTERACTION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        UI COMPONENTS                                   │  │
│  │                                                                        │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐                  │  │
│  │  │   assistant-ui-VIVIM │  │    tool-ui-VIVIM     │                  │  │
│  │  │                      │  │                      │                  │  │
│  │  │  • Thread            │  │  • ApprovalCard      │                  │  │
│  │  │  • MessageList       │  │  • OptionList        │                  │  │
│  │  │  • Composer          │  │  • QuestionFlow      │                  │  │
│  │  │  • Attachment        │  │  • DataTable         │                  │  │
│  │  │  • ToolFallback      │  │  • Chart             │                  │  │
│  │  │  • Markdown          │  │  • ImageGallery      │                  │  │
│  │  │  • CodeBlock         │  │  • VideoPlayer       │                  │  │
│  │  │                      │  │  • Plan              │                  │  │
│  │  └──────────┬───────────┘  └──────────┬───────────┘                  │  │
│  │             │                         │                               │  │
│  └─────────────┼─────────────────────────┼───────────────────────────────┘  │
│                │                         │                                   │
│  ┌─────────────▼─────────────────────────▼───────────────────────────────┐  │
│  │                     VIVIM RUNTIME ADAPTER                              │  │
│  │                                                                        │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │  │
│  │  │ ChatRuntime    │  │ ToolRegistry   │  │ MemoryAdapter  │          │  │
│  │  │                │  │                │  │                │          │  │
│  │  │ • Stream       │  │ • Register     │  │ • Context      │          │  │
│  │  │ • History      │  │ • Execute      │  │ • Recall       │          │  │
│  │  │ • Branch       │  │ • Validate     │  │ • Store        │          │  │
│  │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘          │  │
│  │          │                   │                   │                    │  │
│  └──────────┼───────────────────┼───────────────────┼────────────────────┘  │
│             │                   │                   │                       │
│  ┌──────────▼───────────────────▼───────────────────▼────────────────────┐  │
│  │                        CHAIN CLIENT                                    │  │
│  │                                                                        │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │  │
│  │  │ VivimChain     │  │ Distributed    │  │ AI Model       │          │  │
│  │  │ Client         │  │ Content        │  │ Providers      │          │  │
│  │  │                │  │ Client         │  │                │          │  │
│  │  │ • Events       │  │                │  │ • OpenAI       │          │  │
│  │  │ • Entities     │  │ • Store        │  │ • Anthropic    │          │  │
│  │  │ • Sync         │  │ • Retrieve     │  │ • Local (Ollama)│          │  │
│  │  │ • Subscribe    │  │ • Pin          │  │ • Custom       │          │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘          │  │
│  │                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.3 Chat Runtime Adapter

Connects assistant-ui to VIVIM's blockchain:

```typescript
import { AssistantRuntime, ThreadRuntime } from '@assistant-ui/react';
import { VivimChainClient } from '@vivim/network-engine';

/**
 * VIVIM Chat Runtime
 * Bridges assistant-ui with blockchain-stored conversations
 */
export class VivimChatRuntime implements AssistantRuntime {
  private chainClient: VivimChainClient;
  private conversationId: string;
  private subscriptions: (() => void)[] = [];
  
  constructor(options: {
    chainClient: VivimChainClient;
    conversationId?: string;
    modelProvider: ModelProvider;
  }) {
    this.chainClient = options.chainClient;
    this.conversationId = options.conversationId || this.generateId();
  }
  
  // ============================================
  // THREAD MANAGEMENT
  // ============================================
  
  /**
   * Get current thread
   */
  get thread(): ThreadRuntime {
    return new VivimThreadRuntime({
      chainClient: this.chainClient,
      conversationId: this.conversationId,
    });
  }
  
  /**
   * Create new thread (new conversation)
   */
  async newThread(): Promise<void> {
    // Create new conversation entity on-chain
    const { entityId } = await this.chainClient.createEntity('conversation', {
      title: 'New Conversation',
      provider: 'vivim-p2p',
      model: 'auto',
      createdAt: Date.now(),
    });
    
    this.conversationId = entityId;
    this.emit('thread-change');
  }
  
  /**
   * Switch to existing thread
   */
  async switchToThread(threadId: string): Promise<void> {
    // Load conversation from blockchain
    const conversation = await this.chainClient.getEntity(threadId);
    if (!conversation) {
      throw new Error(`Conversation ${threadId} not found`);
    }
    
    this.conversationId = threadId;
    this.emit('thread-change');
  }
  
  /**
   * List all threads for user
   */
  async listThreads(): Promise<ThreadInfo[]> {
    // Query conversations from DHT/Chain
    const conversations = await this.chainClient.queryEvents({
      types: ['conversation:create'],
      authors: [this.chainClient.getIdentity()!.did],
    });
    
    return conversations.map(conv => ({
      threadId: conv.entityId!,
      title: conv.payload.title,
      createdAt: conv.timestamp,
      messageCount: 0, // Would query message count
    }));
  }
  
  // ============================================
  // MESSAGE HANDLING
  // ============================================
  
  /**
   * Send message
   */
  async sendMessage(content: string, attachments?: Attachment[]): Promise<void> {
    // 1. Upload attachments if any
    const uploadedAttachments = attachments 
      ? await Promise.all(attachments.map(a => this.uploadAttachment(a)))
      : [];
    
    // 2. Create message entity on-chain
    await this.chainClient.createEntity('message', {
      conversationId: this.conversationId,
      role: 'user',
      content,
      attachments: uploadedAttachments,
      createdAt: Date.now(),
    });
    
    // 3. Emit to UI
    this.emit('message', { content, role: 'user' });
    
    // 4. Get AI response
    await this.processAIResponse(content, uploadedAttachments);
  }
  
  /**
   * Process AI response
   */
  private async processAIResponse(
    userContent: string, 
    attachments: UploadedAttachment[]
  ): Promise<void> {
    // 1. Build context from memory
    const context = await this.buildContext(userContent);
    
    // 2. Stream response from AI provider
    const stream = await this.modelProvider.streamChat({
      messages: [
        ...context.history,
        { role: 'user', content: userContent },
      ],
      tools: this.getAvailableTools(),
    });
    
    // 3. Process stream and create message
    let fullContent = '';
    const toolCalls: ToolCall[] = [];
    
    for await (const chunk of stream) {
      if (chunk.type === 'text') {
        fullContent += chunk.text;
        this.emit('stream', { text: chunk.text });
      } else if (chunk.type === 'tool_call') {
        toolCalls.push(chunk.toolCall);
        this.emit('tool-call', chunk.toolCall);
      }
    }
    
    // 4. Store assistant message on-chain
    await this.chainClient.createEntity('message', {
      conversationId: this.conversationId,
      role: 'assistant',
      content: fullContent,
      toolCalls,
      createdAt: Date.now(),
    });
    
    // 5. Extract ACUs from conversation
    await this.extractKnowledge(userContent, fullContent);
  }
  
  // ============================================
  // ATTACHMENTS
  // ============================================
  
  /**
   * Upload attachment to distributed storage
   */
  private async uploadAttachment(
    attachment: Attachment
  ): Promise<UploadedAttachment> {
    const contentClient = this.chainClient.getContentClient();
    
    // Upload to IPFS
    const result = await contentClient.uploadMedia(attachment.file, {
      transcode: attachment.type.startsWith('video/'),
      generateThumbnails: true,
    });
    
    return {
      cid: result.cid,
      name: attachment.name,
      type: attachment.type,
      size: attachment.size,
      thumbnails: result.thumbnails,
      transcoded: result.transcoded,
    };
  }
  
  // ============================================
  // CONTEXT BUILDING
  // ============================================
  
  /**
   * Build context from distributed memory
   */
  private async buildContext(query: string): Promise<{
    history: ChatMessage[];
    memories: MemoryContext[];
  }> {
    // 1. Get conversation history from chain
    const messages = await this.chainClient.queryEvents({
      types: ['message:create'],
      entityIds: [this.conversationId],
    });
    
    const history = messages.map(m => ({
      role: m.payload.role,
      content: m.payload.content,
    }));
    
    // 2. Search distributed memory for relevant context
    const memories = await this.chainClient.queryEvents({
      types: ['memory:create'],
      tags: this.extractKeywords(query),
    });
    
    return { history, memories };
  }
  
  // ============================================
  // KNOWLEDGE EXTRACTION
  // ============================================
  
  /**
   * Extract ACUs from conversation
   */
  private async extractKnowledge(
    userMessage: string, 
    assistantMessage: string
  ): Promise<void> {
    // Use AI to extract knowledge units
    const extraction = await this.modelProvider.extractKnowledge({
      conversation: [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantMessage },
      ],
    });
    
    // Create ACU entities for each extracted insight
    for (const acu of extraction.acus) {
      await this.chainClient.createEntity('acu', {
        content: acu.content,
        type: acu.type,
        category: acu.category,
        conversationId: this.conversationId,
        tags: acu.tags,
        sharingPolicy: 'self', // Default to private
      });
    }
  }
  
  // ============================================
  // SUBSCRIPTIONS
  // ============================================
  
  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (update: RuntimeUpdate) => void): () => void {
    const unsubscribe = this.chainClient.subscribe({
      entityIds: [this.conversationId],
    }, (event) => {
      callback({
        type: 'event',
        event,
      });
    });
    
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }
}
```

## 2.4 Tool Registry

Registers blockchain-interacting tools for AI:

```typescript
import { Tool, ToolExecutor } from '@assistant-ui/react';

/**
 * VIVIM Tool Registry
 * Provides tools for AI to interact with blockchain and storage
 */
export class VivimToolRegistry {
  private chainClient: VivimChainClient;
  private contentClient: DistributedContentClient;
  private tools: Map<string, RegisteredTool> = new Map();
  
  constructor(options: {
    chainClient: VivimChainClient;
    contentClient: DistributedContentClient;
  }) {
    this.chainClient = options.chainClient;
    this.contentClient = options.contentClient;
    this.registerDefaultTools();
  }
  
  // ============================================
  // TOOL REGISTRATION
  // ============================================
  
  /**
   * Register a tool
   */
  register(tool: RegisteredTool): void {
    this.tools.set(tool.name, tool);
  }
  
  /**
   * Get all tools for AI
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }
  
  /**
   * Execute a tool
   */
  async execute(name: string, params: any): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    
    // Validate parameters
    const validated = tool.parameters.parse(params);
    
    // Execute tool
    return tool.executor(validated, {
      chainClient: this.chainClient,
      contentClient: this.contentClient,
    });
  }
  
  // ============================================
  // DEFAULT TOOLS
  // ============================================
  
  private registerDefaultTools(): void {
    // === STORAGE TOOLS ===
    
    this.register({
      name: 'store_content',
      description: 'Store content on the distributed network',
      parameters: z.object({
        content: z.string(),
        type: z.enum(['post', 'image', 'video', 'document']),
        visibility: z.enum(['public', 'circle', 'friends', 'private']),
        tags: z.array(z.string()).optional(),
      }),
      executor: async (params, ctx) => {
        const result = await ctx.contentClient.createContent({
          type: params.type as ContentType,
          text: params.content,
          visibility: params.visibility,
          tags: params.tags,
        });
        
        return {
          success: true,
          cid: result.cid,
          message: `Content stored with CID: ${result.cid}`,
        };
      },
      uiComponent: 'StorageReceipt', // From tool-ui
    });
    
    this.register({
      name: 'search_content',
      description: 'Search content on the distributed network',
      parameters: z.object({
        query: z.string(),
        type: z.enum(['post', 'image', 'video', 'all']).optional(),
        limit: z.number().optional(),
      }),
      executor: async (params, ctx) => {
        const results = await ctx.contentClient.searchContent({
          text: params.query,
          type: params.type === 'all' ? undefined : params.type,
          limit: params.limit || 10,
        });
        
        return {
          success: true,
          results: results.map(r => ({
            cid: r.cid,
            author: r.author,
            preview: r.text?.substring(0, 200),
            type: r.type,
          })),
        };
      },
      uiComponent: 'SearchResults',
    });
    
    this.register({
      name: 'create_storage_deal',
      description: 'Create a permanent storage deal on Filecoin',
      parameters: z.object({
        cid: z.string(),
        durationDays: z.number(),
        replication: z.number().optional(),
      }),
      executor: async (params, ctx) => {
        const deal = await ctx.contentClient.createStorageDeal(
          params.cid,
          {
            duration: params.durationDays,
            replication: params.replication || 1,
          }
        );
        
        return {
          success: true,
          dealId: deal.dealId,
          provider: deal.provider,
          expiresAt: deal.expiresAt,
        };
      },
      uiComponent: 'StorageDealCard',
    });
    
    // === SOCIAL TOOLS ===
    
    this.register({
      name: 'follow_user',
      description: 'Follow a user on the network',
      parameters: z.object({
        did: z.string().describe('DID of user to follow'),
      }),
      executor: async (params, ctx) => {
        await ctx.chainClient.follow(params.did);
        
        return {
          success: true,
          message: `Now following ${params.did}`,
        };
      },
      uiComponent: 'FollowReceipt',
    });
    
    this.register({
      name: 'create_circle',
      description: 'Create a new circle (group) for sharing',
      parameters: z.object({
        name: z.string(),
        isPublic: z.boolean().optional(),
        members: z.array(z.string()).optional(),
      }),
      executor: async (params, ctx) => {
        const result = await ctx.chainClient.createCircle(params.name, {
          isPublic: params.isPublic,
          members: params.members,
        });
        
        return {
          success: true,
          circleId: result.circleId,
        };
      },
      uiComponent: 'CircleCreatedCard',
    });
    
    // === MEMORY TOOLS ===
    
    this.register({
      name: 'save_memory',
      description: 'Save information to distributed memory',
      parameters: z.object({
        content: z.string(),
        type: z.enum(['episodic', 'semantic', 'procedural', 'preference', 'goal']),
        tags: z.array(z.string()).optional(),
        importance: z.number().min(0).max(1).optional(),
      }),
      executor: async (params, ctx) => {
        const result = await ctx.chainClient.createEntity('memory', {
          content: params.content,
          memoryType: params.type,
          tags: params.tags,
          importance: params.importance || 0.5,
        });
        
        return {
          success: true,
          memoryId: result.entityId,
          message: 'Memory saved successfully',
        };
      },
      uiComponent: 'MemorySavedCard',
    });
    
    this.register({
      name: 'recall_memories',
      description: 'Recall relevant memories from distributed storage',
      parameters: z.object({
        query: z.string(),
        types: z.array(z.string()).optional(),
        limit: z.number().optional(),
      }),
      executor: async (params, ctx) => {
        const events = await ctx.chainClient.queryEvents({
          types: ['memory:create'],
          tags: params.types,
        });
        
        // Rank by relevance to query
        const ranked = this.rankMemories(events, params.query);
        
        return {
          success: true,
          memories: ranked.slice(0, params.limit || 5).map(m => ({
            id: m.entityId,
            content: m.payload.content,
            type: m.payload.memoryType,
            createdAt: m.timestamp,
          })),
        };
      },
      uiComponent: 'MemoryList',
    });
    
    // === CONTENT INTERACTION TOOLS ===
    
    this.register({
      name: 'like_content',
      description: 'Like content on the network',
      parameters: z.object({
        cid: z.string(),
      }),
      executor: async (params, ctx) => {
        await ctx.contentClient.likeContent(params.cid);
        
        return {
          success: true,
          message: 'Content liked',
        };
      },
      uiComponent: 'InteractionReceipt',
    });
    
    this.register({
      name: 'comment_on_content',
      description: 'Comment on content',
      parameters: z.object({
        cid: z.string(),
        text: z.string(),
      }),
      executor: async (params, ctx) => {
        const comment = await ctx.contentClient.comment(params.cid, params.text);
        
        return {
          success: true,
          commentCid: comment.cid,
        };
      },
      uiComponent: 'CommentCard',
    });
    
    // === CAPTURE TOOLS ===
    
    this.register({
      name: 'capture_url',
      description: 'Capture content from a URL using distributed workers',
      parameters: z.object({
        url: z.string().url(),
        options: z.object({
          waitFor: z.number().optional(),
          screenshot: z.boolean().optional(),
          extractText: z.boolean().optional(),
        }).optional(),
      }),
      executor: async (params, ctx) => {
        // Find capture providers
        const providers = await ctx.contentClient.findStorageProviders({
          minReplication: 1,
        });
        
        // Request capture (simplified)
        const result = await this.requestCapture(params.url, params.options);
        
        return {
          success: true,
          capturedCid: result.cid,
          title: result.title,
          textPreview: result.text?.substring(0, 500),
        };
      },
      uiComponent: 'CaptureResultCard',
    });
  }
  
  private rankMemories(events: ChainEvent[], query: string): ChainEvent[] {
    // Simple ranking - would use embeddings in production
    return events.sort((a, b) => {
      const scoreA = this.relevanceScore(a.payload.content, query);
      const scoreB = this.relevanceScore(b.payload.content, query);
      return scoreB - scoreA;
    });
  }
  
  private relevanceScore(content: string, query: string): number {
    // Simplified - would use semantic similarity
    const terms = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    return terms.reduce((score, term) => 
      score + (contentLower.includes(term) ? 1 : 0), 0
    );
  }
  
  private async requestCapture(url: string, options?: any): Promise<any> {
    // Implementation would use distributed capture protocol
    return { cid: 'mock-cid', title: 'Captured Content' };
  }
}
```

## 2.5 Tool UI Components Integration

Mapping tool-ui components to VIVIM tools:

```typescript
/**
 * Tool UI Component Registry
 * Maps tool results to tool-ui components
 */
export const toolUIRegistry: Record<string, ToolUIComponent> = {
  // === STORAGE COMPONENTS ===
  
  StorageReceipt: {
    component: 'OrderSummary',
    props: (result) => ({
      title: 'Content Stored',
      items: [
        { label: 'CID', value: result.cid },
        { label: 'Type', value: result.type },
        { label: 'Visibility', value: result.visibility },
      ],
      status: 'completed',
    }),
  },
  
  StorageDealCard: {
    component: 'OrderSummary',
    props: (result) => ({
      title: 'Storage Deal Created',
      items: [
        { label: 'Deal ID', value: result.dealId },
        { label: 'Provider', value: result.provider },
        { label: 'Expires', value: new Date(result.expiresAt).toLocaleDateString() },
      ],
      status: 'active',
    }),
  },
  
  SearchResults: {
    component: 'DataTable',
    props: (result) => ({
      columns: ['CID', 'Author', 'Type', 'Preview'],
      rows: result.results.map((r: any) => [
        r.cid.substring(0, 20) + '...',
        r.author.substring(0, 15) + '...',
        r.type,
        r.preview?.substring(0, 50) + '...',
      ]),
    }),
  },
  
  // === SOCIAL COMPONENTS ===
  
  FollowReceipt: {
    component: 'MessageDraft',
    props: (result) => ({
      title: 'Follow Successful',
      message: result.message,
      status: 'sent',
    }),
  },
  
  CircleCreatedCard: {
    component: 'OrderSummary',
    props: (result) => ({
      title: 'Circle Created',
      items: [
        { label: 'Circle ID', value: result.circleId },
      ],
      status: 'completed',
    }),
  },
  
  // === MEMORY COMPONENTS ===
  
  MemorySavedCard: {
    component: 'MessageDraft',
    props: (result) => ({
      title: 'Memory Saved',
      message: result.message,
      status: 'saved',
    }),
  },
  
  MemoryList: {
    component: 'OptionList',
    props: (result) => ({
      title: 'Relevant Memories',
      options: result.memories.map((m: any) => ({
        id: m.id,
        label: m.content.substring(0, 100),
        description: `${m.type} • ${new Date(m.createdAt).toLocaleDateString()}`,
      })),
    }),
  },
  
  // === CONTENT COMPONENTS ===
  
  CommentCard: {
    component: 'MessageDraft',
    props: (result) => ({
      title: 'Comment Posted',
      message: `Comment CID: ${result.commentCid}`,
      status: 'posted',
    }),
  },
  
  CaptureResultCard: {
    component: 'LinkPreview',
    props: (result) => ({
      title: result.title,
      description: result.textPreview,
      url: `ipfs://${result.capturedCid}`,
    }),
  },
  
  // === APPROVAL COMPONENTS ===
  
  // For tools requiring user approval
  ApprovalCard: {
    component: 'ApprovalCard',
    props: (params) => ({
      title: 'Action Required',
      description: `Do you want to proceed with this action?`,
      details: params,
      onApprove: 'approve',
      onReject: 'reject',
    }),
  },
  
  // === MEDIA COMPONENTS ===
  
  ImageGallery: {
    component: 'ImageGallery',
    props: (result) => ({
      images: result.images.map((img: any) => ({
        src: `ipfs://${img.cid}`,
        alt: img.alt,
        thumbnail: `ipfs://${img.thumbnailCid}`,
      })),
    }),
  },
  
  VideoPlayer: {
    component: 'Video',
    props: (result) => ({
      src: `ipfs://${result.videoCid}`,
      poster: result.thumbnailCid ? `ipfs://${result.thumbnailCid}` : undefined,
    }),
  },
};
```

## 2.6 Complete Integration Example

```typescript
// pwa/src/lib/vivim-runtime.ts

import { VivimChainClient } from '@vivim/network-engine';
import { DistributedContentClient } from '@vivim/storage';
import { VivimChatRuntime } from './chat-runtime';
import { VivimToolRegistry } from './tool-registry';

/**
 * Initialize VIVIM Runtime
 */
export async function initializeVivimRuntime() {
  // 1. Initialize chain client
  const chainClient = new VivimChainClient();
  await chainClient.initializeIdentity();
  
  // 2. Initialize content client
  const contentClient = new DistributedContentClient({
    ipfsNode: await createIPFSNode(),
    chainClient,
  });
  
  // 3. Initialize tool registry
  const toolRegistry = new VivimToolRegistry({
    chainClient,
    contentClient,
  });
  
  // 4. Initialize chat runtime
  const chatRuntime = new VivimChatRuntime({
    chainClient,
    contentClient,
    toolRegistry,
    modelProvider: createModelProvider(),
  });
  
  // 5. Sync with network
  await chainClient.sync();
  
  return {
    chainClient,
    contentClient,
    toolRegistry,
    chatRuntime,
  };
}

// pwa/src/components/AIChat.tsx

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { Thread } from '@assistant-ui/react';
import { useVivimRuntime } from '../lib/vivim-context';

export function AIChat() {
  const { chatRuntime } = useVivimRuntime();
  
  return (
    <AssistantRuntimeProvider runtime={chatRuntime}>
      <div className="flex flex-col h-screen">
        <Thread />
        <Composer />
      </div>
    </AssistantRuntimeProvider>
  );
}

// Tool UI rendering
import { ToolUI } from '@tool-ui/react';

function MessageWithTools({ message }) {
  return (
    <div>
      <Markdown content={message.content} />
      
      {message.toolCalls?.map((toolCall) => (
        <ToolUI
          key={toolCall.id}
          toolName={toolCall.name}
          result={toolCall.result}
          registry={toolUIRegistry}
        />
      ))}
    </div>
  );
}
```

---

# PART 3: IMPLEMENTATION CHECKLIST

## Phase 1: Storage Foundation
- [ ] Implement IPFS/Helia integration in browser
- [ ] Create `ContentObject` serialization with CIDs
- [ ] Build `DistributedContentClient` core
- [ ] Implement local pinning (IndexedDB cache)
- [ ] Add DWN integration for private content

## Phase 2: Network Layer
- [ ] Extend `DHTService` for content discovery
- [ ] Implement provider announcement protocol
- [ ] Build content retrieval via libp2p
- [ ] Add replication tracking
- [ ] Create content availability scoring

## Phase 3: On-Chain Integration
- [ ] Design smart contract for content registry
- [ ] Implement storage deal proposal flow
- [ ] Build payment channel integration
- [ ] Add proof verification hooks
- [ ] Create deal renewal automation

## Phase 4: AI Runtime
- [ ] Implement `VivimChatRuntime`
- [ ] Build `VivimToolRegistry` with all tools
- [ ] Create tool-ui component mappings
- [ ] Add context building from distributed memory
- [ ] Implement knowledge extraction

## Phase 5: UI Integration
- [ ] Wire assistant-ui to VivimChatRuntime
- [ ] Register tool-ui components
- [ ] Build feed/gallery views
- [ ] Add content upload flows
- [ ] Create storage deal UI

## Phase 6: Optimization
- [ ] Add caching strategies
- [ ] Implement prefetching
- [ ] Build CDN edge integration
- [ ] Add offline-first sync
- [ ] Create performance monitoring

---

*This design enables Instagram-scale distributed storage with full AI integration through assistant-ui and tool-ui.*
