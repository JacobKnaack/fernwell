import { defineConfig } from 'vitest/config';

// Consumer-facing checks that run against the *built* package (dist/), so they
// live apart from the jsdom unit tests. Run with `npm run test:types`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    globals: false,
  },
});
