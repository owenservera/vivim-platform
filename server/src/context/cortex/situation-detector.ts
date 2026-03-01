/**
 * VIVIM Cortex — Situation Detector
 *
 * Classifies the current conversational context into one of 12 business
 * archetypes in < 50ms, enabling the adaptive context pipeline to reshape
 * itself in real-time based on what the user is actually doing.
 *
 * Part of the Cortex Phase 1 POC.
 */

import { logger } from '../../lib/logger.js';

// ============================================================================
// TYPES
// ============================================================================

export const SITUATION_ARCHETYPES = {
  SOFTWARE_ENGINEERING: 'software_engineering',
  PROJECT_MANAGEMENT: 'project_management',
  SALES_BUSINESS_DEV: 'sales_business_dev',
  LEGAL_COMPLIANCE: 'legal_compliance',
  MEDICAL_CLINICAL: 'medical_clinical',
  FINANCE_ACCOUNTING: 'finance_accounting',
  CREATIVE_DESIGN: 'creative_design',
  EDUCATION_LEARNING: 'education_learning',
  HR_PEOPLE: 'hr_people',
  OPERATIONS_INFRA: 'operations_infra',
  RESEARCH_ANALYSIS: 'research_analysis',
  PERSONAL_GENERAL: 'personal_general',
} as const;

export type SituationArchetype =
  (typeof SITUATION_ARCHETYPES)[keyof typeof SITUATION_ARCHETYPES];

export interface SituationSignal {
  type: 'keyword' | 'entity' | 'temporal' | 'provider' | 'history' | 'explicit';
  archetype: SituationArchetype;
  weight: number;
  evidence?: string;
}

export interface DetectedSituation {
  archetype: SituationArchetype;
  confidence: number;
  signals: SituationSignal[];
  contextOverrides: ContextOverride;
  detectedAt: number;
}

export interface ContextOverride {
  priorityMemoryTypes: string[];
  layerBoosts: Record<string, number>; // layerId → multiplier (e.g. 1.4 = +40%)
  extractionFocus: string[];
  tokenShift: Record<string, 'increase' | 'decrease' | 'neutral'>;
}

// ============================================================================
// KEYWORD MAPS
// ============================================================================

