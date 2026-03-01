#!/usr/bin/env node

/**
 * VIVIM SDK CLI - Developer tools for VIVIM SDK
 * 
 * Usage:
 *   vivim init <project-name>     Initialize new project
 *   vivim generate node <name>    Generate SDK node
 *   vivim generate service <name> Generate service
 *   vivim test                    Run tests
 *   vivim build                   Build project
 *   vivim deploy                  Deploy application
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * CLI Commands
 */
const commands: Record<string, Command> = {
  init: {
    description: 'Initialize a new VIVIM SDK project',
    usage: 'vivim init <project-name> [options]',
    options: [
      { name: '--template', alias: '-t', description: 'Project template (default|enterprise|p2p)' },
      { name: '--package-manager', alias: '-p', description: 'Package manager (npm|yarn|pnpm|bun)' },
    ],
    handler: initProject,
  },
  generate: {
    description: 'Generate SDK components',
    usage: 'vivim generate <type> <name>',
    subcommands: {
      node: {
        description: 'Generate a new SDK node',
        handler: generateNode,
      },
      service: {
        description: 'Generate a new service',
        handler: generateService,
      },
      protocol: {
        description: 'Generate a new protocol',
        handler: generateProtocol,
      },
    },
    handler: generateHandler,
  },
  test: {
    description: 'Run tests',
    usage: 'vivim test [options]',
    options: [
      { name: '--coverage', alias: '-c', description: 'Generate coverage report' },
      { name: '--watch', alias: '-w', description: 'Watch mode' },
      { name: '--ui', description: 'Open Vitest UI' },
    ],
    handler: runTests,
  },
  build: {
    description: 'Build project',
    usage: 'vivim build [options]',
    options: [
      { name: '--watch', alias: '-w', description: 'Watch mode' },
      { name: '--minify', description: 'Minify output' },
    ],
    handler: buildProject,
  },
  deploy: {
    description: 'Deploy application',
    usage: 'vivim deploy [options]',
    options: [
      { name: '--target', alias: '-t', description: 'Deployment target (vercel|aws|azure|netlify)' },
      { name: '--prod', description: 'Deploy to production' },
    ],
    handler: deployProject,
  },
  help: {
    description: 'Show help',
    usage: 'vivim help [command]',
    handler: showHelp,
  },
};

interface Command {
  description: string;
  usage: string;
  options?: { name: string; alias?: string; description: string }[];
  subcommands?: Record<string, { description?: string; handler: CommandHandler }>;
  handler: CommandHandler;
}

