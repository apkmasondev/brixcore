import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/brixcore/',
  // Media lives in public/assets and is referenced by absolute URL, so it is
  // copied verbatim into the build without passing through the bundler.
  publicDir: 'public',
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
});
