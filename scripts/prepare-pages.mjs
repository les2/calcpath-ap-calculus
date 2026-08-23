import { copyFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.join(process.cwd(), 'dist', 'calcpath', 'browser');

// GitHub Pages has no configurable SPA rewrite. Its supported custom 404 page
// can still boot Angular at the requested clean URL, where the router resolves
// the route normally. The service worker handles later offline navigations.
await copyFile(path.join(output, 'index.html'), path.join(output, '404.html'));
