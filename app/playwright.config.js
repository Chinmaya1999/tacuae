// Browser tests against the built site. Needs TEST_MONGODB_URI (database name containing "test") and `npm run build`.
import { defineConfig } from '@playwright/test'

const port = 3200
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  workers: 1, // the specs share one seeded database
  reporter: process.env.PLAYWRIGHT_JUNIT_OUTPUT_FILE ? [['list'], ['junit']] : [['list']],
  use: { baseURL: `http://localhost:${port}`, screenshot: 'only-on-failure' },
  webServer: { command: 'node tests/e2e/server.mjs', url: `http://localhost:${port}/api/demo/config`, env: { PORT: String(port) }, reuseExistingServer: false, timeout: 60_000 },
})
