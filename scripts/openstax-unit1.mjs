import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const COMMIT = '8dbc2ce19e804924b2517b89ac72ee45be949d15';
const REPOSITORY = 'https://github.com/openstax/osbooks-calculus-bundle';
const RAW = `https://raw.githubusercontent.com/openstax/osbooks-calculus-bundle/${COMMIT}`;
const MODULES = {
  m53485: { title: '2.1 A Preview of Calculus', page: '2-1-a-preview-of-calculus' },
  m53491: { title: '2.2 The Limit of a Function', page: '2-2-the-limit-of-a-function' },
  m53492: { title: '2.3 The Limit Laws', page: '2-3-the-limit-laws' },
  m53489: { title: '2.4 Continuity', page: '2-4-continuity' },
  m53596: { title: '4.6 Limits at Infinity and Asymptotes', page: '4-6-limits-at-infinity-and-asymptotes' }
};

// This is an editorial topic map only. The importer never changes the selected
// publisher problem or solution; it serializes the pinned CNXML mechanically.
export const TOPIC_EXERCISES = {
  '1.1': [['m53485','fs-id1170573426580'],['m53485','fs-id1170573371452'],['m53485','fs-id1170573570896'],['m53485','fs-id1170573409999'],['m53485','fs-id1170570997908']],
  '1.2': [['m53491','fs-id1170572286630'],['m53491','fs-id1170572224892'],['m53491','fs-id1170571656078'],['m53491','fs-id1170571614882'],['m53491','fs-id1170571612128']],
  '1.3': [['m53491','fs-id1170572337209'],['m53491','fs-id1170571656653'],['m53491','fs-id1170572642386'],['m53491','fs-id1170572624470'],['m53491','fs-id1170572128792']],
  '1.4': [['m53491','fs-id1170572403273'],['m53491','fs-id1170572232003'],['m53491','fs-id1170571599593'],['m53491','fs-id1170572174644'],['m53491','fs-id1170572480427']],
  '1.5': [['m53492','fs-id1170572151257'],['m53492','fs-id1170572472249'],['m53492','fs-id1170572551359'],['m53492','fs-id1170571655298'],['m53492','fs-id1170572305832']],
  '1.6': [['m53492','fs-id1170571669715'],['m53492','fs-id1170571598002'],['m53492','fs-id1170572307615'],['m53492','fs-id1170571611952'],['m53492','fs-id1170571612023']],
  '1.7': [['m53492','fs-id1170572394356'],['m53492','fs-id1170571648141'],['m53492','fs-id1170571681425'],['m53492','fs-id1170571679270'],['m53492','fs-id1170571558884']],
  '1.8': [['m53492','fs-id1170571654230'],['m53492','fs-id1170572633051'],['m53492','fs-id1170572243716'],['m53492','fs-id1170571610220'],['m53492','fs-id1170572511389']],
  '1.9': [['m53491','fs-id1170572624546'],['m53491','fs-id1170572219513'],['m53491','fs-id1170572590126'],['m53492','fs-id1170571610978'],['m53492','fs-id1170572480473']],
  '1.10': [['m53489','fs-id1170573248707'],['m53489','fs-id1170573507547'],['m53489','fs-id1170573750481'],['m53489','fs-id1170570998828'],['m53489','fs-id1170571246283']],
  '1.11': [['m53489','fs-id1170573368010'],['m53489','fs-id1170571098221'],['m53489','fs-id1170571048204'],['m53489','fs-id1170573288457'],['m53489','fs-id1170573326117']],
  '1.12': [['m53489','fs-id1170573395562'],['m53489','fs-id1170573387894'],['m53489','fs-id1170573361460'],['m53489','fs-id1170570998131'],['m53489','fs-id1170573732420']],
  '1.13': [['m53489','fs-id1170573750411'],['m53489','fs-id1170573580625'],['m53489','fs-id1170573413991'],['m53489','fs-id1170573575226'],['m53489','fs-id1170573449551']],
  '1.14': [['m53491','fs-id1170571611153'],['m53491','fs-id1170571596334'],['m53491','fs-id1170571656617'],['m53491','fs-id1170571652136'],['m53596','fs-id1165043197447']],
  '1.15': [['m53596','fs-id1165042947732'],['m53596','fs-id1165042320884'],['m53596','fs-id1165043219128'],['m53596','fs-id1165042638555'],['m53596','fs-id1165042660292']],
  '1.16': [['m53489','fs-id1170571120883'],['m53489','fs-id1170573439388'],['m53489','fs-id1170573586870'],['m53489','fs-id1170571100303'],['m53489','fs-id1170570982565']]
};

