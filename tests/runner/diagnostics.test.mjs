import { formatFailure, formatIstanbulIgnoreFailure, hasLintWarnings } from '../../src/runner/diagnostics.mjs';

test('formats policy violations with file locations', () => {
  expect(formatIstanbulIgnoreFailure([{ file: 'src/a.mjs', line: 3 }])).toContain('src/a.mjs:3');
});

test('detects lint warnings and removes ANSI escapes', () => {
  expect(hasLintWarnings('\u001b[33mwarning:\u001b[0m unused')).toBe(true);
  expect(hasLintWarnings('all clear')).toBe(false);
});

test('formats failures and removes repeated coverage noise', () => {
  const result = formatFailure('Tests', { code: 1, output: 'Coverage report\nCoverage report\nFAIL example\nFAIL example' });
  expect(result).toContain('Tests failed (exit 1)');
  expect(result.match(/FAIL example/g)).toHaveLength(1);
  expect(result).not.toContain('Coverage report');
});
