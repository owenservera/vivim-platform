import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { consoleForwardPlugin } from 'vite-console-forward-plugin'
import * as path from 'path'

const isDevelopment = process.env.NODE_ENV === 'development';
const isVerbose = process.env.VITE_DEBUG === 'true';
const isCI = process.env.CI === 'true';

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LogDeduplicationMap {
  [key: string]: {
    count: number;
    firstSeen: Date;
    level: LogLevel;
  };
}

const deduplicationCache: LogDeduplicationMap = {};

const ERROR_PATTERNS = {
  NETWORK: /network|fetch|cors|connection|timeout|abort/i,
  AUTH: /auth|token|session|unauthorized|forbidden|401|403/i,
  VALIDATION: /validation|invalid|schema|type/i,
  REACT: /react|component|render|hook|state/i,
  PERFORMANCE: /performance|slow|timeout|memory|leak/i,
  ASSET: /asset|image|font|script|css/i,
  STORAGE: /storage|indexeddb|idb|quota/i,
  SERVICE_WORKER: /service.?worker|sw|pwa/i,
  ENCRYPTION: /encrypt|decrypt|crypto|cipher|key/i,
};

const NOISE_PATTERNS = {
  HMR: /hmr|hot.?module|vite|dev.?server/i,
  REACT_DEVTOOLS: /react.?dev.?tools/i,
  VITE: /\[vite\]|vite:/i,
  DEBUG_LOGS: /debug.*:|log.*:|info.*:/i,
};

const SENSITIVE_KEYWORDS = [
  'password', 'passwd', 'pwd', 'secret', 'token', 'api_key', 'apikey',
  'private_key', 'privatekey', 'access_token', 'refresh_token',
  'session_id', 'csrf', 'auth', 'credential',
];

function categorizeError(message: string): string {
  for (const [category, pattern] of Object.entries(ERROR_PATTERNS)) {
    if (pattern.test(message)) {
      return category;
    }
  }
  return 'UNKNOWN';
}

function containsSensitiveData(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return SENSITIVE_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

function isNoise(message: string): boolean {
  return Object.values(NOISE_PATTERNS).some(pattern => pattern.test(message));
}

function getDeduplicationKey(level: LogLevel, message: string): string {
  const cleanedMessage = message
    .replace(/\d+/g, 'N')
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID')
    .replace(/\bhttps?:\/\/[^\s]+/gi, 'URL')
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, 'IP');

  return `${level}:${cleanedMessage.substring(0, 200)}`;
}

function shouldForwardLog(level: LogLevel, args: any[]): boolean {
  const message = args.map(arg => typeof arg === 'string' ? arg : String(arg)).join(' ');

  if (containsSensitiveData(message)) {
    return false;
  }

  if (level === 'log' || level === 'debug') {
    if (isNoise(message) && !isVerbose) {
      return false;
    }
  }

  return true;
}

function getConsoleLevels(): LogLevel[] {
  if (isCI) return ['error', 'warn'];
  if (isVerbose) return ['log', 'warn', 'error', 'info', 'debug'];
  return ['warn', 'error', 'info'];
}

export default defineConfig({
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, '../common'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    consoleForwardPlugin({
      enabled: isDevelopment || isCI,
      endpoint: '/api/debug/client-logs',
      levels: getConsoleLevels(),
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/(capture|core)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      },
      manifest: {
        name: 'OpenScroll',
        short_name: 'OpenScroll',
        description: 'The Sovereign AI Conversation Network - Capture, own, and share your AI conversations with quantum-resistant encryption',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'utilities', 'social'],
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        share_target: {
          action: "/capture",
          method: "GET",
          params: {
            title: "title",
            text: "text",
            url: "url"
          }
        },
        shortcuts: [
          {
            name: 'Capture URL',
            short_name: 'Capture',
            description: 'Capture a new AI conversation',
            url: '/capture',
            icons: [{ src: 'icon.svg', sizes: 'any' }]
          },
          {
            name: 'Search',
            short_name: 'Search',
            description: 'Search your conversation library',
            url: '/search',
            icons: [{ src: 'icon.svg', sizes: 'any' }]
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    }),
    {
      name: 'intelligent-console-enhancer',
      configureServer(server) {
        const endpoint = '/api/debug/client-logs';
        const logger = createLogger('info', { prefix: '[console]' });

        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith(endpoint)) {
            return next();
          }

          const chunks: Buffer[] = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8');
              const { logs = [] } = JSON.parse(body);

              logs.forEach((log: any) => {
                const { level, message, timestamp, url, stacks = [] } = log;

                if (!shouldForwardLog(level as LogLevel, [message])) {
                  return;
                }

                const category = categorizeError(message);
                const key = getDeduplicationKey(level as LogLevel, message);

                if (deduplicationCache[key]) {
                  deduplicationCache[key].count++;
                  return;
                }

                deduplicationCache[key] = {
                  count: 1,
                  firstSeen: new Date(timestamp),
                  level: level as LogLevel,
                };

                const location = url ? ` @ ${url}` : '';
                const categoryTag = category !== 'UNKNOWN' ? ` [${category}]` : '';
                let enhancedMessage = `${level.toUpperCase()}${categoryTag}: ${message}${location}`;

                if (stacks.length > 0) {
                  enhancedMessage += '\n' + stacks[0].split('\n').slice(0, 3).join('\n');
                }

                switch (level) {
                  case 'error':
                    logger.error(enhancedMessage);
                    break;
                  case 'warn':
                    logger.warn(enhancedMessage);
                    break;
                  case 'info':
                    logger.info(enhancedMessage);
                    break;
                  default:
                    logger.info(enhancedMessage);
                }
              });

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              logger.error(`Console forward error: ${err}`);
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid request' }));
            }
          });
        });

        setInterval(() => {
          const report: string[] = [];
          const now = new Date();

          for (const [key, data] of Object.entries(deduplicationCache)) {
            if (data.count > 1) {
              const secondsSinceFirst = Math.floor((now.getTime() - data.firstSeen.getTime()) / 1000);
              report.push(`${key}: occurred ${data.count}x in ${secondsSinceFirst}s`);
              delete deduplicationCache[key];
            }
          }

          if (report.length > 0) {
            logger.info('🔄 Repeated log summary:');
            report.forEach(line => logger.info(`  ${line}`));
          }
        }, 30000);
      }
    }
  ],
  ssr: {
    noExternal: ['@vitejs/plugin-react', 'vite-plugin-pwa']
  },
  optimizeDeps: {
    include: ['@testing-library/react', '@testing-library/jest-dom', 'katex', 'mermaid']
  },
  server: {
    port: 5173,
    strictPort: false,
    fs: {
      allow: ['.']
    },
    proxy: {
      '^/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
        configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              if (req.headers.cookie) {
                proxyReq.setHeader('cookie', req.headers.cookie);
              }
            });
            proxy.on('proxyRes', (proxyRes) => {
              const cookies = proxyRes.headers['set-cookie'];
              if (cookies) {
                proxyRes.headers['set-cookie'] = cookies.map((cookie: string) => 
                  cookie.replace(/; Secure/, '; Secure').replace(/; SameSite=None/, '; SameSite=Lax')
                );
              }
            });
          }
      }
    }
  },
  build: {
    sourcemap: true,
    target: 'es2020',
    minify: 'esbuild'
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
