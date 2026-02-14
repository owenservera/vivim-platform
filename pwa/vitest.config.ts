import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/lib/recommendation/__tests__/**/*.{test,spec}.{js,ts}'
    ],
    // Use threads pool for better compatibility with rolldown-vite
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    // Completely disable SSR for rolldown-vite compatibility
    ssr: false,
    experimentalVmThreads: false,
    transformMode: {
      ssr: false,
      web: true
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/dist'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@components': path.resolve(__dirname, './src/components')
    }
  }
});
