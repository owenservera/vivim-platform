import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'VIVIM',
  description: 'Sovereign, portable memory for every AI interaction',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', href: '/images/logo.svg' }],
  ],

  themeConfig: {
    logo: '/images/logo.svg',

    nav: [
      { text: 'Docs', link: '/' },
      { text: 'API', link: '/api-reference' },
      { text: 'GitHub', link: 'https://github.com/owenservera/vivim-platform' },
      { text: 'Live Demo', link: 'https://vivim-platform.vercel.app/demo/investor-pitch' },
    ],

    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/' },
            { text: 'Quick Start', link: '/quickstart' },
          ],
        },
        {
          text: 'Concepts',
          items: [
            { text: 'ACU Specification', link: '/concepts/acu-specification' },
            { text: 'Context Engine', link: '/concepts/context-engine' },
            { text: 'Memory Types', link: '/concepts/memory-types' },
            { text: 'Sovereignty', link: '/concepts/sovereignty' },
          ],
        },
        {
          text: 'Architecture',
          items: [
            { text: 'System Overview', link: '/architecture/system-overview' },
            { text: 'Data Flow', link: '/architecture/data-flow' },
            { text: 'Storage', link: '/architecture/storage' },
            { text: 'Network', link: '/architecture/network' },
          ],
        },
        {
          text: 'SDK Guide',
          items: [
            { text: 'Introduction', link: '/sdk/introduction' },
            { text: 'Basic Usage', link: '/sdk/basic' },
            { text: 'Intermediate', link: '/sdk/intermediate' },
            { text: 'Advanced', link: '/sdk/advanced' },
          ],
        },
        {
          text: 'Integrations',
          items: [
            { text: 'MCP Server', link: '/integrations/mcp-server' },
            { text: 'LangChain & LlamaIndex', link: '/integrations/langchain-llamaindex' },
            { text: 'Automation', link: '/integrations/automation' },
            { text: 'Browser Extension', link: '/integrations/browser-extension' },
          ],
        },
        {
          text: 'Self-Hosting',
          items: [
            { text: 'Docker', link: '/self-hosting/docker' },
            { text: 'Kubernetes', link: '/self-hosting/kubernetes' },
            { text: 'Storage Backends', link: '/self-hosting/storage-backends' },
            { text: 'Migration', link: '/self-hosting/migration' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'API Reference', link: '/api-reference' },
            { text: 'Roadmap', link: '/roadmap' },
            { text: 'Glossary', link: '/glossary' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/owenservera/vivim-platform' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/owenservera/vivim-platform/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the AGPL v3 License.',
      copyright: 'Copyright © 2026 VIVIM Team',
    },
  },
})
