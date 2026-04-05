import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 25_000,
    hookTimeout: 25_000,
    include: ['src/**/*.test.ts'],
    setupFiles: ['dotenv/config']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
