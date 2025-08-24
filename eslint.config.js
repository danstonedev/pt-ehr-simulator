// ESLint v9 flat config
import globals from 'globals';

export default [
  {
    files: ['app/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        console: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      complexity: ['warn', 12],
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
];
