import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';

export default defineConfig({
  plugins: [sites()],
  publicDir: false,
  build: {
    outDir: 'dist/server',
    emptyOutDir: false,
    target: 'es2022',
    lib: { entry: 'worker/index.ts', formats: ['es'], fileName: () => 'index.js' },
    rollupOptions: { external: [] }
  }
});
