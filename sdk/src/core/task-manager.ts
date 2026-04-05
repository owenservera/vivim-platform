/**
 * VIVIM SDK — Task Management System
 *
 * Inspired by vCode's 6 task tools: TaskCreate, TaskGet, TaskList, TaskUpdate, TaskOutput, TaskStop.
 *
 * Generic background task system for:
 * - Shell tasks (command execution)
 * - Agent tasks (sub-agent execution)
 * - Memory tasks (extraction, consolidation)
 * - Sync tasks (team sync, content sync)
 * - Custom tasks (user-defined workflows)
 *
 * Task lifecycle:
 * created → running → completed | failed | stopped
 */

import type { VivimSDK } from '../core/sdk.js';

/**
 * Task type — determines execution environment.
 */
export type TaskType = 'shell' | 'agent' | 'memory' | 'sync' | 'custom';

/**
 * Task status.
 */
export type TaskStatus = 'created' | 'running' | 'completed' | 'failed' | 'stopped';

/**
 * Task priority.
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Task definition.
 */
export interface TaskDefinition {
  /** Unique task ID */
  id: string;
  /** Task name/description */
  name: string;
  /** Task type */
  type: TaskType;
  /** Task status */
  status: TaskStatus;
  /** Priority */
  priority: TaskPriority;
  /** Task payload (command, agent config, etc.) */
  payload: Record<string, unknown>;
  /** Current task status message */
  statusMessage?: string;
  /** Output lines (stdout/stderr equivalent) */
  output: string[];
  /** Error message if failed */
  error?: string;
  /** Created timestamp */
  createdAt: number;
  /** Started timestamp */
  startedAt?: number;
  /** Completed timestamp */
  completedAt?: number;
  /** Tags for organization */
  tags?: string[];
  /** Parent task ID (for sub-tasks) */
  parentId?: string;
}

/**
 * Task creation input.
 */
export interface CreateTaskInput {
  name: string;
  type: TaskType;
  payload: Record<string, unknown>;
  priority?: TaskPriority;
  tags?: string[];
  parentId?: string;
}

/**
 * Task update input.
 */
export interface TaskUpdateInput {
  status?: TaskStatus;
  statusMessage?: string;
  tags?: string[];
}

/**
 * Task query options.
 */
export interface TaskQuery {
  status?: TaskStatus;
  type?: TaskType;
  tags?: string[];
  parentId?: string;
  limit?: number;
}

/**
 * Task output response.
 */
export interface TaskOutput {
  /** Task ID */
  taskId: string;
  /** Current status */
  status: TaskStatus;
  /** Output lines */
  output: string[];
  /** Whether the task is still running */
  isRunning: boolean;
  /** Error if failed */
  error?: string;
}

/**
 * Task executor function.
 */
export type TaskExecutor = (
  task: TaskDefinition,
  onOutput: (line: string) => void,
  onStatus: (status: TaskStatus, message: string) => void,
  signal: AbortSignal
) => Promise<void>;

/**
 * Task Manager — full lifecycle management of background tasks.
 *
 * Implements the 6-tool pattern from vCode:
 * 1. create — Create a new task
 * 2. get — Get task details
 * 3. list — List all tasks
 * 4. update — Update task status/metadata
 * 5. output — Get task output
 * 6. stop — Stop a running task
 */
export class TaskManager {
  private tasks: Map<string, TaskDefinition> = new Map();
  private executors: Map<TaskType, TaskExecutor> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private sdk?: VivimSDK;

  constructor(options?: { sdk?: VivimSDK }) {
    this.sdk = options?.sdk;
  }

  // ============================================
  // 1. CREATE
  // ============================================

  /**
   * Create a new task.
   */
  create(input: CreateTaskInput): TaskDefinition {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const task: TaskDefinition = {
      id,
      name: input.name,
      type: input.type,
      status: 'created',
      priority: input.priority ?? 'normal',
      payload: input.payload,
      output: [],
      createdAt: Date.now(),
      tags: input.tags,
      parentId: input.parentId,
    };

    this.tasks.set(id, task);
    return task;
  }

  // ============================================
  // 2. GET
  // ============================================

  /**
   * Get task details.
   */
  get(id: string): TaskDefinition | null {
    return this.tasks.get(id) ?? null;
  }

  // ============================================
  // 3. LIST
  // ============================================

