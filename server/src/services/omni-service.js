// apps/server/src/services/omni-service.js

import { getPrismaClient } from '../lib/database.js';

/**
 * Omni Service
 * Handles context-aware searches for the Omni-Composer
 */
export class OmniService {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Search based on trigger type
   * @param {string} trigger - One of '/', '@', '+', '!', '#'
   * @param {string} query - The search text
   * @param {string} userId - Context user
   */
  async search(trigger, query, userId) {
    switch (trigger) {
      case '@':
        return this.searchSocial(query, userId);
      case '#':
        return this.searchTopics(query, userId);
      case '!':
        return this.searchActions(query);
      case '/':
        return this.searchCommands(query);
      case '+':
        return this.searchContext(query, userId);
      default:
        return [];
    }
  }

  /**
   * Search People & Personas (@)
   */
  async searchSocial(query, userId) {
    // 1. Search Friends/Users (Mock for now, would search CircleMember)
    // 2. Search AI Personas (System + User owned)
    
    const personas = await this.prisma.aiPersona.findMany({
      where: {
        OR: [
          { ownerId: null }, // System personas
          { ownerId: userId }, // User personas
        ],
        name: { contains: query, mode: 'insensitive' },
      },
      take: 5,
    });

    return personas.map(p => ({
      id: p.id,
      label: p.name,
      subLabel: p.type === 'clone' ? 'Digital Twin' : 'AI Persona',
      value: `@${p.trigger || p.name.replace(/\s+/g, '')}`,
      type: '@',
      icon: 'bot', // simplified
    }));
  }

  /**
   * Search Topics/ACUs (#)
   */
  async searchTopics(query, userId) {
    // Search Atomic Chat Units
    const acus = await this.prisma.atomicChatUnit.findMany({
      where: {
        // Simple content search for now, vector search later
        content: { contains: query, mode: 'insensitive' },
        OR: [
            { sharingPolicy: 'network' },
            { authorDid: userId }, // Assuming userId maps to DID roughly or we look up DID
        ],
      },
      take: 5,
      orderBy: { rediscoveryScore: 'desc' },
    });

    return acus.map(acu => ({
      id: acu.id,
      label: acu.metadata?.title || `${acu.content.slice(0, 20)  }...`,
      subLabel: `ACU • ${acu.type}`,
      value: `#${acu.id.slice(0, 8)}`,
      type: '#',
      icon: 'hash',
    }));
  }

  async searchActions(query) {
    const zaiActions = [
      { id: 'websearch', label: 'Web Search', subLabel: 'Search the web', trigger: 'websearch', icon: 'globe' },
      { id: 'readurl', label: 'Web Reader', subLabel: 'Read a webpage', trigger: 'read', icon: 'book-open' },
      { id: 'github', label: 'GitHub Search', subLabel: 'Search repos', trigger: 'github', icon: 'github' },
      { id: 'githubtree', label: 'GitHub Tree', subLabel: 'Repo structure', trigger: 'githubtree', icon: 'git-branch' },
      { id: 'githubfile', label: 'GitHub File', subLabel: 'Read file', trigger: 'githubfile', icon: 'file-code' },
    ];

    const filteredZai = zaiActions.filter(a => 
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.trigger.toLowerCase().includes(query.toLowerCase())
    );

    let dbActions = [];
    try {
      dbActions = await this.prisma.systemAction.findMany({
        where: {
          OR: [
            { label: { contains: query, mode: 'insensitive' } },
            { trigger: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      });
    } catch (e) {
      // DB not ready, skip
    }

    const dbMapped = dbActions.map(a => ({
      id: a.actionCode,
      label: a.label,
      subLabel: a.subLabel,
      value: `!${a.trigger}`,
      type: '!',
      icon: a.icon || 'zap',
    }));

    const zaiMapped = filteredZai.map(a => ({
      id: a.id,
      label: a.label,
      subLabel: a.subLabel,
      value: `!${a.trigger}`,
      type: '!',
      icon: a.icon,
    }));

    return [...zaiMapped, ...dbMapped];
  }

  async searchCommands(query) {
    const commands = await this.prisma.systemCommand.findMany({
      where: {
        OR: [
          { label: { contains: query, mode: 'insensitive' } },
          { trigger: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    return commands.map(c => ({
      id: c.actionCode,
      label: c.label,
      subLabel: c.subLabel,
      value: `/${c.trigger}`,
      type: '/',
      icon: c.icon || 'command',
    }));
  }

  async searchContext(query, userId) {
    if (!userId) {
return [];
}
    
    const facts = await this.prisma.userFact.findMany({
      where: {
        userId: userId,
        OR: [
          { category: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    return facts.map(f => ({
      id: f.id,
      label: f.category,
      subLabel: `${f.content.slice(0, 30)  }...`,
      value: `+${f.id.slice(0,8)}`, // Context injection usually uses ID or content ref
      type: '+',
      icon: 'file-text',
    }));
  }
}

export const omniService = new OmniService();
