import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': 'http://localhost:8787',
      },
    },
    build: {
      // Modern browsers only — keeps the bundle smaller and avoids legacy
      // polyfill bloat for our motion-heavy app.
      target: 'es2020',
      sourcemap: false,
      cssCodeSplit: true,
      // Slightly higher than default so we don't get warnings for the motion
      // chunk (which we deliberately split out below).
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Hand-pick chunks for libraries that change rarely so the browser
          // can cache them across deploys. Keeping motion separate is the
          // most impactful: it's the largest dependency and only changes
          // with major releases.
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            motion: ['motion'],
            icons: ['lucide-react'],
            head: ['@unhead/react'],
          },
        },
      },
    },
  };
});
