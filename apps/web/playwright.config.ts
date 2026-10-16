import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'node --import tsx e2e/catalog-server.ts',
      url: 'http://127.0.0.1:4101/api/v1/health',
      reuseExistingServer: false
    },
    {
      command: 'pnpm exec next dev --hostname 127.0.0.1 --port 3100',
      url: 'http://127.0.0.1:3100/admin/login',
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:4101/api/v1',
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:4101',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key'
      }
    }
  ]
});
