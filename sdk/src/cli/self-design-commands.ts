/**
 * VIVIM SDK - Self-Design CLI Commands
 * 
 * Extended CLI commands for SDK development using the self-design module
 */

import type { AIAgentCLI, CLICommand, AgentContext } from './agent-cli.js';
import type { SelfDesignModule } from '../core/self-design.js';
import type { OnChainRecordKeeper } from '../core/recordkeeper.js';
import type { TemplateType, SDKComponent, BuildResult, TestResult } from '../core/self-design.js';

/**
 * Register self-design commands with CLI
 */
export function registerSelfDesignCommands(
  cli: AIAgentCLI,
  selfDesign: SelfDesignModule,
  recordKeeper: OnChainRecordKeeper
): void {
  // ============================================
  // TEMPLATE COMMANDS
  // ============================================

  cli.register({
    name: 'template list',
    aliases: ['templates'],
    description: 'List available component templates',
    usage: 'template list',
    examples: ['template list'],
    execute: async () => {
      const templates = selfDesign.listTemplates();
      return {
        success: true,
        data: templates.map(t => ({
          type: t.type,
          name: t.name,
          description: t.description,
          capabilities: t.capabilities,
        })),
      };
    },
  });

  // ============================================
  // COMPONENT COMMANDS
  // ============================================

  cli.register({
    name: 'component create',
    aliases: ['comp create', 'new component'],
    description: 'Create a new SDK component from template',
    usage: 'component create <name> <type> [--description <desc>] [--path <path>]',
    examples: [
      'component create mynode api-node',
      'component create myext extension --description "My custom extension"',
    ],
    execute: async (args, context) => {
      const name = args[0];
      const type = args[1] as TemplateType;
      
      if (!name || !type) {
        return { success: false, error: 'Name and type are required' };
      }

      const description = extractArg(args, '--description');
      const outputPath = extractArg(args, '--path');

      try {
        const component = await selfDesign.createComponent(name, type, {
          description,
          outputPath,
        });

        // Record on chain
        await recordKeeper.recordNodeCreate(component.id, {
          name: component.name,
          type: component.type,
          capabilities: component.capabilities,
        });

        return { success: true, data: component };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  cli.register({
    name: 'component list',
    aliases: ['comp list', 'components', 'comp ls'],
    description: 'List all SDK components',
    usage: 'component list',
    examples: ['component list'],
    execute: async () => {
      const components = selfDesign.listComponents();
      return {
        success: true,
        data: components.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          status: c.status,
          version: c.version,
          path: c.sourcePath,
        })),
      };
    },
  });

  cli.register({
    name: 'component info',
    aliases: ['comp info', 'comp show'],
    description: 'Get component details',
    usage: 'component info <id>',
    examples: ['component info @myorg/node-mynode'],
    execute: async (args) => {
      const id = args[0];
      if (!id) {
        return { success: false, error: 'Component ID is required' };
      }

      const component = selfDesign.getComponent(id);
      if (!component) {
        return { success: false, error: `Component not found: ${id}` };
      }

      return { success: true, data: component };
    },
  });

  cli.register({
    name: 'component build',
    aliases: ['comp build', 'build'],
    description: 'Build a component',
    usage: 'component build <id>',
    examples: ['component build @myorg/node-mynode'],
    execute: async (args) => {
      const id = args[0];
      if (!id) {
        return { success: false, error: 'Component ID is required' };
      }

      try {
        const result = await selfDesign.buildComponent(id);

        // Record on chain
        await recordKeeper.recordNodeUpdate(id, {
          buildStatus: result.success ? 'success' : 'failed',
          buildOutput: result.output,
        });

        return { success: result.success, data: result };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  cli.register({
    name: 'component test',
    aliases: ['comp test', 'test'],
    description: 'Test a component',
    usage: 'component test <id>',
    examples: ['component test @myorg/node-mynode'],
    execute: async (args) => {
      const id = args[0];
      if (!id) {
        return { success: false, error: 'Component ID is required' };
      }

      try {
        const result = await selfDesign.testComponent(id);
        
        if (result.success) {
          await selfDesign.updateComponent(id, { status: 'tested' });
        }

        return { success: result.success, data: result };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  cli.register({
    name: 'component publish',
    aliases: ['comp publish', 'publish'],
    description: 'Publish a component to the registry',
    usage: 'component publish <id>',
    examples: ['component publish @myorg/node-mynode'],
    execute: async (args) => {
      const id = args[0];
      if (!id) {
        return { success: false, error: 'Component ID is required' };
      }

      try {
        const result = await selfDesign.publishComponent(id);

        // Record on chain
        await recordKeeper.recordNodeUpdate(id, {
          status: 'published',
          version: result.version,
        });

        return { success: true, data: result };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  cli.register({
    name: 'component discover',
    aliases: ['comp discover', 'discover'],
    description: 'Discover local SDK components',
    usage: 'component discover <path>',
    examples: ['component discover ./my-components'],
    execute: async (args) => {
      const path = args[0] || './components';

      try {
        const components = await selfDesign.discoverLocal(path);
        return {
          success: true,
          data: {
            found: components.length,
            components: components.map(c => ({
              id: c.id,
              name: c.name,
              type: c.type,
            })),
          },
        };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  cli.register({
    name: 'component delete',
    aliases: ['comp delete', 'comp rm'],
    description: 'Delete a component',
    usage: 'component delete <id>',
    examples: ['component delete @myorg/node-mynode'],
    execute: async (args) => {
      const id = args[0];
      if (!id) {
        return { success: false, error: 'Component ID is required' };
      }

      try {
        await selfDesign.deleteComponent(id);
        
        // Record on chain
        await recordKeeper.recordNodeDelete(id);

        return { success: true, data: { message: `Component ${id} deleted` } };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  // ============================================
  // GIT COMMANDS
  // ============================================

  cli.register({
    name: 'git init',
    aliases: ['git init'],
    description: 'Initialize Git for a component',
    usage: 'git init <component-id>',
    examples: ['git init @myorg/node-mynode'],
    execute: async (args) => {
      const id = args[0];
      if (!id) {
        return { success: false, error: 'Component ID is required' };
      }

      try {
        await selfDesign.initGit(id);
        return { success: true, data: { message: `Git initialized for ${id}` } };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  cli.register({
    name: 'git push',
    aliases: ['git push'],
    description: 'Push component to Git',
    usage: 'git push <component-id> [message]',
    examples: ['git push @myorg/node-mynode "Added new feature"'],
    execute: async (args) => {
      const id = args[0];
      if (!id) {
        return { success: false, error: 'Component ID is required' };
      }

      const message = args.slice(1).join(' ');

      try {
        const hash = await selfDesign.pushToGit(id, message || undefined);
        
        // Record on chain
        await recordKeeper.recordNodeUpdate(id, {
          gitCommit: hash,
        });

        return { success: true, data: { commitHash: hash } };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  // ============================================
  // RECORDKEEPING / AUDIT COMMANDS
  // ============================================

  cli.register({
    name: 'audit',
    aliases: ['log', 'history'],
    description: 'Show operation audit trail',
    usage: 'audit [--type <type>] [--author <did>] [--limit <n>]',
    examples: ['audit', 'audit --type node:create --limit 10'],
    execute: async (args) => {
      const type = extractArg(args, '--type');
      const author = extractArg(args, '--author');
      const limit = parseInt(extractArg(args, '--limit') || '50', 10);

      try {
        const filter: any = { limit };
        if (type) filter.types = [type];
        if (author) filter.authors = [author];

        const entries = recordKeeper.getAuditTrail(filter);
        return { success: true, data: entries };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  cli.register({
    name: 'verify',
    aliases: ['verify'],
    description: 'Verify an operation',
    usage: 'verify <operation-id>',
    examples: ['verify bafy...'],
    execute: async (args) => {
      const id = args[0];
      if (!id) {
        return { success: false, error: 'Operation ID is required' };
      }

      try {
        const result = await recordKeeper.verifyOperation(id);
        return { success: result.valid, data: result };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  cli.register({
    name: 'verify chain',
    aliases: ['verify chain'],
    description: 'Verify operation chain',
    usage: 'verify chain <operation-id>',
    examples: ['verify chain bafy...'],
    execute: async (args) => {
      const id = args[0];
      if (!id) {
        return { success: false, error: 'Operation ID is required' };
      }

      try {
        const result = await recordKeeper.verifyChain(id);
        return { success: result.valid, data: result };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  cli.register({
    name: 'stats',
    aliases: ['statistics'],
    description: 'Show recordkeeping statistics',
    usage: 'stats',
    examples: ['stats'],
    execute: async () => {
      try {
        const stats = recordKeeper.getStats();
        return { success: true, data: stats };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });

  cli.register({
    name: 'export audit',
    aliases: ['export audit'],
    description: 'Export audit trail',
    usage: 'export audit [--format json]',
    examples: ['export audit', 'export audit --format json'],
    execute: async (args) => {
      try {
        const format = extractArg(args, '--format');
        const audit = recordKeeper.exportAuditTrail();
        
        if (format === 'json' || !format) {
          return { success: true, data: JSON.parse(audit) };
        }
        
        return { success: true, data: audit };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  });
}

/**
 * Helper to extract argument
 */
function extractArg(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1] && !args[index + 1].startsWith('--')) {
    return args[index + 1];
  }
  return undefined;
}
