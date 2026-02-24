import js from '@eslint/js'
import globals from 'globals'
import prettierConfig from 'eslint-config-prettier'

export default [
  {
    ignores: ['node_modules/**'],
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.js'],
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
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'warn',
      'no-var': 'warn',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-nested-ternary': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
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
]