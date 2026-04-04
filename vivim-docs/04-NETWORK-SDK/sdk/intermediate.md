---
sidebar_position: 12
---

# Intermediate Examples

Real-world patterns for building production applications with VIVIM SDK.

## Building a Decentralized Blog

Complete example of a blog platform using VIVIM nodes.

```typescript
import { VivimSDK } from '@vivim/sdk';

class DecentralizedBlog {
  private sdk: VivimSDK;
  private contentNode: ContentNode;
  private memoryNode: MemoryNode;
  private socialNode: SocialNode;
  
  constructor() {
    this.sdk = new VivimSDK({
      identity: { autoCreate: true },
      nodes: { autoLoad: true },
    });
  }
  
  async initialize() {
    await this.sdk.initialize();
    
    this.contentNode = await this.sdk.loadNode('content');
    this.memoryNode = await this.sdk.loadNode('memory');
    this.socialNode = await this.sdk.loadNode('social');
  }
  
  // Create blog post
  async createPost(title: string, content: string, tags: string[]) {
    const post = await this.contentNode.create({
      type: 'article',
      title,
      body: content,
      tags,
      metadata: {
        author: this.sdk.getIdentity().did,
        publishedAt: Date.now(),
      },
    });
    
    // Create memory for post
    await this.memoryNode.create({
      content: `Published post: ${title}`,
      memoryType: 'episodic',
      category: 'blog',
      tags,
      provenanceId: post.id,
    });
    
    return post;
  }
  
  // Get posts by tag
  async getPostsByTag(tag: string, limit: number = 10) {
    const memories = await this.memoryNode.search({
      text: tag,
      tags: [tag],
      categories: ['blog'],
      limit,
    });
    
    const posts = await Promise.all(
      memories.map(m => this.contentNode.get(m.provenanceId))
    );
    
    return posts.filter(Boolean);
  }
  
  // Share post to circle
  async shareToCircle(postId: string, circleId: string) {
    await this.socialNode.shareToCircle(circleId, {
      contentType: 'article',
      contentId: postId,
      message: 'Check out this post!',
    });
  }
}

// Usage
const blog = new DecentralizedBlog();
await blog.initialize();

// Create post
const post = await blog.createPost(
  'My First Post',
  'Content here...',
  ['introduction', 'hello']
);

// Query posts
const posts = await blog.getPostsByTag('introduction');
```

## Building a Knowledge Base

Personal knowledge management with semantic search.

```typescript
class KnowledgeBase {
  private memoryNode: MemoryNode;
  private contentNode: ContentNode;
  
  constructor(sdk: VivimSDK) {
    this.memoryNode = await sdk.loadNode('memory');
    this.contentNode = await sdk.loadNode('content');
  }
  
  async addNote(content: string, tags: string[], category: string) {
    // Create memory with embedding
    const memory = await this.memoryNode.create({
      content,
      summary: await this.generateSummary(content),
      memoryType: 'semantic',
      category,
      tags,
    });
    
    return memory;
  }
  
  async searchKnowledge(query: string, options?: SearchOptions) {
    // Semantic search
    const semanticResults = await this.memoryNode.semanticSearch(query, 10);
    
    // Text search
    const textResults = await this.memoryNode.search({
      text: query,
      limit: 10,
      ...options,
    });
    
    // Combine and deduplicate
    const combined = this.combineResults(semanticResults, textResults);
    
    // Get knowledge graph
    const graph = await this.memoryNode.getKnowledgeGraph({
      depth: 2,
      minStrength: 0.3,
    });
    
    return {
      results: combined,
      graph,
      relatedTopics: this.extractTopics(combined),
    };
  }
  
  async linkNotes(sourceId: string, targetId: string, relationType: string) {
    await this.memoryNode.link(sourceId, targetId, relationType);
  }
  
  async getRelatedNotes(noteId: string) {
    const related = await this.memoryNode.getRelated(noteId);
    
    const notes = await Promise.all(
      related.map(r => this.memoryNode.get(r.targetId))
    );
    
    return notes.map((note, i) => ({
      ...note,
      relationStrength: related[i].strength,
      relationType: related[i].relationType,
    }));
  }
}
```

## Building a Chat Application

AI chat with memory context and conversation history.

