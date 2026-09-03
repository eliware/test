import { extractFocusedPaths, isFocusedTestPath, VALUE_OPTIONS } from '../../src/arguments/focused-paths.mjs';

test('classifies test paths and extracts positional arguments', () => {
  expect(isFocusedTestPath('tests/a.test.mjs')).toBe(true);
  expect(extractFocusedPaths(['--config', 'x', 'tests/a.test.mjs'])).toEqual(['tests/a.test.mjs']);
});

test('skips option values', () => {
  expect(VALUE_OPTIONS).toContain('--config');
  expect(extractFocusedPaths(['-t', 'tests/a.test.mjs', 'tests/b.test.mjs'])).toEqual(['tests/b.test.mjs']);
});
