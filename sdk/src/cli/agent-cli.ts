/**
 * VIVIM SDK - AI Agent CLI Wrapper
 * 
 * A TUI-based command-line interface specifically designed for AI coding CLI agents.
 * Provides structured output, machine-readable responses, and agent-friendly interaction patterns.
 */

import { EventEmitter } from 'events';
import * as readline from 'readline';
import type { VivimSDK } from '../core/sdk.js';
import type { Identity, Memory, Conversation, ContentObject, Circle } from '../core/types.js';
import { getLogger, Logger } from '../utils/logger.js';

/**
 * CLI Output Format
 */
export type OutputFormat = 'json' | 'text' | 'markdown' | 'compact';

/**
 * CLI Command Result
 */
export interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    command: string;
    duration: number;
    timestamp: number;
  };
}

/**
 * Agent Context - maintains state between commands
 */
export interface AgentContext {
  sessionId: string;
  identity?: Identity;
  currentConversation?: string;
  lastError?: string;
  commandHistory: Array<{ command: string; result: CommandResult }>;
}

/**
 * CLI Command Definition
 */
export interface CLICommand {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  examples: string[];
  execute: (args: string[], context: AgentContext) => Promise<CommandResult>;
}

/**
 * AI Agent CLI - Main class
 */
export class AIAgentCLI extends EventEmitter {
  private sdk: VivimSDK;
  private logger: Logger;
  private format: OutputFormat = 'json';
  private context: AgentContext;
  private commands: Map<string, CLICommand> = new Map();
  private rl?: readline.Interface;
  private running = false;

  constructor(sdk: VivimSDK, options?: { format?: OutputFormat }) {
    super();
    this.sdk = sdk;
    this.format = options?.format || 'json';
    this.logger = getLogger().child('cli');
    this.context = {
      sessionId: crypto.randomUUID(),
      commandHistory: [],
    };

    this.registerCommands();
  }

  // ============================================
  // COMMAND REGISTRATION
  // ============================================

