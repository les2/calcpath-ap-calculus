import { describe, expect, it } from 'vitest';
import { calculateProgress, filterUnits, toggleCompleted, type Unit } from './roadmap.page';

const units: Unit[] = [
  {
    id: 1,
    title: 'Limits and Continuity',
    course: 'AB + BC',
    weight: '10%',
    color: '#f60',
    reference: 'https://example.com/limits',
    video: 'https://example.com/limits-video',
    topics: [{ id: '1.1', title: 'Defining Limits' }, { id: '1.2', title: 'Continuity' }]
  },
  {
    id: 9,
    title: 'Parametric Equations',
    course: 'BC only',
    weight: '11%',
    color: '#36c',
    reference: 'https://example.com/parametric',
    video: 'https://example.com/parametric-video',
    topics: [{ id: '9.1', title: 'Differentiating Parametric Equations' }]
  }
];
const courseFilters = [
  { id: 'ALL', label: 'All topics', unitCourses: [] },
  { id: 'AB', label: 'AB', unitCourses: ['AB + BC'] },
  { id: 'BC', label: 'BC', unitCourses: ['AB + BC', 'BC only'] }
];

describe('roadmap helpers', () => {
  it('calculates rounded completion progress', () => {
    expect(calculateProgress(units, ['1.1', '9.1'])).toBe(67);
    expect(calculateProgress([], [])).toBe(0);
  });

  it('filters topics by search text without mutating the source data', () => {
    const filtered = filterUnits(units, 'defining', 'ALL');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].topics.map((topic) => topic.id)).toEqual(['1.1']);
    expect(units[0].topics).toHaveLength(2);
  });

  it('keeps AB topics in BC mode and excludes BC-only topics in AB mode', () => {
    expect(filterUnits(units, '', 'BC', courseFilters).map((unit) => unit.id)).toEqual([1, 9]);
    expect(filterUnits(units, '', 'AB', courseFilters).map((unit) => unit.id)).toEqual([1]);
  });

  it('toggles completed topic IDs immutably', () => {
    const original = ['1.1'];
    expect(toggleCompleted(original, '1.2')).toEqual(['1.1', '1.2']);
    expect(toggleCompleted(original, '1.1')).toEqual([]);
    expect(original).toEqual(['1.1']);
  });
});
