import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const COMMIT = '789b54099106b071d1d32bfcee454fed72eb4768';
const REPOSITORY = 'https://github.com/openstax/osbooks-college-algebra-bundle';
const RAW = `https://raw.githubusercontent.com/openstax/osbooks-college-algebra-bundle/${COMMIT}`;
const OUTPUT = new URL('../public/data/courses/ap-precalculus/practice.json', import.meta.url);
const ROADMAP = new URL('../public/data/courses/ap-precalculus/roadmap.json', import.meta.url);

// Editorial topic mapping only. Selected publisher problems and answers are
// serialized verbatim from the pinned OpenStax CNXML; no constants, wording,
// mathematical expressions, or answers are authored or repaired here.
const TOPIC_MODULES = {
  '1.1': ['m49301', 'm49306'],
  '1.2': ['m49306'],
  '1.3': ['m49324', 'm50389', 'm49337'],
  '1.4': ['m49346', 'm49347', 'm49306'],
  '1.5': ['m49335', 'm49349'],
  '1.6': ['m49346', 'm49347'],
  '1.7': ['m49351'],
  '1.8': ['m49351', 'm49349'],
  '1.9': ['m49351'],
  '1.10': ['m49351'],
  '1.11': ['m49348', 'm49349', 'm49351'],
  '1.12': ['m49312'],
  '1.13': ['m49327', 'm49326'],
  '1.14': ['m49326', 'm49327', 'm49337', 'm49353']
};

// Curated where a broad textbook section covers several distinct AP topics.
// IDs point to exact publisher exercises; they are not rewritten downstream.
const SELECTED_EXERCISES = {
  '1.3': [
    ['m49306', 'fs-id1165135403475'],
    ['m49306', 'fs-id1165134486779'],
    ['m49306', 'fs-id1165137579498'],
    ['m49306', 'fs-id1165137432064'],
    ['m49306', 'fs-id1165137851207']
  ],
  '1.4': [
    ['m49306', 'fs-id1165134104075'],
    ['m49306', 'fs-id1165135453186'],
    ['m49306', 'fs-id1165134043700'],
    ['m49306', 'fs-id1165135602253'],
    ['m49306', 'fs-id1165135457758']
  ],
  '1.5': [
    ['m49349', 'fs-id1165135658206'],
    ['m49349', 'fs-id1165137737023'],
    ['m49349', 'ti_03_06_05'],
    ['m49349', 'fs-id1165132940010'],
    ['m49349', 'fs-id1165134380350']
  ],
  '1.7': [
    ['m49351', 'ti_03_07_01'],
    ['m49351', 'fs-id1165137812572'],
    ['m49351', 'fs-id1165137836670'],
    ['m49351', 'fs-id1165135245555'],
    ['m49351', 'fs-id1165133341024']
  ],
  '1.8': [
    ['m49351', 'fs-id1165137570250'],
    ['m49351', 'fs-id1165137734642'],
    ['m49349', 'ti_03_06_02'],
    ['m49349', 'fs-id1165134273636'],
    ['m49349', 'fs-id1165135319520']
  ],
  '1.9': [
    ['m49351', 'fs-id1165135457027'],
    ['m49351', 'fs-id1165137872015'],
    ['m49351', 'fs-id1165137735221'],
    ['m49351', 'fs-id1165134042695'],
    ['m49351', 'fs-id1165137462048']
  ],
  '1.10': [
    ['m49351', 'fs-id1165135704902'],
    ['m49351', 'ti_03_07_05'],
    ['m49351', 'fs-id1165134174944'],
    ['m49351', 'fs-id1165135193108'],
    ['m49351', 'fs-id1165137812268']
  ]
};

const MODULES = {
  m49301: { title: '1.1 Functions and Function Notation', page: '1-1-functions-and-function-notation' },
  m49306: { title: '1.3 Rates of Change and Behavior of Graphs', page: '1-3-rates-of-change-and-behavior-of-graphs' },
  m49312: { title: '1.5 Transformation of Functions', page: '1-5-transformation-of-functions' },
  m49324: { title: '2.1 Linear Functions', page: '2-1-linear-functions' },
  m50389: { title: '2.2 Graphs of Linear Functions', page: '2-2-graphs-of-linear-functions' },
  m49326: { title: '2.3 Modeling with Linear Functions', page: '2-3-modeling-with-linear-functions' },
  m49327: { title: '2.4 Fitting Linear Models to Data', page: '2-4-fitting-linear-models-to-data' },
  m49335: { title: '3.1 Complex Numbers', page: '3-1-complex-numbers' },
  m49337: { title: '3.2 Quadratic Functions', page: '3-2-quadratic-functions' },
  m49346: { title: '3.3 Power Functions and Polynomial Functions', page: '3-3-power-functions-and-polynomial-functions' },
  m49347: { title: '3.4 Graphs of Polynomial Functions', page: '3-4-graphs-of-polynomial-functions' },
  m49348: { title: '3.5 Dividing Polynomials', page: '3-5-dividing-polynomials' },
  m49349: { title: '3.6 Zeros of Polynomial Functions', page: '3-6-zeros-of-polynomial-functions' },
  m49351: { title: '3.7 Rational Functions', page: '3-7-rational-functions' },
  m49353: { title: '3.8 Modeling Using Variation', page: '3-8-modeling-using-variation' }
};

