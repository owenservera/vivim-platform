/**
 * VIVIM SDK - Self-Design Module
 * 
 * Enables SDK extension and design through code using Git as the
 * coordination point. Provides APIs for building, testing, and
 * publishing SDK components.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import type { VivimSDK } from '../core/sdk.js';
import type { APINodeDefinition } from '../core/types.js';

/**
 * Code Template Types
 */
export type TemplateType = 
  | 'api-node'
  | 'sdk-node'
  | 'network-node'
  | 'extension'
  | 'custom';

/**
 * Component Status
 */
export type ComponentStatus = 
  | 'draft'
  | 'developed'
  | 'tested'
  | 'published';

/**
 * SDK Component - represents an SDK extension/component
 */
export interface SDKComponent {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  version: string;
  author: string;
  status: ComponentStatus;
  
  // File paths
  sourcePath: string;
  testPath?: string;
  
  // Git info
  gitRepo?: string;
  gitBranch?: string;
  commitHash?: string;
  
  // Dependencies
  dependencies: string[];
  peerDependencies: string[];
  
  // Capabilities
  capabilities: string[];
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  
  // Build info
  buildStatus?: 'pending' | 'success' | 'failed';
  buildOutput?: string;
}

/**
 * Component Template
 */
export interface ComponentTemplate {
  type: TemplateType;
  name: string;
  description: string;
  files: TemplateFile[];
  dependencies: string[];
  peerDependencies: string[];
  capabilities: string[];
}

export interface TemplateFile {
  path: string;
  content: string;
  isExecutable?: boolean;
}

/**
 * Git Coordination Config
 */
export interface GitCoordinationConfig {
  repoUrl: string;
  branch: string;
  basePath: string;
  autoSync: boolean;
  syncInterval: number; // milliseconds
}

/**
 * Build Result
 */
export interface BuildResult {
  success: boolean;
  componentId: string;
  output?: string;
  errors: string[];
  warnings: string[];
  duration: number;
}

/**
 * Test Result
 */
export interface TestResult {
  success: boolean;
  componentId: string;
  passed: number;
  failed: number;
  errors: TestError[];
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
  };
}

export interface TestError {
  test: string;
  error: string;
  stack?: string;
}

/**
 * Self-Design Module
 */
export class SelfDesignModule extends EventEmitter {
  private sdk: VivimSDK;
  private components: Map<string, SDKComponent> = new Map();
  private templates: Map<TemplateType, ComponentTemplate> = new Map();
  private gitConfig: GitCoordinationConfig | null = null;

  constructor(sdk: VivimSDK) {
    super();
    this.sdk = sdk;
    this.registerBuiltInTemplates();
  }

  // ============================================
  // TEMPLATES
  // ============================================

