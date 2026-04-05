/**
 * VIVIM SDK — SDK Instrumentation Layer
 *
 * Wraps core SDK modules with automatic telemetry collection.
 * Every memory operation, tool execution, agent spawn, and task
 * lifecycle event is tracked and exported.
 */

import type { TelemetryHub } from '../telemetry/hub.js';
import type { MemoryCommands } from '../services/memory/commands.js';
import type { ToolRegistry } from '../core/tools/registry.js';
import type { AgentSpawner } from '../core/agents/spawner.js';
import type { TaskManager } from '../core/task-manager.js';
import type { MemoryExtractor } from '../services/memory/extractor.js';
import type { ContextCompressionService } from '../services/compression.js';
import type { PluginLoader } from '../plugins/loader.js';

/**
 * Instrument MemoryCommands with telemetry.
 */
export function instrumentMemory(commands: MemoryCommands, telemetry: TelemetryHub): void {
  const originalAdd = commands.add.bind(commands);
  commands.add = async (input) => {
    const start = Date.now();
    try {
      const result = await originalAdd(input);
      telemetry.increment('memory_create', 1, { scope: input.scope ?? 'project' });
      telemetry.record('memory_create_latency', Date.now() - start);
      telemetry.event({ type: 'memory_create', level: 'info', message: `Created memory in ${Date.now() - start}ms` });
      return result;
    } catch (error) {
      telemetry.increment('memory_errors');
      telemetry.event({ type: 'memory_error', level: 'error', message: `Failed to create memory: ${String(error)}` });
      throw error;
    }
  };

  const originalGet = commands.get.bind(commands);
  commands.get = async (scope, id) => {
    const start = Date.now();
    const result = await originalGet(scope, id);
    telemetry.increment('memory_get');
    telemetry.record('memory_get_latency', Date.now() - start);
    return result;
  };

  const originalSearch = commands.search.bind(commands);
  commands.search = async (text, options) => {
    const start = Date.now();
    const results = await originalSearch(text, options);
    telemetry.increment('memory_search');
    telemetry.record('memory_search_latency', Date.now() - start);
    telemetry.event({
      type: 'memory_search',
      level: 'debug',
      message: `Found ${results.length} memories for "${text.slice(0, 50)}"`,
      data: { queryLength: text.length, resultCount: results.length },
    });
    return results;
  };

  const originalDelete = commands.delete.bind(commands);
  commands.delete = async (scope, id) => {
    const result = await originalDelete(scope, id);
    if (result) telemetry.increment('memory_delete');
    return result;
  };

  const originalList = commands.list.bind(commands);
  commands.list = async (query) => {
    const results = await originalList(query);
    telemetry.increment('memory_list');
    telemetry.gauge('memory_total', results.length);
    return results;
  };
}

/**
 * Instrument ToolRegistry with telemetry.
 */
export function instrumentToolRegistry(registry: ToolRegistry, telemetry: TelemetryHub): void {
  const originalExecute = registry.execute.bind(registry);
  registry.execute = async (name, input, context) => {
    const start = Date.now();
    telemetry.increment('tool_execute', 1, { tool: name });
    telemetry.gauge('tools_active', registry.count());

    try {
      const result = await originalExecute(name, input, context);
      const duration = Date.now() - start;
      telemetry.record('tool_latency', duration, { tool: name });

      if (result.success) {
        telemetry.increment('tool_success');
      } else {
        telemetry.increment('tool_error', 1, { tool: name });
        telemetry.event({
          type: 'tool_error',
          level: 'error',
          message: `Tool "${name}" failed: ${result.error}`,
        });
      }

      return result;
    } catch (error) {
      telemetry.increment('tool_error');
      telemetry.event({
        type: 'tool_exception',
        level: 'error',
        message: `Tool "${name}" threw: ${String(error)}`,
      });
      throw error;
    }
  };
}

/**
 * Instrument AgentSpawner with telemetry.
 */
export function instrumentAgentSpawner(spawner: AgentSpawner, telemetry: TelemetryHub): void {
  const originalSpawn = spawner.spawn.bind(spawner);
  spawner.spawn = (config) => {
    const agent = originalSpawn(config);
    telemetry.increment('agent_spawn');
    telemetry.event({
      type: 'agent_spawn',
      level: 'info',
      message: `Spawned agent: ${agent.id}`,
      data: { instructions: config.instructions.slice(0, 50) },
    });
    return agent;
  };

  const originalExecute = spawner.execute.bind(spawner);
  spawner.execute = async (agentId) => {
    const start = Date.now();
    telemetry.increment('agent_execute');

    const result = await originalExecute(agentId);
    const duration = Date.now() - start;
    telemetry.record('agent_latency', duration);

    if (result.status === 'completed') {
      telemetry.increment('agent_success');
    } else {
      telemetry.increment('agent_error');
    }

    telemetry.event({
      type: 'agent_complete',
      level: result.status === 'failed' ? 'error' : 'info',
      message: `Agent ${agentId} ${result.status} in ${duration}ms`,
      data: {
        status: result.status,
        duration,
        toolCalls: result.toolCalls.length,
      },
    });

    return result;
  };
}

