import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pandaProjects } from './scripts/vite-plugin-projects.mjs';

// The homepage is served from the root of the custom domain (panoramicpanda.me),
// so assets use root-relative paths.
export default defineConfig({
  base: '/',
  plugins: [react(), pandaProjects()],
  build: {
    outDir: 'dist',
    emptyOutDir: true, // guarantees no stale projects survive between builds
  },
  server: {
    watch: {
      // Built sub-projects have their own node_modules; don't watch them.
      ignored: ['**/projects/*/node_modules/**', '**/projects/*/dist/**'],
    },
  },
});
