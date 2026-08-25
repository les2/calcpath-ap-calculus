import { access, readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import katex from 'katex';

const dataRoot = new URL('../public/data/', import.meta.url);
const schemaRoot = new URL('../public/schemas/', import.meta.url);
const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const isHttpsUrl = (value) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const schemaFiles = ['app', 'courses', 'course', 'roadmap', 'tools', 'reference', 'practice', 'build-info'];
const schemas = new Map(await Promise.all(schemaFiles.map(async (name) => [name, await readJson(new URL(`${name}.schema.json`, schemaRoot))])));
const validateSchema = (name, value, label) => {
  const validate = ajv.compile(schemas.get(name));
  if (!validate(value)) throw new Error(`${label} does not match ${name}.schema.json:\n${ajv.errorsText(validate.errors, { separator: '\n' })}`);
};

const [app, catalog, buildInfo] = await Promise.all([
  readJson(new URL('app.json', dataRoot)),
  readJson(new URL('courses.json', dataRoot)),
  readJson(new URL('../public/build-info.json', import.meta.url))
]);
validateSchema('app', app, 'data/app.json');
validateSchema('courses', catalog, 'data/courses.json');
validateSchema('build-info', buildInfo, 'build-info.json');
assert(new Set(catalog.courses.map((course) => course.id)).size === catalog.courses.length, 'Course IDs must be unique.');
assert(catalog.courses.some((course) => course.id === catalog.defaultCourseId && course.status === 'available'), 'The default course must exist and be available.');

let totalUnits = 0;
let totalTopics = 0;
let totalQuestions = 0;
const availableCourses = catalog.courses.filter((course) => course.status === 'available');
for (const summary of availableCourses) {
  const manifestUrl = new URL(summary.manifest, dataRoot);
  const manifest = await readJson(manifestUrl);
  validateSchema('course', manifest, `${summary.id}/course.json`);
  assert(manifest.id === summary.id, `${summary.id} manifest ID must match its course catalog entry.`);
  assert(new Set(manifest.navigation.map((item) => item.id)).size === manifest.navigation.length, `${summary.id} navigation IDs must be unique.`);

  const [roadmap, toolsData, reference, practice] = await Promise.all(
    ['roadmap', 'tools', 'reference', 'practice'].map((dataset) => readJson(new URL(manifest.datasets[dataset], manifestUrl)))
  );
  validateSchema('roadmap', roadmap, `${summary.id}/roadmap.json`);
  validateSchema('tools', toolsData, `${summary.id}/tools.json`);
  validateSchema('reference', reference, `${summary.id}/reference.json`);
  validateSchema('practice', practice, `${summary.id}/practice.json`);

  const units = roadmap.units;
  const topics = units.flatMap((unit) => unit.topics ?? []);
  assert(units.length === manifest.quality.expectedUnitCount, `${summary.id} expected ${manifest.quality.expectedUnitCount} units, found ${units.length}.`);
  assert(topics.length === manifest.quality.expectedTopicCount, `${summary.id} expected ${manifest.quality.expectedTopicCount} topics, found ${topics.length}.`);
  assert(new Set(topics.map((topic) => topic.id)).size === topics.length, `${summary.id} topic IDs must be unique.`);
  for (const unit of units) {
    assert(unit.title && unit.course && unit.weight, `${summary.id} unit ${unit.id} is missing required metadata.`);
    assert(isHttpsUrl(unit.reference) && isHttpsUrl(unit.video), `${summary.id} unit ${unit.id} resources must use HTTPS.`);
  }

  for (const tool of toolsData.tools) assert(tool.name && isHttpsUrl(tool.url), `${summary.id} tools need a name and HTTPS URL.`);
  for (const group of reference.groups) {
    for (const [label, formula] of group.items) {
      try { katex.renderToString(formula, { strict: 'error', throwOnError: true }); }
      catch (error) { throw new Error(`Invalid TeX for ${summary.id} / ${group.title} / ${label}: ${error.message}`); }
    }
  }

  const { sources, questions } = practice;
  assert(new Set(sources.map((source) => source.id)).size === sources.length, `${summary.id} practice sources must be unique.`);
  assert(new Set(questions.map((question) => question.id)).size === questions.length, `${summary.id} practice question IDs must be unique.`);
  const sourceIndex = new Map(sources.map((source) => [source.id, source]));
  const topicIds = new Set(topics.map((topic) => topic.id));
  for (const question of questions) {
    assert(topicIds.has(question.topicId), `${summary.id} question ${question.id} needs a valid topic mapping.`);
    const source = sourceIndex.get(question.sourceId);
    assert(source, `${summary.id} question ${question.id} references a missing source.`);
    assert(!/adapted|variant|fixed parameters/i.test(`${question.id} ${source.attribution}`), `${question.id} appears adapted or generated; Full Dive AP accepts only source-faithful transcriptions or links.`);
    if (question.type === 'embedded') {
      assert(source.license.usage === 'embedded' && source.license.code.startsWith('CC-'), `${question.id} needs an embeddable Creative Commons license.`);
      assert(question.locator.transcription === 'format-only', `${question.id} must be marked as a format-only transcription.`);
      const markup = `${question.promptHtml ?? ''}\n${question.answerHtml ?? ''}`;
      assert(!/<\/?m:/i.test(markup), `${question.id} contains unresolved namespaced source markup.`);
      assert(!/<\/?(?:script|iframe|object|embed|style|link|meta)\b/i.test(markup), `${question.id} contains executable or document-level markup.`);
      assert(!/\son[a-z]+\s*=|javascript\s*:/i.test(markup), `${question.id} contains an executable HTML attribute or URL.`);
      for (const match of markup.matchAll(/<img\s+[^>]*src="([^"]+)"/gi)) {
        assert(!match[1].includes('..') && !match[1].startsWith('/'), `${question.id} contains an unsafe local media path.`);
        try { await access(new URL(`../public/${match[1]}`, import.meta.url)); }
        catch { throw new Error(`${question.id} references missing local media ${match[1]}.`); }
      }
    } else {
      assert(source.license.usage === 'link-only' && question.locator.transcription === 'link-only', `${question.id} must identify link-only usage.`);
    }
  }
  assert(practice.catalogStats?.questionCount === questions.length, `${summary.id} practice stats must match the question count.`);
  assert(practice.catalogStats?.sourceCount === sources.length, `${summary.id} practice stats must match the source count.`);
  const embedded = questions.filter((question) => question.type === 'embedded');
  assert(practice.catalogStats?.deliveryCounts?.embedded === embedded.length, `${summary.id} embedded stats must match the catalog.`);
  assert(embedded.every((question) => !`${question.promptHtml}${question.answerHtml}`.includes('referenced source item')), `${summary.id} embedded questions must resolve source references.`);
  for (const topic of topics) {
    const count = embedded.filter((question) => question.topicId === topic.id).length;
    assert(count >= manifest.quality.minimumEmbeddedQuestionsPerTopic, `${summary.id} topic ${topic.id} needs at least ${manifest.quality.minimumEmbeddedQuestionsPerTopic} embedded publisher-authored questions.`);
  }
  totalUnits += units.length;
  totalTopics += topics.length;
  totalQuestions += questions.length;
}

console.log(`Validated ${availableCourses.length} available course package(s), ${totalUnits} units, ${totalTopics} topics, and ${totalQuestions} sourced practice questions against 8 JSON Schemas.`);
