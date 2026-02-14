import js from '@eslint/js'
import globals from 'globals'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**'],
    extends: [
      js.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'always-multiline'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],

      // ES2024+ features
      'no-nested-ternary': 'warn',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'prefer-destructuring': ['warn', { object: true }],
    },
  },
  {
    files: ['tests/**', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
])