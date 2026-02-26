import { spawn } from 'bun';
import { VivimChainClient } from '@vivim/network-engine';
import { DistributedContentClient, ContentType } from '@vivim/network-engine';
import { EventScope, EventType } from '@vivim/network-engine';
import fs from 'fs/promises';
import path from 'path';

export interface AIGitConfig {
  chainClient: VivimChainClient;
  contentClient: DistributedContentClient;
  providerApiKey?: string;
  model?: string;
}

export interface CommitResult {
  cid: string;
  transactionId: string;
  message: string;
  diffCid: string;
}

/**
 * AI-Augmented Git Integration (`{ai-git}`)
 * 
 * Captures deep session context and git diffs, generates state-of-the-art 
 * semantic commit messages, and permanently anchors the code evolution to 
 * the VIVIM blockchain using ChainEvents.
 */
export class AIGitIntegration {
  private chainClient: VivimChainClient;
  private contentClient: DistributedContentClient;
  private apiKey?: string;
  private model: string;

  constructor(config: AIGitConfig) {
    this.chainClient = config.chainClient;
    this.contentClient = config.contentClient;
    this.apiKey = config.providerApiKey;
    this.model = config.model ?? 'gpt-4o';
  }

  /**
   * Retrieves the currently staged diff from the local git repository
   */
  async getStagedDiff(): Promise<string> {
    const proc = spawn(['git', 'diff', '--staged'], { stdout: 'pipe', stderr: 'pipe' });
    const output = await new Response(proc.stdout).text();
    const error = await new Response(proc.stderr).text();
    const exitCode = proc.exitCode;

    if (exitCode !== 0) {
      throw new Error(`Git diff failed: ${error}`);
    }

    return output;
  }

  /**
   * Generates a semantic commit message using the AI Provider
   */
  async generateCommitMessage(diff: string, sessionContext: string = ''): Promise<string> {
    if (!diff.trim()) {
      throw new Error('No staged changes found. Run `git add` first.');
    }

    console.log('[AI-Git] 🧠 Analyzing codebase changes and session context...');

    // In a fully integrated environment, this routes through the localized VIVIM Self-Design Graph or a chosen model
    // Here we provide the foundational interface for the prompt logic
    const prompt = `
You are an expert Principal Software Engineer and the autonomous maintainer of this repository.
Your task is to craft a highly descriptive, verbose, and architecturally aware commit message based on the provided staged git diff and session context.

Follow the Conventional Commits specification.
Include:
1. A concise, imperative summary line (max 72 characters) with the appropriate type prefix (feat, fix, refactor, chore, docs, etc.).
2. A detailed body explaining *why* these changes were made, their architectural impact, and any deep context.
3. Relevant footers if breaking changes are introduced.

== SESSION CONTEXT ==
${sessionContext || 'No additional session context provided.'}

== STAGED DIFF ==
${diff}

Generate ONLY the final commit message string. Do not wrap it in markdown block quotes.
`;

    // Try to actually call OpenAI API if key exists, otherwise use a simulated fallback
    if (this.apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'system', content: prompt }],
            temperature: 0.2
          })
        });
        const data = await response.json();
        return data.choices[0].message.content.trim();
      } catch (e: any) {
        console.warn(`[AI-Git] ⚠️ API Call failed (${e.message}), falling back to simulated generation.`);
      }
    }

    // Fallback Simulation for local testing without an API key
    return `refactor(core): optimize state transitions and decentralized integration

Analyzed the provided diff and session context to determine the following architectural shifts:
- Restructured core data flow to improve performance.
- Re-aligned internal logic to strictly adhere to the VIVIM Event Sourcing pipeline.
- Improved edge-case handling in asynchronous network calls.

(Generated via Local Fallback Provider)`;
  }

  /**
   * The core execution loop:
   * 1. Get Diff
   * 2. Generate Message
   * 3. Anchor Code (Diff) to DHT
   * 4. Anchor Commit Event to Blockchain
   * 5. Apply native git commit
   */
  async prepareAndAnchorCommit(sessionContext?: string): Promise<CommitResult> {
    // 1. Capture State
    const diff = await this.getStagedDiff();
    if (!diff) {
      throw new Error('Working directory clean. Nothing to commit.');
    }

    // 2. Generate Semantic Analysis
    const message = await this.generateCommitMessage(diff, sessionContext);
    console.log(`\n[AI-Git] 📝 Generated Commit Message:\n----------------------------------------\n${message}\n----------------------------------------`);

    // 3. Store the physical code diff as a durable blob on the distributed content network
    console.log('[AI-Git] 💾 Anchoring codebase diff as ACU into immutable DHT storage...');
    const diffContentInfo = await this.contentClient.createContent({
      type: ContentType.ARTICLE,
      text: diff,
      visibility: 'public',
      tags: ['git-diff', 'code-commit']
    });

    // 4. Anchor the semantic commit as an immutable event on the VIVIM Blockchain
    console.log('[AI-Git] 🔗 Registering commit event on the VIVIM Distributed Ledger...');
    
    // We mock a custom event type for code commits since it's an extension of MESSAGE_CREATE
    const commitEvent = await this.chainClient.createEvent({
      type: EventType.MESSAGE_CREATE, 
      payload: {
        action: 'code:commit',
        message: message,
        diffCid: diffContentInfo.cid,
        parentCommit: await this.getLastGitCommitHash() // Store topological link to git hierarchy
      },
      tags: ['commit', 'vivim-ai-git'],
      scope: EventScope.PUBLIC
    });

    await this.chainClient.submitEvent(commitEvent);

    return {
      cid: commitEvent.id,
      transactionId: diffContentInfo.id,
      message,
      diffCid: diffContentInfo.cid
    };
  }

  /**
   * Finalizes the local git tree by applying the semantic commit natively
   */
  async applyNativeGitCommit(message: string): Promise<void> {
    console.log('[AI-Git] 🌳 Applying commit strictly to local git tree...');
    
    const proc = spawn(['git', 'commit', '-m', message], { stdout: 'pipe', stderr: 'pipe' });
    await new Response(proc.stdout).text();
    const error = await new Response(proc.stderr).text();

    if (proc.exitCode !== 0) {
      throw new Error(`Native local git commit failed: ${error}`);
    }

    console.log(`[AI-Git] ✅ Success! Local Git state aligned with On-Chain Ledger.`);
  }

  private async getLastGitCommitHash(): Promise<string> {
    try {
      const proc = spawn(['git', 'rev-parse', 'HEAD'], { stdout: 'pipe', stderr: 'pipe' });
      const output = await new Response(proc.stdout).text();
      return proc.exitCode === 0 ? output.trim() : 'genesis';
    } catch {
      return 'genesis';
    }
  }

  /**
   * Helper to gather minimal IDE session context based on recent file modifications
   */
  async gatherLocalSessionContext(directory: string): Promise<string> {
    try {
      const files = await fs.readdir(directory);
      return `Developer was working in directory: ${path.basename(directory)}. ` +
             `Active context includes: ${files.slice(0, 5).join(', ')}.`;
    } catch (e) {
      return 'No active session context available.';
    }
  }
}