  private registerBuiltInTemplates(): void {
    // API Node Template
    this.registerTemplate({
      type: 'api-node',
      name: 'API Node',
      description: 'A functional API node for the SDK',
      files: [
        {
          path: 'src/index.ts',
          content: `import type { VivimSDK } from '@vivim/sdk';
import type { APINodeDefinition } from '@vivim/sdk/core';

export interface MyNodeConfig {
  enabled: boolean;
}

export interface MyNodeAPI {
  doSomething(): Promise<void>;
}

export class MyNode implements MyNodeAPI {
  private sdk: VivimSDK;
  
  constructor(sdk: VivimSDK) {
    this.sdk = sdk;
  }

  async doSomething(): Promise<void> {
    console.log('Hello from MyNode!');
  }

  static definition: APINodeDefinition = {
    id: '@myorg/node-mynode',
    name: 'My Node',
    version: '1.0.0',
    description: 'My custom API node',
    author: 'myorg',
    license: 'MIT',
    capabilities: [
      {
        id: 'doSomething',
        name: 'Do Something',
        description: 'Does something useful',
      },
    ],
    dependencies: {
      nodes: ['@vivim/node-identity'],
    },
    configSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
      },
    },
    events: {
      emits: [],
      listens: [],
    },
    methods: [
      {
        name: 'doSomething',
        description: 'Does something',
        parameters: { type: 'object', properties: {} },
        returns: { type: 'void' },
      },
    ],
    lifecycle: {
      init: 'init',
      start: 'start',
      stop: 'stop',
      destroy: 'destroy',
    },
    permissions: [
      { type: 'identity', access: 'read' },
    ],
  };
}
`,
        },
        {
          path: 'package.json',
          content: `{
  "name": "@myorg/node-mynode",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "@vivim/sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.1.0"
  }
}`,
        },
        {
          path: 'tsconfig.json',
          content: `{
  "extends": "../../../sdk/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}`,
        },
      ],
      dependencies: ['@vivim/sdk'],
      peerDependencies: [],
      capabilities: ['doSomething'],
    });

    // Extension Template
    this.registerTemplate({
      type: 'extension',
      name: 'Extension',
      description: 'An extension for existing nodes',
      files: [
        {
          path: 'src/index.ts',
          content: `import type { Extension } from '@vivim/sdk';

export const MyExtension: Extension = {
  id: '@myorg/ext-myext',
  name: 'My Extension',
  version: '1.0.0',
  extends: 'content-renderer',
  priority: 10,
  implementation: {
    canRender(content: any): boolean {
      return content.type === 'custom';
    },
    async render(content: any): Promise<any> {
      return { type: 'custom', rendered: true };
    },
  },
};
`,
        },
        {
          path: 'package.json',
          content: `{
  "name": "@myorg/ext-myext",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "dependencies": {
    "@vivim/sdk": "^1.0.0"
  }
}`,
        },
      ],
      dependencies: ['@vivim/sdk'],
      peerDependencies: [],
      capabilities: ['render'],
    });

    // SDK Node Template (React)
    this.registerTemplate({
      type: 'sdk-node',
      name: 'React SDK Node',
      description: 'React components and hooks',
      files: [
        {
          path: 'src/index.tsx',
          content: `import React from 'react';
import { SDKNode, useVivim } from '@vivim/sdk';

export const MyComponent: React.FC = () => {
  const sdk = useVivim();
  return <div>Hello from MyComponent!</div>;
};

export const useMyHook = () => {
  const sdk = useVivim();
  return {
    doSomething: () => console.log('Hook action'),
  };
};

export const MySDKDefinition = {
  id: '@myorg/sdk-myreact',
  name: 'My React SDK',
  platform: 'react',
  components: [
    {
      name: 'MyComponent',
      description: 'My custom component',
      props: {},
    },
  ],
  hooks: [
    {
      name: 'useMyHook',
      description: 'My custom hook',
      returns: '{ doSomething: () => void }',
    },
  ],
};
`,
        },
        {
          path: 'package.json',
          content: `{
  "name": "@myorg/sdk-myreact",
  "version": "1.0.0",
  "type": "module",
  "peerDependencies": {
    "react": "^18.0.0",
    "@vivim/sdk": "^1.0.0"
  }
}`,
        },
      ],
      dependencies: ['@vivim/sdk'],
      peerDependencies: ['react'],
      capabilities: ['components', 'hooks'],
    });
  }

  /**
   * Register a custom template
   */
  registerTemplate(template: ComponentTemplate): void {
    this.templates.set(template.type, template);
    this.emit('template:registered', template);
  }

  /**
   * Get template
   */
  getTemplate(type: TemplateType): ComponentTemplate | undefined {
    return this.templates.get(type);
  }

  /**
   * List all templates
   */
  listTemplates(): ComponentTemplate[] {
    return Array.from(this.templates.values());
  }

  // ============================================
  // COMPONENT CREATION
  // ============================================

