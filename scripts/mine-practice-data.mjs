import { readFile, writeFile } from 'node:fs/promises';

const topicsData = JSON.parse(await readFile(new URL('../public/data/topics.json', import.meta.url), 'utf8'));
const topicIndex = new Map();
for (const unit of topicsData.units) for (const topic of unit.topics) topicIndex.set(topic.id, { ...topic, unit });

const decode = (value) => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/&fnof;/g, 'f').replace(/&prime;/g, '′').replace(/&ocirc;/g, 'ô')
  .replace(/&amp;/g, '&').replace(/&#39;/g, '’').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const questions = [];
const seenIds = new Set();

function addQuestion(record) {
  if (seenIds.has(record.id)) return;
  const info = topicIndex.get(record.topicId);
  if (!info) throw new Error(`Unknown topic ${record.topicId} for ${record.id}`);
  seenIds.add(record.id);
  questions.push({
    id: record.id,
    type: 'external',
    topicId: record.topicId,
    topic: info.title,
    unit: `Unit ${info.unit.id} · ${info.unit.title}`,
    title: record.title,
    problemUrl: record.problemUrl,
    solutionUrl: record.solutionUrl,
    videoUrl: info.unit.video,
    referenceUrl: info.unit.reference,
    metadata: record.metadata,
    source: record.source
  });
}

const linkLicense = (url) => ({ code: 'LINK-ONLY', name: 'Source terms apply', url, usage: 'link-only' });

// Paul Dawkins publishes a stable problem page and an individual worked solution
// for each numbered item. We link without reproducing either one.
const pauls = [
  ['Computing Limits', 'CalcI', 'ComputingLimits', 'calci/computinglimits', '1.6', 15],
  ['Chain Rule', 'CalcI', 'ChainRule', 'calci/chainrule', '3.1', 20],
  ['Related Rates', 'CalcI', 'RelatedRates', 'calci/relatedrates', '4.5', 11],
  ['Optimization', 'CalcI', 'Optimization', 'calci/optimization', '5.11', 8],
  ['Integration by Parts', 'CalcII', 'IntegrationByParts', 'calcii/integrationbyparts', '6.11', 9],
  ['Area Between Curves', 'CalcI', 'AreaBetweenCurves', 'calci/areabetweencurves', '8.4', 11],
  ['Volume with Rings', 'CalcI', 'VolumeWithRings', 'calci/volumewithrings', '8.11', 8],
  ['Ratio Test', 'CalcII', 'RatioTest', 'calcii/ratiotest', '10.8', 5]
];
for (const [collection, coursePath, page, solutionPath, topicId, count] of pauls) {
  const problemUrl = `https://tutorial.math.lamar.edu/Problems/${coursePath}/${page}.aspx`;
  for (let number = 1; number <= count; number += 1) addQuestion({
    id: `pauls-${slug(page)}-${number}`,
    topicId,
    title: `Paul’s ${collection} · Problem ${number}`,
    problemUrl,
    solutionUrl: `https://tutorial.math.lamar.edu/solutions/${solutionPath}/prob${number}.aspx`,
    metadata: { sourceQuestionId: `Problem ${number}`, collection, course: coursePath === 'CalcI' ? 'AB + BC' : 'BC emphasis', format: 'worked practice', difficulty: 'mixed', estimatedMinutes: 10, calculator: 'varies', answerKind: 'worked solution', tags: [collection] },
    source: { title: `Paul’s Online Math Notes · ${collection}`, author: 'Paul Dawkins · Lamar University', url: problemUrl, attribution: `Linked to publisher problem ${number}; question text is not reproduced`, transcription: 'link-only', verifiedAt: '2026-08-23', license: linkLicense('https://tutorial.math.lamar.edu/Terms.aspx') }
  });
}

// The Michigan problem pages categorize individual historic exam PDFs and pair
// each one with its own solution PDF. Keep a bounded recent sample per category
// so the offline catalog remains quick while still spanning the full curriculum.
const michiganCategoryTopics = new Map(Object.entries({
  'Continuity and Limits': '1.12', 'Average rate of change': '2.1', 'Definition of the Derivative': '2.2',
  'Derivatives: Numbers': '2.3', 'Derivatives: Graph': '2.3', 'Use a graph to draw its derivative': '5.8',
  'Extract info about f,f′,f′′ from graph': '5.9', 'Linear approximation': '4.6',
  'Match graphs with f,f′,f′′': '5.9', 'Piecewise Functions': '1.10', 'Mean Value Theorem': '5.1',
  'Critical pts, Inflection pts, extrema': '5.2', 'Extract info about f,f′,f′′ from table': '5.9',
  'Global Max/Min': '5.5', 'Optimization': '5.11', 'Derivatives: Formula': '3.5',
  'Product/quotient/chain rules': '3.1', 'Inverse function': '3.3', 'Implicit differentiation': '3.2',
  'Related Rates': '4.5', 'Riemann Sums': '6.2', 'Fund. Thm. Of Calc.': '6.4',
  'Fundamental Theorems': '6.4', 'Average Value': '8.1', 'Average value': '8.1',
  'Even/Odd Integral': '6.6', 'Odd/Even integrals': '6.6', 'Piecewise linear integral': '6.7',
  'Basic rules of integrals': '6.6', 'Integral: Formula': '6.8', 'Integral: Graph': '6.5',
  'Integral: Numbers': '6.7', 'Integral: Words': '8.3', 'Integral Estimation': '6.2',
  'Give meaning of an integral': '8.3', 'Substitution': '6.9', 'Parts': '6.11',
  'Partial fractions': '6.12', 'Area/Volume Integrals': '8.13', 'Arc Length (Cartesian Coords)': '8.13',
  "L'Hôpital's Rule": '4.7', 'Calculation of improper integrals': '6.13',
  'Convergence of improper integrals': '6.13', 'Sequences': '10.1', 'Geometric Series': '10.2',
  'Series Converge/Diverge': '10.3', 'Radius/Interval of Conv': '10.13', 'Taylor Series': '10.14',
  'Parametric Equations': '9.1', 'Arc Length (Parametric Curves)': '9.3', 'Polar Coordinates': '9.7',
  'Work': '8.3'
}));
const michiganPages = ['115exam1', '115exam3', '116exam1', '116exam2', '116exam3'];
const michiganBase = 'https://dhsp.math.lsa.umich.edu/exams/';
for (const page of michiganPages) {
  const sourceUrl = `${michiganBase}${page}probs.html`;
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Could not mine ${sourceUrl}: ${response.status}`);
  const html = await response.text();
  const rows = [...html.matchAll(/<tr>\s*<td class="header">([\s\S]*?)<\/td>([\s\S]*?)<\/tr>/gi)];
  for (const row of rows) {
    const category = decode(row[1]);
    const topicId = michiganCategoryTopics.get(category);
    if (!topicId) continue;
    const pairs = [...row[2].matchAll(/<a href="([^"]+\/p(\d+)\.pdf)">([\s\S]*?)<\/a><a href="([^"]+\/s\d+\.pdf)">#<\/a>/gi)];
    const unique = [...new Map(pairs.map((match) => [match[1], match])).values()].slice(-8);
    for (const match of unique) {
      const problemUrl = new URL(match[1], sourceUrl).toString();
      const solutionUrl = new URL(match[4], sourceUrl).toString();
      const label = decode(match[3]) || `Problem ${match[2]}`;
      const pathId = match[1].replace(/\.pdf$/i, '').replace(/[^a-z0-9]+/gi, '-');
      const term = match[1].match(/\/(w|f)(\d{2})\//i);
      const year = term ? Number(`20${term[2]}`) : undefined;
      addQuestion({
        id: `umich-${slug(category)}-${slug(pathId)}`,
        topicId,
        title: `${category} · ${label}`,
        problemUrl,
        solutionUrl,
        metadata: { sourceQuestionId: label, collection: `Math ${page.startsWith('115') ? '115' : '116'} exam archive`, course: page.startsWith('115') ? 'AB + BC' : 'BC emphasis', format: 'university exam problem', difficulty: 'exam-level', estimatedMinutes: 12, calculator: 'varies', answerKind: 'worked solution PDF', publishedYear: year, tags: [category, 'University exam'] },
        source: { title: `University of Michigan · ${category}`, author: 'University of Michigan Mathematics', url: sourceUrl, attribution: `Linked to the publisher’s ${label} problem PDF and matching solution PDF`, transcription: 'link-only', verifiedAt: '2026-08-23', license: linkLicense('https://dhsp.math.lsa.umich.edu/examshops.html') }
      });
    }
  }
}

// Active Calculus static exercises have stable HTML anchors. The linked answer
// appendix covers non-WeBWorK exercises; randomized WeBWorK cards are excluded.
const activeSections = [
  ['1-2-lim', '1.6'], ['1-3-derivative-pt', '2.2'], ['1-7-lim-cont-diff', '2.4'],
  ['2-1-elem-rules', '2.6'], ['2-3-prod-quot', '2.8'], ['2-5-chain', '3.1'],
  ['2-7-implicit', '3.2'], ['3-4-applied-opt', '5.11'], ['3-5-related-rates', '4.5'],
  ['4-2-riemann', '6.2'], ['4-3-definite-integral', '6.3'], ['4-4-FTC', '6.4'],
  ['5-3-substitution', '6.9'], ['5-4-parts', '6.11'], ['6-1-area-length', '8.4'],
  ['6-2-volume', '8.11'], ['7-3-euler', '7.5'], ['7-4-separable', '7.6'],
  ['8-4-taylor-series', '10.14']
];
const activeAnswerUrl = 'https://activecalculus.org/single-alt/exercises-answers.html';
for (const [section, topicId] of activeSections) {
  const sourceUrl = `https://activecalculus.org/single-alt/sec-${section}.html`;
  const response = await fetch(sourceUrl);
  if (!response.ok) continue;
  const html = await response.text();
  const exerciseStart = html.indexOf('<section class="exercises"');
  if (exerciseStart < 0) continue;
  const exerciseHtml = html.slice(exerciseStart);
  const matches = [...exerciseHtml.matchAll(/<article class="exercise exercise-like" id="(ez-[^"]+)"><h4 class="heading"><span class="codenumber">([\s\S]*?)<\/span><\/h4>/gi)];
  const sectionNumber = section.replace(/-/g, '.').match(/^\d+\.\d+/)?.[0] ?? section;
  for (const match of matches) {
    const number = decode(match[2]).replace(/\.$/, '');
    const exerciseId = `${sectionNumber} exercise ${number}`;
    addQuestion({
      id: `active-${slug(match[1])}`,
      topicId,
      title: `Active Calculus ${sectionNumber} · Exercise ${number}`,
      problemUrl: `${sourceUrl}#${match[1]}`,
      solutionUrl: activeAnswerUrl,
      metadata: { sourceQuestionId: exerciseId, collection: 'Active Calculus exercises', course: Number(topicId.split('.')[0]) >= 9 ? 'BC' : 'AB + BC', format: 'textbook exercise', difficulty: 'mixed', estimatedMinutes: 15, calculator: 'varies', answerKind: 'publisher answer appendix', tags: [topicIndex.get(topicId).title, 'Textbook'] },
      source: { title: `Active Calculus · Section ${sectionNumber}`, author: 'Matthew Boelkins et al.', url: sourceUrl, attribution: `Linked to ${exerciseId} and the publisher’s answer appendix; question text is not reproduced`, transcription: 'link-only', verifiedAt: '2026-08-23', license: { code: 'CC-BY-SA-4.0', name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/', usage: 'link-only' } }
    });
  }
}

// Released AP questions remain in College Board PDFs. Each record identifies the
// exact exam question and its scoring guide without copying the prompt.
const apTopics = {
  '23-ab': ['8.3','4.2','7.9','5.9','3.1','3.2'], '23-bc': ['8.3','9.6','7.9','5.9','8.4','10.11'],
  '24-ab': ['8.3','4.2','7.6','6.5','3.2','8.7'], '24-bc': ['8.3','9.6','7.6','6.5','7.5','10.13'],
  '25-ab': ['4.3','8.7','8.3','6.5','4.2','3.2'], '25-bc': ['4.3','9.8','8.3','6.5','10.11','10.13']
};
for (const [exam, topicIds] of Object.entries(apTopics)) {
  const [shortYear, course] = exam.split('-');
  const year = Number(`20${shortYear}`);
  const problemUrl = `https://apcentral.collegeboard.org/media/pdf/ap${shortYear}-frq-calculus-${course}.pdf`;
  const solutionUrl = `https://apcentral.collegeboard.org/media/pdf/ap${shortYear}-sg-calculus-${course}.pdf`;
  topicIds.forEach((topicId, index) => {
    const number = index + 1;
    addQuestion({
      id: `college-board-${year}-${course}-frq-${number}`,
      topicId,
      title: `${year} AP Calculus ${course.toUpperCase()} · FRQ ${number}`,
      problemUrl,
      solutionUrl,
      metadata: { sourceQuestionId: `${year} ${course.toUpperCase()} Question ${number}`, collection: 'Released AP free-response questions', course: course.toUpperCase(), format: 'free response', difficulty: 'AP exam', estimatedMinutes: 15, calculator: number <= 2 ? 'required' : 'not permitted', answerKind: 'official scoring guidelines', publishedYear: year, tags: [topicIndex.get(topicId).title, 'Released AP exam'] },
      source: { title: `College Board · ${year} AP Calculus ${course.toUpperCase()}`, author: 'College Board', url: problemUrl, attribution: `Linked to released Question ${number} and its official scoring guidelines; question text is not reproduced`, transcription: 'link-only', verifiedAt: '2026-08-23', license: linkLicense('https://privacy.collegeboard.org/terms-of-use') }
    });
  });
}

questions.sort((a, b) => a.topicId.localeCompare(b.topicId, undefined, { numeric: true }) || a.source.title.localeCompare(b.source.title) || a.id.localeCompare(b.id));
const sources = [...new Set(questions.map((question) => question.source.author))];
const output = {
  schemaVersion: 4,
  generatedAt: new Date().toISOString(),
  licenseNotice: 'CalcPath links to publisher-hosted problems and answers without reproducing them. Embedded questions may be added only as source-faithful, format-only transcriptions with exact question and answer locators.',
  catalogStats: { questionCount: questions.length, sourceCount: sources.length, sources },
  questions
};
await writeFile(new URL('../public/data/practice.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Mined ${questions.length} link-only questions from ${sources.length} publisher groups.`);
