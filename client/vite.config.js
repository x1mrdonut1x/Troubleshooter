import { defineConfig } from 'vite';
import { resolve } from 'path';
import checker from 'vite-plugin-checker';

export default defineConfig({
  publicDir: resolve(__dirname, 'public'),
  assetsInclude: ['**/*.png', '**/*.json'],
  build: {
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint -c ../.eslintrc.cjs "./src/**/*.ts"', // for example, lint .ts & .tsx
      },
    }),
  ],
});
