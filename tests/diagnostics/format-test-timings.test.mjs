import { formatTestTimings } from '../../src/diagnostics/format-test-timings.mjs';

test('returns empty output when there are no timed test files', () => {
  expect(formatTestTimings()).toBe('');
  expect(formatTestTimings({ testResults: [] })).toBe('');
  expect(formatTestTimings({ testResults: [{ testFilePath: 'tests/fast.test.mjs', perfStats: { start: 3, end: 3 } }] })).toBe('');
  expect(formatTestTimings({ testResults: [{ testFilePath: 'tests/invalid.test.mjs', perfStats: { start: 'bad', end: 3 } }] })).toBe('');
});

test('sorts files and test cases by duration', () => {
  const output = formatTestTimings({ testResults: [
    { testFilePath: 'tests\\slow.test.mjs', perfStats: { start: 0, end: 2500 }, assertionResults: [
      { duration: 500, fullName: 'short' }, { duration: 1500, title: 'long' }, { title: 'untimed' }
    ] },
    { name: 'tests/fast.test.mjs', startTime: 0, endTime: 1000, assertionResults: [] }
  ]}, 1);

  expect(output).toContain('Test file timings:\n2.500s tests/slow.test.mjs');
  expect(output).toContain('1.500s long');
  expect(output).not.toContain('fast.test.mjs');
});

test('handles malformed results and limits', () => {
  const output = formatTestTimings({ testResults: [
    { testFilePath: 42, perfStats: { start: 10, end: 0 }, assertionResults: null },
    { testFilePath: 'tests/ok.test.mjs', perfStats: { start: 0, end: 1 }, assertionResults: [{ duration: 1 }] }
  ]}, 10);

  expect(output).toContain('unknown');
  expect(output).toContain('0.001s unknown test');
  expect(formatTestTimings({ testResults: [{ name: 'tests/default.test.mjs', startTime: 0, endTime: 1 }] }))
    .toContain('tests/default.test.mjs');
  expect(formatTestTimings({ testResults: [{ testFilePath: null, name: 'tests/fallback.test.mjs', startTime: 0, endTime: 1 }] }))
    .toContain('tests/fallback.test.mjs');
});
