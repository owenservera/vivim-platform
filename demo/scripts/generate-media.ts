#!/usr/bin/env bun
/**
 * VIVIM Demo Media Generator
 * 
 * Generates demo media assets for investor pitches:
 * - Mockup screenshots (SVG-based)
 * - Feature exploration videos (scripted sequences)
 * - Animated GIFs
 * - Slide deck images
 * - Social media assets
 * 
 * Usage:
 *   bun run demo/scripts/generate-media.ts
 *   bun run demo/scripts/generate-media.ts --mode=pitch
 *   bun run demo/scripts/generate-media.ts --mode=social
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  outputDir: path.join(__dirname, '../media'),
  screenshotsDir: path.join(__dirname, '../media/screenshots'),
  videosDir: path.join(__dirname, '../media/videos'),
  gifsDir: path.join(__dirname, '../media/gifs'),
  slidesDir: path.join(__dirname, '../media/slides'),
  socialDir: path.join(__dirname, '../media/social'),
  
  // Brand colors
  colors: {
    primary: '#EF9F27',      // VIVIM orange
    secondary: '#3B82F6',    // Blue
    background: '#0a0a0f',   // Dark background
    surface: '#1a1a2e',      // Card surface
    text: '#ffffff',         // White text
    textMuted: '#888888',    // Muted text
    success: '#10b981',      // Green
    error: '#ef4444',        // Red
  },
  
  // Dimensions
  dimensions: {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 375, height: 812 },
    slide: { width: 1920, height: 1080 },
    social: { width: 1200, height: 630 },
    story: { width: 1080, height: 1920 },
  },
};

// ============================================================================
// SVG Generator - Creates mockup screenshots
// ============================================================================

class SVGGenerator {
  private colors = CONFIG.colors;
  
  generateKnowledgeGraph(): string {
    const nodes = this.generateNodes(50);
    const edges = this.generateEdges(nodes, 80);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CONFIG.dimensions.desktop.width}" height="${CONFIG.dimensions.desktop.height}" 
     xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100%" height="100%" fill="${this.colors.background}"/>
  
  <!-- Grid Pattern -->
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${this.colors.surface}" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  
  <!-- Header -->
  <rect width="100%" height="64" fill="${this.colors.surface}" opacity="0.9"/>
  <text x="32" y="42" font-family="system-ui" font-size="24" font-weight="600" fill="${this.colors.text}">
    VIVIM — Knowledge Graph
  </text>
  <text x="1700" y="42" font-family="system-ui" font-size="14" fill="${this.colors.textMuted}">
    2,161 nodes · 734 connections
  </text>
  
  <!-- Edges (connections) -->
  ${edges.map(edge => `
    <line x1="${edge.x1}" y1="${edge.y1}" x2="${edge.x2}" y2="${edge.y2}" 
          stroke="${this.colors.secondary}" stroke-width="${edge.width}" 
          opacity="${edge.opacity}"/>
  `).join('')}
  
  <!-- Nodes (ACUs) -->
  ${nodes.map(node => `
    <circle cx="${node.x}" cy="${node.y}" r="${node.size}" fill="${node.color}" opacity="0.9">
      <title>${node.label}</title>
    </circle>
    ${node.size > 8 ? `<text x="${node.x}" y="${node.y - node.size - 4}" 
                        font-family="system-ui" font-size="10" fill="${this.colors.textMuted}" 
                        text-anchor="middle">${node.label}</text>` : ''}
  `).join('')}
  
  <!-- Legend -->
  <rect x="32" y="950" width="280" height="100" fill="${this.colors.surface}" rx="8" opacity="0.95"/>
  <text x="48" y="975" font-family="system-ui" font-size="14" font-weight="600" fill="${this.colors.text}">
    Node Types
  </text>
  <circle cx="60" cy="1000" r="6" fill="${this.colors.primary}"/>
  <text x="80" y="1005" font-family="system-ui" font-size="12" fill="${this.colors.textMuted}">Code</text>
  <circle cx="140" cy="1000" r="6" fill="${this.colors.secondary}"/>
  <text x="160" y="1005" font-family="system-ui" font-size="12" fill="${this.colors.textMuted}">Question</text>
  <circle cx="220" cy="1000" r="6" fill="${this.colors.success}"/>
  <text x="240" y="1005" font-family="system-ui" font-size="12" fill="${this.colors.textMuted}">Answer</text>
  
  <!-- Stats Panel -->
  <rect x="1600" y="950" width="288" height="100" fill="${this.colors.surface}" rx="8" opacity="0.95"/>
  <text x="1616" y="975" font-family="system-ui" font-size="14" font-weight="600" fill="${this.colors.text}">
    Active Cluster
  </text>
  <text x="1616" y="1000" font-family="system-ui" font-size="12" fill="${this.colors.textMuted}">
    47 conversations · 312 insights
  </text>
  <text x="1616" y="1020" font-family="system-ui" font-size="12" fill="${this.colors.textMuted}">
    Database Optimization
  </text>
  
  <!-- Search Bar -->
  <rect x="600" y="16" width="400" height="36" rx="8" fill="${this.colors.background}"/>
  <text x="620" y="40" font-family="system-ui" font-size="14" fill="${this.colors.textMuted}">
    Search knowledge graph...
  </text>
</svg>`;
  }
  
  generateForYouFeed(): string {
    const cards = this.generateFeedCards(6);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CONFIG.dimensions.desktop.width}" height="${CONFIG.dimensions.desktop.height}" 
     xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100%" height="100%" fill="${this.colors.background}"/>
  
  <!-- Sidebar -->
  <rect width="256" height="100%" fill="${this.colors.surface}" opacity="0.5"/>
  <text x="32" y="48" font-family="system-ui" font-size="20" font-weight="700" fill="${this.colors.primary}">
    VIVIM
  </text>
  <text x="32" y="100" font-family="system-ui" font-size="14" fill="${this.colors.text}">For You</text>
  <text x="32" y="130" font-family="system-ui" font-size="14" fill="${this.colors.textMuted}">Archive</text>
  <text x="32" y="160" font-family="system-ui" font-size="14" fill="${this.colors.textMuted}">Graph</text>
  <text x="32" y="190" font-family="system-ui" font-size="14" fill="${this.colors.textMuted}">Circles</text>
  
  <!-- Main Content -->
  <rect x="256" width="100%" height="100%" fill="${this.colors.background}"/>
  
  <!-- Header -->
  <rect x="256" width="100%" height="80" fill="${this.colors.surface}" opacity="0.3"/>
  <text x="288" y="50" font-family="system-ui" font-size="28" font-weight="600" fill="${this.colors.text}">
    For You Feed
  </text>
  <text x="288" y="75" font-family="system-ui" font-size="14" fill="${this.colors.textMuted}">
    Curated from your AI thinking
  </text>
  
  <!-- Topic Filters -->
  <rect x="288" y="100" height="40" width="600" fill="none"/>
  ${['All', 'React', 'TypeScript', 'Postgres', 'AI', 'Startup'].map((topic, i) => `
    <rect x="${288 + i * 95}" y="100" width="80" height="32" rx="16" 
          fill="${i === 0 ? this.colors.primary : this.colors.surface}"/>
    <text x="${328 + i * 95}" y="122" font-family="system-ui" font-size="13" 
          fill="${i === 0 ? '#000' : this.colors.textMuted}" text-anchor="middle">
      ${topic}
    </text>
  `).join('')}
  
  <!-- Feed Cards -->
  ${cards.map((card, i) => `
    <rect x="${288 + (i % 3) * 320}" y="${180 + Math.floor(i / 3) * 280}" 
          width="300" height="260" rx="12" fill="${this.colors.surface}"/>
    
    <!-- Card Header -->
    <rect x="${288 + (i % 3) * 320}" y="${180 + Math.floor(i / 3) * 280}" 
          width="300" height="48" rx="12" fill="${this.colors.background}" opacity="0.5"/>
    <text x="${304 + (i % 3) * 320}" y="${210 + Math.floor(i / 3) * 280}" 
          font-family="system-ui" font-size="12" font-weight="600" fill="${this.colors.primary}">
      ${card.provider}
    </text>
    <text x="${550 + (i % 3) * 320}" y="${210 + Math.floor(i / 3) * 280}" 
          font-family="system-ui" font-size="11" fill="${this.colors.textMuted}" text-anchor="end">
      ${card.time}
    </text>
    
    <!-- Card Content -->
    <text x="${304 + (i % 3) * 320}" y="${250 + Math.floor(i / 3) * 280}" 
          font-family="system-ui" font-size="14" font-weight="500" fill="${this.colors.text}" 
          width="268">
      ${card.title.substring(0, 35)}${card.title.length > 35 ? '...' : ''}
    </text>
    <text x="${304 + (i % 3) * 320}" y="${275 + Math.floor(i / 3) * 280}" 
          font-family="system-ui" font-size="12" fill="${this.colors.textMuted}" 
          width="268">
      ${card.excerpt.substring(0, 40)}${card.excerpt.length > 40 ? '...' : ''}
    </text>
    
    <!-- Card Footer -->
    <text x="${304 + (i % 3) * 320}" y="${420 + Math.floor(i / 3) * 280}" 
          font-family="system-ui" font-size="11" fill="${this.colors.textMuted}">
      🔗 ${card.links} connections · 💡 Score: ${(card.score * 100).toFixed(0)}%
    </text>
  `).join('')}
</svg>`;
  }
  
  generateContextCockpit(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CONFIG.dimensions.desktop.width}" height="${CONFIG.dimensions.desktop.height}" 
     xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100%" height="100%" fill="${this.colors.background}"/>
  
  <!-- Header -->
  <rect width="100%" height="64" fill="${this.colors.surface}" opacity="0.9"/>
  <text x="32" y="42" font-family="system-ui" font-size="24" font-weight="600" fill="${this.colors.text}">
    Context Cockpit
  </text>
  
  <!-- Token Budget -->
  <rect x="1600" y="16" width="280" height="36" rx="8" fill="${this.colors.background}"/>
  <text x="1620" y="40" font-family="system-ui" font-size="13" fill="${this.colors.text}">
    ⚡ 2,847 / 8,192 tokens
  </text>
  
  <!-- Context Layers Grid -->
  <rect x="32" y="96" width="600" height="400" rx="12" fill="${this.colors.surface}"/>
  <text x="48" y="128" font-family="system-ui" font-size="16" font-weight="600" fill="${this.colors.text}">
    🧠 Active Memories (8)
  </text>
  ${[
    'Alex prefers TypeScript over JavaScript',
    'Building B2B SaaS startup (stealth)',
    'Interviewed at Google and Stripe',
    'Skeptical of microservices early-stage',
    'Uses Postgres + pgvector production',
    'Lives in San Francisco',
    'AI infrastructure space',
    'Background in distributed systems'
  ].map((memory, i) => `
    <rect x="48" y="${148 + i * 40}" width="568" height="32" rx="6" fill="${this.colors.background}"/>
    <text x="64" y="${170 + i * 40}" font-family="system-ui" font-size="12" fill="${this.colors.textMuted}">
      ${memory}
    </text>
  `).join('')}
  
  <!-- Topic Profiles -->
  <rect x="664" y="96" width="600" height="400" rx="12" fill="${this.colors.surface}"/>
  <text x="680" y="128" font-family="system-ui" font-size="16" font-weight="600" fill="${this.colors.text}">
    📊 Topic Profiles
  </text>
  ${[
    { name: 'React', level: 'Expert', convos: 30 },
    { name: 'TypeScript', level: 'Expert', convos: 25 },
    { name: 'System Design', level: 'Advanced', convos: 20 },
    { name: 'Postgres', level: 'Advanced', convos: 20 },
    { name: 'AI/ML', level: 'Intermediate', convos: 15 },
  ].map((topic, i) => `
    <rect x="680" y="${148 + i * 60}" width="568" height="52" rx="6" fill="${this.colors.background}"/>
    <text x="696" y="${170 + i * 60}" font-family="system-ui" font-size="13" font-weight="500" fill="${this.colors.text}">
      ${topic.name}
    </text>
    <text x="1100" y="${170 + i * 60}" font-family="system-ui" font-size="12" fill="${this.colors.primary}">
      ${topic.level}
    </text>
    <text x="1200" y="${170 + i * 60}" font-family="system-ui" font-size="12" fill="${this.colors.textMuted}">
      ${topic.convos} conversations
    </text>
  `).join('')}
  
  <!-- Entity Profiles -->
  <rect x="1296" y="96" width="592" height="400" rx="12" fill="${this.colors.surface}"/>
  <text x="1312" y="128" font-family="system-ui" font-size="16" font-weight="600" fill="${this.colors.text}">
    🏢 Entity Profiles
  </text>
  ${[
    { name: 'Stripe', type: 'Company', sentiment: 0.8 },
    { name: 'Jordan Lee', type: 'Person', sentiment: 0.9 },
    { name: 'First Close Ventures', type: 'Investor', sentiment: 0.7 },
    { name: 'San Francisco', type: 'Location', sentiment: 0.5 },
    { name: 'B2B SaaS', type: 'Product', sentiment: 0.8 },
  ].map((entity, i) => `
    <rect x="1312" y="${148 + i * 68}" width="560" height="60" rx="6" fill="${this.colors.background}"/>
    <text x="1328" y="${175 + i * 68}" font-family="system-ui" font-size="13" font-weight="500" fill="${this.colors.text}">
      ${entity.name}
    </text>
    <text x="1328" y="${195 + i * 68}" font-family="system-ui" font-size="11" fill="${this.colors.textMuted}">
      ${entity.type} · Sentiment: ${(entity.sentiment * 100).toFixed(0)}%
    </text>
  `).join('')}
  
  <!-- Chat Input -->
  <rect x="32" y="520" width="1856" height="80" rx="12" fill="${this.colors.surface}"/>
  <text x="48" y="565" font-family="system-ui" font-size="14" fill="${this.colors.textMuted}">
    Ask VIVIM AI... (context assembled from 8 memories, 5 topics, 5 entities)
  </text>
  <rect x="1760" y="536" width="112" height="48" rx="8" fill="${this.colors.primary}"/>
  <text x="1816" y="565" font-family="system-ui" font-size="13" font-weight="600" fill="#000" text-anchor="middle">
    Send
  </text>
  
  <!-- Context Stats -->
  <rect x="32" y="620" width="1856" height="80" rx="12" fill="${this.colors.surface}" opacity="0.5"/>
  <text x="48" y="650" font-family="system-ui" font-size="12" font-weight="600" fill="${this.colors.text}">
    Context Assembly
  </text>
  <text x="48" y="675" font-family="system-ui" font-size="11" fill="${this.colors.textMuted}">
    8 memories loaded · 5 topic profiles active · 5 entities referenced · 3 past conversations cited · Token budget: 35% used
  </text>
</svg>`;
  }
  
  generateArchiveTimeline(): string {
    const conversations = this.generateTimelineItems(12);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CONFIG.dimensions.desktop.width}" height="${CONFIG.dimensions.desktop.height}" 
     xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100%" height="100%" fill="${this.colors.background}"/>
  
  <!-- Header -->
  <rect width="100%" height="64" fill="${this.colors.surface}" opacity="0.9"/>
  <text x="32" y="42" font-family="system-ui" font-size="24" font-weight="600" fill="${this.colors.text}">
    Archive
  </text>
  <text x="1700" y="42" font-family="system-ui" font-size="14" fill="${this.colors.textMuted}">
    320 conversations · 2,161 ACUs
  </text>
  
  <!-- View Toggle -->
  <rect x="1500" y="16" width="180" height="36" rx="8" fill="${this.colors.background}"/>
  <text x="1520" y="40" font-family="system-ui" font-size="13" fill="${this.colors.primary}">Timeline</text>
  <text x="1600" y="40" font-family="system-ui" font-size="13" fill="${this.colors.textMuted}">Grid</text>
  <text x="1650" y="40" font-family="system-ui" font-size="13" fill="${this.colors.textMuted}">Canvas</text>
  
  <!-- Search Bar -->
  <rect x="600" y="16" width="400" height="36" rx="8" fill="${this.colors.background}"/>
  <text x="620" y="40" font-family="system-ui" font-size="14" fill="${this.colors.textMuted}">
    Search conversations...
  </text>
  
  <!-- Timeline -->
  ${conversations.map((conv, i) => `
    <rect x="32" y="${96 + i * 80}" width="1856" height="64" rx="8" fill="${this.colors.surface}"/>
    
    <!-- Provider Icon -->
    <circle cx="64" cy="${128 + i * 80}" r="16" fill="${this.getProviderColor(conv.provider)}"/>
    
    <!-- Content -->
    <text x="96" y="${118 + i * 80}" font-family="system-ui" font-size="14" font-weight="600" fill="${this.colors.text}">
      ${conv.title}
    </text>
    <text x="96" y="${140 + i * 80}" font-family="system-ui" font-size="12" fill="${this.colors.textMuted}">
      ${conv.excerpt}
    </text>
    
    <!-- Meta -->
    <text x="1700" y="${125 + i * 80}" font-family="system-ui" font-size="11" fill="${this.colors.textMuted}" text-anchor="end">
      ${conv.messages} msgs · ${conv.acus} ACUs
    </text>
    <text x="1700" y="${142 + i * 80}" font-family="system-ui" font-size="11" fill="${this.colors.textMuted}" text-anchor="end">
      ${conv.date}
    </text>
  `).join('')}
  
  <!-- Pagination -->
  <rect x="32" y="1020" width="1856" height="40" fill="none"/>
  <text x="928" y="1045" font-family="system-ui" font-size="13" fill="${this.colors.textMuted}" text-anchor="middle">
    Showing 1-12 of 320 conversations
  </text>
</svg>`;
  }
  
  // Helper methods
  private generateNodes(count: number) {
    const nodes = [];
    const types = ['code', 'question', 'answer', 'statement'];
    const labels = ['React Hooks', 'Postgres Index', 'TS Generics', 'API Design', 'System Architecture', 'Debug Session', 'Code Review'];
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      nodes.push({
        x: 200 + Math.random() * 1500,
        y: 150 + Math.random() * 700,
        size: 4 + Math.random() * 12,
        color: type === 'code' ? this.colors.primary : type === 'question' ? this.colors.secondary : type === 'answer' ? this.colors.success : this.colors.textMuted,
        type,
        label: labels[Math.floor(Math.random() * labels.length)],
      });
    }
    return nodes;
  }
  
  private generateEdges(nodes: any[], count: number) {
    const edges = [];
    for (let i = 0; i < count; i++) {
      const n1 = nodes[Math.floor(Math.random() * nodes.length)];
      const n2 = nodes[Math.floor(Math.random() * nodes.length)];
      edges.push({
        x1: n1.x,
        y1: n1.y,
        x2: n2.x,
        y2: n2.y,
        width: 0.5 + Math.random() * 2,
        opacity: 0.2 + Math.random() * 0.5,
      });
    }
    return edges;
  }
  
  private generateFeedCards(count: number) {
    const providers = ['ChatGPT', 'Claude', 'Gemini', 'DeepSeek'];
    const titles = [
      'Understanding React useEffect Dependencies',
      'Postgres Query Optimization Strategies',
      'TypeScript Generic Constraints Explained',
      'System Design: Monolith vs Microservices',
      'AI Context Window Management',
      'Startup Validation Framework',
    ];
    
    return Array.from({ length: count }, (_, i) => ({
      provider: providers[i % providers.length],
      time: `${i + 1}h ago`,
      title: titles[i % titles.length],
      excerpt: 'Key insights from your conversation about...',
      links: Math.floor(Math.random() * 10) + 1,
      score: 0.6 + Math.random() * 0.4,
    }));
  }
  
  private generateTimelineItems(count: number) {
    const providers = ['ChatGPT', 'Claude', 'Gemini', 'DeepSeek', 'Grok'];
    const titles = [
      'React Performance Optimization Discussion',
      'Postgres Indexing Best Practices',
      'TypeScript Advanced Types',
      'System Architecture Review',
      'Debugging Memory Leaks',
      'API Design Patterns',
      'Code Review: Authentication Flow',
      'Startup Technical Strategy',
      'AI Integration Planning',
      'Database Schema Design',
      'Testing Strategy Discussion',
      'DevOps Pipeline Setup',
    ];
    
    return Array.from({ length: count }, (_, i) => ({
      provider: providers[i % providers.length],
      title: titles[i % titles.length],
      excerpt: 'Deep dive into technical concepts and implementation strategies...',
      messages: Math.floor(Math.random() * 20) + 5,
      acus: Math.floor(Math.random() * 15) + 3,
      date: `${i + 1} days ago`,
    }));
  }
  
  private getProviderColor(provider: string) {
    const colors: Record<string, string> = {
      'ChatGPT': '#10a37f',
      'Claude': '#d97757',
      'Gemini': '#4285f4',
      'DeepSeek': '#1da1f2',
      'Grok': '#000000',
    };
    return colors[provider] || this.colors.textMuted;
  }
  
  saveSVG(filename: string, content: string) {
    const filePath = path.join(CONFIG.screenshotsDir, filename);
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Created: ${filename}`);
    return filePath;
  }
}

// ============================================================================
// Video Script Generator - Creates pitch video scripts
// ============================================================================

class VideoScriptGenerator {
  generate90SecondPitch() {
    return {
      title: 'VIVIM — The 90-Second Investor Pitch',
      duration: '90 seconds',
      scenes: [
        {
          time: '0-5s',
          visual: 'Black screen, white text fades in',
          text: 'Every AI power user lives here...',
          audio: '(silence, build anticipation)',
        },
        {
          time: '5-10s',
          visual: 'Three browser tabs: ChatGPT, Claude, Gemini',
          text: 'Browser tabs filled with AI assistants',
          audio: 'This is where your most valuable thinking goes to die.',
        },
        {
          time: '10-15s',
          visual: 'All tabs close simultaneously',
          text: 'No more.',
          audio: '(sound effect: tabs closing)',
        },
        {
          time: '15-20s',
          visual: 'VIVIM logo animates in',
          text: 'VIVIM — Own Your AI Brain',
          audio: 'Introducing VIVIM.',
        },
        {
          time: '20-35s',
          visual: 'Archive timeline scrolls by rapidly',
          text: '320 conversations · 9 providers · Fully organized',
          audio: 'One tap captures from ChatGPT, Claude, Gemini, and 6 more providers. Your entire AI history, archived.',
        },
        {
          time: '35-55s',
          visual: 'Canvas graph animates into place (THE MONEY SHOT)',
          text: '2,161 insights · 734 connections',
          audio: 'Every conversation decomposed into atomic insights. Mapped. Connected. This isn\'t a search tool. It\'s a second brain.',
        },
        {
          time: '55-70s',
          visual: 'Context cockpit layers load one by one',
          text: '8 context layers active',
          audio: 'New chat. Eight layers of context assemble automatically. Memories. Topics. Entities. It knows you.',
        },
        {
          time: '70-80s',
          visual: 'AI response with citations appears',
          text: 'Grounded in your history',
          audio: 'Not because you told it. Because it\'s been watching you think.',
        },
        {
          time: '80-90s',
          visual: 'Fade to VIVIM logo on dark background',
          text: 'VIVIM — Own Your AI Brain',
          audio: 'That\'s VIVIM. You own your AI brain. Fully.',
        },
      ],
      callToAction: '[Silence. Let them ask questions.]',
    };
  }
  
  generateFeatureExploration() {
    return {
      title: 'VIVIM Feature Exploration',
      duration: '3 minutes',
      sections: [
        {
          name: 'Core Capture',
          duration: '30s',
          steps: [
            'Show browser extension icon',
            'Click to capture current conversation',
            'Progress bar: "Capturing from ChatGPT..."',
            'Success notification: "47 messages captured"',
            'Archive updates with new conversation',
          ],
        },
        {
          name: 'Knowledge Graph',
          duration: '45s',
          steps: [
            'Navigate to Canvas view',
            'Graph animates into place',
            'Zoom into largest cluster',
            'Click node to show ACU detail',
            'Show relationship edges',
            'Search for concept, watch nodes glow',
          ],
        },
        {
          name: 'Context Engine',
          duration: '40s',
          steps: [
            'Open Context Cockpit',
            'Show 8 layers loading',
            'Highlight active memories',
            'Show topic profiles',
            'Show entity profiles',
            'Type question, show context assembled',
          ],
        },
        {
          name: 'For You Feed',
          duration: '30s',
          steps: [
            'Show feed with ranked cards',
            'Filter by topic (React)',
            'Click card to show conversation',
            'Show rediscovery score',
            'Demonstrate relevance',
          ],
        },
        {
          name: 'Social Sharing',
          duration: '35s',
          steps: [
            'Show Circles list',
            'Open Founders Circle',
            'Show shared conversations',
            'Demonstrate attribution',
            'Show group feed',
          ],
        },
      ],
    };
  }
  
  saveScript(filename: string, script: any) {
    const filePath = path.join(CONFIG.videosDir, filename);
    let content = `# ${script.title}\n\n`;
    content += `**Duration:** ${script.duration}\n\n---\n\n`;
    
    if ('scenes' in script) {
      // 90-second pitch format
      for (const scene of script.scenes) {
        content += `### ${scene.time}\n\n`;
        content += `**Visual:** ${scene.visual}\n\n`;
        if (scene.text) content += `**Text:** ${scene.text}\n\n`;
        content += `**Audio:** ${scene.audio}\n\n`;
        content += '---\n\n';
      }
      content += `**CTA:** ${script.callToAction}\n`;
    } else if ('sections' in script) {
      // Feature exploration format
      for (const section of script.sections) {
        content += `## ${section.name} (${section.duration})\n\n`;
        for (const step of section.steps) {
          content += `- [ ] ${step}\n`;
        }
        content += '\n';
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Created: ${filename}`);
    return filePath;
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('🎨 VIVIM Demo Media Generator');
  console.log('═'.repeat(70) + '\n');
  
  // Create output directories
  const dirs = [
    CONFIG.outputDir,
    CONFIG.screenshotsDir,
    CONFIG.videosDir,
    CONFIG.gifsDir,
    CONFIG.slidesDir,
    CONFIG.socialDir,
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  📁 Created: ${path.relative(process.cwd(), dir)}`);
    }
  }
  
  console.log();
  
  // Generate SVG mockups
  console.log('📐 Generating SVG Mockups...\n');
  const svgGen = new SVGGenerator();
  
  svgGen.saveSVG('knowledge-graph.svg', svgGen.generateKnowledgeGraph());
  svgGen.saveSVG('for-you-feed.svg', svgGen.generateForYouFeed());
  svgGen.saveSVG('context-cockpit.svg', svgGen.generateContextCockpit());
  svgGen.saveSVG('archive-timeline.svg', svgGen.generateArchiveTimeline());
  
  console.log();
  
  // Generate video scripts
  console.log('🎬 Generating Video Scripts...\n');
  const videoGen = new VideoScriptGenerator();
  
  videoGen.saveScript('90-second-pitch.md', videoGen.generate90SecondPitch());
  videoGen.saveScript('feature-exploration.md', videoGen.generateFeatureExploration());
  
  console.log();
  
  // Generate social media assets
  console.log('📱 Generating Social Media Assets...\n');
  
  // Twitter/X card
  const twitterCard = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${CONFIG.colors.background}"/>
  <text x="600" y="200" font-family="system-ui" font-size="72" font-weight="700" fill="${CONFIG.colors.primary}" text-anchor="middle">
    VIVIM
  </text>
  <text x="600" y="280" font-family="system-ui" font-size="36" fill="${CONFIG.colors.text}" text-anchor="middle">
    Own Your AI Brain
  </text>
  <text x="600" y="360" font-family="system-ui" font-size="24" fill="${CONFIG.colors.textMuted}" text-anchor="middle">
    Capture · Organize · Surface
  </text>
  <text x="600" y="420" font-family="system-ui" font-size="20" fill="${CONFIG.colors.textMuted}" text-anchor="middle">
    Your AI conversations from ChatGPT, Claude, Gemini — unified
  </text>
  <text x="600" y="550" font-family="system-ui" font-size="18" fill="${CONFIG.colors.primary}" text-anchor="middle">
    vivim.app
  </text>
</svg>`;
  
  fs.writeFileSync(path.join(CONFIG.socialDir, 'twitter-card.svg'), twitterCard);
  console.log('  ✅ Created: twitter-card.svg');
  
  // LinkedIn banner
  const linkedinBanner = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1584" height="396" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${CONFIG.colors.background}"/>
  <text x="80" y="200" font-family="system-ui" font-size="64" font-weight="700" fill="${CONFIG.colors.primary}">
    VIVIM
  </text>
  <text x="80" y="260" font-family="system-ui" font-size="28" fill="${CONFIG.colors.text}">
    Own Your AI Brain
  </text>
  <text x="80" y="310" font-family="system-ui" font-size="18" fill="${CONFIG.colors.textMuted}">
    Capture · Organize · Surface · Remember
  </text>
</svg>`;
  
  fs.writeFileSync(path.join(CONFIG.socialDir, 'linkedin-banner.svg'), linkedinBanner);
  console.log('  ✅ Created: linkedin-banner.svg');
  
  console.log();
  
  // Generate pitch deck slides
  console.log('📊 Generating Pitch Deck Slides...\n');
  
  const slides = [
    {
      title: 'The Problem',
      subtitle: 'Every AI power user lives here',
      content: 'Browser tabs filled with ChatGPT, Claude, Gemini...\n\nThis is where your most valuable thinking goes to die.',
      file: 'slide-01-problem.svg',
    },
    {
      title: 'VIVIM',
      subtitle: 'Own Your AI Brain',
      content: 'Capture. Organize. Surface.\nYour AI conversations, unified.',
      file: 'slide-02-solution.svg',
    },
    {
      title: 'The Archive',
      subtitle: '9 AI providers. One timeline.',
      content: '320 conversations · 2,161 ACUs · Fully organized',
      file: 'slide-03-archive.svg',
    },
    {
      title: 'Knowledge Graph',
      subtitle: 'The money shot',
      content: 'What if your AI conversations could remember each other?',
      file: 'slide-04-graph.svg',
    },
    {
      title: 'Context Engine',
      subtitle: 'AI that actually knows you',
      content: '8 layers of context · Memories · Topics · Entities',
      file: 'slide-05-context.svg',
    },
    {
      title: 'The Vision',
      subtitle: 'You own your AI brain',
      content: 'Decentralized · Private · Permanent',
      file: 'slide-06-vision.svg',
    },
  ];
  
  for (const slide of slides) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${CONFIG.colors.background}"/>
  <text x="960" y="400" font-family="system-ui" font-size="72" font-weight="700" fill="${CONFIG.colors.text}" text-anchor="middle">
    ${slide.title}
  </text>
  <text x="960" y="480" font-family="system-ui" font-size="36" fill="${CONFIG.colors.primary}" text-anchor="middle">
    ${slide.subtitle}
  </text>
  <text x="960" y="600" font-family="system-ui" font-size="28" fill="${CONFIG.colors.textMuted}" text-anchor="middle" white-space="preserve">
    ${slide.content.replace(/\n/g, '</text><text x="960" y="')}
  </text>
  <text x="960" y="980" font-family="system-ui" font-size="18" fill="${CONFIG.colors.textMuted}" text-anchor="middle">
    vivim.app
  </text>
</svg>`;
    
    fs.writeFileSync(path.join(CONFIG.slidesDir, slide.file), svg);
    console.log(`  ✅ Created: ${slide.file}`);
  }
  
  console.log();
  console.log('═'.repeat(70));
  console.log('✅ Media generation complete!');
  console.log('═'.repeat(70));
  console.log(`\n📁 Output directory: ${path.relative(process.cwd(), CONFIG.outputDir)}\n`);
  console.log('📋 Generated files:');
  console.log('   Screenshots: 4 SVG mockups');
  console.log('   Videos: 2 pitch scripts');
  console.log('   Social: 2 assets (Twitter, LinkedIn)');
  console.log('   Slides: 6 pitch deck slides');
  console.log();
  console.log('💡 Next steps:');
  console.log('   1. Convert SVG to PNG: Use Inkscape or online converter');
  console.log('   2. Record video: Follow 90-second pitch script');
  console.log('   3. Import slides: Use in Keynote, PowerPoint, or MDX Deck');
  console.log();
}

main().catch(error => {
  console.error('❌ Media generation failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
