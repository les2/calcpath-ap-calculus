import { describe, expect, it } from 'vitest';
import { hydrateCatalog, type PracticeCatalog } from './practice-catalog.service';

describe('normalized practice catalog', () => {
  it('joins a compact question to its source registry at runtime', () => {
    const catalog = {
      schemaVersion: 5, revision: '1234567890abcdef', generatedAt: '2026-08-23', licenseNotice: '', catalogStats: {},
      sources: [{ id: 'publisher', title: 'Publisher', author: 'Author', url: 'https://example.com', attribution: 'Transcribed from Publisher exercise ex-1.', license: { code: 'CC-BY-4.0', name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/', usage: 'embedded' } }],
      questions: [{ id: 'q1', type: 'embedded', topicId: '1.1', topic: 'Topic', unit: 'Unit 1', title: 'ex-1', sourceId: 'publisher', locator: { exerciseId: 'ex-1', promptUrl: 'https://example.com/q', answerUrl: 'https://example.com/a', transcription: 'format-only', verifiedAt: '2026-08-23' }, promptHtml: '<p>Question</p>', answerHtml: '<p>Answer</p>', videoUrl: 'https://example.com/v', referenceUrl: 'https://example.com/r', metadata: { sourceQuestionId: 'ex-1', collection: 'Book', course: 'AB + BC', format: 'textbook exercise', difficulty: 'easy', estimatedMinutes: 5, calculator: 'varies', answerKind: 'publisher solution', tags: ['Textbook'] } }]
    } satisfies PracticeCatalog;
    const [question] = hydrateCatalog(catalog);
    expect(question.sourceId).toBe('publisher');
    expect(question.source).toMatchObject({ title: 'Publisher', exerciseId: 'ex-1', transcription: 'format-only' });
    expect(catalog.questions[0]).not.toHaveProperty('source');
  });
});
