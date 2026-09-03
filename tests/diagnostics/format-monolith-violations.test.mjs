import { formatMonolithViolations } from '../../src/diagnostics/format-monolith-violations.mjs';

test('formats actionable monolith diagnostics', () => {
  const output = formatMonolithViolations([{ file: 'src/large.mjs', lines: 301, threshold: 300 }]);
  expect(output).toContain('src/large.mjs');
  expect(output).toContain('required action');
  expect(output).toContain('Summary: 1 violation');
});