const escapeHtml = (value = '') => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const localName = (node) => node?.localName?.replace(/^m:/, '') ?? '';
const directChild = (node, name) => [...node.children].find((child) => localName(child) === name);
const compactText = (node) => node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

function serializer() {
  const serialize = (node) => {
    if (node.nodeType === 3) return escapeHtml(node.nodeValue ?? '');
    if (node.nodeType !== 1) return '';
    const name = localName(node);
    const children = () => [...node.childNodes].map(serialize).join('');
    if (name === 'math') return `<math xmlns="http://www.w3.org/1998/Math/MathML">${children()}</math>`;
    if (node.namespaceURI?.includes('MathML')) {
      const attrs = [...node.attributes]
        .filter((attribute) => !attribute.name.startsWith('xmlns'))
        .map((attribute) => ` ${attribute.localName}="${escapeHtml(attribute.value)}"`)
        .join('');
      return `<${name}${attrs}>${children()}</${name}>`;
    }
    if (name === 'para') return `<p>${children()}</p>`;
    if (name === 'emphasis') {
      const tag = node.getAttribute('effect') === 'bold' ? 'strong' : 'em';
      return `<${tag}>${children()}</${tag}>`;
    }
    if (name === 'list') {
      const tag = node.getAttribute('list-type') === 'enumerated' ? 'ol' : 'ul';
      return `<${tag}>${children()}</${tag}>`;
    }
    if (name === 'item') return `<li>${children()}</li>`;
    if (name === 'equation') return `<div class="source-equation">${children()}</div>`;
    if (name === 'newline') return '<br>';
    if (name === 'sub' || name === 'sup') return `<${name}>${children()}</${name}>`;
    if (name === 'quote') return `<q>${children()}</q>`;
    if (name === 'code') return `<code>${children()}</code>`;
    if (name === 'link') return children();
    return children();
  };
  return serialize;
}

function groupInstruction(exercise) {
  if (!exercise.parentElement?.getAttribute('class')?.includes('section-exercises')) return null;
  let sibling = exercise.previousElementSibling;
  while (sibling) {
    if (localName(sibling) === 'para' && /(?:for|in) the following/i.test(compactText(sibling))) return sibling;
    if (localName(sibling) === 'section') break;
    sibling = sibling.previousElementSibling;
  }
  return null;
}

function isSelfContained(exercise) {
  const problem = directChild(exercise, 'problem');
  const solution = directChild(exercise, 'solution');
  if (!problem || !solution) return false;
  if (problem.querySelector('figure, image, table, link[target-id]') || solution.querySelector('figure, image, table, link[target-id]')) return false;
  const instruction = groupInstruction(exercise);
  const text = `${compactText(instruction)} ${compactText(problem)}`;
  if (text.length < 12 || compactText(solution).length < 1) return false;
  return !/preceding (?:exercise|problem)|same (?:exercise|problem)|shown (?:below|above)|use (?:the )?(?:graph|table|figure)|provided in figure|according to the graph/i.test(text);
}

