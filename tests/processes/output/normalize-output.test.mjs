import { normalizeOutput } from '../../../src/processes/output/normalize-output.mjs';

test('removes ANSI escapes and normalizes workspace paths', () => {
  expect(normalizeOutput('\u001b[31mC:/repo/failure\u001b[0m', 'C:/repo')).toBe('<workspace>/failure');
});

test('safely handles non-string output', () => {
  expect(normalizeOutput(null, 'C:/repo')).toBe('');
});