  private registerCommands(): void {
    // Identity Commands
    this.register({
      name: 'identity',
      aliases: ['id', 'whoami'],
      description: 'Get current identity information',
      usage: 'identity',
      examples: ['identity', 'id'],
      execute: async () => {
        const identity = this.sdk.getIdentity();
        return this.success(identity || null, 'No identity found. Create one with "identity create"');
      },
    });

    this.register({
      name: 'identity create',
      aliases: ['id create'],
      description: 'Create a new identity',
      usage: 'identity create [--name <name>]',
      examples: ['identity create', 'identity create --name "My Agent"'],
      execute: async (args) => {
        const name = this.extractArg(args, '--name');
        const identity = await this.sdk.createIdentity({ displayName: name || undefined });
        return this.success(identity);
      },
    });

    // Memory Commands
    this.register({
      name: 'memory create',
      aliases: ['m create', 'mem create'],
      description: 'Create a new memory',
      usage: 'memory create <content> [--type <type>] [--tags <tags>]',
      examples: [
        'memory create "Important fact about the codebase" --type semantic --tags important',
      ],
      execute: async (args) => {
        const content = args[0];
        if (!content) {
          return this.failure('Memory content is required');
        }
        const type = this.extractArg(args, '--type') as any || 'semantic';
        const tagsStr = this.extractArg(args, '--tags') || '';
        const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

        const memoryNode = await this.sdk.getMemoryNode();
        const memory = await memoryNode.create({
          content,
          memoryType: type,
          category: 'general',
          tags,
        });
        return this.success(memory);
      },
    });

    this.register({
      name: 'memory search',
      aliases: ['m search', 'mem search'],
      description: 'Search memories',
      usage: 'memory search <query> [--type <type>] [--limit <limit>]',
      examples: ['memory search "authentication"', 'memory search "api" --type semantic --limit 10'],
      execute: async (args) => {
        const query = args[0] || '';
        const type = this.extractArg(args, '--type') as any;
        const limit = parseInt(this.extractArg(args, '--limit') || '10', 10);

        const memoryNode = await this.sdk.getMemoryNode();
        const results = await memoryNode.search({
          text: query,
          types: type ? [type] : undefined,
          limit,
        });
        return this.success(results);
      },
    });

    this.register({
      name: 'memory list',
      aliases: ['m list', 'mem list', 'm ls'],
      description: 'List all memories',
      usage: 'memory list [--type <type>] [--limit <limit>]',
      examples: ['memory list', 'memory list --type episodic --limit 20'],
      execute: async (args) => {
        const type = this.extractArg(args, '--type') as any;
        const limit = parseInt(this.extractArg(args, '--limit') || '50', 10);

        const memoryNode = await this.sdk.getMemoryNode();
        const results = await memoryNode.search({
          types: type ? [type] : undefined,
          limit,
        });
        return this.success(results);
      },
    });

    // Content Commands
    this.register({
      name: 'content create',
      aliases: ['c create', 'post'],
      description: 'Create new content',
      usage: 'content create <text> [--visibility <public|circle|friends|private>]',
      examples: ['content create "Hello world" --visibility public'],
      execute: async (args) => {
        const text = args.join(' ');
        if (!text) {
          return this.failure('Content text is required');
        }
        const visibility = (this.extractArg(args, '--visibility') as any) || 'public';

        const contentNode = await this.sdk.getContentNode();
        const content = await contentNode.create('post', { text }, { visibility });
        return this.success(content);
      },
    });

    this.register({
      name: 'content feed',
      aliases: ['c feed', 'c ls', 'feed'],
      description: 'Get content feed',
      usage: 'content feed [--type <type>] [--limit <limit>]',
      examples: ['content feed', 'content feed --type following --limit 20'],
      execute: async (args) => {
        const type = this.extractArg(args, '--type') as any;
        const limit = parseInt(this.extractArg(args, '--limit') || '20', 10);

        const contentNode = await this.sdk.getContentNode();
        const feed = await contentNode.getFeed({ type, limit });
        return this.success(feed);
      },
    });

    this.register({
      name: 'content search',
      aliases: ['c search'],
      description: 'Search content',
      usage: 'content search <query> [--author <did>] [--type <type>]',
      examples: ['content search "vivim"', 'content search "blockchain" --author did:key:...'],
      execute: async (args) => {
        const query = args[0];
        if (!query) {
          return this.failure('Search query is required');
        }
        const author = this.extractArg(args, '--author');
        const type = this.extractArg(args, '--type') as any;

        const contentNode = await this.sdk.getContentNode();
        const results = await contentNode.search({ text: query, author, type: type ? [type] : undefined });
        return this.success(results);
      },
    });

    // Social Commands
    this.register({
      name: 'social follow',
      aliases: ['follow'],
      description: 'Follow a user',
      usage: 'social follow <did>',
      examples: ['social follow did:key:z...'],
      execute: async (args) => {
        const did = args[0];
        if (!did) {
          return this.failure('DID is required');
        }

        const socialNode = await this.sdk.getSocialNode();
        await socialNode.follow(did);
        return this.success({ message: `Now following ${did}` });
      },
    });

    this.register({
      name: 'social circles',
      aliases: ['circles', 'circle list'],
      description: 'List circles',
      usage: 'social circles',
      examples: ['social circles'],
      execute: async () => {
        const socialNode = await this.sdk.getSocialNode();
        const circles = await socialNode.getUserCircles();
        return this.success(circles);
      },
    });

    this.register({
      name: 'social circle create',
      aliases: ['circle create'],
      description: 'Create a new circle',
      usage: 'social circle create <name> [--public] [--description <desc>]',
      examples: ['social circle create "Dev Friends"', 'social circle create "Work" --public'],
      execute: async (args) => {
        const name = args[0];
        if (!name) {
          return this.failure('Circle name is required');
        }
        const isPublic = args.includes('--public');
        const description = this.extractArg(args, '--description');

        const socialNode = await this.sdk.getSocialNode();
        const circle = await socialNode.createCircle(name, { isPublic, description });
        return this.success(circle);
      },
    });

    // Chat Commands
    this.register({
      name: 'chat new',
      aliases: ['chat create', 'chat init'],
      description: 'Start a new conversation',
      usage: 'chat new [--title <title>] [--model <model>]',
      examples: ['chat new', 'chat new --title "Project Discussion" --model gpt-4'],
      execute: async (args) => {
        const title = this.extractArg(args, '--title') || 'New Conversation';
        const model = this.extractArg(args, '--model') || 'gpt-4';

        const chatNode = await this.sdk.getAIChatNode();
        const conversation = await chatNode.createConversation({ title, model });
        this.context.currentConversation = conversation.id;
        return this.success(conversation);
      },
    });

    this.register({
      name: 'chat list',
      aliases: ['chat ls', 'conversations'],
      description: 'List conversations',
      usage: 'chat list',
      examples: ['chat list'],
      execute: async () => {
        const chatNode = await this.sdk.getAIChatNode();
        const conversations = await chatNode.listConversations();
        return this.success(conversations);
      },
    });

    this.register({
      name: 'chat send',
      aliases: ['chat msg', 'say'],
      description: 'Send a message',
      usage: 'chat send <message>',
      examples: ['chat send "Hello, help me with this code"'],
      execute: async (args, context) => {
        const message = args.join(' ');
        if (!message) {
          return this.failure('Message is required');
        }
        if (!context.currentConversation) {
          return this.failure('No active conversation. Start one with "chat new"');
        }

        const chatNode = await this.sdk.getAIChatNode();
        const response = await chatNode.sendMessage(context.currentConversation, message);
        return this.success(response);
      },
    });

    // Storage Commands
    this.register({
      name: 'storage status',
      aliases: ['storage', 'df'],
      description: 'Get storage status',
      usage: 'storage status',
      examples: ['storage status'],
      execute: async () => {
        const storageNode = await this.sdk.getStorageNode();
        const status = await storageNode.getStatus();
        return this.success(status);
      },
    });

    this.register({
      name: 'storage pins',
      aliases: ['pins', 'ipfs pins'],
      description: 'List pinned content',
      usage: 'storage pins',
      examples: ['storage pins'],
      execute: async () => {
        const storageNode = await this.sdk.getStorageNode();
        const pins = await storageNode.getPins();
        return this.success(pins);
      },
    });

    // System Commands
    this.register({
      name: 'help',
      aliases: ['?', 'h'],
      description: 'Show help information',
      usage: 'help [command]',
      examples: ['help', 'help memory'],
      execute: async (args) => {
        const cmdName = args[0];
        if (cmdName) {
          const cmd = this.commands.get(cmdName);
          if (cmd) {
            return this.success({
              name: cmd.name,
              description: cmd.description,
              usage: cmd.usage,
              examples: cmd.examples,
            });
          }
          return this.failure(`Unknown command: ${cmdName}`);
        }

        const allCommands = Array.from(this.commands.values()).map(c => ({
          name: c.name,
          description: c.description,
        }));
        return this.success(allCommands);
      },
    });

    this.register({
      name: 'format',
      aliases: [],
      description: 'Set output format',
      usage: 'format <json|text|markdown|compact>',
      examples: ['format json', 'format text'],
      execute: async (args) => {
        const format = args[0] as OutputFormat;
        if (!['json', 'text', 'markdown', 'compact'].includes(format)) {
          return this.failure('Invalid format. Use: json, text, markdown, or compact');
        }
        this.format = format;
        return this.success({ format: this.format });
      },
    });

    this.register({
      name: 'context',
      aliases: ['ctx', 'env'],
      description: 'Show current context',
      usage: 'context',
      examples: ['context'],
      execute: async () => {
        return this.success({
          sessionId: this.context.sessionId,
          identity: this.context.identity,
          currentConversation: this.context.currentConversation,
          lastError: this.context.lastError,
          format: this.format,
        });
      },
    });

    this.register({
      name: 'exit',
      aliases: ['quit', 'q', 'bye'],
      description: 'Exit the CLI',
      usage: 'exit',
      examples: ['exit'],
      execute: async () => {
        this.running = false;
        return this.success({ message: 'Goodbye!' });
      },
    });
  }

