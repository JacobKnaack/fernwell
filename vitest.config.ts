import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    pool: 'vmThreads',
    include: ['src/js/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    globals: false,
  },
});
