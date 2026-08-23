import { readFile } from 'node:fs/promises';
import katex from 'katex';

const readJson = async (name) => JSON.parse(await readFile(new URL(`../public/data/${name}`, import.meta.url), 'utf8'));
const isHttpsUrl = (value) => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const [{ units }, { tools }, { groups }, practice] = await Promise.all([
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

const { schemaVersion, questions } = practice;
assert(schemaVersion === 2, 'Practice data must use schema version 2.');
assert(Array.isArray(questions) && questions.length > 0, 'At least one practice question is required.');
assert(new Set(questions.map((question) => question.id)).size === questions.length, 'Practice question IDs must be unique.');
const topicIds = new Set(topics.map((topic) => topic.id));
for (const question of questions) {
  assert(question.id && question.title && question.topic && topicIds.has(question.topicId), `Practice question ${question.id} needs a valid topic mapping.`);
  assert(['embedded', 'external'].includes(question.type), `${question.id} has an invalid question type.`);
  for (const field of ['videoUrl', 'referenceUrl']) assert(isHttpsUrl(question[field]), `${question.id} ${field} must use HTTPS.`);
  assert(question.source?.title && question.source?.author && isHttpsUrl(question.source?.url), `${question.id} needs complete source attribution.`);
  assert(question.source?.license?.code && question.source?.license?.name && isHttpsUrl(question.source?.license?.url), `${question.id} needs complete license metadata.`);
  if (question.type === 'embedded') {
    assert(question.promptTex && question.answerTex, `${question.id} needs embedded question and answer TeX.`);
    assert(question.source.license.usage === 'embedded' && question.source.license.code.startsWith('CC-'), `${question.id} must be covered by an embeddable Creative Commons license.`);
    for (const [label, formula] of [['prompt', question.promptTex], ['answer', question.answerTex]]) {
      try { katex.renderToString(formula, { strict: 'error', throwOnError: true }); }
      catch (error) { throw new Error(`Invalid ${label} TeX for ${question.id}: ${error.message}`); }
    }
  } else {
    assert(isHttpsUrl(question.problemUrl) && isHttpsUrl(question.solutionUrl), `${question.id} external links must use HTTPS.`);
    assert(question.source.license.usage === 'link-only', `${question.id} must identify link-only source usage.`);
  }
}

console.log(`Validated ${units.length} units, ${topics.length} topics, ${tools.length} tools, ${groups.length} formula groups, and ${questions.length} licensed practice questions.`);
