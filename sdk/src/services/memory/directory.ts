/**
 * Hierarchical Memory Directory Manager
 *
 * Manages three-tier memory hierarchy: project → user → team
 * Each tier stores memories as JSON files in a scoped directory.
 *
 * Directory structure:
 *   .vivim/memory/
 *     project/          — Project-scoped memories
 *       memories/       — Individual memory JSON files
 *       index.json      — Memory index for fast lookup
 *     user/             — User-scoped memories (cross-project)
 *       memories/
 *       index.json
 *     team/             — Team-scoped memories (synced via CRDT)
 *       memories/
 *       index.json
 */

export type MemoryScope = 'project' | 'user' | 'team';

export interface MemoryFileInfo {
  path: string;
  name: string;
  scope: MemoryScope;
  exists: boolean;
}

export interface MemoryDirectory {
  scope: MemoryScope;
  rootPath: string;
  memoriesPath: string;
  indexPath: string;
}

/**
 * Resolve the base memory directory for a given scope.
 * In browser environments, this maps to IndexedDB key paths.
 * In server/Node environments, this maps to filesystem paths.
 */
export function resolveMemoryDirectory(
  scope: MemoryScope,
  options: {
    projectRoot?: string;
    userId?: string;
    teamId?: string;
    baseDir?: string;
  }
): MemoryDirectory {
  const base = options.baseDir ?? '.vivim/memory';

  let rootPath: string;
  switch (scope) {
    case 'project':
      rootPath = options.projectRoot
        ? `${options.projectRoot}/.vivim/memory/project`
        : `${base}/project`;
      break;
    case 'user':
      rootPath = options.userId
        ? `${base}/user/${options.userId}`
        : `${base}/user/default`;
      break;
    case 'team':
      rootPath = options.teamId
        ? `${base}/team/${options.teamId}`
        : `${base}/team/default`;
      break;
  }

  return {
    scope,
    rootPath,
    memoriesPath: `${rootPath}/memories`,
    indexPath: `${rootPath}/index.json`,
  };
}

/**
 * Generate a stable file ID for a memory entry.
 * Uses a slugified version of the memory category + a hash of content.
 */
export function generateMemoryFileId(id: string): string {
  // Sanitize to filesystem-safe name
  return id
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase()
    .slice(0, 120);
}

/**
 * Memory Directory Manager — handles directory resolution and file paths.
 *
 * In production, the actual file I/O is environment-specific:
 * - Node.js/Bun: fs.readFile/fs.writeFile
 * - Browser: IndexedDB via Dexie
 * - PWA: IndexedDB with sync to server
 *
 * This class provides the path resolution logic; the MemoryStore
 * handles actual persistence.
 */
export class MemoryDirectoryManager {
  private projectRoot?: string;
  private userId?: string;
  private teamId?: string;
  private baseDir: string;

  constructor(options: {
    projectRoot?: string;
    userId?: string;
    teamId?: string;
    baseDir?: string;
  } = {}) {
    this.projectRoot = options.projectRoot;
    this.userId = options.userId;
    this.teamId = options.teamId;
    this.baseDir = options.baseDir ?? '.vivim/memory';
  }

  /**
   * Update the manager's context (e.g., when switching projects).
   */
  setContext(options: {
    projectRoot?: string;
    userId?: string;
    teamId?: string;
  }): void {
    if (options.projectRoot !== undefined) this.projectRoot = options.projectRoot;
    if (options.userId !== undefined) this.userId = options.userId;
    if (options.teamId !== undefined) this.teamId = options.teamId;
  }

  /**
   * Get the directory structure for a memory scope.
   */
  getDirectory(scope: MemoryScope): MemoryDirectory {
    return resolveMemoryDirectory(scope, {
      projectRoot: this.projectRoot,
      userId: this.userId,
      teamId: this.teamId,
      baseDir: this.baseDir,
    });
  }

  /**
   * Get all available directories for all scopes.
   */
  getAllDirectories(): Record<MemoryScope, MemoryDirectory> {
    return {
      project: this.getDirectory('project'),
      user: this.getDirectory('user'),
      team: this.getDirectory('team'),
    };
  }

  /**
   * Get the file path for a specific memory entry.
   */
  getMemoryFilePath(scope: MemoryScope, memoryId: string): MemoryFileInfo {
    const dir = this.getDirectory(scope);
    const safeId = generateMemoryFileId(memoryId);
    return {
      path: `${dir.memoriesPath}/${safeId}.json`,
      name: `${safeId}.json`,
      scope,
      exists: true,
    };
  }
}
