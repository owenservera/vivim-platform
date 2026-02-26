import { EventEmitter } from 'events';
import { VivimChainClient, EventScope, ChainEvent } from '@vivim/network-engine';

export interface OmniFeedConfig {
  chainClient: VivimChainClient;
  aggregationIntervalMs?: number; // How often to materialize new views
}

/**
 * Omni-Feed Orchestrator App
 * 
 * Replaces centralized feed curation (`feed-service.js`, `feed-context-integration.ts`).
 * Runs natively on SDK Edge Nodes to index the DHT and emit materialized "Feeds"
 * as lightweight data synchronization packages across the GossipSub.
 */
export class OmniFeedApp extends EventEmitter {
  private chainClient: VivimChainClient;
  private aggregationIntervalMs: number;
  
  public appDid: string | null = null;
  private feedIndexTimer: any;
  
  // Local volatile index mapping Context DIDs to Array of Events (simulating a materialized view)
  private socialGraphIndex = new Map<string, ChainEvent[]>();

  constructor(config: OmniFeedConfig) {
    super();
    this.chainClient = config.chainClient;
    this.aggregationIntervalMs = config.aggregationIntervalMs ?? 15000;
  }

  /**
   * Initializes the Orchestrator, listening to the firehose and indexing context
   */
  async start() {
    console.log('[Omni-Feed] 🌊 Initializing Real-Time Feed Analytics Engine...');
    
    this.appDid = await this.chainClient.initializeIdentity();

    // 1. Build the continuous memory feed from the firehose
    this.chainClient.on('event:received', (event: ChainEvent) => {
      // We explicitly index user generations, messaging events, and context ACUs
      const evType = event.type as string;
      if (
        evType === 'content:processed' || 
        evType === 'message:create' ||
        evType === 'reaction:add'
      ) {
        this.indexEventLocally(event);
      }
    });

    // 2. Continually materialize feed summaries for connected peers
    this.feedIndexTimer = setInterval(() => {
        this.broadcastFeedPulse();
    }, this.aggregationIntervalMs);

    console.log(`[Omni-Feed] 📡 Feed Orchestrator Active. Sweeping Mesh every ${this.aggregationIntervalMs/1000}s`);
  }

  stop() {
    if (this.feedIndexTimer) clearInterval(this.feedIndexTimer);
  }

  /**
   * Caches raw chain events against semantic categories mapping up to specific users/Circles
   */
  private indexEventLocally(event: ChainEvent) {
    // Map events by user or specific circle scopes using custom parsing
    // In actual implementation we use the EventStore's secondary indexes or a specialized SQLite adapter here
    const categoryKey = event.scope === EventScope.PUBLIC ? 'global_discovery' : (event.payload as any).circleId || 'direct';
    
    if (!this.socialGraphIndex.has(categoryKey)) {
        this.socialGraphIndex.set(categoryKey, []);
    }
    
    const stream = this.socialGraphIndex.get(categoryKey)!;
    stream.push(event);

    // Keep memory bounded to latest 500 events
    if (stream.length > 500) {
        stream.shift();
    }
  }

  /**
   * Simulates calculating a "Top Trending" or personalized feed state 
   * and emitting it as a lightweight pulse event to subscribed UI Clients (PWA).
   */
  private async broadcastFeedPulse() {
    console.log(`[Omni-Feed] 🔄 Calculating materialized timeline views...`);
    
    const globalStream = this.socialGraphIndex.get('global_discovery') || [];
    if (globalStream.length === 0) return;

    // Simulate basic PageRank / Trending Algorithm
    const topEvents = globalStream
        // High priority to recently processed high-fidelity context structures
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
        .slice(0, 10)
        .map(e => ({ id: e.id, author: (e as any).author?.substring(0, 8), type: e.type, age: Date.now() - Number(e.timestamp) }));

    // Formulate a structured Chain Event representing a compiled feed payload that clients load instead of fetching thousands of events individually
    const feedSnapshotEvent = await this.chainClient.createEvent({
      type: 'feed:materialized' as any,
      payload: {
        algorithm: 'chronological_hot',
        snapshotSize: topEvents.length,
        items: topEvents
      },
      tags: ['feed', 'discovery-pulse'],
      scope: EventScope.PUBLIC
    });

    try {
        await this.chainClient.submitEvent(feedSnapshotEvent);
        console.log(`[Omni-Feed 🚀] Broadcasted global feed snapshot: ${feedSnapshotEvent.id.substring(0, 12)}`);
    } catch (e: any) {
        console.error(`[Omni-Feed Error] Failed broadcasting stream: ${e.message}`);
    }
  }
}

