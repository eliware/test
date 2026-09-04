import { formatMonolithViolations } from '../../src/diagnostics/format-monolith-violations.mjs';

test('formats actionable monolith diagnostics', () => {
  const output = formatMonolithViolations([{ file: 'src/large.mjs', lines: 301, threshold: 300 }]);
  expect(output).toContain('src/large.mjs');
  expect(output).toContain('required action');
  expect(output).toContain('Summary: 1 violation');
});

test('formats empty violations with plural summary and validates input', () => {
  expect(formatMonolithViolations([])).toBe('Monolith limit violations (exit 15)\nSummary: 0 violations\n');
  expect(() => formatMonolithViolations(null)).toThrow(TypeError);
});

test('formats multiple violations', () => {
  const output = formatMonolithViolations([
    { file: 'src/a.mjs', lines: 301, threshold: 300 },
    { file: 'src/b.mjs', lines: 401, threshold: 400 }
  ]);
  expect(output).toContain('Summary: 2 violations');
  expect(output).toContain('src/b.mjs');
});
