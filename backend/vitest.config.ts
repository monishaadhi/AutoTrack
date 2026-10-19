import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  css: {
    postcss: false,
  },
  test: {
    globals: true,
    environment: 'node',
    root: __dirname,
    css: false,
  },
});
