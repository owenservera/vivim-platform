/**
 * VIVIM SDK — Demo Engine
 *
 * Scripted investor demo journeys with narration, metrics, and magic moments.
 *
 * Journey format: Markdown-defined stories with step-by-step execution,
 * screenshot capture, and investor-facing metrics.
 *
 * Three Magic Moments:
 * 1. The Archive (0-15s) — "Where AI thinking goes to die"
 * 2. The Knowledge Graph (35-60s) — "The money shot"
 * 3. The Context Cockpit (60-80s) — "AI that knows you"
 */

import type { TelemetryHub, EventLogEntry } from '../telemetry/hub.js';

// ============================================
// TYPES
// ============================================

export type DemoStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface DemoStep {
  id: string;
  name: string;
  description: string;
  /** Duration in ms */
  duration: number;
  /** Action to execute */
  action: () => Promise<void>;
  /** Narration to display during this step */
  narration?: string;
  /** Screenshot marker name */
  screenshot?: string;
  /** Metrics to capture after this step */
  metrics?: string[];
  status: DemoStepStatus;
  startedAt?: number;
  completedAt?: number;
}

export interface DemoJourney {
  slug: string;
  title: string;
  description: string;
  /** Target investor type */
  target: 'technical' | 'product' | 'business' | 'general';
  /** Total estimated duration in seconds */
  duration: number;
  /** Steps in the journey */
  steps: DemoStep[];
  /** Pre-conditions that must be met */
  preConditions?: string[];
  /** Backup plan if things go wrong */
  backupPlan?: { failure: string; solution: string }[];
  /** FAQ for this journey */
  faq?: Array<{ question: string; answer: string }>;
}

export interface DemoState {
  currentJourney?: DemoJourney;
  currentStepIndex: number;
  isRunning: boolean;
  progress: number; // 0-1
  startTime?: number;
  events: EventLogEntry[];
  magicMoments: MagicMoment[];
}

export interface MagicMoment {
  id: string;
  name: string;
  timestamp: number;
  metric: string;
  value: string;
  story: string;
}

export type DemoEventType =
  | 'journey_start'
  | 'journey_complete'
  | 'journey_fail'
  | 'journey_cancel'
  | 'step_start'
  | 'step_complete'
  | 'step_fail'
  | 'step_skip'
  | 'magic_moment'
  | 'screenshot_capture'
  | 'narration_update'
  | 'progress_update';

export interface DemoEvent {
  type: DemoEventType;
  timestamp: number;
  journeySlug?: string;
  stepId?: string;
  data?: Record<string, unknown>;
}

// ============================================
// DEMO EVENT BUS
// ============================================

/**
 * Pub/sub event bus for cross-component demo communication.
 * Enables demo components to coordinate state changes and triggers.
 */
export class DemoEventBus {
  private listeners: Map<string, Set<(event: DemoEvent) => void>> = new Map();

  emit(event: DemoEvent): void {
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        try { listener(event); } catch { /* ignore */ }
      }
    }
    // Also emit to wildcard
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      for (const listener of allListeners) {
        try { listener(event); } catch { /* ignore */ }
      }
    }
  }

  on(type: string, listener: (event: DemoEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
    return () => { this.listeners.get(type)?.delete(listener); };
  }

  clear(): void {
    this.listeners.clear();
  }
}

// ============================================
// JOURNEY RUNNER
// ============================================

/**
 * Journey Runner — executes demo journeys step by step.
 *
 * Manages step lifecycle, narration, screenshot capture points,
 * and magic moment triggers.
 */
export class JourneyRunner {
  private state: DemoState = {
    currentStepIndex: 0,
    isRunning: false,
    progress: 0,
    events: [],
    magicMoments: [],
  };

  private abortController?: AbortController;

  constructor(
    private telemetry: TelemetryHub,
    private eventBus: DemoEventBus
  ) {}

  /**
   * Get current state.
   */
  getState(): DemoState {
    return { ...this.state };
  }

