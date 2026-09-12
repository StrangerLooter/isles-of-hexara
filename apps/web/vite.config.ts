import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'GAME_'],
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
  build: {
    // Suppress the large-bundle warning — Babylon.js is unavoidably large
    chunkSizeWarningLimit: 8000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Babylon.js 3D engine — the largest chunk, loaded lazily by GameCanvas
          if (id.includes('@babylonjs') || id.includes('babylonjs')) {
            return 'vendor-babylon';
          }
          // Socket.IO client — needed only in online/multiplayer mode
          if (id.includes('socket.io-client') || id.includes('socket.io-parser') || id.includes('engine.io-client')) {
            return 'vendor-socketio';
          }
          // React + Zustand + Lucide icons + animation libraries
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/zustand') ||
            id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/canvas-confetti') ||
            id.includes('node_modules/clsx')
          ) {
            return 'vendor-react';
          }
          // Zod (used heavily in protocol validation)
          if (id.includes('node_modules/zod')) {
            return 'vendor-zod';
          }
        },
      },
    },
  },
});

