import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3000,
  },
  publicDir: './assets',
  build: {
    target: 'esnext',
    outDir: __dirname + '../../../dist/shell-chrome-v3',
    // see also, custom ./build.js file to bundle eg. src/scripts and copy alpine.js to local dist folder
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        simulator: fileURLToPath(new URL('./simulator.html', import.meta.url)),
      },
    },
  },
});
