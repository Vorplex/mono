import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        include: ['**/*.spec.ts'],
        passWithNoTests: true,
        coverage: {
            provider: 'v8',
            reporter: ['html', 'text', 'lcov'],
        },
    },
});
