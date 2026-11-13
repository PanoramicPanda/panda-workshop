import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Set by Panda Workshop to /projects/mcu-release-order/ during builds.
  base: process.env.PROJECT_BASE_PATH ?? '/',
  plugins: [react()],
});