async function main() {
  const roadmap = JSON.parse(await readFile(ROADMAP, 'utf8'));
  const topicIndex = new Map(roadmap.units.flatMap((unit) => unit.topics.map((topic) => [topic.id, { ...topic, unit }])));
  const documents = new Map();
  for (const moduleId of Object.keys(MODULES)) {
    const response = await fetch(`${RAW}/modules/${moduleId}/index.cnxml`);
    if (!response.ok) throw new Error(`Could not fetch OpenStax module ${moduleId}: ${response.status}`);
    const xml = await response.text();
    documents.set(moduleId, { xml, document: new JSDOM(xml, { contentType: 'text/xml' }).window.document });
  }

  const used = new Set();
  const serialize = serializer();
  const questions = [];
  for (const [topicId, moduleIds] of Object.entries(TOPIC_MODULES)) {
    const candidates = moduleIds.flatMap((moduleId) => {
      const entry = documents.get(moduleId);
      return [...entry.document.querySelectorAll('exercise[id]')]
        .filter(isSelfContained)
        .map((exercise) => ({ moduleId, exercise, ...entry }));
    });
    const selected = SELECTED_EXERCISES[topicId]
      ? SELECTED_EXERCISES[topicId].map(([moduleId, exerciseId]) => {
          const entry = documents.get(moduleId);
          const exercise = entry.document.getElementById(exerciseId);
          if (!exercise || !isSelfContained(exercise)) throw new Error(`${topicId} references an unavailable or non-self-contained exercise ${exerciseId}.`);
          return { moduleId, exercise, ...entry };
        })
      : candidates.filter(({ exercise }) => !used.has(exercise.id)).slice(0, 5);
    if (selected.length !== 5) throw new Error(`${topicId} has only ${selected.length} safe unique OpenStax exercises.`);
    for (const { exercise } of selected) {
      if (used.has(exercise.id)) throw new Error(`${exercise.id} is mapped to more than one AP topic.`);
    }
    const topic = topicIndex.get(topicId);
    for (const [position, record] of selected.entries()) {
      const { moduleId, exercise, xml } = record;
      used.add(exercise.id);
      const problem = directChild(exercise, 'problem');
      const solution = directChild(exercise, 'solution');
      const instruction = groupInstruction(exercise);
      const problemClone = problem.cloneNode(true);
      directChild(problemClone, 'title')?.remove();
      const promptHtml = `${instruction ? serialize(instruction) : ''}${serialize(problemClone)}`;
      const answerHtml = serialize(solution);
      const exerciseToken = `<exercise id="${exercise.id}"`;
      const problemLine = xml.slice(0, xml.indexOf(exerciseToken)).split('\n').length;
      const solutionToken = solution.id ? `<solution id="${solution.id}"` : '<solution';
      const solutionOffset = xml.indexOf(solutionToken, xml.indexOf(exerciseToken));
      const solutionLine = xml.slice(0, solutionOffset).split('\n').length;
      const blob = `${REPOSITORY}/blob/${COMMIT}/modules/${moduleId}/index.cnxml`;
      questions.push({
        id: `openstax-precalculus-${exercise.id}`,
        type: 'embedded',
        topicId,
        topic: topic.title,
        unit: `Unit ${topic.unit.id} · ${topic.unit.title}`,
        title: `OpenStax exercise ${exercise.id}`,
        promptHtml,
        answerHtml,
        videoUrl: topic.unit.video,
        referenceUrl: `https://openstax.org/books/precalculus-2e/pages/${MODULES[moduleId].page}`,
        metadata: {
          sourceQuestionId: exercise.id,
          collection: MODULES[moduleId].title,
          course: 'AP Precalculus · Unit 1',
          format: 'textbook exercise',
          difficulty: position < 2 ? 'easy' : position < 4 ? 'medium' : 'hard',
          estimatedMinutes: position < 2 ? 5 : position < 4 ? 8 : 12,
          calculator: 'varies',
          answerKind: 'publisher solution',
          tags: [topic.title, 'Textbook', 'Embedded', 'Publisher solution']
        },
        sourceId: 'openstax-precalculus-2e',
        locator: {
          exerciseId: exercise.id,
          promptUrl: `${blob}#L${problemLine}`,
          answerUrl: `${blob}#L${solutionLine}`,
          transcription: 'format-only',
          verifiedAt: '2026-08-25'
        }
      });
    }
  }

  const difficultyCounts = Object.fromEntries(['easy', 'medium', 'hard', 'ridiculous'].map((level) => [level, questions.filter((question) => question.metadata.difficulty === level).length]));
  const source = {
    id: 'openstax-precalculus-2e',
    title: 'OpenStax Precalculus 2e',
    author: 'OpenStax',
    url: 'https://openstax.org/details/books/precalculus-2e',
    attribution: 'Transcribed from OpenStax Precalculus 2e; every item records its exact pinned exercise and publisher-supplied solution.',
    license: {
      code: 'CC-BY-NC-SA-4.0',
      name: 'CC BY-NC-SA 4.0',
      url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
      usage: 'embedded'
    }
  };
  const revisionPayload = JSON.stringify({ source, questions });
  const output = {
    $schema: '../../../schemas/practice.schema.json',
    schemaVersion: 5,
    revision: createHash('sha256').update(revisionPayload).digest('hex').slice(0, 16),
    generatedAt: new Date().toISOString(),
    licenseNotice: 'Unit 1 includes source-faithful, format-only transcriptions from openly licensed OpenStax Precalculus 2e. Every prompt and publisher-supplied answer links to exact lines in a pinned source revision.',
    catalogStats: {
      questionCount: questions.length,
      sourceCount: 1,
      sources: ['OpenStax'],
      difficultyCounts,
      deliveryCounts: { embedded: questions.length, external: 0 },
      unit1EmbeddedCounts: Object.fromEntries(Object.keys(TOPIC_MODULES).map((topicId) => [topicId, questions.filter((question) => question.topicId === topicId).length]))
    },
    sources: [source],
    questions
  };
  await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${questions.length} exact OpenStax questions across ${Object.keys(TOPIC_MODULES).length} AP Precalculus Unit 1 topics.`);
}

await main();
