import { normalizeOutput } from '../../../src/processes/output/normalize-output.mjs';

test('removes ANSI escapes and normalizes workspace paths', () => {
  expect(normalizeOutput('\u001b[31mC:/repo/failure\u001b[0m', 'C:/repo')).toBe('<workspace>/failure');
});

test('safely handles non-string output', () => {
  expect(normalizeOutput(null, 'C:/repo')).toBe('');
});

test('only strips ANSI escapes when no workspace path is provided', () => {
  const output = '\u001b[33mwarning\u001b[0m';

  expect(normalizeOutput(output)).toBe('warning');
  expect(normalizeOutput(output, '')).toBe('warning');
  expect(normalizeOutput(output, null)).toBe('warning');
});

test('escapes workspace path characters and matches case-insensitively', () => {
  expect(normalizeOutput('C:\\Repo (test)\\file.mjs', 'c:\\repo (test)')).toBe(
    '<workspace>\\file.mjs',
  );
});

test('redacts mixed Windows separators', () => {
  expect(normalizeOutput('C:\\Repo\\file.mjs', 'c:/repo')).toBe('<workspace>\\file.mjs');
});

test('redacts only workspace path boundaries with platform-aware matching', () => {
  expect(normalizeOutput('/work/failure /workspace/failure /workshop/failure', '/work'))
    .toBe('<workspace>/failure /workspace/failure /workshop/failure');
  expect(normalizeOutput('C:/REPO/failure C:/repository/failure', 'c:/repo'))
    .toBe('<workspace>/failure C:/repository/failure');
});

test('does not redact punctuation-containing sibling paths', () => {
  expect(normalizeOutput('/work-shop/failure /work.foo/failure /work_test/failure', '/work'))
    .toBe('/work-shop/failure /work.foo/failure /work_test/failure');
  expect(normalizeOutput('C:/work-shop/failure C:/work.foo/failure C:/work_test/failure', 'C:/work'))
    .toBe('C:/work-shop/failure C:/work.foo/failure C:/work_test/failure');
});

test('handles long workspace paths without constructing a large regex', () => {
  const cwd = `C:/${'deep/'.repeat(2000)}repo`;
  expect(normalizeOutput(`${cwd}/failure`, cwd)).toBe('<workspace>/failure');
  expect(normalizeOutput(cwd, cwd)).toBe('<workspace>');
});
