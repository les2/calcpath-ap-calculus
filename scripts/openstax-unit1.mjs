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
  m53596: { title: '4.6 Limits at Infinity and Asymptotes', page: '4-6-limits-at-infinity-and-asymptotes' },
  m53495: { title: '3.1 Defining the Derivative', page: '3-1-defining-the-derivative' },
  m53573: { title: '3.2 The Derivative as a Function', page: '3-2-the-derivative-as-a-function' },
  m53575: { title: '3.3 Differentiation Rules', page: '3-3-differentiation-rules' },
  m53578: { title: '3.5 Derivatives of Trigonometric Functions', page: '3-5-derivatives-of-trigonometric-functions' },
  m53581: { title: '3.6 The Chain Rule', page: '3-6-the-chain-rule' },
  m53584: { title: '3.7 Derivatives of Inverse Functions', page: '3-7-derivatives-of-inverse-functions' },
  m53585: { title: '3.8 Implicit Differentiation', page: '3-8-implicit-differentiation' },
  m53586: { title: '3.9 Derivatives of Exponential and Logarithmic Functions', page: '3-9-derivatives-of-exponential-and-logarithmic-functions' },
  m53576: { title: '3.4 Derivatives as Rates of Change', page: '3-4-derivatives-as-rates-of-change' },
  m53604: { title: '4.1 Related Rates', page: '4-1-related-rates' },
  m53605: { title: '4.2 Linear Approximations and Differentials', page: '4-2-linear-approximations-and-differentials' },
  m53611: { title: '4.3 Maxima and Minima', page: '4-3-maxima-and-minima' },
  m53612: { title: '4.4 The Mean Value Theorem', page: '4-4-the-mean-value-theorem' },
  m53613: { title: '4.5 Derivatives and the Shape of a Graph', page: '4-5-derivatives-and-the-shape-of-a-graph' },
  m53614: { title: '4.7 Applied Optimization Problems', page: '4-7-applied-optimization-problems' },
  m53619: { title: '4.8 L’Hôpital’s Rule', page: '4-8-lhopitals-rule' }
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
  '1.16': [['m53489','fs-id1170571120883'],['m53489','fs-id1170573439388'],['m53489','fs-id1170573586870'],['m53489','fs-id1170571100303'],['m53489','fs-id1170570982565']],
  '2.1': [['m53495','fs-id1169736611315'],['m53495','fs-id1169736589136'],['m53495','fs-id1169739348491'],['m53495','fs-id1169739179206'],['m53495','fs-id1169739187345']],
  '2.2': [['m53495','fs-id1169739033980'],['m53495','fs-id1169738893708'],['m53495','fs-id1169739129042'],['m53495','fs-id1169739236874'],['m53573','fs-id1169737836812']],
  '2.3': [['m53495','fs-id1169739198958'],['m53495','fs-id1169739187794'],['m53495','fs-id1169739269671'],['m53495','fs-id1169739190079'],['m53573','fs-id1169738039259']],
  '2.4': [['m53573','fs-id1169738218188'],['m53573','fs-id1169738185319'],['m53573','fs-id1169738071477'],['m53573','fs-id1169737954177'],['m53495','fs-id1169739347174']],
  '2.5': [['m53575','fs-id1169738954753'],['m53575','fs-id1169736611688'],['m53575','fs-id1169736616196'],['m53575','fs-id1169739199743'],['m53575','fs-id1169736614310']],
  '2.6': [['m53575','fs-id1169738888884'],['m53575','fs-id1169738923828'],['m53575','fs-id1169739269766'],['m53575','fs-id1169739300389'],['m53575','fs-id1169739299465']],
  '2.7': [['m53578','fs-id1169739303829'],['m53578','fs-id1169739298012'],['m53578','fs-id1169738907624'],['m53586','fs-id1169738235136'],['m53586','fs-id1169737904496']],
  '2.8': [['m53575','fs-id1169736659560'],['m53575','fs-id1169739273814'],['m53575','fs-id1169736654824'],['m53575','fs-id1169739273725'],['m53575','fs-id1169739275301']],
  '2.9': [['m53575','fs-id1169739305227'],['m53575','fs-id1169739304919'],['m53575','fs-id1169739303722'],['m53575','fs-id1169739303900'],['m53575','fs-id1169739341415']],
  '2.10': [['m53578','fs-id1169736589201'],['m53578','fs-id1169739273066'],['m53578','fs-id1169736597649'],['m53578','fs-id1169739303429'],['m53578','fs-id1169736655848']],
  '3.1': [['m53581','fs-id1169739274625'],['m53581','fs-id1169736662942'],['m53581','fs-id1169739301539'],['m53581','fs-id1169739333923'],['m53581','fs-id1169739190029']],
  '3.2': [['m53585','fs-id1169738015312'],['m53585','fs-id1169738149878'],['m53585','fs-id1169738220221'],['m53585','fs-id1169737142258'],['m53585','fs-id1169738186788']],
  '3.3': [['m53584','fs-id1169739299944'],['m53584','fs-id1169736612521'],['m53584','fs-id1169738937013'],['m53584','fs-id1169739270336'],['m53584','fs-id1169739062472']],
  '3.4': [['m53584','fs-id1169736609244'],['m53584','fs-id1169739303914'],['m53584','fs-id1169739282717'],['m53584','fs-id1169738894988'],['m53584','fs-id1169736656490']],
  '3.5': [['m53581','fs-id1169739298049'],['m53581','fs-id1169736658582'],['m53581','fs-id1169739264202'],['m53586','fs-id1169737140881'],['m53586','fs-id1169738238115']],
  '3.6': [['m53573','fs-id1169738217348'],['m53573','fs-id1169738099445'],['m53578','fs-id1169739301937'],['m53578','fs-id1169739298088'],['m53578','fs-id1169739376127']],
  '4.1': [['m53573','fs-id1169738184829'],['m53573','fs-id1169738221107'],['m53573','fs-id1169738221202'],['m53573','fs-id1169738073277'],['m53573','fs-id1169737141464']],
  '4.2': [['m53576','fs-id1169739223216'],['m53576','fs-id1169739038358'],['m53576','fs-id1169738994257'],['m53576','fs-id1169738843352'],['m53576','fs-id1169739301136']],
  '4.3': [['m53576','fs-id1169739270777'],['m53576','fs-id1169739202494'],['m53576','fs-id1169739274268'],['m53576','fs-id1169739054965'],['m53576','fs-id1169736662792']],
  '4.4': [['m53604','fs-id1165042978641'],['m53604','fs-id1165043098631'],['m53604','fs-id1165043123744'],['m53604','fs-id1165043116333'],['m53604','fs-id1165043114873']],
  '4.5': [['m53604','fs-id1165043105134'],['m53604','fs-id1165043116554'],['m53604','fs-id1165043112991'],['m53604','fs-id1165043109828'],['m53604','fs-id1165043109911']],
  '4.6': [['m53605','fs-id1165043094190'],['m53605','fs-id1165043051505'],['m53605','fs-id1165042979291'],['m53605','fs-id1165043039141'],['m53605','fs-id1165042354636']],
  '4.7': [['m53619','fs-id1165043104016'],['m53619','fs-id1165043427625'],['m53619','fs-id1165043219076'],['m53619','fs-id1165042368497'],['m53619','fs-id1165043323877']],
  '5.1': [['m53612','fs-id1165042367594'],['m53612','fs-id1165042478873'],['m53612','fs-id1165042332064'],['m53612','fs-id1165042707212'],['m53612','fs-id1165042710334']],
  '5.2': [['m53611','fs-id1165041979121'],['m53611','fs-id1165040757544'],['m53611','fs-id1165042199447'],['m53611','fs-id1165042278260'],['m53611','fs-id1165042065906']],
  '5.3': [['m53613','fs-id1165042970465'],['m53613','fs-id1165043395896'],['m53613','fs-id1165043183805'],['m53613','fs-id1165042373655'],['m53613','fs-id1165042331804']],
  '5.4': [['m53613','fs-id1165042973802'],['m53613','fs-id1165043317506'],['m53613','fs-id1165042640287'],['m53613','fs-id1165043428512'],['m53613','fs-id1165042709552']],
  '5.5': [['m53611','fs-id1165042035519'],['m53611','fs-id1165042108871'],['m53611','fs-id1165041865041'],['m53611','fs-id1165042051306'],['m53611','fs-id1165042062070']],
  '5.6': [['m53613','fs-id1165042558995'],['m53613','fs-id1165043321427'],['m53613','fs-id1165043395336'],['m53613','fs-id1165043431030'],['m53613','fs-id1165042364601']],
  '5.7': [['m53613','fs-id1165042710829'],['m53613','fs-id1165042373296'],['m53613','fs-id1165042705948'],['m53613','fs-id1165042474277'],['m53613','fs-id1165043286677']],
  '5.8': [['m53573','fs-id1169737966985'],['m53573','fs-id1169738223960'],['m53573','fs-id1169738189260'],['m53573','fs-id1169737927662'],['m53573','fs-id1169738187055']],
  '5.9': [['m53613','fs-id1165043430810'],['m53613','fs-id1165043430751'],['m53613','fs-id1165043248713'],['m53613','fs-id1165042708313'],['m53613','fs-id1165043390836']],
  '5.10': [['m53614','fs-id1165043107418'],['m53614','fs-id1165042713670'],['m53614','fs-id1165042369580'],['m53614','fs-id1165042552153'],['m53614','fs-id1165043251103']],
  '5.11': [['m53614','fs-id1165043092414'],['m53614','fs-id1165042515877'],['m53614','fs-id1165043392360'],['m53614','fs-id1165043113003'],['m53614','fs-id1165042327675']],
  '5.12': [['m53585','fs-id1169737906658'],['m53585','fs-id1169737935219'],['m53585','fs-id1169738184892'],['m53585','fs-id1169738244350'],['m53585','fs-id1169738211822']]
};