/**
 * Instrument TaskManager with telemetry.
 */
export function instrumentTaskManager(tm: TaskManager, telemetry: TelemetryHub): void {
  const originalCreate = tm.create.bind(tm);
  tm.create = (input) => {
    const task = originalCreate(input);
    telemetry.increment('task_create', 1, { type: input.type });
    telemetry.gauge('tasks_total', tm.list().length);
    return task;
  };

  const originalExecute = tm.execute.bind(tm);
  tm.execute = async (id) => {
    const start = Date.now();
    telemetry.increment('task_execute');

    const result = await originalExecute(id);
    const duration = Date.now() - start;
    telemetry.record('task_latency', duration);

    if (result.status === 'completed') {
      telemetry.increment('task_success');
    } else if (result.status === 'failed') {
      telemetry.increment('task_error');
    }

    return result;
  };

  const originalStop = tm.stop.bind(tm);
  tm.stop = (id) => {
    const result = originalStop(id);
    if (result) telemetry.increment('task_stop');
    return result;
  };
}

/**
 * Instrument MemoryExtractor with telemetry.
 */
export function instrumentMemoryExtractor(
  extractor: MemoryExtractor,
  telemetry: TelemetryHub
): void {
  const originalExtract = extractor.extractFromConversation.bind(extractor);
  extractor.extractFromConversation = async (user, assistant, options) => {
    const start = Date.now();
    telemetry.increment('extraction_run');

    const result = await originalExtract(user, assistant, options);
    const duration = Date.now() - start;
    telemetry.record('extraction_latency', duration);
    telemetry.increment('extraction_candidates', result.totalCandidates);
    telemetry.increment('extraction_success', result.extracted.length);
    telemetry.increment('extraction_rejected', result.rejected.length);

    telemetry.event({
      type: 'memory_extract',
      level: 'info',
      message: `Extracted ${result.extracted.length}/${result.totalCandidates} memories in ${duration}ms`,
      data: {
        candidates: result.totalCandidates,
        extracted: result.extracted.length,
        rejected: result.rejected.length,
      },
    });

    return result;
  };
}

/**
 * Instrument ContextCompressionService with telemetry.
 */
export function instrumentCompression(
  service: ContextCompressionService,
  telemetry: TelemetryHub
): void {
  const originalCompress = service.compress.bind(service);
  service.compress = async (messages, options) => {
    const start = Date.now();
    telemetry.increment('compression_run');

    const result = await originalCompress(messages, options);
    const duration = Date.now() - start;
    telemetry.record('compression_latency', duration);
    telemetry.gauge('compression_ratio', result.compressionRatio);

    telemetry.event({
      type: 'compression',
      level: 'info',
      message: `Compressed ${result.originalTokens} → ${result.compressedTokens} tokens (${(result.compressionRatio * 100).toFixed(0)}%)`,
      data: {
        originalTokens: result.originalTokens,
        compressedTokens: result.compressedTokens,
        ratio: result.compressionRatio,
        removed: result.messagesRemoved,
      },
    });

    return result;
  };
}

/**
 * Instrument PluginLoader with telemetry.
 */
export function instrumentPluginLoader(loader: PluginLoader, telemetry: TelemetryHub): void {
  loader.onEvent((event) => {
    telemetry.increment(`plugin_${event.type}`, 1, { plugin: event.pluginName });
    telemetry.event({
      type: `plugin_${event.type}`,
      level: event.type === 'plugin_error' ? 'error' : 'info',
      message: `Plugin ${event.type}: ${event.pluginName}`,
      data: event.data as Record<string, unknown>,
    });
  });
}

/**
 * Instrument all SDK modules at once.
 */
export function instrumentSDK(telemetry: TelemetryHub, modules: {
  memoryCommands?: MemoryCommands;
  toolRegistry?: ToolRegistry;
  agentSpawner?: AgentSpawner;
  taskManager?: TaskManager;
  memoryExtractor?: MemoryExtractor;
  compression?: ContextCompressionService;
  pluginLoader?: PluginLoader;
}): void {
  if (modules.memoryCommands) instrumentMemory(modules.memoryCommands, telemetry);
  if (modules.toolRegistry) instrumentToolRegistry(modules.toolRegistry, telemetry);
  if (modules.agentSpawner) instrumentAgentSpawner(modules.agentSpawner, telemetry);
  if (modules.taskManager) instrumentTaskManager(modules.taskManager, telemetry);
  if (modules.memoryExtractor) instrumentMemoryExtractor(modules.memoryExtractor, telemetry);
  if (modules.compression) instrumentCompression(modules.compression, telemetry);
  if (modules.pluginLoader) instrumentPluginLoader(modules.pluginLoader, telemetry);
}