  /**
   * Start a journey.
   */
  async start(journey: DemoJourney): Promise<void> {
    if (this.state.isRunning) {
      throw new Error('A journey is already running');
    }

    this.state = {
      currentJourney: journey,
      currentStepIndex: 0,
      isRunning: true,
      progress: 0,
      startTime: Date.now(),
      events: [],
      magicMoments: [],
    };

    this.abortController = new AbortController();

    this.telemetry.event({
      type: 'journey_start',
      level: 'info',
      message: `Starting journey: ${journey.title}`,
      data: { slug: journey.slug, target: journey.target, steps: journey.steps.length },
    });

    this.eventBus.emit({
      type: 'journey_start',
      timestamp: Date.now(),
      journeySlug: journey.slug,
    });

    // Execute steps
    for (let i = 0; i < journey.steps.length; i++) {
      if (this.abortController.signal.aborted) {
        this.state.isRunning = false;
        this.eventBus.emit({ type: 'journey_cancel', timestamp: Date.now(), journeySlug: journey.slug });
        return;
      }

      await this.executeStep(journey.steps[i], i, journey);
    }

    // Journey complete
    this.state.isRunning = false;
    this.state.progress = 1;

    this.telemetry.event({
      type: 'journey_complete',
      level: 'info',
      message: `Journey complete: ${journey.title}`,
      data: {
        duration: Date.now() - (this.state.startTime ?? Date.now()),
        magicMoments: this.state.magicMoments.length,
      },
    });

    this.eventBus.emit({
      type: 'journey_complete',
      timestamp: Date.now(),
      journeySlug: journey.slug,
      data: { magicMoments: this.state.magicMoments.length },
    });
  }

  /**
   * Cancel the running journey.
   */
  cancel(): void {
    this.abortController?.abort();
  }

  /**
   * Execute a single step.
   */
  private async executeStep(step: DemoStep, index: number, journey: DemoJourney): Promise<void> {
    if (this.abortController?.signal.aborted) return;

    step.status = 'running';
    step.startedAt = Date.now();
    this.state.currentStepIndex = index;
    this.state.progress = (index + 1) / journey.steps.length;

    this.telemetry.event({
      type: 'step_start',
      level: 'info',
      message: `Step: ${step.name}`,
      data: { step: step.name, index },
    });

    this.eventBus.emit({
      type: 'step_start',
      timestamp: Date.now(),
      journeySlug: journey.slug,
      stepId: step.id,
      data: { name: step.name, narration: step.narration },
    });

    try {
      await step.action();

      step.status = 'completed';
      step.completedAt = Date.now();
      const duration = step.completedAt - step.startedAt;

      this.telemetry.event({
        type: 'step_complete',
        level: 'info',
        message: `Step complete: ${step.name} (${duration}ms)`,
      });

      this.eventBus.emit({
        type: 'step_complete',
        timestamp: Date.now(),
        journeySlug: journey.slug,
        stepId: step.id,
        data: { duration },
      });
    } catch (error) {
      step.status = 'failed';
      step.completedAt = Date.now();

      this.telemetry.event({
        type: 'step_fail',
        level: 'error',
        message: `Step failed: ${step.name}: ${String(error)}`,
      });

      this.eventBus.emit({
        type: 'step_fail',
        timestamp: Date.now(),
        journeySlug: journey.slug,
        stepId: step.id,
        data: { error: String(error) },
      });
    }
  }

  /**
   * Trigger a magic moment during a journey.
   */
  triggerMagicMoment(moment: Omit<MagicMoment, 'id' | 'timestamp'>): MagicMoment {
    const magicMoment: MagicMoment = {
      ...moment,
      id: `mm_${Date.now()}`,
      timestamp: Date.now(),
    };

    this.state.magicMoments.push(magicMoment);

    this.telemetry.event({
      type: 'magic_moment',
      level: 'info',
      message: `✨ Magic Moment: ${moment.name} — ${moment.story}`,
      data: { metric: moment.metric, value: moment.value },
    });

    this.eventBus.emit({
      type: 'magic_moment',
      timestamp: Date.now(),
      data: { name: moment.name, metric: moment.metric, value: moment.value, story: moment.story },
    });

    return magicMoment;
  }
}

// ============================================
// BUILT-IN JOURNEY DEFINITIONS
// ============================================

/**
 * Investor Pitch Journey — the 90-second demo.
 */
