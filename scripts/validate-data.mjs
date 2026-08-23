import { readFile } from 'node:fs/promises';

const readJson = async (name) => JSON.parse(await readFile(new URL(`../public/data/${name}`, import.meta.url), 'utf8'));
const isHttpsUrl = (value) => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const [{ units }, { tools }, { groups }] = await Promise.all([
  readJson('topics.json'),
  readJson('tools.json'),
  readJson('formulas.json')
]);

assert(Array.isArray(units) && units.length === 10, 'Expected all 10 AP Calculus units.');
const topics = units.flatMap((unit) => unit.topics ?? []);
assert(topics.length === 111, `Expected 111 curriculum topics, found ${topics.length}.`);
assert(new Set(topics.map((topic) => topic.id)).size === topics.length, 'Topic IDs must be unique.');

for (const unit of units) {
  assert(unit.title && unit.course && unit.weight, `Unit ${unit.id} is missing required metadata.`);
  assert(isHttpsUrl(unit.reference), `Unit ${unit.id} reference must use HTTPS.`);
  assert(isHttpsUrl(unit.video), `Unit ${unit.id} video must use HTTPS.`);
}

assert(Array.isArray(tools) && tools.length > 0, 'At least one free tool is required.');
for (const tool of tools) assert(tool.name && isHttpsUrl(tool.url), 'Every tool needs a name and HTTPS URL.');
assert(Array.isArray(groups) && groups.length > 0, 'At least one formula group is required.');
for (const group of groups) assert(group.title && Array.isArray(group.items) && group.items.length > 0, 'Every formula group needs titled entries.');

console.log(`Validated ${units.length} units, ${topics.length} topics, ${tools.length} tools, and ${groups.length} formula groups.`);
