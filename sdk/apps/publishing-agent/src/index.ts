import { spawn } from 'bun';
import { VivimChainClient, DistributedContentClient } from '@vivim/network-engine';
import { AIGitIntegration } from '@vivim/sdk';

/**
 * VIVIM Publishing Agent
 * Automates system publishing, semantic commits via AI, and pushing to core integrations like GitHub.
 */
class PublishingAgent {
  private aiGit: AIGitIntegration;
  
  constructor(apiKey?: string) {
    // Initialize mock network clients for the AI Git Integration
    const chainClient = new VivimChainClient({} as any); 
    const contentClient = new DistributedContentClient({} as any);
    
    // Core SDK integration
    this.aiGit = new AIGitIntegration({
      chainClient,
      contentClient,
      providerApiKey: apiKey || process.env.OPENAI_API_KEY
    });
  }

  async runPublishCycle() {
    console.log('[PublishingAgent] Starting publish cycle...');
    try {
      // 1. Stage all changes
      console.log('[PublishingAgent] Staging changes...');
      await this.runGitCommand(['add', '.']);
      
      const diff = await this.aiGit.getStagedDiff();
      if (!diff || diff.trim() === '') {
         console.log('[PublishingAgent] Working directory clean. No publishing needed.');
         return;
      }
      
      // 2. Prepare & anchor commit via AI Git
      const context = await this.aiGit.gatherLocalSessionContext(process.cwd());
      const commitRes = await this.aiGit.prepareAndAnchorCommit(context);
      
      // 3. Apply the semantic commit
      await this.aiGit.applyNativeGitCommit(commitRes.message);
      
      // 4. Push to core integration (GitHub/remote repository)
      console.log('[PublishingAgent] Pushing to remote repository (GitHub)...');
      await this.runGitCommand(['push', 'origin', 'HEAD']); 
      console.log('[PublishingAgent] ✅ System successfully published and anchored.');
    } catch (err: any) {
      if (err.message && err.message.includes('Working directory clean')) {
         console.log('[PublishingAgent] Working directory clean. Nothing to commit.');
      } else {
         console.error(`[PublishingAgent] ❌ Publish cycle failed: ${err.message}`);
      }
    }
  }

  private async runGitCommand(args: string[]): Promise<void> {
    const proc = spawn(['git', ...args], { stdout: 'pipe', stderr: 'pipe' });
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    
    if (proc.exitCode !== 0) {
      if (!stderr.includes('Everything up-to-date') && !stderr.includes('nothing to commit')) {
        throw new Error(`Git command failed: ${stderr || stdout}`);
      }
    }
  }

  /**
   * Start the automated daemon
   */
  startDaemon(intervalMs = 60000) { // 1 minute default for demo
    console.log(`[PublishingAgent] Daemon started. Polling every ${intervalMs}ms.`);
    this.runPublishCycle();
    setInterval(() => this.runPublishCycle(), intervalMs);
  }
}

// CLI Entrypoint
const mode = process.argv[2];

if (mode === 'daemon') {
  const agent = new PublishingAgent();
  agent.startDaemon();
} else if (mode === 'publish' || mode === undefined) {
  const agent = new PublishingAgent();
  agent.runPublishCycle().then(() => process.exit(0));
} else {
  console.log(`Unknown command: ${mode}`);
  console.log('Usage: bun run src/index.ts [publish|daemon]');
}
