import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true
  },
  esbuild: {
    target: 'es2022'
  },
  build: {
    sourcemap: true
  }
});