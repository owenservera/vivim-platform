import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'VIVIM',
  tagline: 'Your Personal AI Memory Platform',
  favicon: 'img/favicon.ico',

  url: 'https://vivim.ai',
  baseUrl: '/',

  organizationName: 'vivim',
  projectName: 'vivim-docs',

  onBrokenLinks: 'throw',

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
          label: 'Docs',
        },
        {
          href: 'https://github.com/vivim',
          label: 'GitHub',
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
              label: 'GitHub',
              href: 'https://github.com/vivim',
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
