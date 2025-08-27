import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), solidPlugin()],
  server: {
    port: 3000,
  },
  publicDir: './assets',
  build: {
    target: 'esnext',
    outDir: __dirname + '../../../dist/browser-extension',
    // see also, custom ./build.js file to bundle eg. src/scripts and copy alpine.js to local dist folder
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        ...(process.env.NODE_ENV !== 'production'
          ? { simulator: fileURLToPath(new URL('./simulator.html', import.meta.url)) }
          : {}),
      },
    },
  },
});
