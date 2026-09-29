import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // Vitest flags "14 workers spawned · ~525ms startup each" with the default
    // pool. vmThreads reuses workers and stays isolated per file, which the
    // suite needs (tokens.ts keeps module-level state; tests mutate document).
    // Avoid `isolate: false` — files would share that state.
    pool: 'vmThreads',
    include: ['src/js/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    globals: false,
  },
});
