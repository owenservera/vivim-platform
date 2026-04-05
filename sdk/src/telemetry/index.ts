/**
 * VIVIM SDK — Telemetry Module Exports
 */

// Telemetry Hub
export {
  TelemetryHub,
  type MetricType,
  type Metric,
  type CounterMetric,
  type GaugeMetric,
  type HistogramMetric,
  type EventLogEntry,
  type DashboardSummary,
} from './hub.js';

// SDK Instrumentation
export {
  instrumentSDK,
  instrumentMemory,
  instrumentToolRegistry,
  instrumentAgentSpawner,
  instrumentTaskManager,
  instrumentMemoryExtractor,
  instrumentCompression,
  instrumentPluginLoader,
} from './instrumentation.js';

// Demo Engine
export {
  JourneyRunner,
  DemoEventBus,
  createInvestorPitchJourney,
  createOnboardingJourney,
  type DemoStep,
  type DemoStepStatus,
  type DemoJourney,
  type DemoState,
  type MagicMoment,
  type DemoEvent,
  type DemoEventType,
} from './demo-engine.js';