  private register(command: CLICommand): void {
    this.commands.set(command.name, command);
    for (const alias of command.aliases) {
      this.commands.set(alias, command);
    }
  }

  // ============================================
  // COMMAND EXECUTION
  // ============================================

  /**
   * Execute a command from string input
   */
  async executeCommand(input: string): Promise<CommandResult> {
    const startTime = Date.now();
    const trimmed = input.trim();
    
    if (!trimmed) {
      return this.failure('Empty command');
    }

    // Parse command and args
    const parts = this.parseCommand(trimmed);
    const commandName = parts.command;
    const args = parts.args;

    // Find command
    const command = this.commands.get(commandName);
    if (!command) {
      return this.failure(`Unknown command: ${commandName}. Run "help" for available commands.`);
    }

    try {
      const result = await command.execute(args, this.context);
      
      // Update context
      this.context.commandHistory.push({ command: trimmed, result });
      if (!result.success) {
        this.context.lastError = result.error;
      }

      // Add metadata
      result.metadata = {
        command: commandName,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.context.lastError = errorMessage;
      
      return {
        success: false,
        error: errorMessage,
        metadata: {
          command: commandName,
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Execute command and output formatted result
   */
  async runCommand(input: string): Promise<void> {
    const result = await this.executeCommand(input);
    this.output(result);

    // Handle exit
    if (input.trim() === 'exit' || input.trim() === 'quit') {
      await this.close();
    }
  }

  // ============================================
  // OUTPUT FORMATTING
  // ============================================

  private success<T>(data: T, message?: string): CommandResult<T> {
    return {
      success: true,
      data: message ? { message, ...(data as object) } : data,
    };
  }

  private failure<T>(error: string): CommandResult<T> {
    return {
      success: false,
      error,
    };
  }

  private output(result: CommandResult): void {
    switch (this.format) {
      case 'json':
        console.log(JSON.stringify(result, null, 2));
        break;
      case 'text':
        this.outputText(result);
        break;
      case 'markdown':
        this.outputMarkdown(result);
        break;
      case 'compact':
        this.outputCompact(result);
        break;
    }
  }

  private outputText(result: CommandResult): void {
    if (result.success) {
      console.log('✓ Success');
      if (result.data) {
        console.log(JSON.stringify(result.data, null, 2));
      }
    } else {
      console.log('✗ Error:', result.error);
    }
    if (result.metadata) {
      console.log(`[${result.metadata.duration}ms]`);
    }
  }

  private outputMarkdown(result: CommandResult): void {
    if (result.success) {
      console.log('## ✓ Success\n');
      if (result.data) {
        console.log('```json');
        console.log(JSON.stringify(result.data, null, 2));
        console.log('```');
      }
    } else {
      console.log('## ✗ Error\n');
      console.log(result.error);
    }
    if (result.metadata) {
      console.log(`\n*Executed in ${result.metadata.duration}ms*`);
    }
  }

  private outputCompact(result: CommandResult): void {
    const prefix = result.success ? 'OK' : 'ERR';
    const data = result.success 
      ? JSON.stringify(result.data)
      : result.error;
    console.log(`${prefix}|${data}`);
  }

  // ============================================
  // INPUT PARSING
  // ============================================

  private parseCommand(input: string): { command: string; args: string[] } {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    const command = parts[0] || '';
    const args = parts.slice(1);

    return { command, args };
  }

  private extractArg(args: string[], flag: string): string | undefined {
    const index = args.indexOf(flag);
    if (index !== -1 && args[index + 1] && !args[index + 1].startsWith('--')) {
      return args[index + 1];
    }
    return undefined;
  }

  // ============================================
  // INTERACTIVE MODE
  // ============================================

  /**
   * Start interactive CLI mode
   */
  async interactive(): Promise<void> {
    this.running = true;
    
    this.logger.info('Starting interactive mode');
    console.log('VIVIM AI Agent CLI v1.0.0');
    console.log('Type "help" for available commands, "exit" to quit.\n');

    // Check for identity
    const identity = this.sdk.getIdentity();
    if (identity) {
      console.log(`Logged in as: ${identity.did}`);
    } else {
      console.log('No identity found. Run "identity create" to get started.\n');
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = () => {
      if (!this.running) return;
      
      this.rl!.question('vivim> ', async (answer) => {
        if (!this.running) {
          this.rl!.close();
          return;
        }

        const trimmed = answer.trim();
        if (trimmed) {
          await this.runCommand(trimmed);
        }
        
        prompt();
      });
    };

    prompt();
  }

  /**
   * Close the CLI
   */
  async close(): Promise<void> {
    this.running = false;
    if (this.rl) {
      this.rl.close();
      this.rl = undefined;
    }
    await this.sdk.destroy();
    this.logger.info('CLI closed');
  }

  // ============================================
  // BATCH PROCESSING
  // ============================================

  /**
   * Execute multiple commands from a file
   */
  async executeFile(filePath: string): Promise<CommandResult[]> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    
    const results: CommandResult[] = [];
    
    for (const line of lines) {
      const result = await this.executeCommand(line);
      results.push(result);
      
      if (!result.success) {
        this.logger.warn({ command: line, error: result.error }, 'Command failed');
      }
    }
    
    return results;
  }

  // ============================================
  // AGENT-SPECIFIC METHODS
  // ============================================

  /**
   * Execute command and get structured result for AI agents
   */
  async agentExecute(command: string): Promise<{
    success: boolean;
    data?: unknown;
    error?: string;
    raw: string;
  }> {
    const result = await this.executeCommand(command);
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      raw: JSON.stringify(result),
    };
  }

  /**
   * Memory operation shorthand for agents
   */
  async remember(content: string, type = 'semantic', tags: string[] = []): Promise<string> {
    const result = await this.agentExecute(`memory create "${content}" --type ${type}${tags.length ? ` --tags ${tags.join(',')}` : ''}`);
    if (result.success) {
      return (result.data as Memory)?.id || 'saved';
    }
    throw new Error(result.error);
  }

  /**
   * Recall operation shorthand for agents
   */
  async recall(query: string, limit = 5): Promise<Memory[]> {
    const result = await this.agentExecute(`memory search "${query}" --limit ${limit}`);
    if (result.success) {
      return result.data as Memory[];
    }
    throw new Error(result.error);
  }

  /**
   * Content posting shorthand for agents
   */
  async post(text: string, visibility = 'public'): Promise<ContentObject> {
    const result = await this.agentExecute(`content create "${text}" --visibility ${visibility}`);
    if (result.success) {
      return result.data as ContentObject;
    }
    throw new Error(result.error);
  }
}

/**
 * Create CLI instance
 */
export async function createAIAgentCLI(options?: {
  format?: OutputFormat;
  autoInit?: boolean;
}): Promise<AIAgentCLI> {
  const sdk = new VivimSDK();
  
  if (options?.autoInit !== false) {
    await sdk.initialize();
  }
  
  return new AIAgentCLI(sdk, options);
}
