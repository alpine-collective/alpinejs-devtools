import { build } from 'esbuild';
import fs, { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const entryPoints = (await fs.readdir(fileURLToPath(new URL('./src/scripts', import.meta.url)))).map(
  (el) => `src/scripts/${el}`,
);

async function buildAll() {
  try {
    // for production output
    const out = await build({
      entryPoints,
      outdir: fileURLToPath(new URL('../../dist/shell-chrome-v3', import.meta.url)),
      bundle: true,
      // minify: true,
      sourcemap: true,
      target: 'esnext',
      platform: 'browser',
    });

    // for simulator to access
    const out2 = await build({
      entryPoints,
      outdir: fileURLToPath(new URL('./dist', import.meta.url)),
      bundle: true,
      // minify: true,
      sourcemap: true,
      target: 'esnext',
      platform: 'browser',
    });

    const alpineBuild = await copyFile(
      fileURLToPath(new URL('../../node_modules/alpinejs/dist/alpine.js', import.meta.url)),
      fileURLToPath(new URL('./dist/alpine.js', import.meta.url)),
    );

    console.log('Build successful!', out);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run build process
buildAll();
