import { readFile } from 'node:fs/promises';
import katex from 'katex';

const readJson = async (name) => JSON.parse(await readFile(new URL(`../public/data/${name}`, import.meta.url), 'utf8'));
const isHttpsUrl = (value) => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const [{ units }, { tools }, { groups }, { challenges }] = await Promise.all([
  readJson('topics.json'),
  readJson('tools.json'),
  readJson('formulas.json'),
  readJson('practice.json')
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
for (const group of groups) {
  assert(group.title && Array.isArray(group.items) && group.items.length > 0, 'Every formula group needs titled entries.');
  for (const [label, formula] of group.items) {
    assert(label && formula, `Formula entries in ${group.title} need a label and TeX expression.`);
    try { katex.renderToString(formula, { strict: 'error', throwOnError: true }); }
    catch (error) { throw new Error(`Invalid TeX for ${group.title} / ${label}: ${error.message}`); }
  }
}

assert(Array.isArray(challenges) && challenges.length > 0, 'At least one practice challenge is required.');
assert(new Set(challenges.map((challenge) => challenge.id)).size === challenges.length, 'Practice challenge IDs must be unique.');
const topicIds = new Set(topics.map((topic) => topic.id));
for (const challenge of challenges) {
  assert(challenge.id && challenge.topic && topicIds.has(challenge.topicId), `Practice challenge ${challenge.id} needs a valid topic mapping.`);
  for (const field of ['problemUrl', 'solutionUrl', 'videoUrl', 'referenceUrl']) assert(isHttpsUrl(challenge[field]), `${challenge.id} ${field} must use HTTPS.`);
}

console.log(`Validated ${units.length} units, ${topics.length} topics, ${tools.length} tools, ${groups.length} formula groups, and ${challenges.length} practice challenges.`);
