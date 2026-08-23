import { describe, expect, it } from 'vitest';
import { completionCount, gradePoints, sessionScore, type StudySession } from './grade-maxxing.page';

const session = (results: StudySession['results']): Pick<StudySession, 'results'> => ({ results });

describe('Grade Maxxing study sessions', () => {
  it('uses a simple three-level self grade', () => { expect(gradePoints('cooked')).toBe(1); expect(gradePoints('close')).toBe(0.5); expect(gradePoints('reps')).toBe(0); });
  it('calculates progress and score from saved results', () => { const value = session({ q1: 'cooked', q2: 'close', q3: 'reps' }); expect(completionCount(value)).toBe(3); expect(sessionScore(value)).toBe(50); });
  it('keeps an untouched session at zero', () => { expect(sessionScore(session({}))).toBe(0); });
});