export function createInvestorPitchJourney(options: {
  onArchive?: () => Promise<void>;
  onGraph?: () => Promise<void>;
  onContext?: () => Promise<void>;
  onExtraction?: () => Promise<void>;
  onNetwork?: () => Promise<void>;
}): DemoJourney {
  return {
    slug: 'investor-pitch',
    title: 'VIVIM Investor Pitch',
    description: '90-second cinematic demo showing AI memory sovereignty',
    target: 'general',
    duration: 90,
    steps: [
      {
        id: 'hook',
        name: 'The Problem',
        description: 'Show where AI thinking goes to die',
        duration: 15000,
        action: async () => {
          await options.onArchive?.();
        },
        narration: 'Right now, your AI thinking lives in silos — ChatGPT, Claude, Gemini — disconnected, unsearchable, lost. VIVIM changes that.',
        screenshot: 'archive-view',
        metrics: ['memory_total', 'providers_connected'],
        status: 'pending',
      },
      {
        id: 'magic-1-archive',
        name: 'The Archive',
        description: 'Massive timeline of imported conversations',
        duration: 20000,
        action: async () => {
          await options.onArchive?.();
        },
        narration: '609 sessions across 6 providers. 47,000 messages. All searchable. All yours.',
        screenshot: 'timeline',
        metrics: ['session_count', 'provider_count', 'message_count'],
        status: 'pending',
      },
      {
        id: 'extraction',
        name: 'Memory Extraction',
        description: 'Live extraction of memories from conversation',
        duration: 15000,
        action: async () => {
          await options.onExtraction?.();
        },
        narration: 'Watch as VIVIM automatically extracts memories from your conversations — facts, preferences, patterns — building your AI brain in real-time.',
        screenshot: 'extraction',
        metrics: ['memory_extract_count', 'extraction_accuracy'],
        status: 'pending',
      },
      {
        id: 'magic-2-graph',
        name: 'Knowledge Graph',
        description: 'The money shot — 1,500+ connected memories',
        duration: 25000,
        action: async () => {
          await options.onGraph?.();
        },
        narration: 'This is the money shot. 1,547 connected memories. 4,892 relationships. Your AI brain, visualized.',
        screenshot: 'knowledge-graph',
        metrics: ['graph_nodes', 'graph_edges', 'graph_density'],
        status: 'pending',
      },
      {
        id: 'magic-3-context',
        name: 'Context Cockpit',
        description: '7-layer context intelligence display',
        duration: 20000,
        action: async () => {
          await options.onContext?.();
        },
        narration: '2,847 memories. 12,400 tokens. 94% relevance. AI that knows you — because it remembers everything.',
        screenshot: 'context-cockpit',
        metrics: ['context_layers', 'token_budget', 'relevance_score'],
        status: 'pending',
      },
      {
        id: 'close',
        name: 'The Close',
        description: "That's VIVIM. You own your AI brain.",
        duration: 10000,
        action: async () => {
          await options.onNetwork?.();
        },
        narration: "That's VIVIM. Your AI memory. Sovereign. Portable. Yours. Let's talk about what we build next.",
        screenshot: 'closing',
        metrics: ['total_memories', 'encryption_coverage'],
        status: 'pending',
      },
    ],
    backupPlan: [
      { failure: 'Live extraction fails', solution: 'Show pre-captured extraction results' },
      { failure: 'Graph rendering fails', solution: 'Show static graph image' },
      { failure: 'Context data missing', solution: 'Show seeded context data' },
    ],
    faq: [
      { question: 'How do you make money?', answer: 'Platform fees on AI memory usage, enterprise tiers for team memory, marketplace for shared AI configurations.' },
      { question: 'What about OpenAI/Anthropic building this?', answer: 'They won\'t — their business model is vendor lock-in. We\'re the anti-lock-in play.' },
      { question: 'How hard is this to copy?', answer: 'CRDT sync, multi-provider extraction, knowledge graph construction — 18 months of engineering minimum.' },
    ],
  };
}

/**
 * Onboarding Journey — shows how easy it is to start.
 */
export function createOnboardingJourney(options: {
  onConnect?: () => Promise<void>;
  onFirstCapture?: () => Promise<void>;
  onFirstMemory?: () => Promise<void>;
}): DemoJourney {
  return {
    slug: 'onboarding',
    title: 'VIVIM Onboarding',
    description: '45-second demo: connect, capture, remember',
    target: 'product',
    duration: 45,
    steps: [
      {
        id: 'connect',
        name: 'Connect Your Providers',
        description: 'Link AI accounts',
        duration: 10000,
        action: async () => { await options.onConnect?.(); },
        narration: 'Connect ChatGPT, Claude, Gemini — one click each.',
        status: 'pending',
      },
      {
        id: 'capture',
        name: 'First Capture',
        description: 'Import a conversation',
        duration: 15000,
        action: async () => { await options.onFirstCapture?.(); },
        narration: 'Your first conversation, captured. VIVIM understands the context.',
        status: 'pending',
      },
      {
        id: 'first-memory',
        name: 'First Memory',
        description: 'See auto-extracted memories',
        duration: 20000,
        action: async () => { await options.onFirstMemory?.(); },
        narration: 'VIVIM automatically extracted 12 memories from that one conversation. It\'s learning.',
        status: 'pending',
      },
    ],
  };
}