const KEYWORD_MAP: Record<SituationArchetype, string[]> = {
  software_engineering: [
    'code', 'debug', 'refactor', 'api', 'function', 'typescript', 'react',
    'component', 'database', 'query', 'bug', 'error', 'deploy', 'git',
    'branch', 'merge', 'test', 'lint', 'build', 'compile', 'import',
    'export', 'module', 'class', 'interface', 'type', 'schema', 'migration',
    'endpoint', 'route', 'middleware', 'docker', 'kubernetes', 'ci', 'cd',
    'npm', 'bun', 'node', 'package', 'dependency', 'version', 'release',
    'backend', 'frontend', 'fullstack', 'server', 'client', 'prisma',
    'sql', 'postgres', 'redis', 'cache', 'websocket', 'rest', 'graphql',
  ],
  project_management: [
    'project', 'deadline', 'milestone', 'sprint', 'backlog', 'kanban',
    'status', 'blocker', 'dependency', 'timeline', 'deliverable', 'scope',
    'requirement', 'stakeholder', 'roadmap', 'priority', 'assignee',
    'standup', 'retrospective', 'planning', 'estimate', 'velocity',
    'epic', 'story', 'task', 'jira', 'trello', 'notion', 'asana',
    'schedule', 'kick-off', 'handoff', 'sign-off', 'progress', 'tracking',
  ],
  sales_business_dev: [
    'client', 'prospect', 'deal', 'pipeline', 'revenue', 'quota',
    'proposal', 'contract', 'negotiation', 'closing', 'upsell', 'churn',
    'retention', 'crm', 'salesforce', 'hubspot', 'lead', 'opportunity',
    'demo', 'pricing', 'discount', 'commission', 'territory', 'forecast',
    'qtd', 'ytd', 'arr', 'mrr', 'customer', 'account', 'renewal',
    'objection', 'competitor', 'value-prop', 'roi', 'business-case',
  ],
  legal_compliance: [
    'contract', 'clause', 'amendment', 'regulation', 'compliance', 'gdpr',
    'hipaa', 'sox', 'audit', 'liability', 'indemnity', 'nda', 'ip',
    'patent', 'trademark', 'copyright', 'litigation', 'arbitration',
    'jurisdiction', 'breach', 'penalty', 'statute', 'ordinance', 'policy',
    'governance', 'risk', 'framework', 'certification', 'soc2', 'iso',
  ],
  medical_clinical: [
    'patient', 'diagnosis', 'treatment', 'medication', 'dosage', 'protocol',
    'clinical', 'trial', 'symptom', 'prognosis', 'referral', 'lab',
    'imaging', 'surgery', 'therapy', 'prescription', 'ehr', 'emr',
    'icd', 'cpt', 'hipaa', 'phi', 'vitals', 'assessment', 'chart',
  ],
  finance_accounting: [
    'budget', 'forecast', 'revenue', 'expense', 'profit', 'margin',
    'invoice', 'payment', 'receivable', 'payable', 'ledger', 'journal',
    'reconciliation', 'audit', 'tax', 'depreciation', 'amortization',
    'balance-sheet', 'p&l', 'cash-flow', 'capex', 'opex', 'roi',
    'irr', 'npv', 'valuation', 'equity', 'debt', 'funding', 'investor',
  ],
  creative_design: [
    'design', 'brand', 'logo', 'color', 'typography', 'layout', 'mockup',
    'wireframe', 'prototype', 'figma', 'sketch', 'illustrator', 'canva',
    'creative', 'aesthetic', 'visual', 'ux', 'ui', 'animation', 'motion',
    'font', 'palette', 'composition', 'illustration', 'photography',
    'video', 'edit', 'render', 'export', 'artboard', 'style', 'tone',
  ],
  education_learning: [
    'learn', 'teach', 'course', 'curriculum', 'lesson', 'tutorial',
    'quiz', 'exam', 'grade', 'student', 'teacher', 'professor', 'lecture',
    'homework', 'assignment', 'study', 'concept', 'theory', 'practice',
    'explain', 'understand', 'example', 'exercise', 'textbook', 'syllabus',
  ],
  hr_people: [
    'hire', 'recruit', 'candidate', 'interview', 'offer', 'onboard',
    'performance', 'review', 'feedback', 'promotion', 'compensation',
    'salary', 'benefits', 'culture', 'engagement', 'retention', 'turnover',
    'pto', 'leave', 'policy', 'handbook', 'termination', 'severance',
    'diversity', 'inclusion', 'training', 'development', 'team', 'org-chart',
  ],
  operations_infra: [
    'deploy', 'infrastructure', 'monitoring', 'alert', 'incident', 'outage',
    'uptime', 'sla', 'sli', 'slo', 'latency', 'throughput', 'scaling',
    'load-balancer', 'dns', 'ssl', 'certificate', 'firewall', 'vpn',
    'backup', 'recovery', 'disaster', 'runbook', 'oncall', 'pagerduty',
    'grafana', 'prometheus', 'datadog', 'cloudwatch', 'terraform', 'ansible',
  ],
  research_analysis: [
    'hypothesis', 'experiment', 'data', 'analysis', 'correlation',
    'regression', 'statistical', 'significance', 'sample', 'control',
    'variable', 'methodology', 'findings', 'conclusion', 'paper',
    'citation', 'peer-review', 'journal', 'abstract', 'dataset',
    'visualization', 'chart', 'graph', 'metric', 'benchmark', 'model',
  ],
  personal_general: [
    'hobby', 'travel', 'food', 'recipe', 'movie', 'book', 'music',
    'game', 'fitness', 'health', 'wellness', 'meditation', 'journal',
    'goal', 'dream', 'family', 'friend', 'relationship', 'pet',
    'home', 'garden', 'cooking', 'shopping', 'vacation', 'weekend',
  ],
};

// ============================================================================
// ARCHETYPE → CONTEXT OVERRIDES
// ============================================================================