  /**
   * Create a new component from template
   */
  async createComponent(
    name: string,
    type: TemplateType,
    options?: {
      description?: string;
      outputPath?: string;
      author?: string;
    }
  ): Promise<SDKComponent> {
    const template = this.templates.get(type);
    if (!template) {
      throw new Error(`Template not found: ${type}`);
    }

    const outputPath = options?.outputPath || `./components/${name}`;
    const identity = this.sdk.getIdentity();
    const author = options?.author || identity?.did || 'anonymous';

    // Create component directory
    await fs.mkdir(outputPath, { recursive: true });

    // Generate files from template
    for (const file of template.files) {
      const filePath = path.join(outputPath, file.path);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf-8');
    }

    // Create component record
    const component: SDKComponent = {
      id: `@${author.replace('did:key:', '')}/node-${name}`,
      name,
      type,
      description: options?.description || template.description,
      version: '0.1.0',
      author,
      status: 'draft',
      sourcePath: outputPath,
      dependencies: template.dependencies,
      peerDependencies: template.peerDependencies,
      capabilities: template.capabilities,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.components.set(component.id, component);
    this.emit('component:created', component);

    return component;
  }

  /**
   * Get component
   */
  getComponent(id: string): SDKComponent | undefined {
    return this.components.get(id);
  }

  /**
   * List all components
   */
  listComponents(): SDKComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Update component
   */
  async updateComponent(id: string, updates: Partial<SDKComponent>): Promise<SDKComponent> {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    Object.assign(component, updates, { updatedAt: Date.now() });
    this.emit('component:updated', component);

    return component;
  }

  /**
   * Delete component
   */
  async deleteComponent(id: string): Promise<void> {
    const component = this.components.get(id);
    if (!component) return;

    // Delete files
    try {
      await fs.rm(component.sourcePath, { recursive: true, force: true });
    } catch (e) {
      console.warn('Failed to delete component files:', e);
    }

    this.components.delete(id);
    this.emit('component:deleted', id);
  }

  // ============================================
  // BUILD
  // ============================================

  /**
   * Build a component
   */
  async buildComponent(id: string): Promise<BuildResult> {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Run TypeScript build
      const output = execSync('npm run build', {
        cwd: component.sourcePath,
        encoding: 'utf-8',
      });

      await this.updateComponent(id, {
        buildStatus: 'success',
        buildOutput: output,
      });

      return {
        success: true,
        componentId: id,
        output,
        errors: [],
        warnings,
        duration: Date.now() - startTime,
      };
    } catch (e: any) {
      const errorMsg = e.stdout || e.message || String(e);
      errors.push(errorMsg);

      await this.updateComponent(id, {
        buildStatus: 'failed',
        buildOutput: errorMsg,
      });

      return {
        success: false,
        componentId: id,
        output: errorMsg,
        errors,
        warnings,
        duration: Date.now() - startTime,
      };
    }
  }

  // ============================================
  // TEST
  // ============================================

  /**
   * Test a component
   */
  async testComponent(id: string): Promise<TestResult> {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    try {
      const output = execSync('npm test', {
        cwd: component.sourcePath,
        encoding: 'utf-8',
      });

      // Parse test output (simplified)
      return {
        success: true,
        componentId: id,
        passed: 1,
        failed: 0,
        errors: [],
      };
    } catch (e: any) {
      return {
        success: false,
        componentId: id,
        passed: 0,
        failed: 1,
        errors: [{ test: 'unknown', error: String(e) }],
      };
    }
  }

  // ============================================
  // GIT COORDINATION
  // ============================================

  /**
   * Configure Git coordination
   */
  configureGit(config: GitCoordinationConfig): void {
    this.gitConfig = config;
    this.emit('git:configured', config);
  }

  /**
   * Initialize Git repository for component
   */
  async initGit(id: string, options?: {
    repoName?: string;
    private?: boolean;
  }): Promise<void> {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    try {
      // Initialize git
      execSync('git init', { cwd: component.sourcePath, stdio: 'ignore' });
      
      // Create initial commit
      execSync('git add .', { cwd: component.sourcePath });
      execSync('git commit -m "Initial commit from VIVIM SDK"', { 
        cwd: component.sourcePath,
        stdio: 'ignore' 
      });

      component.gitBranch = 'main';
      component.status = 'developed';
      
      this.emit('git:initialized', component);
    } catch (e) {
      throw new Error(`Failed to initialize git: ${e}`);
    }
  }

