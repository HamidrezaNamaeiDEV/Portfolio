import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { browserName: 'chromium' },
  webServer: [
    {
      command: 'node apps/web/.output/server/index.mjs',
      url: 'http://127.0.0.1:47121',
      env: { NITRO_HOST: '127.0.0.1', NITRO_PORT: '47121' },
      reuseExistingServer: false,
    },
    {
      command: 'node apps/admin/.output/server/index.mjs',
      url: 'http://127.0.0.1:47122',
      env: { NITRO_HOST: '127.0.0.1', NITRO_PORT: '47122' },
      reuseExistingServer: false,
    },
  ],
})