const ARCHETYPE_OVERRIDES: Record<SituationArchetype, ContextOverride> = {
  software_engineering: {
    priorityMemoryTypes: ['PROCEDURAL', 'PROJECT', 'SEMANTIC', 'PREFERENCE'],
    layerBoosts: { topic_profiles: 1.4, memory_recall: 1.2, active_messages: 1.1 },
    extractionFocus: ['code patterns', 'tool preferences', 'architecture decisions', 'error solutions'],
    tokenShift: { active_messages: 'increase', topic_profiles: 'increase', entity_profiles: 'neutral' },
  },
  project_management: {
    priorityMemoryTypes: ['PROJECT', 'GOAL', 'RELATIONSHIP', 'EPISODIC'],
    layerBoosts: { entity_profiles: 1.5, memory_recall: 1.3, identity_core: 1.1 },
    extractionFocus: ['deadlines', 'deliverables', 'blockers', 'owners', 'action items'],
    tokenShift: { entity_profiles: 'increase', conv_arc: 'decrease', memory_recall: 'increase' },
  },
  sales_business_dev: {
    priorityMemoryTypes: ['RELATIONSHIP', 'EPISODIC', 'GOAL', 'FACTUAL'],
    layerBoosts: { entity_profiles: 1.6, global_prefs: 1.2, memory_recall: 1.3 },
    extractionFocus: ['client preferences', 'deal stages', 'meeting notes', 'objections', 'opportunities'],
    tokenShift: { entity_profiles: 'increase', identity_core: 'increase', conv_arc: 'decrease' },
  },
  legal_compliance: {
    priorityMemoryTypes: ['FACTUAL', 'PROCEDURAL', 'SEMANTIC'],
    layerBoosts: { topic_profiles: 1.5, memory_recall: 1.4, identity_core: 1.1 },
    extractionFocus: ['clauses', 'precedents', 'regulations', 'dates', 'obligations'],
    tokenShift: { memory_recall: 'increase', topic_profiles: 'increase', conv_arc: 'decrease' },
  },
  medical_clinical: {
    priorityMemoryTypes: ['FACTUAL', 'PROCEDURAL', 'EPISODIC'],
    layerBoosts: { identity_core: 1.3, memory_recall: 1.5, topic_profiles: 1.3 },
    extractionFocus: ['protocols', 'medications', 'patient history', 'contraindications'],
    tokenShift: { memory_recall: 'increase', identity_core: 'increase', entity_profiles: 'increase' },
  },
  finance_accounting: {
    priorityMemoryTypes: ['FACTUAL', 'PROJECT', 'PROCEDURAL'],
    layerBoosts: { topic_profiles: 1.4, entity_profiles: 1.3, memory_recall: 1.2 },
    extractionFocus: ['numbers', 'dates', 'accounts', 'forecasts', 'variances'],
    tokenShift: { topic_profiles: 'increase', memory_recall: 'increase', conv_arc: 'neutral' },
  },
  creative_design: {
    priorityMemoryTypes: ['PREFERENCE', 'EPISODIC', 'IDENTITY'],
    layerBoosts: { global_prefs: 1.5, identity_core: 1.3, memory_recall: 1.1 },
    extractionFocus: ['style choices', 'inspiration sources', 'tone', 'brand guidelines'],
    tokenShift: { global_prefs: 'increase', identity_core: 'increase', topic_profiles: 'decrease' },
  },
  education_learning: {
    priorityMemoryTypes: ['SEMANTIC', 'PROCEDURAL', 'GOAL'],
    layerBoosts: { topic_profiles: 1.6, memory_recall: 1.3, identity_core: 1.1 },
    extractionFocus: ['concepts learned', 'knowledge gaps', 'progress', 'explanations'],
    tokenShift: { topic_profiles: 'increase', memory_recall: 'increase', entity_profiles: 'decrease' },
  },
  hr_people: {
    priorityMemoryTypes: ['RELATIONSHIP', 'IDENTITY', 'GOAL'],
    layerBoosts: { entity_profiles: 1.5, identity_core: 1.2, memory_recall: 1.2 },
    extractionFocus: ['candidate info', 'review notes', 'policies', 'compensation data'],
    tokenShift: { entity_profiles: 'increase', identity_core: 'increase', conv_arc: 'decrease' },
  },
  operations_infra: {
    priorityMemoryTypes: ['PROCEDURAL', 'PROJECT', 'EPISODIC'],
    layerBoosts: { topic_profiles: 1.3, memory_recall: 1.4, active_messages: 1.1 },
    extractionFocus: ['runbooks', 'incident history', 'configs', 'architecture', 'alerts'],
    tokenShift: { memory_recall: 'increase', active_messages: 'increase', global_prefs: 'decrease' },
  },
  research_analysis: {
    priorityMemoryTypes: ['SEMANTIC', 'FACTUAL', 'PROCEDURAL'],
    layerBoosts: { topic_profiles: 1.5, memory_recall: 1.5, entity_profiles: 1.2 },
    extractionFocus: ['hypotheses', 'methods', 'findings', 'data sources', 'citations'],
    tokenShift: { topic_profiles: 'increase', memory_recall: 'increase', conv_arc: 'decrease' },
  },
  personal_general: {
    priorityMemoryTypes: ['IDENTITY', 'PREFERENCE', 'EPISODIC'],
    layerBoosts: { identity_core: 1.4, global_prefs: 1.4, memory_recall: 1.1 },
    extractionFocus: ['life goals', 'hobbies', 'relationships', 'preferences'],
    tokenShift: { identity_core: 'increase', global_prefs: 'increase', topic_profiles: 'decrease' },
  },
};