type CommandHandler = (args: string[], options: Record<string, string>) => Promise<void>;

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const commandName = args[0] || 'help';
  const commandArgs = args.slice(1);

  // Parse options
  const options: Record<string, string> = {};
  const positionalArgs: string[] = [];

  for (let i = 0; i < commandArgs.length; i++) {
    const arg = commandArgs[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = commandArgs[i + 1] && !commandArgs[i + 1].startsWith('-') ? commandArgs[i + 1] : 'true';
      options[key] = value;
      if (value !== 'true') i++;
    } else if (arg.startsWith('-') && arg.length === 2) {
      const alias = arg.slice(1);
      const value = commandArgs[i + 1] && !commandArgs[i + 1].startsWith('-') ? commandArgs[i + 1] : 'true';
      // Find option by alias
      const command = commands[commandName];
      if (command?.options) {
        const option = command.options.find((o) => o.alias === alias);
        if (option) {
          options[option.name.slice(2)] = value;
          if (value !== 'true') i++;
        }
      }
    } else {
      positionalArgs.push(arg);
    }
  }

  // Execute command
  const command = commands[commandName];
  if (!command) {
    console.error(`Unknown command: ${commandName}`);
    console.error('Run "vivim help" for available commands');
    process.exit(1);
  }

  try {
    await command.handler(positionalArgs, options);
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

/**
 * Command Handlers
 */

async function initProject(args: string[], options: Record<string, string>): Promise<void> {
  const projectName = args[0];
  if (!projectName) {
    console.error('Please provide a project name');
    console.error('Usage: vivim init <project-name>');
    process.exit(1);
  }

  const template = options.template || 'default';
  const packageManager = options.packageManager || 'npm';

  console.log(`🚀 Initializing VIVIM SDK project: ${projectName}`);
  console.log(`   Template: ${template}`);
  console.log(`   Package Manager: ${packageManager}`);

  // Create project directory
  const projectDir = resolve(process.cwd(), projectName);
  if (existsSync(projectDir)) {
    console.error(`Directory already exists: ${projectDir}`);
    process.exit(1);
  }

  mkdirSync(projectDir, { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vivim dev',
      build: 'vivim build',
      test: 'vivim test',
      deploy: 'vivim deploy',
    },
    dependencies: {
      '@vivim/sdk': 'latest',
    },
    devDependencies: {
      '@vivim/sdk': 'latest',
      typescript: '^5.3.0',
      vitest: '^1.1.0',
    },
  };

  writeFileSync(join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      lib: ['ES2022'],
      moduleResolution: 'node',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      outDir: './dist',
      rootDir: './src',
      declaration: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  writeFileSync(join(projectDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  // Create src directory
  mkdirSync(join(projectDir, 'src'));

  // Create main.ts based on template
  let mainContent = '';
  switch (template) {
    case 'default':
      mainContent = getDefaultTemplate();
      break;
    case 'enterprise':
      mainContent = getEnterpriseTemplate();
      break;
    case 'p2p':
      mainContent = getP2PTemplate();
      break;
    default:
      mainContent = getDefaultTemplate();
  }

  writeFileSync(join(projectDir, 'src', 'main.ts'), mainContent);

  // Create README.md
  const readme = `# ${projectName}

VIVIM SDK Project

## Getting Started

\`\`\`bash
${packageManager} install
${packageManager} run dev
\`\`\`

## License

MIT
`;

  writeFileSync(join(projectDir, 'README.md'), readme);

  // Create .gitignore
  const gitignore = `node_modules
dist
.env
*.log
`;

  writeFileSync(join(projectDir, '.gitignore'), gitignore);

  console.log('');
  console.log('✅ Project initialized successfully!');
  console.log('');
  console.log('Next steps:');
  console.log(`  cd ${projectName}`);
  console.log(`  ${packageManager} install`);
  console.log(`  ${packageManager} run dev`);
  console.log('');
}

async function generateHandler(args: string[], options: Record<string, string>): Promise<void> {
  const subcommand = args[0];
  if (!subcommand) {
    console.error('Please specify what to generate');
    console.error('Usage: vivim generate <node|service|protocol> <name>');
    process.exit(1);
  }

  const command = commands.generate.subcommands?.[subcommand];
  if (!command) {
    console.error(`Unknown generate subcommand: ${subcommand}`);
    console.error('Available: node, service, protocol');
    process.exit(1);
  }

  await command.handler(args.slice(1), options);
}

async function generateNode(args: string[], options: Record<string, string>): Promise<void> {
  const nodeName = args[0];
  if (!nodeName) {
    console.error('Please provide a node name');
    console.error('Usage: vivim generate node <name>');
    process.exit(1);
  }

  const fileName = `${kebabCase(nodeName)}-node.ts`;
  const className = `${pascalCase(nodeName)}Node`;
  const interfaceName = `${pascalCase(nodeName)}NodeAPI`;

  const content = `/**
 * ${className} - Generated SDK Node
 */

import type { VivimSDK } from '../core/sdk.js';
import {
  createCommunicationProtocol,
  type MessageEnvelope,
  type CommunicationEvent,
  type NodeMetrics,
} from '../core/communication.js';

/**
 * ${interfaceName}
 */
export interface ${interfaceName} {
  // TODO: Define node API methods
  
  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

/**
 * ${className} Implementation
 */
export class ${className} implements ${interfaceName} {
  private communication: ReturnType<typeof createCommunicationProtocol>;

  constructor(private sdk: VivimSDK) {
    this.communication = createCommunicationProtocol('${kebabCase(nodeName)}-node');
  }

  // TODO: Implement node methods

  // Communication Protocol
  getNodeId(): string {
    return '${kebabCase(nodeName)}-node';
  }

  getMetrics(): NodeMetrics {
    return this.communication.getMetrics();
  }

  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void {
    return this.communication.onEvent('message_received', listener as any);
  }

  async sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope> {
    return this.communication.sendMessage(type, payload);
  }

  async processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    return this.communication.processMessage(envelope);
  }

  destroy(): void {
    // Cleanup resources
  }
}

/**
 * Create ${className} instance
 */
export function create${pascalCase(nodeName)}Node(sdk: VivimSDK): ${className} {
  return new ${className}(sdk);
}
`;

  const outputPath = join(process.cwd(), 'src', 'nodes', fileName);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content);

  console.log(`✅ Generated node: ${fileName}`);
  console.log(`   Location: ${outputPath}`);
}

async function generateService(args: string[], options: Record<string, string>): Promise<void> {
  const serviceName = args[0];
  if (!serviceName) {
    console.error('Please provide a service name');
    console.error('Usage: vivim generate service <name>');
    process.exit(1);
  }

  const fileName = `${kebabCase(serviceName)}-service.ts`;
  const className = `${pascalCase(serviceName)}Service`;
  const interfaceName = `${pascalCase(serviceName)}API`;

  const content = `/**
 * ${className} - Generated Service
 */

import type { VivimSDK } from '../core/sdk.js';

/**
 * ${interfaceName}
 */
export interface ${interfaceName} {
  // TODO: Define service API methods
}

/**
 * ${className} Implementation
 */
export class ${className} implements ${interfaceName} {
  constructor(private sdk: VivimSDK) {}

  // TODO: Implement service methods
}

/**
 * Create ${className} instance
 */
export function create${pascalCase(serviceName)}Service(sdk: VivimSDK): ${className} {
  return new ${className}(sdk);
}
`;

  const outputPath = join(process.cwd(), 'src', 'services', fileName);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content);

  console.log(`✅ Generated service: ${fileName}`);
  console.log(`   Location: ${outputPath}`);
}

async function generateProtocol(args: string[], options: Record<string, string>): Promise<void> {
  const protocolName = args[0];
  if (!protocolName) {
    console.error('Please provide a protocol name');
    console.error('Usage: vivim generate protocol <name>');
    process.exit(1);
  }

  const fileName = `${kebabCase(protocolName)}.ts`;
  const className = `${pascalCase(protocolName)}Protocol`;

  const content = `/**
 * ${className} - Generated Protocol
 */

/**
 * Protocol version
 */
export const ${pascalCase(protocolName)}_VERSION = '1.0.0';

/**
 * ${className} Implementation
 */
export class ${className} {
  // TODO: Implement protocol methods
}

/**
 * Create ${className} instance
 */
export function create${pascalCase(protocolName)}(): ${className} {
  return new ${className}();
}
`;

  const outputPath = join(process.cwd(), 'src', 'protocols', fileName);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content);

  console.log(`✅ Generated protocol: ${fileName}`);
  console.log(`   Location: ${outputPath}`);
}

async function runTests(args: string[], options: Record<string, string>): Promise<void> {
  console.log('🧪 Running tests...');

  const testArgs = ['vitest', 'run'];
  if (options.coverage) testArgs.push('--coverage');
  if (options.watch) testArgs.push('--watch');
  if (options.ui) testArgs.push('--ui');

  runCommand('bun', testArgs);
}

async function buildProject(args: string[], options: Record<string, string>): Promise<void> {
  console.log('🔨 Building project...');

  const buildArgs = ['tsc'];
  if (options.watch) buildArgs.push('--watch');

  runCommand('bun', buildArgs);
}

async function deployProject(args: string[], options: Record<string, string>): Promise<void> {
  const target = options.target || 'vercel';
  const prod = options.prod || false;

  console.log(`🚀 Deploying to ${target}...`);
  console.log(`   Production: ${prod ? 'yes' : 'no'}`);

  let deployArgs: string[];
  switch (target) {
    case 'vercel':
      deployArgs = ['vercel', 'deploy', prod ? '--prod' : ''];
      break;
    case 'netlify':
      deployArgs = ['netlify', 'deploy', prod ? '--prod' : ''];
      break;
    case 'aws':
      deployArgs = ['aws', 's3', 'sync', './dist', 's3://my-bucket'];
      break;
    case 'azure':
      deployArgs = ['az', 'storage', 'blob', 'upload-batch', '--destination', '$web', '--source', './dist'];
      break;
    default:
      console.error(`Unknown deployment target: ${target}`);
      process.exit(1);
  }

  runCommand('bun', deployArgs);
}

async function showHelp(args: string[], options: Record<string, string>): Promise<void> {
  const commandName = args[0];

  if (!commandName) {
    // Show all commands
    console.log('');
    console.log('📦 VIVIM SDK CLI');
    console.log('');
    console.log('Usage: vivim <command> [options]');
    console.log('');
    console.log('Commands:');

    for (const [name, command] of Object.entries(commands)) {
      if (name === 'help') continue;
      console.log(`  ${name.padEnd(12)} ${command.description}`);
    }

    console.log('');
    console.log('Run "vivim help <command>" for more information on a command.');
    console.log('');
  } else {
    // Show command help
    const command = commands[commandName];
    if (!command) {
      console.error(`Unknown command: ${commandName}`);
      return;
    }

    console.log('');
    console.log(`📦 vivim ${commandName}`);
    console.log('');
    console.log(command.description);
    console.log('');
    console.log(`Usage: ${command.usage}`);

    if (command.options) {
      console.log('');
      console.log('Options:');
      for (const option of command.options) {
        const alias = option.alias ? `, ${option.alias}` : '';
        console.log(`  ${option.name}${alias}  ${option.description}`);
      }
    }

    if (command.subcommands) {
      console.log('');
      console.log('Subcommands:');
      for (const [name, sub] of Object.entries(command.subcommands)) {
        console.log(`  ${name.padEnd(12)} ${sub.description || ''}`);
      }
    }

    console.log('');
  }
}

/**
 * Helper Functions
 */

function runCommand(command: string, args: string[]): void {
  const proc = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
  });

  proc.on('close', (code) => {
    if (code !== 0) {
      process.exit(code || 1);
    }
  });
}