const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const localName = (node) => node?.localName?.replace(/^m:/, '') ?? '';
const FORCE_GROUP_INSTRUCTIONS = new Set([
  'fs-id1169739275301',
  'fs-id1169739303722'
]);

export async function mineOpenStaxPractice(topicIndex) {
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
  const resolveLink = (node) => {
    const targetId = node.getAttribute('target-id');
    if (!targetId) return null;
    const targetModule = node.getAttribute('document');
    return targetModule
      ? documents.get(targetModule)?.document.getElementById(targetId) ?? null
      : node.ownerDocument.getElementById(targetId);
  };
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
      const target = resolveLink(node);
      const targetType = localName(target);
      const label = targetType === 'figure' ? 'source figure below' : targetType === 'table' ? 'source table below' : targetType === 'equation' ? 'source equation' : targetType === 'note' ? 'source result below' : targetType === 'example' ? 'source example' : targetType === 'exercise' ? 'source exercise' : 'referenced source item';
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
      let instructionNodes = [];
      if (exercise.parentElement?.getAttribute('class')?.includes('section-exercises')) {
        const problemText = problemClone.textContent.replace(/\s+/g, ' ').trim();
        const isStandalone = !FORCE_GROUP_INSTRUCTIONS.has(exerciseId) && /^(?:\[T\]\s*)?(?:A\b|An\b|The\b|Two\b|Find\b|Use\b|For\b|Let\b|Suppose\b|Consider\b|Determine\b|Evaluate\b|Sketch\b|Calculate\b)/i.test(problemText);
        if (!isStandalone) {
          let instructionStart = exercise.previousElementSibling;
          while (instructionStart && !(localName(instructionStart) === 'para' && /(?:for|in) the following/i.test(instructionStart.textContent))) instructionStart = instructionStart.previousElementSibling;
          if (instructionStart) {
            instructionNodes.push(instructionStart);
            let sibling = instructionStart.nextElementSibling;
            while (sibling && localName(sibling) !== 'exercise') { instructionNodes.push(sibling); sibling = sibling.nextElementSibling; }
          }
        }
      }
      const roots = [...instructionNodes, problem];
      const referenced = [...new Set(roots.flatMap((root) => [...root.querySelectorAll('link[target-id]')].map(resolveLink)))]
        .filter((node) => ['figure','table','equation','note'].includes(localName(node)) && !roots.some((root) => root.contains(node)));
      const promptHtml = `${instructionNodes.map(serialize).join('')}${serialize(problemClone)}${referenced.map(serialize).join('')}`;
      const answerReferenced = [...new Set([...solution.querySelectorAll('link[target-id]')].map(resolveLink))]
        .filter((node) => ['figure','table','equation','note'].includes(localName(node)) && !solution.contains(node));
      const answerHtml = `${serialize(solution)}${answerReferenced.map(serialize).join('')}`;
      const problemLine = xml.slice(0, xml.indexOf(`<exercise id="${exerciseId}"`)).split('\n').length;
      const solutionId = solution.id;
      const solutionLine = xml.slice(0, xml.indexOf(`<solution id="${solutionId}"`)).split('\n').length;
      const blob = `${REPOSITORY}/blob/${COMMIT}/modules/${moduleId}/index.cnxml`;
      records.push({
        id: `openstax-${exerciseId}`,
        type: 'embedded', topicId, title,
        promptHtml, answerHtml,
        metadata: { sourceQuestionId: exerciseId, collection: MODULES[moduleId].title, course: 'AB + BC', format: 'textbook exercise', difficulty: position <= 2 ? 'easy' : position <= 4 ? 'medium' : 'hard', estimatedMinutes: 10, calculator: 'varies', answerKind: 'publisher solution', tags: [topicIndex.get(topicId).title, 'Textbook', 'Embedded'] },
        source: { title: `OpenStax Calculus Volume 1 · ${MODULES[moduleId].title}`, author: 'OpenStax', url: `https://openstax.org/books/calculus-volume-1/pages/${MODULES[moduleId].page}`, attribution: `Transcribed from OpenStax Calculus Volume 1, exact exercise ${exerciseId}.`, exerciseId, promptUrl: `${blob}#L${problemLine}`, answerUrl: `${blob}#L${solutionLine}`, transcription: 'format-only', verifiedAt: topicId.startsWith('5.') ? '2026-08-24' : '2026-08-23', license: { code: 'CC-BY-NC-SA-4.0', name: 'CC BY-NC-SA 4.0', url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/', usage: 'embedded' } }
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