// ============================================================================
// EXPLICIT TRIGGER PATTERNS
// ============================================================================

const EXPLICIT_TRIGGERS: Array<{ pattern: RegExp; archetype: SituationArchetype }> = [
  { pattern: /working on (project|the)\s/i, archetype: 'project_management' },
  { pattern: /preparing for (a |the )?(meeting|call|demo|presentation)/i, archetype: 'project_management' },
  { pattern: /debug(ging)?\s/i, archetype: 'software_engineering' },
  { pattern: /refactor(ing)?\s/i, archetype: 'software_engineering' },
  { pattern: /fix(ing)?\s(the |a |this )?bug/i, archetype: 'software_engineering' },
  { pattern: /client (call|meeting|deal|proposal)/i, archetype: 'sales_business_dev' },
  { pattern: /draft(ing)?\s(a |the )?(contract|agreement|nda|policy)/i, archetype: 'legal_compliance' },
  { pattern: /write|draft|blog|article|content|copy/i, archetype: 'creative_design' },
  { pattern: /learn(ing)?\s(about|how)/i, archetype: 'education_learning' },
  { pattern: /deploy(ing|ment)?\s/i, archetype: 'operations_infra' },
  { pattern: /incident|outage|alert/i, archetype: 'operations_infra' },
  { pattern: /analy[sz](e|ing)\s(the |this )?(data|results|metrics)/i, archetype: 'research_analysis' },
  { pattern: /budget|forecast|financial/i, archetype: 'finance_accounting' },
  { pattern: /hiring|interview|candidate|performance review/i, archetype: 'hr_people' },
];

// ============================================================================
// SITUATION DETECTOR
// ============================================================================

export interface SituationDetectorConfig {
  /** Known project names from user's memories for entity matching */
  knownProjects?: string[];
  /** Known person names from user's memories */
  knownPeople?: string[];
  /** Recent conversation archetypes for momentum signal */
  recentArchetypes?: SituationArchetype[];
}

export class SituationDetector {
  private knownProjects: Set<string>;
  private knownPeople: Set<string>;
  private recentArchetypes: SituationArchetype[];

  constructor(config: SituationDetectorConfig = {}) {
    this.knownProjects = new Set((config.knownProjects ?? []).map(p => p.toLowerCase()));
    this.knownPeople = new Set((config.knownPeople ?? []).map(p => p.toLowerCase()));
    this.recentArchetypes = config.recentArchetypes ?? [];
  }

  /**
   * Update known entities (call when new memories are extracted)
   */
  updateKnownEntities(projects?: string[], people?: string[]): void {
    if (projects) {
      projects.forEach(p => this.knownProjects.add(p.toLowerCase()));
    }
    if (people) {
      people.forEach(p => this.knownPeople.add(p.toLowerCase()));
    }
  }

  /**
   * Record a detected archetype for momentum tracking
   */
  recordArchetype(archetype: SituationArchetype): void {
    this.recentArchetypes.push(archetype);
    if (this.recentArchetypes.length > 5) {
      this.recentArchetypes.shift();
    }
  }

