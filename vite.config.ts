import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Ensure modules are resolved correctly
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // For development
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    exclude: ['@rollup/rollup-linux-x64-gnu']
  },
  
  server: {
    port: 5174,
    host: true,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      // Proxy API calls in development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
  
  build: {
    // CRITICAL: Ensure ES2020 for import.meta support
    target: 'es2020',
    minify: 'esbuild',
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production
    
    rollupOptions: {
      output: {
        // Force ES module format
        format: 'es',
        
        // Ensure modern JavaScript features
        generatedCode: {
          constBindings: true,
          arrowFunctions: true,
          objectShorthand: true
        },
        
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react', 'framer-motion'],
          'radix-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          'data-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
        },
        // Enhanced cache busting with timestamp
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      },
      external: [
        '**/tests/**',
        '**/*.test.*',
        '**/*.spec.*'
      ]
    },
    modulePreload: false
  },
  
  // Ensure proper module handling
  esbuild: {
    target: 'es2020',
    format: 'esm'
  },
  
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  
  envPrefix: 'VITE_',
  define: {
    // Ensure proper environment variables are available
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    
    // Fix import.meta.env undefined error
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
    
    // Resend email configuration
    'import.meta.env.VITE_RESEND_API_KEY': JSON.stringify(process.env.VITE_RESEND_API_KEY || ''),
    'import.meta.env.VITE_FROM_EMAIL': JSON.stringify(process.env.VITE_FROM_EMAIL || ''),
    'import.meta.env.VITE_FROM_NAME': JSON.stringify(process.env.VITE_FROM_NAME || ''),
    
    'import.meta.env.PROD': process.env.NODE_ENV === 'production',
    'import.meta.env.DEV': process.env.NODE_ENV !== 'production',
  }
}); 