  /**
   * Push component to Git
   */
  async pushToGit(id: string, message?: string): Promise<string> {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    if (!this.gitConfig) {
      throw new Error('Git not configured. Call configureGit() first.');
    }

    try {
      // Stage changes
      execSync('git add .', { cwd: component.sourcePath });
      
      // Commit
      const commitMsg = message || `Update component: ${component.name}`;
      execSync(`git commit -m "${commitMsg}"`, { cwd: component.sourcePath });
      
      // Get commit hash
      const hash = execSync('git rev-parse HEAD', { 
        cwd: component.sourcePath, 
        encoding: 'utf-8' 
      }).trim();

      component.commitHash = hash;
      component.updatedAt = Date.now();

      // In production, would push to remote
      // execSync('git push origin main', { cwd: component.sourcePath });

      this.emit('git:pushed', { component, commitHash: hash });
      
      return hash;
    } catch (e) {
      throw new Error(`Failed to push to git: ${e}`);
    }
  }

  /**
   * Pull component from Git
   */
  async pullFromGit(id: string): Promise<void> {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    // In production, would pull from remote
    this.emit('git:pulled', component);
  }

  // ============================================
  // PUBLISH
  // ============================================

  /**
   * Publish component to registry
   */
  async publishComponent(id: string): Promise<{ packageId: string; version: string }> {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    // Build first
    const buildResult = await this.buildComponent(id);
    if (!buildResult.success) {
      throw new Error(`Build failed: ${buildResult.errors.join(', ')}`);
    }

    // Update status
    await this.updateComponent(id, {
      status: 'published',
      publishedAt: Date.now(),
    });

    this.emit('component:published', component);

    return {
      packageId: component.id,
      version: component.version,
    };
  }

  // ============================================
  // DISCOVERY
  // ============================================

  /**
   * Discover local components
   */
  async discoverLocal(basePath: string): Promise<SDKComponent[]> {
    const discovered: SDKComponent[] = [];

    try {
      const entries = await fs.readdir(basePath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packageJsonPath = path.join(basePath, entry.name, 'package.json');
          try {
            const content = await fs.readFile(packageJsonPath, 'utf-8');
            const pkg = JSON.parse(content);
            
            // Check if it's a VIVIM component
            if (pkg.name?.includes('@vivim/') || pkg.dependencies?.['@vivim/sdk']) {
              const component: SDKComponent = {
                id: pkg.name,
                name: entry.name,
                type: this.guessComponentType(pkg),
                description: pkg.description || '',
                version: pkg.version || '0.0.0',
                author: pkg.author || 'unknown',
                status: 'developed',
                sourcePath: path.join(basePath, entry.name),
                dependencies: Object.keys(pkg.dependencies || {}),
                peerDependencies: Object.keys(pkg.peerDependencies || {}),
                capabilities: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              
              discovered.push(component);
              this.components.set(component.id, component);
            }
          } catch {
            // Not a package.json or not a VIVIM component
          }
        }
      }
    } catch (e) {
      console.warn('Failed to discover components:', e);
    }

    return discovered;
  }

  private guessComponentType(pkg: any): TemplateType {
    if (pkg.peerDependencies?.react) return 'sdk-node';
    if (pkg.name?.includes('ext-')) return 'extension';
    return 'api-node';
  }

  // ============================================
  // EXPORT/IMPORT
  // ============================================

  /**
   * Export component specification
   */
  exportComponent(id: string): string {
    const component = this.components.get(id);
    if (!component) {
      throw new Error(`Component not found: ${id}`);
    }

    return JSON.stringify(component, null, 2);
  }

  /**
   * Export all components
   */
  exportAll(): string {
    return JSON.stringify(this.listComponents(), null, 2);
  }

  /**
   * Import component specification
   */
  async importComponent(spec: string): Promise<SDKComponent> {
    const component = JSON.parse(spec) as SDKComponent;
    this.components.set(component.id, component);
    this.emit('component:imported', component);
    return component;
  }
}
