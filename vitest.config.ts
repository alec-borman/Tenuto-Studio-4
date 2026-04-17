import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      instances: [
        { browser: 'chromium' }
      ],
      provider: playwright(),
      headless: true
    },
    include: ['tests/**/*.tsx', 'tests/**/*.ts', 'tests/**/*.js'],
    exclude: ['node_modules', 'dist', '**/*.spec.ts', '**/*.spec.js'],
    setupFiles: ['./tests/setup.ts'],
  },
});
