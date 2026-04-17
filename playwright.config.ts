import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Load .env.local for E2E (Next.js loads it for webServer, but Playwright test runner doesn't)
try {
  const envFile = readFileSync(join(__dirname, '.env.local'), 'utf8');
  for (const line of envFile.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let value = m[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[m[1]] = value;
    }
  }
} catch {
  // .env.local not present; tests requiring admin login will fail with a clear error.
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'he-IL',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
