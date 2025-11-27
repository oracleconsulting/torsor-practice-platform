import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// Note: Platform app will be migrated here from src/
// For now this is a stub to make the monorepo build pass
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