  /**
   * Detect the current situation from a user message.
   * Designed to complete in < 50ms.
   */
  detect(
    message: string,
    options?: {
      provider?: string;
      currentHour?: number;
      dayOfWeek?: number;
    }
  ): DetectedSituation {
    const startTime = performance.now();
    const signals: SituationSignal[] = [];
    const tokens = this.tokenize(message);

    // ── Signal 1: Keyword Classification ──────────────────────────
    for (const [archetype, keywords] of Object.entries(KEYWORD_MAP)) {
      let matchCount = 0;
      for (const keyword of keywords) {
        if (tokens.includes(keyword)) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        signals.push({
          type: 'keyword',
          archetype: archetype as SituationArchetype,
          weight: Math.min(matchCount * 0.15, 0.6),
          evidence: `${matchCount} keyword matches`,
        });
      }
    }

    // ── Signal 2: Entity Recognition ──────────────────────────────
    const lowerMessage = message.toLowerCase();
    for (const project of this.knownProjects) {
      if (lowerMessage.includes(project)) {
        signals.push({
          type: 'entity',
          archetype: 'project_management',
          weight: 0.3,
          evidence: `Known project: ${project}`,
        });
      }
    }
    for (const person of this.knownPeople) {
      if (lowerMessage.includes(person)) {
        signals.push({
          type: 'entity',
          archetype: 'sales_business_dev',
          weight: 0.2,
          evidence: `Known person: ${person}`,
        });
      }
    }

    // ── Signal 3: Temporal Context ────────────────────────────────
    const hour = options?.currentHour ?? new Date().getHours();
    const dayOfWeek = options?.dayOfWeek ?? new Date().getDay();
    const isBusinessHours = hour >= 9 && hour <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5;
    const isLateNight = hour >= 22 || hour <= 5;

    if (isBusinessHours) {
      signals.push({ type: 'temporal', archetype: 'project_management', weight: 0.05 });
      signals.push({ type: 'temporal', archetype: 'sales_business_dev', weight: 0.05 });
    }
    if (isLateNight) {
      signals.push({ type: 'temporal', archetype: 'software_engineering', weight: 0.08 });
      signals.push({ type: 'temporal', archetype: 'personal_general', weight: 0.05 });
    }

    // ── Signal 4: Provider Hint ───────────────────────────────────
    if (options?.provider) {
      const provider = options.provider.toLowerCase();
      if (['ollama', 'lmstudio', 'local'].includes(provider)) {
        signals.push({ type: 'provider', archetype: 'software_engineering', weight: 0.12 });
      }
      if (['claude', 'anthropic'].includes(provider)) {
        signals.push({ type: 'provider', archetype: 'creative_design', weight: 0.06 });
      }
    }

    // ── Signal 5: Conversation Momentum ───────────────────────────
    if (this.recentArchetypes.length > 0) {
      const counts = new Map<SituationArchetype, number>();
      for (const arch of this.recentArchetypes) {
        counts.set(arch, (counts.get(arch) ?? 0) + 1);
      }
      let maxCount = 0;
      let momentum: SituationArchetype | null = null;
      for (const [arch, count] of counts) {
        if (count > maxCount) {
          maxCount = count;
          momentum = arch;
        }
      }
      if (momentum) {
        signals.push({
          type: 'history',
          archetype: momentum,
          weight: Math.min(maxCount * 0.1, 0.3),
          evidence: `${maxCount} recent conversations in this mode`,
        });
      }
    }

    // ── Signal 6: Explicit Triggers (highest confidence) ──────────
    for (const trigger of EXPLICIT_TRIGGERS) {
      if (trigger.pattern.test(message)) {
        signals.push({
          type: 'explicit',
          archetype: trigger.archetype,
          weight: 0.5,
          evidence: `Explicit pattern: ${trigger.pattern.source}`,
        });
      }
    }

    // ── SCORING ───────────────────────────────────────────────────
    const scores = new Map<SituationArchetype, number>();
    for (const signal of signals) {
      scores.set(signal.archetype, (scores.get(signal.archetype) ?? 0) + signal.weight);
    }

    // Default to personal_general if no signals
    if (scores.size === 0) {
      scores.set('personal_general', 0.1);
    }

    // Find winner
    let maxScore = 0;
    let winner: SituationArchetype = 'personal_general';
    for (const [arch, score] of scores) {
      if (score > maxScore) {
        maxScore = score;
        winner = arch;
      }
    }

    // Calculate confidence (winner score / total scores)
    const totalScore = Array.from(scores.values()).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 1.0) : 0.5;

    const elapsed = performance.now() - startTime;
    logger.debug({ archetype: winner, confidence, elapsed: `${elapsed.toFixed(1)}ms` }, 'Situation detected');

    const result: DetectedSituation = {
      archetype: winner,
      confidence,
      signals,
      contextOverrides: ARCHETYPE_OVERRIDES[winner],
      detectedAt: Date.now(),
    };

    // Record for momentum
    this.recordArchetype(winner);

    return result;
  }

  /**
   * Get the context overrides for a specific archetype (for testing/direct access)
   */
  getOverrides(archetype: SituationArchetype): ContextOverride {
    return ARCHETYPE_OVERRIDES[archetype];
  }

  /**
   * List all supported archetypes
   */
  getArchetypes(): SituationArchetype[] {
    return Object.values(SITUATION_ARCHETYPES);
  }

  // ── Private helpers ─────────────────────────────────────────────

  private tokenize(message: string): string[] {
    return message
      .toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }
}

export default SituationDetector;
