import { build } from 'esbuild';
import fs, { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const entryPoints = (
  await fs.readdir(fileURLToPath(new URL('./src/scripts', import.meta.url)))
).map((el) => `src/scripts/${el}`);

async function buildAll() {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    // for production output
    const buildOutput = await build({
      entryPoints,
      outdir: fileURLToPath(new URL('../../dist/shell-chrome-v3', import.meta.url)),
      bundle: true,
      sourcemap: !isProd,
      minify: isProd,
      target: 'esnext',
      platform: 'browser',

      define: {
        'import.meta.env.DEV': JSON.stringify(!isProd),
        'import.meta.env.VITE_MAINLINE_PUBLISH': JSON.stringify(
          JSON.stringify(process.env.VITE_MAINLINE_PUBLISH === 'true'),
        ),
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

    if (process.env.TARGET === 'firefox') {
      console.log('Overwriting manifest.json with Firefox compatible one.');
      await fs.writeFile(
        fileURLToPath(new URL('../../dist/shell-chrome-v3/manifest.json', import.meta.url)),
        JSON.stringify(convertToFirefoxManifest(newManifestJson), null, 2),
      );
    } else {
      await fs.writeFile(
        fileURLToPath(new URL('../../dist/shell-chrome-v3/manifest-ff.json', import.meta.url)),
        JSON.stringify(convertToFirefoxManifest(newManifestJson), null, 2),
      );
    }

    console.log('manifest.json updates successful');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run build process
buildAll();

function convertToFirefoxManifest(manifest) {
  const { service_worker, ...rest } = manifest.background;
  return {
    ...manifest,
    background: {
      ...rest,
      scripts: [service_worker],
    },
    browser_specific_settings: {
      gecko: {
        id: 'devtools@alpinedevtools.com',
        strict_min_version: '112.0',
        ...(process.env.VITE_MAINLINE_PUBLISH !== 'true'
          ? {
              update_url: 'https://alpinedevtools.com/ff-ea-updates.json',
            }
          : undefined),
      },
    },
  };
}