  /**
   * List tasks with optional filtering.
   */
  list(query: TaskQuery = {}): TaskDefinition[] {
    let results = Array.from(this.tasks.values());

    if (query.status) {
      results = results.filter(t => t.status === query.status);
    }
    if (query.type) {
      results = results.filter(t => t.type === query.type);
    }
    if (query.tags && query.tags.length > 0) {
      results = results.filter(t =>
        query.tags!.every(tag => t.tags?.includes(tag))
      );
    }
    if (query.parentId) {
      results = results.filter(t => t.parentId === query.parentId);
    }

    // Sort by creation date (newest first)
    results.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  // ============================================
  // 4. UPDATE
  // ============================================

  /**
   * Update task status/metadata.
   */
  update(id: string, input: TaskUpdateInput): TaskDefinition | null {
    const task = this.tasks.get(id);
    if (!task) return null;

    if (input.status) {
      task.status = input.status;
      if (input.status === 'running' && !task.startedAt) {
        task.startedAt = Date.now();
      }
      if (['completed', 'failed', 'stopped'].includes(input.status) && !task.completedAt) {
        task.completedAt = Date.now();
      }
    }
    if (input.statusMessage) {
      task.statusMessage = input.statusMessage;
    }
    if (input.tags) {
      task.tags = input.tags;
    }

    return task;
  }

  // ============================================
  // 5. OUTPUT
  // ============================================

  /**
   * Get task output.
   */
  getOutput(id: string): TaskOutput | null {
    const task = this.tasks.get(id);
    if (!task) return null;

    return {
      taskId: id,
      status: task.status,
      output: [...task.output],
      isRunning: task.status === 'running' || task.status === 'created',
      error: task.error,
    };
  }

  // ============================================
  // 6. STOP
  // ============================================

  /**
   * Stop a running task.
   */
  stop(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    if (!['created', 'running'].includes(task.status)) return false;

    // Abort execution
    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(id);
    }

    task.status = 'stopped';
    task.completedAt = Date.now();
    task.statusMessage = 'Task stopped by user';

    return true;
  }

  // ============================================
  // EXECUTION
  // ============================================

  /**
   * Register an executor for a task type.
   */
  registerExecutor(type: TaskType, executor: TaskExecutor): void {
    this.executors.set(type, executor);
  }

  /**
   * Start executing a task.
   */
  async execute(id: string): Promise<TaskDefinition> {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Task not found: ${id}`);

    const executor = this.executors.get(task.type);
    if (!executor) {
      task.status = 'failed';
      task.error = `No executor registered for task type: ${task.type}`;
      task.completedAt = Date.now();
      return task;
    }

    // Set up abort controller
    const controller = new AbortController();
    this.abortControllers.set(id, controller);

    // Update status to running
    task.status = 'running';
    task.startedAt = Date.now();

    // Execute
    try {
      await executor(
        task,
        (line) => {
          task.output.push(line);
          // Keep output bounded (max 1000 lines)
          if (task.output.length > 1000) {
            task.output = task.output.slice(-500);
          }
        },
        (status, message) => {
          task.status = status;
          task.statusMessage = message;
          if (['completed', 'failed', 'stopped'].includes(status)) {
            task.completedAt = Date.now();
          }
        },
        controller.signal
      );

      if (task.status === 'running') {
        task.status = 'completed';
        task.completedAt = Date.now();
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.completedAt = Date.now();
    } finally {
      this.abortControllers.delete(id);
    }

    return task;
  }

  /**
   * Execute a task in the background (non-blocking).
   */
  executeBackground(id: string): void {
    this.execute(id).catch(() => {
      // Error already recorded in task status
    });
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get task statistics.
   */
  getStats(): {
    total: number;
    byStatus: Record<TaskStatus, number>;
    byType: Record<TaskType, number>;
    running: number;
  } {
    const tasks = Array.from(this.tasks.values());
    const byStatus: Record<TaskStatus, number> = {
      created: 0, running: 0, completed: 0, failed: 0, stopped: 0,
    };
    const byType: Record<TaskType, number> = {
      shell: 0, agent: 0, memory: 0, sync: 0, custom: 0,
    };

    for (const task of tasks) {
      byStatus[task.status]++;
      byType[task.type]++;
    }

    return {
      total: tasks.length,
      byStatus,
      byType,
      running: byStatus.running,
    };
  }

  /**
   * Delete a completed/failed/stopped task.
   */
  delete(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    if (['created', 'running'].includes(task.status)) {
      return false; // Must stop first
    }
    return this.tasks.delete(id);
  }

  /**
   * Clean up all completed/failed/stopped tasks.
   */
  cleanup(): number {
    let count = 0;
    for (const [id, task] of this.tasks.entries()) {
      if (['completed', 'failed', 'stopped'].includes(task.status)) {
        this.tasks.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Destroy the task manager and abort all running tasks.
   */
  destroy(): void {
    for (const [id, task] of this.tasks.entries()) {
      if (['created', 'running'].includes(task.status)) {
        this.stop(id);
      }
    }
    this.tasks.clear();
    this.executors.clear();
    this.abortControllers.clear();
  }
}
