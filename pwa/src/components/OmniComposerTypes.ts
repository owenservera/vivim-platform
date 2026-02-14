/**
 * OmniComposer Trigger Types
 * Configuration for all OmniComposer trigger characters
 */

import { Command, User, Plus, Zap, Hash } from 'lucide-react';

export type TriggerType = '/' | '@' | '+' | '!' | '#';

export interface TriggerConfig {
  trigger: TriggerType;
  icon: React.ElementType;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  examples: string[];
}

export const TRIGGER_CONFIGS: Record<TriggerType, TriggerConfig> = {
  '/': {
    trigger: '/',
    icon: Command,
    name: 'Commands',
    description: 'Execute commands and actions',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    examples: ['/help', '/model', '/settings', '/clear'],
  },
  '@': {
    trigger: '@',
    icon: User,
    name: 'Mentions',
    description: 'Reference people, AI, or networks',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    examples: ['@AI', '@Network', '@you'],
  },
  '+': {
    trigger: '+',
    icon: Plus,
    name: 'Context',
    description: 'Add context from captures, ACUs',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    examples: ['+capture', '+bookmark', '+search'],
  },
  '!': {
    trigger: '!',
    icon: Zap,
    name: 'Actions',
    description: 'Perform actions like save, broadcast',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    examples: ['!save', '!broadcast', '!remix'],
  },
  '#': {
    trigger: '#',
    icon: Hash,
    name: 'Topics',
    description: 'Tag topics, ACUs, or categories',
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
    examples: ['#coding', '#v1v1m', '#docs'],
  },
};

export const ALL_TRIGGERS = Object.values(TRIGGER_CONFIGS);

export interface SuggestionItem {
  id: string;
  label: string;
  icon?: string;
  value?: string;
  type?: string;
  subLabel?: string;
}

export const SUGGESTION_CATEGORIES = {
  '/': [
    { id: 'help', label: 'Help', icon: 'help', value: '/help ', type: '/', subLabel: 'Show help' },
    { id: 'model', label: 'Switch Model', icon: 'zap', value: '/model ', type: '/', subLabel: 'Change AI model' },
    { id: 'settings', label: 'Settings', icon: 'settings', value: '/settings ', type: '/', subLabel: 'Open settings' },
    { id: 'clear', label: 'Clear Chat', icon: 'trash', value: '/clear ', type: '/', subLabel: 'Clear conversation' },
    { id: 'remix', label: 'Remix', icon: 'refresh', value: '/remix ', type: '/', subLabel: 'Remix last response' },
  ],
  '@': [
    { id: 'ai', label: 'AI Assistant', icon: 'bot', value: '@AI ', type: '@', subLabel: 'Default AI' },
    { id: 'network', label: 'Network', icon: 'globe', value: '@Network ', type: '@', subLabel: 'Share to network' },
    { id: 'coder', label: 'Coder Agent', icon: 'code', value: '@Coder ', type: '@', subLabel: 'Coding specialist' },
    { id: 'writer', label: 'Writer Agent', icon: 'file-text', value: '@Writer ', type: '@', subLabel: 'Writing specialist' },
  ],
  '+': [
    { id: 'capture', label: 'From Capture', icon: 'file', value: '+capture ', type: '+', subLabel: 'Add from capture' },
    { id: 'bookmark', label: 'From Bookmark', icon: 'bookmark', value: '+bookmark ', type: '+', subLabel: 'Add from bookmark' },
    { id: 'search', label: 'Search Results', icon: 'search', value: '+search ', type: '+', subLabel: 'Add search results' },
    { id: 'clipboard', label: 'From Clipboard', icon: 'clipboard', value: '+clipboard ', type: '+', subLabel: 'Paste from clipboard' },
  ],
  '!': [
    { id: 'save', label: 'Save to Vault', icon: 'save', value: '!save ', type: '!', subLabel: 'Save to vault' },
    { id: 'broadcast', label: 'Broadcast', icon: 'globe', value: '!broadcast ', type: '!', subLabel: 'Public post' },
    { id: 'remix', label: 'Remix', icon: 'refresh', value: '!remix ', type: '!', subLabel: 'Remix conversation' },
    { id: 'export', label: 'Export', icon: 'download', value: '!export ', type: '!', subLabel: 'Export conversation' },
  ],
  '#': [
    { id: 'topic', label: 'Topic', icon: 'hash', value: '#', type: '#', subLabel: 'Add topic tag' },
    { id: 'acu', label: 'ACU', icon: 'file-text', value: '#acu:', type: '#', subLabel: 'Reference ACU' },
    { id: 'project', label: 'Project', icon: 'folder', value: '#project:', type: '#', subLabel: 'Project tag' },
  ],
};
