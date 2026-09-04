import { DEFAULT_THRESHOLDS, exceedsThreshold, thresholdFor } from '../../src/monolith/thresholds.mjs';

test('defines and resolves documented defaults', () => {
  expect(DEFAULT_THRESHOLDS).toEqual({ source: 100, test: 200 });
  expect(thresholdFor('source')).toBe(100);
});

test('detects only counts above the threshold', () => {
  expect(exceedsThreshold(100, 'source')).toBe(false);
  expect(exceedsThreshold(101, 'source')).toBe(true);
});

test('rejects unknown categories and invalid counts', () => {
  expect(() => thresholdFor('unknown')).toThrow(TypeError);
  expect(() => thresholdFor(null)).toThrow(TypeError);
  expect(() => exceedsThreshold(-1, 'test')).toThrow(TypeError);
  expect(() => thresholdFor('source', { source: 0, test: 1 })).toThrow('Invalid monolith threshold');
  expect(exceedsThreshold(6, 'source', { source: 5, test: 5 })).toBe(true);
});
