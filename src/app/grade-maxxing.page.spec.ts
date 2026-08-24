import { describe, expect, it } from 'vitest';
import { completionCount, gradePoints, reconcileSessionQuestions, sessionScore, type StudySession } from './grade-maxxing.page';

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
});