const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const localName = (node) => node.localName?.replace(/^m:/, '') ?? '';

export async function mineOpenStaxUnit1(topicIndex) {
  const documents = new Map();
  for (const moduleId of Object.keys(MODULES)) {
    const localPath = `/private/tmp/openstax-calculus-source/modules/${moduleId}/index.cnxml`;
    let xml;
    try { xml = await readFile(localPath, 'utf8'); }
    catch { const response = await fetch(`${RAW}/modules/${moduleId}/index.cnxml`); if (!response.ok) throw new Error(`Could not fetch OpenStax ${moduleId}`); xml = await response.text(); }
    documents.set(moduleId, { xml, document: new JSDOM(xml, { contentType: 'text/xml' }).window.document });
  }

  const mediaDir = new URL('../public/media/openstax/', import.meta.url);
  await mkdir(mediaDir, { recursive: true });
  const mediaFiles = new Set();
  const serialize = (node) => {
    if (node.nodeType === 3) return escapeHtml(node.nodeValue ?? '');
    if (node.nodeType !== 1) return '';
    const name = localName(node);
    const children = () => [...node.childNodes].map(serialize).join('');
    if (name === 'math') return `<math xmlns="http://www.w3.org/1998/Math/MathML">${children()}</math>`;
    if (node.namespaceURI?.includes('MathML')) {
      const attrs = [...node.attributes].filter((attr) => !attr.name.startsWith('xmlns')).map((attr) => ` ${attr.localName}="${escapeHtml(attr.value)}"`).join('');
      return `<${name}${attrs}>${children()}</${name}>`;
    }
    if (name === 'para') return `<p>${children()}</p>`;
    if (name === 'emphasis') return `<${node.getAttribute('effect') === 'bold' ? 'strong' : 'em'}>${children()}</${node.getAttribute('effect') === 'bold' ? 'strong' : 'em'}>`;
    if (name === 'list') return `<${node.getAttribute('list-type') === 'enumerated' ? 'ol' : 'ul'}>${children()}</${node.getAttribute('list-type') === 'enumerated' ? 'ol' : 'ul'}>`;
    if (name === 'item') return `<li>${children()}</li>`;
    if (name === 'equation') return `<div class="source-equation">${children()}</div>`;
    if (name === 'newline') return '<br>';
    if (name === 'title') return localName(node.parentElement) === 'table' ? `<caption>${children()}</caption>` : `<h4>${children()}</h4>`;
    if (name === 'table') return `<div class="source-table-wrap"><table>${children()}</table></div>`;
    if (name === 'tgroup') return children();
    if (name === 'row') return `<tr>${children()}</tr>`;
    if (name === 'thead' || name === 'tbody') return `<${name}>${children()}</${name}>`;
    if (name === 'entry') return `<td>${children()}</td>`;
    if (name === 'sub' || name === 'sup') return `<${name}>${children()}</${name}>`;
    if (name === 'figure') return `<figure>${children()}</figure>`;
    if (name === 'media') return children();
    if (name === 'caption') return `<figcaption>${children()}</figcaption>`;
    if (name === 'image') { const filename = (node.getAttribute('src') ?? '').split('/').pop(); if (!filename) return ''; mediaFiles.add(filename); return `<img src="media/openstax/${escapeHtml(filename)}" alt="${escapeHtml(node.parentElement?.getAttribute('alt') ?? '')}">`; }
    if (name === 'link') {
      const content = children();
      if (content.trim()) return content;
      const target = node.ownerDocument.getElementById(node.getAttribute('target-id'));
      const targetType = localName(target);
      const label = targetType === 'figure' ? 'source figure below' : targetType === 'table' ? 'source table below' : targetType === 'equation' ? 'source equation' : targetType === 'example' ? 'source example' : targetType === 'exercise' ? 'source exercise' : 'referenced source item';
      return `<span class="source-reference">${label}</span>`;
    }
    return children();
  };

  const records = [];
  for (const [topicId, selections] of Object.entries(TOPIC_EXERCISES)) {
    for (const [moduleId, exerciseId] of selections) {
      const { xml, document } = documents.get(moduleId);
      const exercise = document.getElementById(exerciseId);
      if (!exercise) throw new Error(`Missing OpenStax exercise ${exerciseId}`);
      const problem = [...exercise.children].find((child) => localName(child) === 'problem');
      const solution = [...exercise.children].find((child) => localName(child) === 'solution');
      if (!problem || !solution) throw new Error(`${exerciseId} lacks a publisher problem or solution`);
      const problemClone = problem.cloneNode(true);
      const suppliedTitle = [...problemClone.children].find((child) => localName(child) === 'title');
      const position = selections.findIndex((selection) => selection[1] === exerciseId) + 1;
      const parentClass = exercise.parentElement?.getAttribute('class') ?? '';
      const sourceKind = parentClass.includes('checkpoint') ? 'Check Your Understanding' : parentClass.includes('section-exercises') ? 'Section Exercise' : 'Practice Example';
      const title = suppliedTitle?.textContent?.trim() || `${topicId} · ${sourceKind} ${position}`;
      suppliedTitle?.remove();
      let instruction = '';
      if (exercise.parentElement?.getAttribute('class')?.includes('section-exercises')) {
        let sibling = exercise.previousElementSibling;
        while (sibling && localName(sibling) !== 'para') sibling = sibling.previousElementSibling;
        if (sibling) instruction = serialize(sibling);
      }
      const referenced = [...problem.querySelectorAll('link[target-id]')].map((link) => document.getElementById(link.getAttribute('target-id'))).filter((node) => ['figure','table'].includes(localName(node)));
      const promptHtml = `${instruction}${serialize(problemClone)}${referenced.map(serialize).join('')}`;
      const answerHtml = serialize(solution);
      const problemLine = xml.slice(0, xml.indexOf(`<exercise id="${exerciseId}"`)).split('\n').length;
      const solutionId = solution.id;
      const solutionLine = xml.slice(0, xml.indexOf(`<solution id="${solutionId}"`)).split('\n').length;
      const blob = `${REPOSITORY}/blob/${COMMIT}/modules/${moduleId}/index.cnxml`;
      records.push({
        id: `openstax-${exerciseId}`,
        type: 'embedded', topicId, title,
        promptHtml, answerHtml,
        metadata: { sourceQuestionId: exerciseId, collection: MODULES[moduleId].title, course: 'AB + BC', format: 'textbook exercise', difficulty: position <= 2 ? 'easy' : position <= 4 ? 'medium' : 'hard', estimatedMinutes: 10, calculator: 'varies', answerKind: 'publisher solution', tags: [topicIndex.get(topicId).title, 'Textbook', 'Embedded'] },
        source: { title: `OpenStax Calculus Volume 1 · ${MODULES[moduleId].title}`, author: 'OpenStax', url: `https://openstax.org/books/calculus-volume-1/pages/${MODULES[moduleId].page}`, attribution: `Transcribed from OpenStax Calculus Volume 1, exact exercise ${exerciseId}.`, exerciseId, promptUrl: `${blob}#L${problemLine}`, answerUrl: `${blob}#L${solutionLine}`, transcription: 'format-only', verifiedAt: '2026-08-23', license: { code: 'CC-BY-NC-SA-4.0', name: 'CC BY-NC-SA 4.0', url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/', usage: 'embedded' } }
      });
    }
  }

  for (const filename of mediaFiles) {
    const response = await fetch(`${RAW}/media/${filename}`);
    if (!response.ok) throw new Error(`Could not fetch OpenStax media ${filename}`);
    await writeFile(new URL(filename, mediaDir), new Uint8Array(await response.arrayBuffer()));
  }
  return records;
}
