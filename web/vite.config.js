import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': {
        target: process.env.HSU_BACKEND_ORIGIN || 'http://localhost:8080',
        headers: { 'X-HSU-Frontend': 'admin' },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 벤더/아이콘/화면군을 분리해 초기 번들 크기와 캐시 효율을 개선한다.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react-router')) return 'router';
            if (id.includes('react-dom') || id.includes('/react/')) return 'react';
            return 'vendor';
          }
          if (id.includes('/src/pages/admin/')) return 'pages-admin';
          if (id.includes('/src/pages/mobile/')) return 'pages-mobile';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'https://admin.hsu-hub.site/' } },
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: true,
  },
});
