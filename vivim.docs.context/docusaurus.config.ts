import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'VIVIM',
  tagline: 'Your Personal AI Memory Platform',
  favicon: 'img/favicon.ico',

  url: 'https://vivim.live',
  baseUrl: '/docs',

  organizationName: 'vivim',
  projectName: 'vivim-live',

  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'ignore',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-pwa',
      {
        debug: false,
        offlineModeActivationStrategies: ['always', 'standalone', 'mobile'],
        pwaHead: [
          {
            tagName: 'meta',
            name: 'theme-color',
            content: '#a65bf0',
          },
          {
            tagName: 'meta',
            name: 'description',
            content: 'VIVIM - The Sovereign Foundation Layer for AI. User-owned knowledge graph on your personal blockchain.',
          },
          {
            tagName: 'link',
            rel: 'icon',
            href: '/docs/img/favicon.ico',
          },
          {
            tagName: 'link',
            rel: 'apple-touch-icon',
            href: '/docs/img/logo.svg',
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-capable',
            content: 'yes',
          },
          {
            tagName: 'meta',
            name: 'apple-mobile-web-app-status-bar-style',
            content: 'black-translucent',
          },
        ],
      },
    ],
  ],



  themes: ['@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
  },

  themeConfig: {
    image: 'img/vivim-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    announcementBar: {
      id: 'announcement',
      content: '🚀 VIVIM - Decentralized AI Memory Platform. Own your AI conversations.',
      backgroundColor: 'rgba(166, 91, 240, 0.1)',
      textColor: '#a65bf0',
      isCloseable: true,
    },
    navbar: {
      title: 'VIVIM',
      hideOnScroll: true,
      logo: {
        alt: 'VIVIM Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/',
          label: 'Home',
          position: 'left',
        },
        {
          type: 'docSidebar',
          sidebarId: 'gettingStarted',
          position: 'left',
          label: 'SDK Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'featureDocumentation',
          position: 'left',
          label: '📊 Features',
        },

        {
          href: 'https://github.com/owenservera/vivim-app',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://github.com/vivim/vivim-sdk',
          label: 'SDK',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/introduction',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture/overview',
            },
            {
              label: 'API Reference',
              to: '/docs/api/overview',
            },
          ],
        },
        {
          title: 'Core Features',
          items: [
            {
              label: 'Context Pipeline',
              to: '/docs/architecture/pipeline',
            },
            {
              label: 'Storage V2',
              to: '/docs/pwa/storage-v2',
            },
            {
              label: 'BYOK',
              to: '/docs/pwa/byok',
            },
            {
              label: 'Network Security',
              to: '/docs/network/security',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub (Main Repo)',
              href: 'https://github.com/owenservera/vivim-app',
            },
            {
              label: 'GitHub (SDK)',
              href: 'https://github.com/vivim/vivim-sdk',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/vivim',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/vivim',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} VIVIM. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.oneLight,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript', 'json', 'bash'],
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
