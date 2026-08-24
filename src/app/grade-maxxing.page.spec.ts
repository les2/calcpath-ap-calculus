import { describe, expect, it } from 'vitest';
import { completionCount, filterPracticeQuestions, gradePoints, reconcileSessionQuestions, selectBalancedQuestions, sessionScore, type PracticeDifficulty, type PracticeQuestion, type StudySession } from './grade-maxxing.page';

const session = (results: StudySession['results']): Pick<StudySession, 'results'> => ({ results });

describe('Grade Maxxing study sessions', () => {
  it('uses a simple three-level self grade', () => { expect(gradePoints('cooked')).toBe(1); expect(gradePoints('close')).toBe(0.5); expect(gradePoints('reps')).toBe(0); });
  it('calculates progress and score from saved results', () => { const value = session({ q1: 'cooked', q2: 'close', q3: 'reps' }); expect(completionCount(value)).toBe(3); expect(sessionScore(value)).toBe(50); });
  it('keeps an untouched session at zero', () => { expect(sessionScore(session({}))).toBe(0); });
  it('removes withdrawn questions from saved study runs', () => {
    const value: StudySession = { id: 's1', name: 'Test', topicIds: ['1.6'], questionIds: ['withdrawn', 'kept'], currentIndex: 1, totalSeconds: 0, results: { withdrawn: 'cooked', kept: 'close' }, revealed: ['withdrawn'], status: 'open', createdAt: '2026-01-01', updatedAt: '2026-01-01' };
    expect(reconcileSessionQuestions(value, new Set(['kept']))).toMatchObject({ questionIds: ['kept'], currentIndex: 0, results: { kept: 'close' }, revealed: [] });
  });
  it('drops a saved run when all of its questions were withdrawn', () => {
    const value: StudySession = { id: 's1', name: 'Test', topicIds: ['1.6'], questionIds: ['withdrawn'], currentIndex: 0, totalSeconds: 0, results: {}, revealed: [], status: 'open', createdAt: '2026-01-01', updatedAt: '2026-01-01' };
    expect(reconcileSessionQuestions(value, new Set(['kept']))).toBeNull();
  });
  it('caps every selected topic and rotates between publishers', () => {
    const question = (id: string, topicId: string, author: string) => ({ id, topicId, source: { author } }) as PracticeQuestion;
    const values = [question('a1', '1.6', 'A'), question('a2', '1.6', 'A'), question('b1', '1.6', 'B'), question('c1', '3.1', 'C'), question('c2', '3.1', 'C')];
    expect(selectBalancedQuestions(values, ['1.6', '3.1'], 2).map((item) => item.id)).toEqual(['a1', 'b1', 'c1', 'c2']);
  });
  it('filters with OR inside a group and AND across groups', () => {
    const question = (id: string, author: string, difficulty: PracticeDifficulty, tags: string[]) => ({ id, source: { author }, metadata: { difficulty, tags } }) as PracticeQuestion;
    const values = [question('exam', 'Michigan', 'hard', ['University exam']), question('book', 'Active', 'medium', ['Textbook']), question('easy-exam', 'Michigan', 'easy', ['University exam'])];
    expect(filterPracticeQuestions(values, ['Michigan'], ['University exam', 'Textbook'], ['hard'])).toEqual([values[0]]);
    expect(filterPracticeQuestions(values, [], ['University exam'], ['hard'])).toEqual([]);
  });
});
