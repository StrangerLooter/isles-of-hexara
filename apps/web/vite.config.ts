import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  define: {
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hexara/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@hexara/game-core': path.resolve(__dirname, '../../packages/game-core/src/index.ts'),
      '@hexara/protocol': path.resolve(__dirname, '../../packages/protocol/src/index.ts'),
    },
  },
});
