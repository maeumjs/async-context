import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'v8'
      all: false,
    },
  },
  plugins: [tsconfigPaths({ projects: ['tsconfig.json'] })],
});
