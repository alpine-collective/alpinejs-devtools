import { build } from 'esbuild';
import fs, { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const entryPoints = (await fs.readdir(fileURLToPath(new URL('./src/scripts', import.meta.url)))).map(
  (el) => `src/scripts/${el}`,
);

async function buildAll() {
  try {
    // for production output
    const buildOutput = await build({
      entryPoints,
      outdir: fileURLToPath(new URL('../../dist/shell-chrome-v3', import.meta.url)),
      bundle: true,
      sourcemap: true,
      target: 'esnext',
      platform: 'browser',

      define: {
        'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV !== 'production'),
      },
    });

    // for simulator to access
    const simulatorBuildOutput = await build({
      entryPoints,
      outdir: fileURLToPath(new URL('./dist', import.meta.url)),
      bundle: true,
      sourcemap: true,
      target: 'esnext',
      platform: 'browser',
    });

    const alpineBuild = await copyFile(
      fileURLToPath(new URL('../../node_modules/alpinejs/dist/alpine.js', import.meta.url)),
      fileURLToPath(new URL('./dist/alpine.js', import.meta.url)),
    );

    console.log('Build successful!', buildOutput);

    const { default: manifestJson } = await import('./manifest.json', { with: { type: 'json' } });
    const { default: pkgJson } = await import('./package.json', { with: { type: 'json' } });

    let newManifestJson = { ...manifestJson };
    newManifestJson.version = pkgJson.version;
    await fs.writeFile(
      fileURLToPath(new URL('./manifest.json', import.meta.url)),
      JSON.stringify(newManifestJson, null, 2),
    );
    if (process.env.VITE_MAINLINE_PUBLISH === 'true') {
      newManifestJson.name = 'Alpine.js devtools';
    }
    await fs.writeFile(
      fileURLToPath(new URL('../../dist/shell-chrome-v3/manifest.json', import.meta.url)),
      JSON.stringify(newManifestJson, null, 2),
    );

    console.log('manifest.json updates successful');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run build process
buildAll();
