import { describe, expect, it } from 'vitest';
import { gradePoints, levelLabel, type Attempt } from './grade-maxxing.page';

const attempt = (grade: Attempt['grade']): Attempt => ({ id: crypto.randomUUID(), sessionId: 's', challengeId: 'c', topicId: '1.1', topic: 'Limits', grade, seconds: 60, completedAt: new Date().toISOString() });

describe('Grade Maxxing scoring', () => {
  it('gives partial work half credit', () => {
    expect(gradePoints('cooked')).toBe(1);
    expect(gradePoints('almost')).toBe(0.5);
    expect(gradePoints('got-cooked')).toBe(0);
  });

  it('requires repeated evidence before showing a strong level', () => {
    expect(levelLabel([])).toBe('New');
    expect(levelLabel([attempt('cooked')])).toBe('Warming up');
    expect(levelLabel([attempt('cooked'), attempt('cooked'), attempt('cooked')])).toBe('Leveled up');
    expect(levelLabel([attempt('got-cooked'), attempt('almost'), attempt('cooked')])).toBe('In the lab');
  });
});
