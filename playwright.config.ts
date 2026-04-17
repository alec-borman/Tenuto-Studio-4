import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests/ui',
  testMatch: '**/*.spec.ts',
  use: {
    browserName: 'chromium',
  },
};
export default config;