```typescript
class ChatApplication {
  private chatNode: AIChatNode;
  private memoryNode: MemoryNode;
  
  constructor(sdk: VivimSDK) {
    this.chatNode = await sdk.loadNode('ai-chat');
    this.memoryNode = await sdk.loadNode('memory');
  }
  
  async sendMessage(conversationId: string, message: string) {
    // Get conversation history
    const history = await this.getConversationHistory(conversationId);
    
    // Search memory for relevant context
    const memories = await this.memoryNode.semanticSearch(message, 5);
    
    // Send with context
    const response = await this.chatNode.sendChatMessage(conversationId, message, {
      context: [
        ...history.map(h => ({
          type: 'message' as const,
          content: h.content,
          metadata: { role: h.role },
        })),
        ...memories.map(m => ({
          type: 'memory' as const,
          content: m.content,
          metadata: { memoryType: m.memoryType },
        })),
      ],
    });
    
    // Save to memory
    await this.memoryNode.create({
      content: `User: ${message}\nAssistant: ${response.content}`,
      memoryType: 'episodic',
      category: 'conversation',
      provenanceId: conversationId,
    });
    
    return response;
  }
  
  async streamMessage(conversationId: string, message: string) {
    const stream = await this.chatNode.streamMessage(conversationId, message);
    
    for await (const chunk of stream) {
      if (chunk.type === 'text') {
        process.stdout.write(chunk.text);
      }
    }
  }
  
  async exportConversation(conversationId: string) {
    const messages = await this.chatNode.getMessages(conversationId);
    
    // Store as content
    const content = await this.contentNode.create({
      type: 'conversation',
      title: `Conversation ${conversationId}`,
      body: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
      metadata: {
        conversationId,
        messageCount: messages.length,
        exportedAt: Date.now(),
      },
    });
    
    return content;
  }
}
```

## Building a File Storage App

Encrypted file storage with sharing capabilities.

```typescript
class FileStorageApp {
  private storageNode: StorageNode;
  private socialNode: SocialNode;
  
  constructor(sdk: VivimSDK) {
    this.storageNode = await sdk.loadNode('storage');
    this.socialNode = await sdk.loadNode('social');
  }
  
  async uploadFile(file: File, options: UploadOptions = {}) {
    // Read file
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    
    // Store with encryption
    const result = await this.storageNode.store(data, {
      encryption: options.encrypt ?? true,
      pin: true,
      visibility: options.visibility ?? 'private',
    });
    
    // Store metadata
    const metadata = {
      name: file.name,
      type: file.type,
      size: file.size,
      cid: result.cid,
      uploadedAt: Date.now(),
    };
    
    await this.storageNode.store(metadata, {
      key: `metadata:${result.cid}`,
      encryption: true,
    });
    
    return { ...result, metadata };
  }
  
  async downloadFile(cid: string) {
    // Get data
    const data = await this.storageNode.retrieve(cid);
    
    // Get metadata
    const metadata = await this.storageNode.retrieve(`metadata:${cid}`);
    
    return {
      data,
      metadata,
    };
  }
  
  async shareFile(cid: string, recipientDid: string, permissions: string[]) {
    // Create sharing record
    const shareRecord = {
      cid,
      sharedWith: recipientDid,
      permissions,
      sharedAt: Date.now(),
    };
    
    await this.storageNode.store(shareRecord, {
      key: `share:${cid}:${recipientDid}`,
      encryption: true,
    });
    
    // Notify recipient via social node
    await this.socialNode.sendMessage({
      to: recipientDid,
      content: `File shared with you: ${cid}`,
      encrypt: true,
    });
  }
  
  async listFiles() {
    const pins = await this.storageNode.getPins();
    
    const files = await Promise.all(
      pins.map(async pin => {
        const metadata = await this.storageNode.retrieve(`metadata:${pin.cid}`);
        return { ...pin, ...metadata };
      })
    );
    
    return files;
  }
}
```

## Building an Analytics Dashboard

Track and visualize SDK metrics.

```typescript
class AnalyticsDashboard {
  private metrics: Map<string, Metric[]> = new Map();
  
  constructor(sdk: VivimSDK) {
    this.setupMonitoring(sdk);
  }
  
  private setupMonitoring(sdk: VivimSDK) {
    // Track operations
    const rk = sdk.getRecordKeeper();
    rk.on('operation:recorded', (op) => {
      this.recordMetric('operations', {
        type: op.type,
        timestamp: op.timestamp,
        duration: op.duration,
      });
    });
    
    // Track errors
    sdk.on(SDK_EVENTS.ERROR, (error) => {
      this.recordMetric('errors', {
        code: error.code,
        message: error.message,
        timestamp: Date.now(),
      });
    });
  }
  
  private recordMetric(category: string, data: any) {
    const metrics = this.metrics.get(category) || [];
    metrics.push(data);
    this.metrics.set(category, metrics);
    
    // Keep only last 1000 metrics
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }
  
  getMetrics(category: string, options: MetricOptions) {
    const metrics = this.metrics.get(category) || [];
    
    // Filter by time range
    const filtered = metrics.filter(m => 
      m.timestamp >= options.from && m.timestamp <= options.to
    );
    
    // Aggregate
    return this.aggregate(filtered, options.aggregation);
  }
  
  generateReport(options: ReportOptions) {
    const report = {
      period: { from: options.from, to: options.to },
      generatedAt: Date.now(),
      sections: {
        operations: this.getMetrics('operations', options),
        errors: this.getMetrics('errors', options),
        performance: this.calculatePerformance(options),
      },
    };
    
    return report;
  }
}
```

## Related

- [Advanced Examples](./advanced) - Complex patterns
- [API Nodes](../api-nodes/overview) - Node documentation

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
