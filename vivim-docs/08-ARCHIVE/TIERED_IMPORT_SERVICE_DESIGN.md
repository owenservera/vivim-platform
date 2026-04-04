# Tiered Import Service Design

**Version:** 2.0.0  
**Date:** March 17, 2026  
**Status:** Design Specification

---

## Executive Summary

This document specifies a **tiered, user-directed import service** that handles large `.zip` file imports (100MB+) gracefully. The core principle is **progressive enhancement** where the minimum requirement is always satisfied (parse and store conversations per the data schema), while AI-enhanced transformations run **hierarchically** and **intelligently** with user control.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Current System Analysis](#2-current-system-analysis)
3. [Key Bottlenecks Identified](#3-key-bottlenecks-identified)
4. [Tiered Architecture](#4-tiered-architecture)
5. [User-Directed Import Flow](#5-user-directed-import-flow)
6. [Implementation Details](#6-implementation-details)
7. [API Changes](#7-api-changes)
8. [Frontend Integration](#8-frontend-integration)
9. [Migration Path](#9-migration-path)

---

## 1. Problem Statement

### The Challenge

- Users have imports ranging from **tens of MB to hundreds of MB**
- Current system uses **monolithic, all-or-nothing processing**
- Large imports cause **memory exhaustion**, **timeout errors**, and **poor UX**
- Users have **no visibility** into what's happening
- AI-enhanced features (ACU generation, memory extraction) are **all-or-nothing**
- **No way to prioritize** important conversations over less important ones

### The Requirement

> **Minimum**: Fully parse and store conversations properly adhering to the data schema  
> **Intelligence**: AI-enhanced algorithms run **hierarchically** and **intelligently**  
> **User Control**: Allow users to choose which transformations to run and when

---

## 2. Current System Analysis

### What Works

- Basic ZIP file parsing (ChatGPT format)
- Import job tracking with progress
- Duplicate detection via content hash
- Conversation storage with full message data
- Cancel/retry functionality

### What Doesn't Work at Scale

- **Memory-based file upload** (`multer.memoryStorage()`) - loads entire file into RAM
- **Synchronous sequential processing** - processes one conversation at a time
- **100MB file size limit** - but even reaching this causes OOM issues
- **No streaming extraction** - `AdmZip` loads all entries at once
- **ACU/Memory extraction disabled** - commented out in production code
- **No user choice** - all processing happens automatically
- **No intelligent prioritization** - all conversations treated equally

---

## 3. Key Bottlenecks Identified

| Bottleneck | Impact | Severity |
|------------|--------|----------|
| **Memory Storage** - Full ZIP loaded into RAM | OOM on 100MB+ files | Critical |
| **Sequential Processing** - Loop over all conversations | Hours for large imports | Critical |
| **Synchronous Parsing** - Blocking event loop | Server unresponsive | High |
| **No Streaming Upload** - Cannot handle large files | Upload failures | Critical |
| **No User Control** - All-or-nothing | Poor UX, no flexibility | High |
| **Disabled AI Features** - ACU/Memory off | No intelligence | Medium |
| **No Prioritization** - Equal processing for all | Wasted resources | Medium |
| **No Progress Granularity** - Only overall % | Poor UX | Medium |

---

## 4. Tiered Architecture

### The Tier Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      TIERED IMPORT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      USER SELECTION LAYER                          │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │ Tier 0  │ │ Tier 1  │ │ Tier 2  │ │ Tier 3  │ │ Tier 4  │    │  │
│  │  │  Core   │ │   ACU   │ │ Memory  │ │Context  │ │ Index   │    │  │
│  │  │ Import  │ │   Gen   │ │ Extract │ │Enrich   │ │ Build   │    │  │
│  │  │ REQUIRED│ │OPTIONAL │ │OPTIONAL │ │OPTIONAL │ │OPTIONAL │    │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘    │  │
│  └───────┼───────────┼───────────┼───────────┼───────────┼──────────┘  │
│          │           │           │           │           │             │
│          ▼           ▼           ▼           ▼           ▼             │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    PROCESSING PIPELINE                             │  │
│  │                                                                    │  │
│  │  TIER 0: Parse → Validate → Store Conversations → DONE ✓         │  │
│  │                         │                                          │  │
│  │  TIER 1: ──────────────►│ Extract ACUs → Quality Score → DONE     │  │
│  │                                │                                    │  │
│  │  TIER 2: ─────────────────────►│ Extract Facts → Preferences →    │  │
│  │                                            │                        │  │
│  │  TIER 3: ───────────────────────────────►│ Topic Analysis →      │  │
│  │                                                   │                  │  │
│  │  TIER 4: ───────────────────────────────────────►│ Search Index →     │  │
│  │                                                        │             │  │
│  └────────────────────────────────────────────────────────┴───────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tier Definitions

#### Tier 0: Core Import (REQUIRED - Minimum Viable Import)

**Purpose**: Parse ZIP, validate, store conversations in database

**Process**:
1. Stream file upload (disk-based, not memory)
2. Stream ZIP extraction (entry-by-entry)
3. Parse conversations.json
4. Validate against schema
5. Check duplicates
6. Store Conversation + Messages
7. Generate statistics

**Guarantees**:
- ✅ Conversations stored per `conversation-schema.json`
- ✅ All messages with proper parts (text, code, image, etc.)
- ✅ Statistics calculated (word count, token estimate, etc.)
- ✅ Metadata preserved

**Time Estimate**: ~50-100ms per conversation

---

#### Tier 1: ACU Generation (OPTIONAL - AI Knowledge Extraction)

**Purpose**: Extract Atomic Chat Units from conversation messages

**Process**:
1. Iterate through messages
2. Extract meaningful content blocks as ACUs
3. Generate content hash for deduplication
4. Calculate quality scores
5. Link to parent conversation

**User Choice**: Enable/disable, priority (high/medium/low)

**Time Estimate**: ~200-500ms per conversation

---

#### Tier 2: Memory Extraction (OPTIONAL - Fact Extraction)

**Purpose**: Extract facts, preferences, and knowledge from ACUs

**Process**:
1. Analyze ACU content
2. Extract factual statements
3. Identify user preferences
4. Extract entity relationships
5. Create Memory records

**User Choice**: Enable/disable, extraction depth (basic/deep)

**Time Estimate**: ~300-800ms per conversation

---

#### Tier 3: Context Enrichment (OPTIONAL - Graph Building)

**Purpose**: Build knowledge graph connections

**Process**:
1. Update TopicProfiles with new topics
2. Update EntityProfiles with discovered entities
3. Link memories to existing context
4. Rebuild context bundles

**User Choice**: Enable/disable, merge strategy (aggressive/conservative)

**Time Estimate**: ~400-1000ms per conversation

---

#### Tier 4: Index Building (OPTIONAL - Search Optimization)

**Purpose**: Build search indexes and aggregates

**Process**:
1. Update full-text search index
2. Update vector embeddings (async)
3. Aggregate statistics
4. Update provider stats

**User Choice**: Enable/disable, async priority

**Time Estimate**: ~100-300ms per conversation

---

## 5. User-Directed Import Flow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     USER-DIRECTED IMPORT FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐      │
│  │  Upload  │────►│  Scan &  │────►│  Select  │────►│  Process  │      │
│  │   ZIP    │     │  Analyze │     │  Tiers   │     │  Pipeline │      │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘      │
│       │                │                │                │              │
│       ▼                ▼                ▼                ▼              │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐      │
│  │ Streaming│     │  Quick   │     │  User    │     │  Tiered  │      │
│  │   UPLO  │     │  Parse   │     │ CHOOSES  │     │  Work    │      │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘      │
│                                              │              │            │
│                                              ▼              ▼            │
│                                       ┌──────────┐     ┌──────────┐      │
│                                       │ Show     │     │ Progress │      │
│                                       │ Summary  │     │  Per     │      │
│                                       │ & Stats  │     │  Tier    │      │
│                                       └──────────┘     └──────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Flow

#### Step 1: Upload (Streaming)

```typescript
// NEW: Stream-based upload instead of memory-based
const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads/imports',
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB - allow larger files
  },
});
```

#### Step 2: Scan & Analyze (Fast)

```typescript
// Quick scan provides instant feedback
async function scanImportFile(filePath: string): Promise<ImportScanResult> {
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();
  
  // Quick parse of conversations.json
  const conversationsFile = zip.getEntry('conversations.json');
  const raw = JSON.parse(conversationsFile.getData().toString('utf8'));
  
  return {
    totalConversations: raw.length,
    totalMessages: raw.reduce((sum, c) => sum + (c.mapping ? Object.keys(c.mapping).length : 0), 0),
    estimatedSize: calculateEstimatedSize(entries),
    providers: detectProviders(raw),
    dateRange: detectDateRange(raw),
    conversationSizes: analyzeConversationSizes(raw),
  };
}
```

#### Step 3: User Selection UI

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         IMPORT SETTINGS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  File: chatgpt-export.zip (347 MB)                                      │
│  Conversations: 1,247 | Messages: 45,892                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ IMPORT TIER SELECTION                                           │   │
│  │                                                                  │   │
│  │ ☑ TIER 0: Core Import (REQUIRED)                               │   │
│  │    Parse and store all conversations                           │   │
│  │                                                                  │   │
│  │ ☑ TIER 1: ACU Generation                                       │   │
│  │    Extract knowledge units from messages                        │   │
│  │    Priority: ○ High  ● Medium  ○ Low                          │   │
│  │                                                                  │   │
│  │ ☐ TIER 2: Memory Extraction                                    │   │
│  │    Extract facts and preferences                                │   │
│  │    Depth: ○ Basic  ● Deep                                     │   │
│  │                                                                  │   │
│  │ ☐ TIER 3: Context Enrichment                                   │   │
│  │    Build knowledge graph connections                           │   │
│  │    Merge: ○ Aggressive  ● Conservative                         │   │
│  │                                                                  │   │
│  │ ☐ TIER 4: Index Building                                       │   │
│  │    Build search indexes (runs async)                          │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ INTELLIGENT OPTIONS                                             │   │
│  │                                                                  │   │
│  │ ☐ Prioritize recent conversations                              │   │
│  │    Process newest 20% first with higher resources             │   │
│  │                                                                  │   │
│  │ ☐ Skip conversations with < 3 messages                        │   │
│  │                                                                  │   │
│  │ ☐ Detect and merge duplicate conversations                     │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Estimated time: ~15 minutes                                           │
│                                                                          │
│  [Cancel]                                    [Start Import]             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Step 4: Process with Progress Per Tier

```typescript
// Progress response now includes tier breakdown
{
  "job": {
    "id": "job_123",
    "status": "PROCESSING",
    "currentTier": "TIER_1",
    "tiers": {
      "TIER_0": {
        "status": "COMPLETED",
        "progress": 100,
        "conversationsProcessed": 1247,
        "timeElapsed": "45s"
      },
      "TIER_1": {
        "status": "PROCESSING",
        "progress": 35,
        "acusGenerated": 8934,
        "conversationsProcessed": 436,
        "timeElapsed": "2m 15s"
      },
      "TIER_2": {
        "status": "PENDING",
        "progress": 0
      },
      "TIER_3": {
        "status": "PENDING",
        "progress": 0
      },
      "TIER_4": {
        "status": "PENDING",
        "progress": 0
      }
    }
  }
}
```

---

## 6. Implementation Details

### 6.1 Database Schema Changes

```prisma
// Enhanced ImportJob with tier support
model ImportJob {
  id                     String            @id @default(uuid())
  userId                 String
  status                 ImportJobStatus   @default(PENDING)
  
  // Tier configuration
  tierConfig             Json              // User's tier selections
  
  // Tier progress tracking
  currentTier            ImportTier?       
  tierProgress           Json              // Progress per tier
  
  sourceProvider         String
  format                 String
  fileHash               String            @unique
  fileName               String
  filePath               String?           // NEW: Disk storage path
  fileSize               Int
  
  totalConversations     Int
  processedConversations Int               @default(0)
  failedConversations    Int               @default(0)
  
  // Tier-specific stats
  acuGenerated           Int               @default(0)
  memoriesExtracted      Int               @default(0)
  contextEnriched        Int               @default(0)
  
  startedAt              DateTime?
  completedAt            DateTime?
  createdAt              DateTime          @default(now())
  updatedAt              DateTime          @updatedAt
  
  metadata               Json              @default("{}")
  errors                 Json              @default("[]")
  
  user                   User              @relation(fields: [userId], references: [id])
  conversations          ImportedConversation[]
  
  @@index([userId, status])
  @@index([userId, currentTier])
  @@map("import_jobs")
}

enum ImportTier {
  TIER_0_CORE
  TIER_1_ACU
  TIER_2_MEMORY
  TIER_3_CONTEXT
  TIER_4_INDEX
}

enum ImportJobStatus {
  PENDING           // Initial state
  SCANNING          // Analyzing file
  WAITING_FOR_USER  // Awaiting tier selection
  PROCESSING        // Currently running a tier
  TIER_COMPLETE     // One tier done, paused for next
  COMPLETED         // All selected tiers done
  FAILED
  CANCELLED
  PAUSED            // User paused
}
```

### 6.2 Import Configuration Schema

```typescript
interface ImportTierConfig {
  // Required
  tier0Core: {
    enabled: true; // Always true
    skipDuplicates: boolean;
    validateSchema: boolean;
  };
  
  // Optional - Tier 1
  tier1Acu?: {
    enabled: boolean;
    priority: 'high' | 'medium' | 'low';
    minContentLength: number; // Minimum text length for ACU
    extractCode: boolean;
    extractThinking: boolean;
  };
  
  // Optional - Tier 2
  tier2Memory?: {
    enabled: boolean;
    depth: 'basic' | 'deep';
    extractFacts: boolean;
    extractPreferences: boolean;
    extractGoals: boolean;
  };
  
  // Optional - Tier 3
  tier3Context?: {
    enabled: boolean;
    mergeStrategy: 'aggressive' | 'conservative';
    updateTopics: boolean;
    updateEntities: boolean;
  };
  
  // Optional - Tier 4
  tier4Index?: {
    enabled: boolean;
    async: boolean; // Run in background
    priority: 'high' | 'low';
  };
}

interface IntelligentOptions {
  prioritizeRecent: boolean;
  recentPercentage: number; // 0-100
  skipShortConversations: boolean;
  minMessages: number;
  detectAndMergeDuplicates: boolean;
  parallelProcessing: boolean;
  maxConcurrency: number;
}
```

### 6.3 Streaming Upload Service

```typescript
// server/src/services/streaming-import-service.ts

import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { v4 as uuidv4 } from 'uuid';

export class StreamingImportService {
  
  /**
   * Stream upload - doesn't load entire file into memory
   */
  async streamUpload(
    userId: string,
    file: Express.Multer.File
  ): Promise<StreamingUploadResult> {
    const jobId = uuidv4();
    const uploadPath = `./uploads/imports/${jobId}-${file.originalname}`;
    
    // Move from temp to permanent storage
    await pipeline(
      createReadStream(file.path),
      createWriteStream(uploadPath)
    );
    
    // Quick scan for preview
    const scanResult = await this.scanImportFile(uploadPath);
    
    return {
      jobId,
      filePath: uploadPath,
      scanResult,
    };
  }
  
  /**
   * Quick scan - doesn't parse everything, just gets stats
   */
  async scanImportFile(filePath: string): Promise<ImportScanResult> {
    const zip = new AdmZip(filePath);
    
    // Only parse the manifest/conversations list, not full content
    const conversationsEntry = zip.getEntry('conversations.json');
    if (!conversationsEntry) {
      throw new Error('No conversations.json found in export');
    }
    
    // Parse conversations list (lightweight)
    const rawConversations = JSON.parse(
      conversationsEntry.getData().toString('utf8')
    );
    
    // Quick analysis without full message parsing
    return {
      totalConversations: rawConversations.length,
      providers: this.detectProviders(rawConversations),
      dateRange: this.detectDateRange(rawConversations),
      conversationSizeDistribution: this.analyzeSizeDistribution(rawConversations),
      estimatedProcessingTime: this.estimateTime(rawConversations.length),
    };
  }
  
  /**
   * Stream process - processes conversations one at a time
   */
  async *streamProcessConversations(
    filePath: string,
    config: ImportTierConfig
  ): AsyncGenerator<ConversationProcessResult> {
    const zip = new AdmZip(filePath);
    const rawConversations = JSON.parse(
      zip.getEntry('conversations.json')!.getData().toString('utf8')
    );
    
    for (const raw of rawConversations) {
      try {
        // Parse one conversation at a time
        const parsed = this.parseConversation(raw);
        
        // Validate
        if (!this.validateConversation(parsed)) {
          throw new Error('Invalid conversation format');
        }
        
        // Store (Tier 0)
        const conversation = await this.storeConversation(parsed);
        
        // ACU Generation (Tier 1)
        if (config.tier1Acu?.enabled) {
          const acus = await this.generateACUs(conversation);
          conversation.acus = acus;
        }
        
        // Memory Extraction (Tier 2) - would chain here
        // ...
        
        yield {
          success: true,
          conversationId: conversation.id,
          stats: {
            messages: conversation.messageCount,
            acus: conversation.acus?.length || 0,
          }
        };
      } catch (error) {
        yield {
          success: false,
          error: error.message,
          sourceId: raw.conversation_id,
        };
      }
    }
  }
}
```

### 6.4 Tier Orchestrator

```typescript
// server/src/services/tier-orchestrator.ts

export class TierOrchestrator {
  
  async runImportWithTiers(
    jobId: string,
    config: ImportTierConfig,
    intelligentOptions: IntelligentOptions
  ): Promise<void> {
    const prisma = getPrismaClient();
    const job = await prisma.importJob.findUnique({ where: { id: jobId } });
    
    // Get conversations in priority order
    const conversations = await this.getConversationsInOrder(
      job.filePath,
      intelligentOptions
    );
    
    // Run each enabled tier
    const tiers = [
      { config: config.tier0Core, handler: this.runTier0.bind(this) },
      { config: config.tier1Acu, handler: this.runTier1.bind(this) },
      { config: config.tier2Memory, handler: this.runTier2.bind(this) },
      { config: config.tier3Context, handler: this.runTier3.bind(this) },
      { config: config.tier4Index, handler: this.runTier4.bind(this) },
    ];
    
    for (const { config: tierConfig, handler } of tiers) {
      if (!tierConfig?.enabled) continue;
      
      // Update current tier
      await this.updateJobTier(jobId, tierConfig.name);
      
      // Run tier
      await handler(conversations, tierConfig, jobId);
      
      // Update tier complete
      await this.markTierComplete(jobId, tierConfig.name);
      
      // Check if user paused
      const currentJob = await prisma.importJob.findUnique({ where: { id: jobId } });
      if (currentJob.status === 'PAUSED') {
        break;
      }
    }
  }
  
  private async runTier0(
    conversations: ParsedConversation[],
    config: Tier0Config,
    jobId: string
  ): Promise<Tier0Result> {
    // Stream store each conversation
    for (const conv of conversations) {
      await this.storeConversation(conv);
      await this.updateProgress(jobId, 'TIER_0');
    }
    
    return { stored: conversations.length };
  }
  
  private async runTier1(
    conversations: StoredConversation[],
    config: Tier1Config,
    jobId: string
  ): Promise<Tier1Result> {
    constacuGenerated = 0;
    
    for (const conv of conversations) {
      const acus = await this.generateACUs(conv, config);
      acuGenerated += acus.length;
      
      // Batch update every 10
      if (acuGenerated % 10 === 0) {
        await this.updateProgress(jobId, 'TIER_1', acuGenerated);
      }
    }
    
    return { acuGenerated };
  }
  
  // ... similar for other tiers
}
```

---

## 7. API Changes

### 7.1 New/Modified Endpoints

```typescript
// POST /api/v1/import/scan
// NEW: Quick scan without full import
router.post('/scan', optionalAuth, async (req, res) => {
  const file = req.file;
  const scanResult = await importService.scanImportFile(file.path);
  
  res.json({
    success: true,
    scan: scanResult,
    // Suggests default tier config
    recommendedConfig: {
      tier0Core: { enabled: true },
      tier1Acu: { enabled: true, priority: 'medium' },
      tier2Memory: { enabled: false },
      tier3Context: { enabled: false },
      tier4Index: { enabled: false },
    }
  });
});

// POST /api/v1/import/start
// MODIFIED: Now accepts tier configuration
router.post('/start', optionalAuth, async (req, res) => {
  const { 
    filePath, 
    tierConfig, 
    intelligentOptions 
  } = req.body;
  
  const job = await importService.startImportWithTiers(
    userId,
    filePath,
    tierConfig,
    intelligentOptions
  );
  
  res.json({
    success: true,
    jobId: job.id,
    estimatedTime: job.estimatedTime,
  });
});

// GET /api/v1/import/jobs/:id
// ENHANCED: Returns tier-by-tier progress
router.get('/jobs/:id', async (req, res) => {
  const job = await importService.getImportJobWithTierProgress(id);
  
  res.json({
    success: true,
    job: {
      ...job,
      tierProgress: job.tierProgress, // Per-tier breakdown
      currentTier: job.currentTier,
    }
  });
});

// POST /api/v1/import/jobs/:id/pause
// NEW: Pause between tiers
router.post('/jobs/:id/pause', async (req, res) => {
  await importService.pauseImportJob(id);
  res.json({ success: true });
});

// POST /api/v1/import/jobs/:id/resume
// NEW: Resume paused job
router.post('/jobs/:id/resume', async (req, res) => {
  await importService.resumeImportJob(id);
  res.json({ success: true });
});

// POST /api/v1/import/jobs/:id/tiers/:tier/run
// NEW: Run specific tier on completed import
router.post('/jobs/:id/tiers/:tier/run', async (req, res) => {
  const { tier } = req.params;
  await importService.runTier(jobId, tier);
  res.json({ success: true });
});
```

### 7.2 WebSocket Events (Enhanced)

```typescript
// Enhanced progress events
interface ImportProgressEvent {
  jobId: string;
  type: 'tier_start' | 'tier_progress' | 'tier_complete' | 'tier_error';
  tier: ImportTier;
  data: {
    conversationsProcessed: number;
    tierSpecificProgress: number; // ACUs, memories, etc.
    timeElapsed: string;
    estimatedRemaining: string;
  };
}
```

---

## 8. Frontend Integration

### 8.1 Updated Import Page Flow

```tsx
// pwa/src/pages/Import.tsx (Updated)

export const ImportPage: React.FC = () => {
  const [phase, setPhase] = useState<'upload' | 'scan' | 'configure' | 'processing' | 'complete'>('upload');
  const [scanResult, setScanResult] = useState<ImportScanResult | null>(null);
  const [tierConfig, setTierConfig] = useState<ImportTierConfig>(defaultConfig);
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);
  
  // Phase 1: Upload
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Stream upload to temp location
    const response = await apiClient.post('/import/scan', formData);
    setScanResult(response.data.scan);
    setPhase('configure');
  };
  
  // Phase 2: Configure (User Selection)
  const handleConfigure = () => {
    setPhase('processing');
    startImportWithTiers(tierConfig);
  };
  
  // Phase 3: Processing with tier progress
  const renderProcessing = () => (
    <div className="processing-view">
      {/* Tier Progress Cards */}
      <div className="tier-grid">
        {Object.entries(jobProgress.tiers).map(([tier, progress]) => (
          <TierProgressCard 
            key={tier}
            tier={tier}
            progress={progress}
            isActive={jobProgress.currentTier === tier}
          />
        ))}
      </div>
      
      {/* Controls */}
      <div className="controls">
        {jobProgress.status === 'TIER_COMPLETE' && (
          <button onClick={() => selectNextTier()}>
            Continue to Next Tier
          </button>
        )}
        <button onClick={() => pauseImport()}>Pause</button>
      </div>
    </div>
  );
  
  return (
    <div className="import-page">
      {phase === 'upload' && <UploadZone onUpload={handleUpload} />}
      {phase === 'configure' && scanResult && (
        <ConfigureScreen 
          scanResult={scanResult}
          config={tierConfig}
          onConfigChange={setTierConfig}
          onStart={handleConfigure}
        />
      )}
      {phase === 'processing' && jobProgress && renderProcessing()}
      {phase === 'complete' && <CompleteScreen jobProgress={jobProgress} />}
    </div>
  );
};
```

### 8.2 Tier Progress Component

```tsx
// pwa/src/components/TierProgressCard.tsx

export const TierProgressCard: React.FC<{
  tier: ImportTier;
  progress: TierProgress;
  isActive: boolean;
}> = ({ tier, progress, isActive }) => {
  const statusColors = {
    PENDING: 'gray',
    PROCESSING: 'blue',
    COMPLETED: 'green',
    FAILED: 'red',
  };
  
  const tierDescriptions = {
    TIER_0_CORE: 'Parsing and storing conversations',
    TIER_1_ACU: 'Extracting knowledge units',
    TIER_2_MEMORY: 'Extracting facts and preferences',
    TIER_3_CONTEXT: 'Building knowledge graph',
    TIER_4_INDEX: 'Building search indexes',
  };
  
  return (
    <div className={`tier-card ${isActive ? 'active' : ''}`}>
      <div className="tier-header">
        <span className={`status-dot ${statusColors[progress.status]}`} />
        <span className="tier-name">{tier.replace('TIER_', 'Tier ')}</span>
      </div>
      
      <p className="tier-description">{tierDescriptions[tier]}</p>
      
      {progress.status === 'PROCESSING' && (
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="progress-stats">
            <span>{progress.conversationsProcessed} / {progress.totalConversations}</span>
            <span>{progress.timeElapsed}</span>
          </div>
        </div>
      )}
      
      {progress.status === 'COMPLETED' && (
        <div className="completed-stats">
          {progress.stats && Object.entries(progress.stats).map(([key, value]) => (
            <div key={key} className="stat">
              <span className="stat-value">{value}</span>
              <span className="stat-label">{key}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 9. Migration Path

### Phase 1: Infrastructure (Week 1-2)

- [ ] Implement streaming upload (disk-based multer)
- [ ] Add `filePath` field to ImportJob
- [ ] Create `scanImportFile()` function
- [ ] Add tier config schema to database
- [ ] Add tier progress tracking fields

### Phase 2: Core Logic (Week 3-4)

- [ ] Implement tier orchestrator
- [ ] Refactor import service into tier handlers
- [ ] Add pause/resume functionality
- [ ] Implement intelligent prioritization
- [ ] Add WebSocket progress per tier

### Phase 3: Frontend (Week 5-6)

- [ ] Update Import page with configure step
- [ ] Add tier selection UI
- [ ] Add tier progress visualization
- [ ] Add pause/resume controls
- [ ] Add "run additional tier" functionality

### Phase 4: Enhancement (Week 7-8)

- [ ] Re-enable ACU generation (Tier 1)
- [ ] Re-enable memory extraction (Tier 2)
- [ ] Implement context enrichment (Tier 3)
- [ ] Implement index building (Tier 4)
- [ ] Add intelligent options

---

## Summary

This tiered import service addresses all the identified bottlenecks:

| Problem | Solution |
|---------|----------|
| Memory exhaustion | Streaming upload + disk storage |
| Sequential processing | Parallel tier processing |
| No user control | User-directed tier selection |
| Poor visibility | Per-tier progress tracking |
| Disabled AI features | Optional tier enablement |
| No prioritization | Intelligent conversation ordering |
| All-or-nothing | Pause between tiers, run tiers later |

**The minimum is always guaranteed**: Tier 0 (Core Import) is required and ensures all conversations are parsed and stored per the data schema. Users can then choose which additional AI-enhanced transformations to run, when to run them, and at what depth.
