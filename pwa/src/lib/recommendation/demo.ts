/**
 * Recommendation System Demo
 * Simple demo to test the recommendation system
 */

import { qualityCalculator } from './scoring/QualityScore';
import { generateTestConversations } from './test-data-generator';
import { knowledgeMixer } from './mixer/KnowledgeMixer';
import { DEFAULT_USER_PREFERENCES } from './config';
import type { UserPreferences } from './types';

/**
 * Run a simple demo of the recommendation system
 */
export async function runDemo() {
  console.log('=== OpenScroll Recommendation System Demo ===\n');

  // Step 1: Generate test data
  console.log('1. Generating test conversations...');
  const conversations = generateTestConversations(25);
  console.log(`   Generated ${conversations.length} conversations\n`);

  // Step 2: Calculate quality scores
  console.log('2. Calculating quality scores...');
  const qualityScores = conversations.map(c => ({
    id: c.id,
    title: c.title,
    score: qualityCalculator.calculate(c)
  }));
  console.log(`   Average quality: ${Math.round(qualityScores.reduce((a, b) => a + b.score, 0) / qualityScores.length)}/100\n`);

  // Step 3: Generate recommendations
  console.log('3. Generating personalized recommendations...');
  const recommendations = await knowledgeMixer.generateFeed(
    conversations,
    DEFAULT_USER_PREFERENCES as UserPreferences
  );
  console.log(`   Generated ${recommendations.length} recommendations\n`);

  // Step 4: Display top recommendations
  console.log('4. Top 5 recommendations:');
  recommendations.slice(0, 5).forEach((item, i) => {
    console.log(`   ${i + 1}. ${item.conversation.title}`);
    console.log(`      Score: ${item.score.toFixed(0)} | Source: ${item.source} | Reason: ${item.reason.text}`);
  });

  console.log('\n=== Demo Complete ===\n');
  return recommendations;
}

/**
 * Demo quality scoring
 */
export async function demoQualityScoring() {
  console.log('=== Quality Scoring Demo ===\n');

  const conversations = generateTestConversations(10);
  console.log(`Generated ${conversations.length} test conversations\n`);

  conversations.forEach((conv, i) => {
    const breakdown = qualityCalculator.getBreakdown(conv);

    console.log(`${i + 1}. ${conv.title}`);
    console.log(`   Quality: ${breakdown.overall}/100`);
    console.log(`   Content: ${breakdown.components.contentRichness.toFixed(0)} | Structure: ${breakdown.components.structuralDepth.toFixed(0)} | Interaction: ${breakdown.components.interaction.toFixed(0)}`);
    console.log(`   Stats: ${conv.stats.totalMessages} msgs, ${conv.stats.totalCodeBlocks} code blocks, ${conv.stats.totalWords} words\n`);
  });
}

/**
 * Demo rediscovery source
 */
export async function demoRediscovery() {
  console.log('=== Rediscovery Source Demo ===\n');

  const conversations = generateTestConversations(50);
  console.log(`Generated ${conversations.length} conversations with various timestamps\n`);

  // Group by age
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  const ages = conversations.map(c => ({
    title: c.title,
    ageDays: Math.floor((now - new Date(c.createdAt).getTime()) / dayInMs)
  }));

  console.log('Conversation ages:');
  ages.forEach(({ title, ageDays }) => {
    console.log(`   ${title}: ${ageDays} days ago`);
  });

  console.log('\n=== Demo Complete ===\n');
}
