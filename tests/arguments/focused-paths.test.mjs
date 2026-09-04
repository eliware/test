import { extractFocusedPaths, VALUE_OPTIONS } from '../../src/arguments/focused-paths.mjs';

test('extracts positional test paths', () => {
  expect(extractFocusedPaths(['--config', 'x', 'tests/a.test.mjs'])).toEqual(['tests/a.test.mjs']);
});

test('skips option values', () => {
  expect(VALUE_OPTIONS).toContain('--config');
  expect(extractFocusedPaths(['-t', 'tests/a.test.mjs', 'tests/b.test.mjs'])).toEqual(['tests/b.test.mjs']);
});

test.each(['-e', '-w'])('skips test-looking values for short option %s', (option) => {
  expect(extractFocusedPaths([option, 'tests/value.test.mjs', 'tests/actual.test.mjs'])).toEqual(['tests/actual.test.mjs']);
});

test('does not guess that unknown options consume values', () => {
  expect(extractFocusedPaths(['--futureTestPattern', 'tests/value.test.mjs', 'tests/actual.test.mjs']))
    .toEqual(['tests/value.test.mjs', 'tests/actual.test.mjs']);
});

test('skips equals-form option values', () => {
  expect(extractFocusedPaths(['--config=tests/a.test.mjs', 'tests/b.test.mjs'])).toEqual(['tests/b.test.mjs']);
  expect(extractFocusedPaths(['--testNamePattern=tests/a.test.mjs'])).toEqual([]);
});

test.each([
  '--testPathIgnorePatterns', '--testPathPatterns', '--modulePathIgnorePatterns', '--transform',
  '--testRegex', '--filter', '--dependencyExtractor', '--globalSetup', '--globalTeardown',
  '--testEnvironment', '--maxWorkers', '--maxConcurrency', '--slowTestThreshold', '--bail',
  '--changedSince', '--findRelatedTests'
])('skips test-looking values for %s', (option) => {
  expect(extractFocusedPaths([option, 'tests/value.test.mjs', 'tests/actual.test.mjs'])).toEqual(['tests/actual.test.mjs']);
  expect(extractFocusedPaths([`${option}=tests/value.test.mjs`, 'tests/actual.test.mjs'])).toEqual(['tests/actual.test.mjs']);
});

test('rejects malformed argument lists and missing option values', () => {
  expect(() => extractFocusedPaths(null)).toThrow(TypeError);
  expect(() => extractFocusedPaths(['--config'])).toThrow('--config requires a value.');
  expect(() => extractFocusedPaths(['--config', '--watch'])).toThrow('--config requires a value before --watch.');
  expect(extractFocusedPaths(['--watch'])).toEqual([]);
  expect(extractFocusedPaths([null, 42, {}, 'tests/a.test.mjs'])).toEqual(['tests/a.test.mjs']);
});
