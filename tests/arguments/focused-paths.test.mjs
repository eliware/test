import { extractFocusedPaths, VALUE_OPTIONS } from '../../src/arguments/focused-paths.mjs';

test('extracts positional test paths', () => {
  expect(extractFocusedPaths(['--config', 'x', 'tests/a.test.mjs'])).toEqual(['tests/a.test.mjs']);
});

test('skips option values', () => {
  expect(VALUE_OPTIONS).toContain('--config');
  expect(extractFocusedPaths(['-t', 'tests/a.test.mjs', 'tests/b.test.mjs'])).toEqual(['tests/b.test.mjs']);
});

test('skips equals-form option values', () => {
  expect(extractFocusedPaths(['--config=tests/a.test.mjs', 'tests/b.test.mjs'])).toEqual(['tests/b.test.mjs']);
  expect(extractFocusedPaths(['--testNamePattern=tests/a.test.mjs'])).toEqual([]);
});

test('rejects malformed argument lists and missing option values', () => {
  expect(() => extractFocusedPaths(null)).toThrow(TypeError);
  expect(() => extractFocusedPaths(['--config'])).toThrow('--config requires a value.');
  expect(extractFocusedPaths(['--watch'])).toEqual([]);
});
