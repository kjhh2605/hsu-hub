import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    proxy: {
      '/api': {
        target: process.env.HSU_BACKEND_ORIGIN || 'http://localhost:8080',
        headers: { 'X-HSU-Frontend': 'applicant' },
      },
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'https://app.hsu-hub.site/' } },
    globals: true,
  },
});
