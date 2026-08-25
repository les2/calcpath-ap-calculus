import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.join(process.cwd(), 'dist', 'full-dive-ap', 'browser');

// GitHub Pages has no configurable SPA rewrite. Its supported custom 404 page
// can still boot Angular at the requested clean URL, where the router resolves
// the route normally. The service worker handles later offline navigations.
await copyFile(path.join(output, 'index.html'), path.join(output, '404.html'));

// Emit entry points for known routes as well. GitHub Pages redirects these
// directory paths to a trailing slash and serves a real 200 response.
const dataRoot = path.join(process.cwd(), 'public', 'data');
const catalog = JSON.parse(await readFile(path.join(dataRoot, 'courses.json'), 'utf8'));
const routes = ['realms'];
for (const summary of catalog.courses.filter((course) => course.status === 'available')) {
  const manifest = JSON.parse(await readFile(path.join(dataRoot, summary.manifest), 'utf8'));
  routes.push(...manifest.navigation.map((item) => `realms/${summary.id}/${item.path}`));
}

for (const route of routes) {
  const routeDirectory = path.join(output, route);
  await mkdir(routeDirectory, { recursive: true });
  await copyFile(path.join(output, 'index.html'), path.join(routeDirectory, 'index.html'));
}
