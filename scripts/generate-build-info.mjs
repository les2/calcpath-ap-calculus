import { readFile, writeFile } from 'node:fs/promises';

const packageInfo = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const builtAt = new Date();
const compactTime = builtAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const buildInfo = {
  $schema: 'schemas/build-info.schema.json',
  version: packageInfo.version,
  buildId: compactTime,
  builtAt: builtAt.toISOString()
};

await writeFile(new URL('../public/build-info.json', import.meta.url), `${JSON.stringify(buildInfo, null, 2)}\n`);
