import { prepareTestTimings } from '../../src/diagnostics/prepare-test-timings.mjs';

test('normalizes and orders timing rows', () => {
  expect(prepareTestTimings({ testResults: [
    { testFilePath: 'a\\test.mjs', perfStats: { start: 0, end: 10 } },
    { name: 'slow.mjs', startTime: 0, endTime: 30 },
    { name: 'zero.mjs', startTime: 1, endTime: 1 },
  ] })).toEqual([
    { duration: 30, file: 'slow.mjs', tests: [] },
    { duration: 10, file: 'a/test.mjs', tests: [] },
  ]);
});

test('handles malformed, fallback, and non-positive timing rows', () => {
  expect(prepareTestTimings({ testResults: [
    { testFilePath: 42, perfStats: { start: 10, end: 0 } },
    { name: 'tests/default.test.mjs', startTime: 0, endTime: 1 },
    { testFilePath: null, name: 'tests/fallback.test.mjs', startTime: 0, endTime: 1 },
    { testFilePath: 'tests/invalid.test.mjs', perfStats: { start: 'bad', end: 3 } },
  ] })).toEqual([
    { duration: 1, file: 'tests/default.test.mjs', tests: [] },
    { duration: 1, file: 'tests/fallback.test.mjs', tests: [] },
  ]);
});
