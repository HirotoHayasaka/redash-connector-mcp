import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      REDASH_URL: 'https://redash.example.com',
      REDASH_API_KEY: 'test-api-key',
      REDASH_TIMEOUT: '30000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'dist/**', 'node_modules/**'],
      thresholds: {
        lines: 85,
        functions: 93,
        branches: 73,
        statements: 83,
      },
    },
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
