import { COVERAGE_THRESHOLDS, meetsCoverageThresholds } from '../../src/coverage/coverage-thresholds.mjs';

const complete = { statements: 100, branches: 100, functions: 100, lines: 100 };

test('defines independent 100 percent thresholds', () => {
  expect(COVERAGE_THRESHOLDS).toEqual(complete);
  expect(Object.isFrozen(COVERAGE_THRESHOLDS)).toBe(true);
});

test('rejects missing, array, and non-object metrics', () => {
  expect(meetsCoverageThresholds(null)).toBe(false);
  expect(meetsCoverageThresholds([])).toBe(false);
  expect(meetsCoverageThresholds('100')).toBe(false);
});

test('accepts complete finite metrics', () => {
  expect(meetsCoverageThresholds(complete)).toBe(true);
});

test('rejects every incomplete or invalid metric', () => {
  for (const metric of Object.keys(complete)) {
    expect(meetsCoverageThresholds({ ...complete, [metric]: 99 })).toBe(false);
    expect(meetsCoverageThresholds({ ...complete, [metric]: Number.NaN })).toBe(false);
  }
});
