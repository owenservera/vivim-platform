import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  gettingStarted: [
    {
      type: 'doc',
      id: 'getting-started/introduction',
      label: 'Introduction',
    },
    {
      type: 'doc',
      id: 'sdk/overview',
      label: 'SDK Overview',
    },
    {
      type: 'doc',
      id: 'user/getting-started',
      label: 'Quick Start Guide',
    },
    {
      type: 'doc',
      id: 'development/guide',
      label: 'Development Guide',
    },
    {
      type: 'doc',
      id: 'deployment/guide',
      label: 'Deployment',
    },
  ],

  sdk: [
    {
      type: 'doc',
      id: 'sdk/overview',
      label: '📦 Overview',
    },
    {
      type: 'category',
      label: '🏗️ Architecture',
      link: {
        type: 'doc',
        id: 'sdk/architecture/data-flow',
      },
      items: [
        'sdk/architecture/data-flow',
      ],
    },
    {
      type: 'category',
      label: '🔧 Core SDK',
      link: {
        type: 'doc',
        id: 'sdk/core/overview',
      },
      items: [
        'sdk/core/overview',
        'sdk/core/communication',
        'sdk/core/utilities',
        'sdk/core/self-design',
      ],
    },
    {
      type: 'category',
      label: '💻 CLI',
      link: {
        type: 'doc',
        id: 'sdk/cli/overview',
      },
      items: [
        'sdk/cli/overview',
      ],
    },
    {
      type: 'category',
      label: '🔌 Extension System',
      link: {
        type: 'doc',
        id: 'sdk/extension/overview',
      },
      items: [
        'sdk/extension/overview',
      ],
    },
    {
      type: 'category',
      label: '🥟 Bun Integration',
      link: {
        type: 'doc',
        id: 'sdk/bun/integration',
      },
      items: [
        'sdk/bun/integration',
      ],
    },
    {
      type: 'category',
      label: '🔌 API Nodes',
      link: {
        type: 'doc',
        id: 'sdk/api-nodes/overview',
      },
      items: [
        'sdk/api-nodes/overview',
        'sdk/api-nodes/additional-nodes',
      ],
    },
    {
      type: 'category',
      label: '🎨 SDK Nodes',
      link: {
        type: 'doc',
        id: 'sdk/sdk-nodes/overview',
      },
      items: [
        'sdk/sdk-nodes/overview',
      ],
    },
    {
      type: 'category',
      label: '🌐 Network',
      link: {
        type: 'doc',
        id: 'sdk/network/overview',
      },
      items: [
        'sdk/network/overview',
        'sdk/network/protocols',
        'sdk/network/graph-registry',
      ],
    },
    {
      type: 'category',
      label: '📱 Applications',
      link: {
        type: 'doc',
        id: 'sdk/apps/overview',
      },
      items: [
        'sdk/apps/overview',
        'sdk/apps/additional-apps',
      ],
    },
    {
      type: 'category',
      label: '📚 Guides',
      link: {
        type: 'doc',
        id: 'sdk/guides/getting-started',
      },
      items: [
        'sdk/guides/getting-started',
        'sdk/guides/testing',
        'sdk/guides/migration',
        'sdk/guides/performance',
        'sdk/guides/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: '💡 Examples',
      link: {
        type: 'doc',
        id: 'sdk/examples/basic',
      },
      items: [
        'sdk/examples/basic',
        'sdk/examples/intermediate',
        'sdk/examples/advanced',
      ],
    },
  ],
  
  user: [
    {
      type: 'doc',
      id: 'user/capturing-conversations',
      label: 'Capturing Conversations',
    },
    {
      type: 'doc',
      id: 'user/searching-finding',
      label: 'Searching & Finding',
    },
    {
      type: 'doc',
      id: 'user/collections',
      label: 'Collections',
    },
    {
      type: 'doc',
      id: 'user/bookmarks',
      label: 'Bookmarks',
    },
    {
      type: 'doc',
      id: 'user/for-you',
      label: 'For You Recommendations',
    },
    {
      type: 'doc',
      id: 'user/ai-chat',
      label: 'AI Chat',
    },
    {
      type: 'doc',
      id: 'user/byok-chat',
      label: 'BYOK Chat',
    },
    {
      type: 'doc',
      id: 'user/sharing',
      label: 'Sharing Knowledge',
    },
    {
      type: 'doc',
      id: 'user/context-recipes',
      label: 'Context Recipes',
    },
    {
      type: 'doc',
      id: 'user/context-cockpit',
      label: 'Context Cockpit',
    },
    {
      type: 'doc',
      id: 'user/context-components',
      label: 'Context Components (ACUs)',
    },
    {
      type: 'doc',
      id: 'user/analytics',
      label: 'Analytics',
    },
    {
      type: 'doc',
      id: 'user/error-dashboard',
      label: 'Error Dashboard',
    },
    {
      type: 'doc',
      id: 'user/settings-account',
      label: 'Settings & Account',
    },
  ],
  
  architecture: [
    {
      type: 'doc',
      id: 'architecture/overview',
      label: '🏗️ Overview',
    },
    {
      type: 'doc',
      id: 'architecture/visual-guides',
      label: '🎬 Visual Guides',
    },
    {
      type: 'autogenerated',
      dirName: 'architecture',
    },
  ],
  
  api: [
    {
      type: 'doc',
      id: 'api/overview',
      label: 'REST API',
    },
  ],
  
  pwa: [
    {
      type: 'doc',
      id: 'pwa/overview',
      label: 'PWA Overview',
    },
    {
      type: 'doc',
      id: 'pwa/byok',
      label: 'BYOK',
    },
    {
      type: 'doc',
      id: 'pwa/storage-v2',
      label: 'Storage V2',
    },
    {
      type: 'doc',
      id: 'pwa/content-renderer',
      label: 'Content Renderer',
    },
  ],
  
  network: [
    {
      type: 'doc',
      id: 'network/overview',
      label: 'Network Overview',
    },
    {
      type: 'doc',
      id: 'network/security',
      label: 'Security',
    },
  ],
  
  database: [
    {
      type: 'doc',
      id: 'database/schema',
      label: 'Schema',
    },
  ],
  
  social: [
    {
      type: 'doc',
      id: 'social/overview',
      label: 'Social Features',
    },
  ],
  
  admin: [
    {
      type: 'doc',
      id: 'admin/overview',
      label: 'Admin Panel',
    },
  ],
  
  security: [
    {
      type: 'doc',
      id: 'security/overview',
      label: 'Security Overview',
    },
  ],
  
  common: [
    {
      type: 'doc',
      id: 'common/overview',
      label: 'Common Utils',
    },
  ],
  
  reference: [
    {
      type: 'doc',
      id: 'reference/types',
      label: 'TypeScript Types',
    },
  ],

  // Feature Documentation - NEW
  featureDocumentation: [
    {
      type: 'category',
      label: '📊 Feature Documentation',
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'ATOMIC_FEATURE_INVENTORY',
          label: 'Atomic Feature Inventory',
        },
        {
          type: 'doc',
          id: 'ROADMAP/FEATURE_ROADMAP',
          label: 'Feature Roadmap',
        },
        {
          type: 'doc',
          id: 'SDK_GAP_ANALYSIS',
          label: 'SDK Gap Analysis',
        },
      ],
    },
  ],
};

export default sidebars;
