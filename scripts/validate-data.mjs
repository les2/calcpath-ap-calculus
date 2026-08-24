import { access, readFile } from 'node:fs/promises';
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

const { schemaVersion, revision, sources, questions } = practice;
assert(schemaVersion === 5 && /^[a-f0-9]{16}$/.test(revision), 'Practice data must use normalized schema version 5 with a content revision.');
assert(Array.isArray(sources) && sources.length > 0 && new Set(sources.map((source) => source.id)).size === sources.length, 'Practice sources must be a unique normalized registry.');
const practiceSources = new Map(sources.map((source) => [source.id, source]));
for (const source of sources) {
  assert(source.title && source.author && isHttpsUrl(source.url), `${source.id} needs complete source attribution.`);
  assert(source.license?.code && source.license?.name && isHttpsUrl(source.license?.url), `${source.id} needs complete license metadata.`);
}
assert(Array.isArray(questions) && questions.length > 0, 'At least one practice question is required.');
assert(new Set(questions.map((question) => question.id)).size === questions.length, 'Practice question IDs must be unique.');
const topicIds = new Set(topics.map((topic) => topic.id));
for (const question of questions) {
  assert(question.id && question.title && question.topic && topicIds.has(question.topicId), `Practice question ${question.id} needs a valid topic mapping.`);
  assert(['embedded', 'external'].includes(question.type), `${question.id} has an invalid question type.`);
  for (const field of ['videoUrl', 'referenceUrl']) assert(isHttpsUrl(question[field]), `${question.id} ${field} must use HTTPS.`);
  const source = practiceSources.get(question.sourceId);
  assert(source, `${question.id} must reference a source in the normalized registry.`);
  assert(question.metadata?.sourceQuestionId && question.metadata?.collection && question.metadata?.course && question.metadata?.format, `${question.id} needs useful source and format metadata.`);
  assert(['easy', 'medium', 'hard', 'ridiculous'].includes(question.metadata?.difficulty) && Number.isInteger(question.metadata?.estimatedMinutes) && question.metadata.estimatedMinutes > 0, `${question.id} needs a supported difficulty and estimated-time metadata.`);
  assert(question.metadata?.calculator && question.metadata?.answerKind && Array.isArray(question.metadata?.tags) && question.metadata.tags.length > 0, `${question.id} needs calculator, answer, and skill tags.`);
  assert(question.locator?.exerciseId && isHttpsUrl(question.locator?.promptUrl) && isHttpsUrl(question.locator?.answerUrl), `${question.id} needs exact normalized question and answer locators.`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(question.locator?.verifiedAt ?? ''), `${question.id} needs a source verification date.`);
  assert(!/adapted|variant|fixed parameters/i.test(`${question.id} ${source.attribution}`), `${question.id} appears to be adapted or generated; CalcPath only accepts source-faithful transcriptions or links.`);
  if (question.type === 'embedded') {
    assert(!/^fs-id\d+$/i.test(question.title), `${question.id} exposes an internal publisher ID as its title.`);
    assert((question.promptTex || question.promptHtml) && (question.answerTex || question.answerHtml), `${question.id} needs embedded question and answer content.`);
    assert(source.license.usage === 'embedded' && source.license.code.startsWith('CC-'), `${question.id} must be covered by an embeddable Creative Commons license.`);
    assert(question.locator.transcription === 'format-only', `${question.id} must be marked as a format-only transcription.`);
    const embeddedMarkup = `${question.promptHtml ?? ''}\n${question.answerHtml ?? ''}`;
    assert(!/<\/?m:/i.test(embeddedMarkup), `${question.id} contains unresolved namespaced source markup.`);
    assert(!/<\/?(?:script|iframe|object|embed|style|link|meta)\b/i.test(embeddedMarkup), `${question.id} contains executable or document-level markup.`);
    assert(!/\son[a-z]+\s*=|javascript\s*:/i.test(embeddedMarkup), `${question.id} contains an executable HTML attribute or URL.`);
    for (const match of embeddedMarkup.matchAll(/<img\s+[^>]*src="([^"]+)"/gi)) {
      assert(!match[1].includes('..') && !match[1].startsWith('/'), `${question.id} contains an unsafe local media path.`);
      try { await access(new URL(`../public/${match[1]}`, import.meta.url)); }
      catch { throw new Error(`${question.id} references missing local media ${match[1]}.`); }
    }
    for (const [label, formula] of [['prompt', question.promptTex], ['answer', question.answerTex]].filter((entry) => entry[1])) {
      try { katex.renderToString(formula, { strict: 'error', throwOnError: true }); }
      catch (error) { throw new Error(`Invalid ${label} TeX for ${question.id}: ${error.message}`); }
    }
  } else {
    assert(isHttpsUrl(question.problemUrl) && isHttpsUrl(question.solutionUrl), `${question.id} external links must use HTTPS.`);
    assert(source.license.usage === 'link-only', `${question.id} must identify link-only source usage.`);
    assert(question.locator.transcription === 'link-only', `${question.id} must be marked link-only.`);
  }
}
assert(new Set(practice.questions.map((question) => question.metadata.difficulty)).size === 4, 'Practice data must exercise all four difficulty filters.');

assert(practice.catalogStats?.questionCount === questions.length, 'Practice catalog stats must match the question count.');
assert(practice.catalogStats?.sourceCount === sources.length && sources.length >= 3, 'Practice catalog stats must match the normalized publisher registry.');
const embeddedQuestions = questions.filter((question) => question.type === 'embedded');
assert(practice.catalogStats?.deliveryCounts?.embedded === embeddedQuestions.length, 'Embedded catalog stats must match the question records.');
for (const topic of topics.filter((topic) => topic.id.startsWith('1.'))) {
  assert(embeddedQuestions.filter((question) => question.topicId === topic.id).length >= 5, `Unit 1 topic ${topic.id} needs at least five embedded publisher-authored questions.`);
}
console.log(`Validated ${units.length} units, ${topics.length} topics, ${tools.length} tools, ${groups.length} formula groups, and ${questions.length} sourced practice questions from ${practice.catalogStats.sourceCount} publisher groups.`);
