import { BudgetInput, LayerBudget } from './types';
import type { UserContextConfiguration, LayerBudgetOverride } from './settings-types';

interface BudgetAlgorithmOptions {
  userSettings?: UserContextConfiguration;
}

export class BudgetAlgorithm {
  private userSettings?: UserContextConfiguration;

  constructor(options?: BudgetAlgorithmOptions) {
    this.userSettings = options?.userSettings;
  }

  computeBudget(input: BudgetInput): Map<string, LayerBudget> {
    const layers = this.computeLayerParams(input);
    let remaining = input.totalBudget;

    const l7 = layers.get('L7_user_message')!;
    l7.allocated = input.userMessageTokens;
    remaining -= l7.allocated;

    const l0 = layers.get('L0_identity')!;
    l0.allocated = Math.min(l0.idealTokens, l0.maxTokens);
    remaining -= l0.allocated;

    const l1 = layers.get('L1_global_prefs')!;
    l1.allocated = Math.min(l1.idealTokens, l1.maxTokens);
    remaining -= l1.allocated;

    const elasticLayers = ['L2_topic', 'L3_entity', 'L4_conversation', 'L5_jit', 'L6_message_history'];

    for (const key of elasticLayers) {
      const layer = layers.get(key)!;
      layer.allocated = layer.minTokens;
      remaining -= layer.minTokens;
    }

    if (remaining < 0) {
      this.cutToFit(layers, elasticLayers, remaining);
      return layers;
    }

    const totalIdealRemaining = elasticLayers.reduce((sum, key) => {
      const layer = layers.get(key)!;
      return sum + Math.max(0, layer.idealTokens - layer.minTokens);
    }, 0);

    if (totalIdealRemaining > 0) {
      for (const key of elasticLayers) {
        const layer = layers.get(key)!;
        const idealDelta = Math.max(0, layer.idealTokens - layer.minTokens);
        const weight = (idealDelta / totalIdealRemaining) * (layer.priority / 100);

        const additionalAllocation = Math.min(
          Math.floor(remaining * weight),
          layer.maxTokens - layer.allocated,
          idealDelta
        );

        layer.allocated += additionalAllocation;
        remaining -= additionalAllocation;
      }
    }

    if (remaining > 0) {
      const sortedByPriority = elasticLayers
        .map(key => ({ key, layer: layers.get(key)! }))
        .filter(({ layer }) => layer.allocated < layer.maxTokens)
        .sort((a, b) => b.layer.priority - a.layer.priority);

      for (const { key, layer } of sortedByPriority) {
        if (remaining <= 0) break;
        const canTake = Math.min(remaining, layer.maxTokens - layer.allocated);
        layer.allocated += canTake;
        remaining -= canTake;
      }
    }

    return layers;
  }

