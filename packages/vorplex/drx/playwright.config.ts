import { defineConfig } from '@playwright/test';

const port = 4173;

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.test.ts',
    fullyParallel: true,
    timeout: 60_000,
    expect: {
        timeout: 15_000
    },
    use: {
        baseURL: `http://localhost:${port}`
    },
    webServer: {
        command: 'npx tsx standalone/serve.mts',
        url: `http://localhost:${port}/packages/vorplex/drx/dist/standalone/drx.js`,
        env: { PORT: String(port) },
        reuseExistingServer: !process.env.CI
    }
});
