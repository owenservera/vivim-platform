import { EventEmitter } from 'events';
import { spawn } from 'bun';
import { VivimChainClient, DistributedContentClient } from '@vivim/network-engine';
import { AIGitIntegration } from '../../index.js';

export interface PublishingAgentConfig {
  chainClient: VivimChainClient;
  contentClient: DistributedContentClient;
  providerApiKey?: string;
  intervalMs?: number;
}

/**
 * Publishing Agent App
 * 
 * A core VIVIM application that automates system publishing, 
 * semantic commits via AI, and pushing to core integrations.
 * Adheres to the on-chain app store protocols via its identity.
 */
export class PublishingAgentApp extends EventEmitter {
  private chainClient: VivimChainClient;
  private contentClient: DistributedContentClient;
  private aiGit: AIGitIntegration;
  private intervalMs: number;
  private timer: any;
  private appDid: string | null = null;

  constructor(config: PublishingAgentConfig) {
    super();
    this.chainClient = config.chainClient;
    this.contentClient = config.contentClient;
    this.intervalMs = config.intervalMs ?? 60000;

    this.aiGit = new AIGitIntegration({
      chainClient: this.chainClient,
      contentClient: this.contentClient,
      providerApiKey: config.providerApiKey || process.env['OPENAI_API_KEY'] || ''
    });
  }

  async start() {
    console.log('[Publishing-Agent App] 🚀 Initializing Publishing Agent...');
    
    // 1. Establish App Identity (Protocol Requirement)
    this.appDid = await this.chainClient.initializeIdentity();
    console.log(`[Publishing-Agent App] 👤 Operating Identity: ${this.appDid}`);

    // 2. Register with the local node registry (App Store Protocol)
    // In a real implementation, this would involve submitting a registration event
    
    // 3. Start the daemon logic
    this.timer = setInterval(() => this.runPublishCycle(), this.intervalMs);
    this.runPublishCycle();
    
    console.log(`[Publishing-Agent App] ✅ Daemon Active. Polling every ${this.intervalMs/1000}s`);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  async runPublishCycle() {
    try {
      console.log('[Publishing-Agent App] Starting publish cycle...');
      
      // Stage changes
      await this.runGitCommand(['add', '.']);
      
      const diff = await this.aiGit.getStagedDiff();
      if (!diff || diff.trim() === '') {
         console.log('[Publishing-Agent App] Working directory clean.');
         return;
      }
      
      // Prepare and anchor
      // Prepare and anchor
      const context = await this.aiGit.gatherLocalSessionContext(process.cwd());
      const commitRes = await this.aiGit.prepareAndAnchorCommit(context);
      
      // Apply and push
      await this.aiGit.applyNativeGitCommit(commitRes.message);
      await this.runGitCommand(['push', 'origin', 'HEAD']); 
      
      console.log(`[Publishing-Agent App] ✅ System successfully published. Commit CID: ${commitRes.cid}`);
    } catch (err: any) {
      if (!err.message?.includes('nothing to commit')) {
        console.error(`[Publishing-Agent App] ❌ Cycle failed: ${err.message}`);
      }
    }
  }

  private async runGitCommand(args: string[]): Promise<void> {
    const proc = spawn(['git', ...args], { stdout: 'pipe', stderr: 'pipe' });
    await proc.exited;
    if (proc.exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      if (!stderr.includes('Everything up-to-date') && !stderr.includes('nothing to commit')) {
        throw new Error(`Git failed: ${stderr}`);
      }
    }
  }
}
