import { DEFAULT_THRESHOLDS, exceedsThreshold, thresholdFor } from '../../src/monolith/thresholds.mjs';

test('defines and resolves documented defaults', () => {
  expect(DEFAULT_THRESHOLDS).toEqual({ source: 300, test: 600 });
  expect(thresholdFor('source')).toBe(300);
});

test('detects only counts above the threshold', () => {
  expect(exceedsThreshold(300, 'source')).toBe(false);
  expect(exceedsThreshold(301, 'source')).toBe(true);
});

test('rejects unknown categories and invalid counts', () => {
  expect(() => thresholdFor('unknown')).toThrow(TypeError);
  expect(() => exceedsThreshold(-1, 'test')).toThrow(TypeError);
});
