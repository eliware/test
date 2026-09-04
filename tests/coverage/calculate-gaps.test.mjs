import { calculateGaps } from '../../src/coverage/calculate-gaps.mjs';

const complete = { statements: 100, branches: 100, functions: 100, lines: 100 };

test('returns no gaps for invalid or empty entry collections', () => {
  expect(calculateGaps(null)).toEqual([]);
  expect(calculateGaps('invalid')).toEqual([]);
  expect(calculateGaps([])).toEqual([]);
});

test('filters entries whose metrics do not meet every threshold', () => {
  const gap = { file: 'src/gap.mjs', metrics: { ...complete, branches: 99 } };
  const missing = { file: 'src/missing.mjs' };
  expect(calculateGaps([{ file: 'src/ok.mjs', metrics: complete }, gap, missing])).toEqual([gap, missing]);
});

test('handles null and array metrics as gaps', () => {
  expect(calculateGaps([{ metrics: null }, { metrics: [] }])).toHaveLength(2);
});
