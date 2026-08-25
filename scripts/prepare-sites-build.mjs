import { copyFile, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const angularBrowser = path.join(dist, 'full-dive-ap', 'browser');
const client = path.join(dist, 'client');

await rm(client, { recursive: true, force: true });
await rename(angularBrowser, client);
await rm(path.join(dist, 'full-dive-ap'), { recursive: true, force: true });
await rm(path.join(dist, 'server'), { recursive: true, force: true });
await mkdir(path.join(dist, '.openai'), { recursive: true });
await copyFile(path.join(root, '.openai', 'hosting.json'), path.join(dist, '.openai', 'hosting.json'));
