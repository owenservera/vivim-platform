/**
 * VIVIM SDK - AI Agent Utilities
 * 
 * Helper functions specifically designed for AI coding agents
 */

import type { AIAgentCLI, CommandResult } from './agent-cli.js';

/**
 * Agent Session - manages a CLI session for an AI agent
 */
export class AgentSession {
  private cli: AIAgentCLI;
  
  constructor(cli: AIAgentCLI) {
    this.cli = cli;
  }

  /**
   * Execute a command and return result
   */
  async exec(command: string): Promise<CommandResult> {
    return this.cli.executeCommand(command);
  }

  /**
   * Execute command, throw on failure
   */
  async execOrThrow(command: string): Promise<CommandResult> {
    const result = await this.exec(command);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result;
  }

  /**
   * Quick memory operations
   */
  async remember(content: string, type = 'semantic', tags: string[] = []): Promise<string> {
    const result = await this.execOrThrow(
      `memory create "${content.replace(/"/g, '\\"')}" --type ${type}${tags.length ? ` --tags ${tags.join(',')}` : ''}`
    );
    return (result.data as any)?.id || 'saved';
  }

  async recall(query: string, limit = 10): Promise<any[]> {
    const result = await this.execOrThrow(`memory search "${query}" --limit ${limit}`);
    return result.data as any[];
  }

  /**
   * Quick content operations
   */
  async post(text: string, visibility = 'public'): Promise<any> {
    const result = await this.execOrThrow(
      `content create "${text.replace(/"/g, '\\"')}" --visibility ${visibility}`
    );
    return result.data;
  }

  /**
   * Get feed
   */
  async getFeed(limit = 20): Promise<any[]> {
    const result = await this.execOrThrow(`content feed --limit ${limit}`);
    return result.data as any[];
  }

  /**
   * Social operations
   */
  async follow(did: string): Promise<void> {
    await this.execOrThrow(`social follow ${did}`);
  }

  async createCircle(name: string, isPublic = false): Promise<any> {
    const result = await this.execOrThrow(
      `social circle create "${name}"${isPublic ? ' --public' : ''}`
    );
    return result.data;
  }

  /**
   * Chat operations
   */
  async startChat(title?: string): Promise<string> {
    const result = await this.execOrThrow(
      `chat new${title ? ` --title "${title}"` : ''}`
    );
    return (result.data as any)?.id;
  }

  async sendMessage(message: string): Promise<any> {
    const result = await this.execOrThrow(
      `chat send "${message.replace(/"/g, '\\"')}"`
    );
    return result.data;
  }

  /**
   * Storage operations
   */
  async getStorageStatus(): Promise<any> {
    const result = await this.execOrThrow('storage status');
    return result.data;
  }

  /**
   * Context operations
   */
  async getContext(): Promise<any> {
    const result = await this.exec('context');
    return result.data;
  }

  /**
   * Change output format
   */
  async setFormat(format: 'json' | 'text' | 'markdown' | 'compact'): Promise<void> {
    await this.execOrThrow(`format ${format}`);
  }
}

/**
 * Build agent - specialized for code building tasks
 */
export class BuildAgent extends AgentSession {
  /**
   * Remember code-related information
   */
  async rememberCode(pattern: string, context: string): Promise<string> {
    return this.remember(
      `[CODE] ${pattern}: ${context}`,
      'procedural',
      ['code', 'pattern', 'implementation']
    );
  }

  /**
   * Remember error and solution
   */
  async rememberError(error: string, solution: string): Promise<string> {
    return this.remember(
      `[ERROR] ${error}\n[SOLUTION] ${solution}`,
      'episodic',
      ['error', 'fix', 'bugfix']
    );
  }

  /**
   * Search for relevant memories
   */
  async findRelevantMemories(query: string): Promise<any[]> {
    return this.recall(query, 5);
  }

  /**
   * Post build update
   */
  async postUpdate(status: string): Promise<any> {
    return this.post(`🤖 Build Update: ${status}`, 'public');
  }
}

/**
 * Research agent - specialized for research tasks
 */
export class ResearchAgent extends AgentSession {
  /**
   * Save research finding
   */
  async saveFinding(topic: string, content: string): Promise<string> {
    return this.remember(
      `[RESEARCH] ${topic}\n${content}`,
      'semantic',
      ['research', topic.toLowerCase().replace(/\s+/g, '-')]
    );
  }

  /**
   * Search previous research
   */
  async findResearch(topic: string): Promise<any[]> {
    return this.recall(topic, 10);
  }
}

/**
 * CLI Builder - fluent CLI creation
 */
export class CLIBuilder {
  private cli: AIAgentCLI | null = null;

  withFormat(format: 'json' | 'text' | 'markdown' | 'compact'): this {
    this.cli = null; // Will be applied on build
    return this;
  }

  async build(): Promise<AIAgentCLI> {
    const { createAIAgentCLI } = await import('./agent-cli.js');
    return createAIAgentCLI({ autoInit: true });
  }

  async agent(): Promise<AgentSession> {
    const cli = await this.build();
    return new AgentSession(cli);
  }

  async buildAgent<T extends AgentSession>(
    agentClass: new (cli: AIAgentCLI) => T
  ): Promise<T> {
    const cli = await this.build();
    return new agentClass(cli);
  }
}

/**
 * Create a new CLI builder
 */
export function createCLI(): CLIBuilder {
  return new CLIBuilder();
}
