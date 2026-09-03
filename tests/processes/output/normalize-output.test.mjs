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
