import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@torsor/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@torsor/llm': path.resolve(__dirname, '../../packages/llm/src'),
      '@torsor/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  server: {
    port: 3001,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

