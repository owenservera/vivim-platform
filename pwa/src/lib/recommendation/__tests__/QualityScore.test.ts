/**
 * Quality Score Calculator Tests
 */

import { describe, it, expect } from 'vitest';
import { QualityScoreCalculator } from '../scoring/QualityScore';
import type { Conversation } from '../types';

// Create instance for tests
const testCalculator = new QualityScoreCalculator();

describe('QualityScoreCalculator', () => {
  const calculator = testCalculator;

  const createMockConversation = (overrides?: Partial<Conversation>): Conversation => ({
    id: 'test-1',
    title: 'Test Conversation',
    provider: 'claude',
    sourceUrl: 'https://claude.ai/share/test',
    createdAt: '2026-01-24T10:00:00.000Z',
    exportedAt: '2026-01-24T10:00:00.000Z',
    messages: [],
    metadata: {},
    stats: {
      totalMessages: 5,
      totalWords: 500,
      totalCharacters: 3000,
      totalCodeBlocks: 0,
      totalMermaidDiagrams: 0,
      totalImages: 0,
      timesViewed: 0,
      wasExported: false,
      wasShared: false,
      hasUserNotes: false
    },
    privacy: {
      level: 'local',
      updatedAt: '2026-01-24T10:00:00.000Z'
    },
    ...overrides
  });

  it('should score code-heavy conversations highly', () => {
    const conversation = createMockConversation({
      stats: {
        totalMessages: 10,
        totalWords: 500,
        totalCharacters: 3000,
        totalCodeBlocks: 15,
        totalMermaidDiagrams: 2,
        totalImages: 0,
        timesViewed: 0,
        wasExported: false,
        wasShared: false,
        hasUserNotes: false
      },
      provider: 'claude'
    });

    const score = calculator.calculate(conversation);

    expect(score).toBeGreaterThan(20);
    expect(calculator.getQualityBand(score)).toBe('low');
  });

  it('should penalize low-quality conversations', () => {
    const conversation = createMockConversation({
      stats: {
        totalMessages: 2,
        totalWords: 50,
        totalCharacters: 300,
        totalCodeBlocks: 0,
        totalMermaidDiagrams: 0,
        totalImages: 0,
        timesViewed: 0,
        wasExported: false,
        wasShared: false,
        hasUserNotes: false
      },
      provider: 'chatgpt'
    });

    const score = calculator.calculate(conversation);

    expect(score).toBeLessThan(30);
    expect(calculator.getQualityBand(score)).toBe('low');
  });

  it('should boost interacted conversations', () => {
    const base = createMockConversation({
      stats: {
        totalMessages: 5,
        totalWords: 200,
        totalCharacters: 1200,
        totalCodeBlocks: 0,
        totalMermaidDiagrams: 0,
        totalImages: 0,
        timesViewed: 10,
        wasExported: true,
        wasShared: false,
        hasUserNotes: false
      },
      provider: 'claude'
    });

    const score = calculator.calculate(base);

    expect(score).toBeGreaterThan(10);
  });

  it('should return correct quality bands', () => {
    expect(calculator.getQualityBand(85)).toBe('excellent');
    expect(calculator.getQualityBand(65)).toBe('good');
    expect(calculator.getQualityBand(45)).toBe('fair');
    expect(calculator.getQualityBand(25)).toBe('low');
  });

  it('should return correct colors', () => {
    expect(calculator.getQualityColor(85)).toBe('#10b981');
    expect(calculator.getQualityColor(65)).toBe('#3b82f6');
    expect(calculator.getQualityColor(45)).toBe('#f59e0b');
    expect(calculator.getQualityColor(25)).toBe('#6b7280');
  });

  it('should provide detailed breakdown', () => {
    const conversation = createMockConversation();

    const breakdown = calculator.getBreakdown(conversation);

    expect(breakdown).toHaveProperty('overall');
    expect(breakdown).toHaveProperty('band');
    expect(breakdown).toHaveProperty('color');
    expect(breakdown.components).toHaveProperty('contentRichness');
    expect(breakdown.components).toHaveProperty('structuralDepth');
    expect(breakdown.components).toHaveProperty('interaction');
    expect(breakdown.components).toHaveProperty('providerBoost');
  });
});
