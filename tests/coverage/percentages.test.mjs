import { percentage, percentageWithUnknowns } from '../../src/coverage/percentages.mjs';

test('calculates percentages for scalar and array counters', () => {
  expect(percentage({ a: 1, b: 0, c: [1, 0] })).toBe(50);
  expect(percentage(undefined)).toBe(0);
  expect(percentage({})).toBe(100);
});

test('includes unknown lines and validates the unknown count', () => {
  expect(percentageWithUnknowns(new Map([[1, 1]]), 1)).toBe(50);
  expect(percentageWithUnknowns(new Map(), 0)).toBe(100);
  for (const value of [-1, 1.5, Infinity]) expect(() => percentageWithUnknowns(new Map(), value)).toThrow('finite non-negative integer');
});