function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function pascalCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1$2')
    .replace(/[\s_-]+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function getDefaultTemplate(): string {
  return `/**
 * VIVIM SDK - Default Template
 */

import { VivimSDK } from '@vivim/sdk';

async function main() {
  // Initialize SDK
  const sdk = new VivimSDK({
    // Configuration
  });

  await sdk.initialize();

  console.log('VIVIM SDK initialized!');

  // Use SDK nodes
  const identityNode = await sdk.loadNode('@vivim/node-identity');
  const identity = await identityNode.getIdentity();

  if (!identity) {
    const newIdentity = await identityNode.createIdentity();
    console.log('Created identity:', newIdentity.did);
  } else {
    console.log('Loaded identity:', identity.did);
  }
}

main().catch(console.error);
`;
}

function getEnterpriseTemplate(): string {
  return `/**
 * VIVIM SDK - Enterprise Template
 * Includes SSO, Audit Logging, and Compliance
 */

import { VivimSDK } from '@vivim/sdk';
import { createSSOService, createAuditLoggingService } from '@vivim/sdk/services';

async function main() {
  // Initialize SDK
  const sdk = new VivimSDK({
    // Enterprise configuration
  });

  await sdk.initialize();

  // Setup SSO
  const sso = createSSOService('https://your-instance.com');
  
  // Register SSO provider
  await sso.registerProvider({
    id: 'okta',
    name: 'Okta SSO',
    type: 'oidc',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    issuerUrl: 'https://your-org.okta.com',
    redirectUri: 'https://your-app.com/callback',
    scopes: ['openid', 'profile', 'email'],
    enabled: true,
  });

  // Setup audit logging
  const audit = createAuditLoggingService(sdk);

  console.log('Enterprise VIVIM SDK initialized!');
  console.log('SSO and Audit Logging enabled');
}

main().catch(console.error);
`;
}

function getP2PTemplate(): string {
  return `/**
 * VIVIM SDK - P2P Template
 * Includes Federation and P2P networking
 */

import { VivimSDK } from '@vivim/sdk';
import { FederationClient, InstanceDiscovery } from '@vivim/sdk/nodes';

async function main() {
  // Initialize SDK
  const sdk = new VivimSDK({
    // P2P configuration
  });

  await sdk.initialize();

  // Setup federation
  const federation = new FederationClient(sdk, {
    instanceUrl: 'https://your-instance.com',
    did: 'did:key:z6Mk...',
  });

  // Discover instances
  const discovery = new InstanceDiscovery();
  const instances = await discovery.discoverFromDirectory();

  console.log('P2P VIVIM SDK initialized!');
  console.log('Discovered instances:', instances.length);

  // Connect to federation
  for (const instance of instances) {
    if (instance.status === 'active') {
      await federation.discoverInstance(instance.domain);
    }
  }
}

main().catch(console.error);
`;
}

// Run CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