  private computeLayerParams(input: BudgetInput): Map<string, LayerBudget> {
    const B = input.totalBudget;
    const layers = new Map<string, LayerBudget>();

    const depthMultiplier = {
      minimal: 0.5,
      standard: 1.0,
      deep: 1.5
    }[input.knowledgeDepth];

    const conversationPressure = Math.min(1.0, input.conversationTotalTokens / (B * 0.7));
    const isKnowledgeHeavy = input.detectedTopicCount >= 2 || input.knowledgeDepth === 'deep';
    const isDialogueHeavy = input.conversationMessageCount > 20 && input.prioritizeHistory;

    const l0Override = this.getLayerOverride('L0_identity');
    layers.set('L0_identity', {
      layer: 'L0_identity',
      minTokens: l0Override?.min ?? 150,
      idealTokens: l0Override?.ideal ?? Math.min(400, Math.floor(B * 0.02)),
      maxTokens: l0Override?.max ?? 500,
      priority: 100,
      allocated: 0,
      elasticity: this.getElasticityOverride('L0_identity', 0.0)
    });

    const l1Override = this.getLayerOverride('L1_global_prefs');
    layers.set('L1_global_prefs', {
      layer: 'L1_global_prefs',
      minTokens: l1Override?.min ?? 100,
      idealTokens: l1Override?.ideal ?? Math.min(600, Math.floor(B * 0.03)),
      maxTokens: l1Override?.max ?? 800,
      priority: 95,
      allocated: 0,
      elasticity: this.getElasticityOverride('L1_global_prefs', 0.1)
    });

    const topicCountFactor = Math.min(2.0, 1.0 + (input.detectedTopicCount - 1) * 0.3);
    const topicBase = B * 0.12;
    const topicAdjusted = topicBase * depthMultiplier * topicCountFactor;
    const topicPressured = topicAdjusted * (1 - conversationPressure * 0.4);
    const l2Override = this.getLayerOverride('L2_topic');

    layers.set('L2_topic', {
      layer: 'L2_topic',
      minTokens: l2Override?.min ?? (input.detectedTopicCount > 0 ? 300 : 0),
      idealTokens: l2Override?.ideal ?? Math.floor(Math.max(0, topicPressured)),
      maxTokens: l2Override?.max ?? Math.floor(B * 0.25),
      priority: isKnowledgeHeavy ? 85 : 70,
      allocated: 0,
      elasticity: this.getElasticityOverride('L2_topic', 0.6)
    });

    const entityCountFactor = Math.min(2.0, 1.0 + (input.detectedEntityCount - 1) * 0.4);
    const entityBase = B * 0.06;
    const entityAdjusted = entityBase * entityCountFactor;
    const entityCapped = Math.min(entityAdjusted, input.detectedEntityCount * 400);
    const l3Override = this.getLayerOverride('L3_entity');

    layers.set('L3_entity', {
      layer: 'L3_entity',
      minTokens: l3Override?.min ?? (input.detectedEntityCount > 0 ? 150 : 0),
      idealTokens: l3Override?.ideal ?? Math.floor(Math.max(0, entityCapped)),
      maxTokens: l3Override?.max ?? Math.floor(B * 0.12),
      priority: 65,
      allocated: 0,
      elasticity: this.getElasticityOverride('L3_entity', 0.7)
    });

    const msgCount = input.conversationMessageCount;
    const logScale = Math.log2(Math.max(1, msgCount) + 1);
    const convIdeal = Math.floor(150 * logScale * depthMultiplier);
    const l4Override = this.getLayerOverride('L4_conversation');

    layers.set('L4_conversation', {
      layer: 'L4_conversation',
      minTokens: l4Override?.min ?? (input.hasActiveConversation ? 200 : 0),
      idealTokens: l4Override?.ideal ?? Math.min(convIdeal, Math.floor(B * 0.15)),
      maxTokens: l4Override?.max ?? Math.floor(B * 0.20),
      priority: input.hasActiveConversation ? 88 : 30,
      allocated: 0,
      elasticity: this.getElasticityOverride('L4_conversation', 0.3)
    });

    const topicBundleTokens = input.availableBundles.get('topic') ?? 0;
    const coverageFactor = 1.0 - Math.min(1.0, topicBundleTokens / (B * 0.15));
    const jitBase = B * 0.10;
    const jitAdjusted = jitBase * Math.max(0.3, coverageFactor) * depthMultiplier;
    const l5Override = this.getLayerOverride('L5_jit');

    layers.set('L5_jit', {
      layer: 'L5_jit',
      minTokens: l5Override?.min ?? 200,
      idealTokens: l5Override?.ideal ?? Math.floor(jitAdjusted),
      maxTokens: l5Override?.max ?? Math.floor(B * 0.18),
      priority: 75,
      allocated: 0,
      elasticity: this.getElasticityOverride('L5_jit', 0.5)
    });

    const totalConvTokens = input.conversationTotalTokens;
    let idealRatio: number;

    if (totalConvTokens <= 3000) {
      idealRatio = Math.min(1.0, totalConvTokens / B);
    } else if (totalConvTokens <= 10000) {
      idealRatio = 0.35;
    } else if (totalConvTokens <= 50000) {
      idealRatio = 0.30;
    } else {
      idealRatio = 0.25;
    }

    const historyBoost = input.prioritizeHistory ? 1.3 : 1.0;
    const dialogueBoost = isDialogueHeavy ? 1.2 : 1.0;
    const historyIdeal = Math.floor(B * idealRatio * historyBoost * dialogueBoost);
    const l6Override = this.getLayerOverride('L6_message_history');

    layers.set('L6_message_history', {
      layer: 'L6_message_history',
      minTokens: l6Override?.min ?? (input.hasActiveConversation ? 500 : 0),
      idealTokens: l6Override?.ideal ?? Math.min(historyIdeal, totalConvTokens),
      maxTokens: l6Override?.max ?? Math.floor(B * 0.60),
      priority: isDialogueHeavy ? 90 : 80,
      allocated: 0,
      elasticity: this.getElasticityOverride('L6_message_history', 0.4)
    });

    const l7Override = this.getLayerOverride('L7_user_message');
    layers.set('L7_user_message', {
      layer: 'L7_user_message',
      minTokens: l7Override?.min ?? input.userMessageTokens,
      idealTokens: l7Override?.ideal ?? input.userMessageTokens,
      maxTokens: l7Override?.max ?? input.userMessageTokens,
      priority: 100,
      allocated: 0,
      elasticity: this.getElasticityOverride('L7_user_message', 0.0)
    });

    return layers;
  }

  private getLayerOverride(layer: string): LayerBudgetOverride | undefined {
    return this.userSettings?.layerBudgetOverrides?.[layer];
  }

  private getElasticityOverride(layer: string, defaultValue: number): number {
    return this.userSettings?.elasticityOverrides?.[layer] ?? defaultValue;
  }

  private cutToFit(layers: Map<string, LayerBudget>, elasticKeys: string[], deficit: number): void {
    const sorted = elasticKeys
      .map(key => ({ key, layer: layers.get(key)! }))
      .sort((a, b) => a.layer.priority - b.layer.priority);

    let remaining = Math.abs(deficit);

    for (const { key, layer } of sorted) {
      if (remaining <= 0) break;
      const canCut = layer.allocated;
      const willCut = Math.min(remaining, canCut);
      layer.allocated -= willCut;
      remaining -= willCut;
    }
  }
}
