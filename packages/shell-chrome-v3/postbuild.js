import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

console.log('Copying shell-chrome-v3 to firefox-ext');
await fs.cp(
  fileURLToPath(new URL('../../dist/shell-chrome-v3', import.meta.url)),
  fileURLToPath(new URL('../../dist/firefox-ext', import.meta.url)),
  { recursive: true },
);
console.log('Updating firefox-ext/manifest.json.');
await fs.rename(
  fileURLToPath(new URL('../../dist/firefox-ext/manifest-ff.json', import.meta.url)),
  fileURLToPath(new URL('../../dist/firefox-ext/manifest.json', import.meta.url)),
);
console.log('Cleanup shell-chrome-v3/manifest-ff.json');
await fs.rm(fileURLToPath(new URL('../../dist/shell-chrome-v3/manifest-ff.json', import.meta.url)));
