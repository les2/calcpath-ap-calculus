import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const output = path.join(process.cwd(), 'dist', 'calcpath', 'browser');

// GitHub Pages has no configurable SPA rewrite. Its supported custom 404 page
// can still boot Angular at the requested clean URL, where the router resolves
// the route normally. The service worker handles later offline navigations.
await copyFile(path.join(output, 'index.html'), path.join(output, '404.html'));

// Emit entry points for known routes as well. GitHub Pages redirects these
// directory paths to a trailing slash and serves a real 200 response.
for (const route of ['roadmap', 'tools', 'reference', 'grade-maxxing']) {
  const routeDirectory = path.join(output, route);
  await mkdir(routeDirectory, { recursive: true });
  await copyFile(path.join(output, 'index.html'), path.join(routeDirectory, 'index.html'));
}
