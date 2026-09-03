import { formatMonolithViolations } from '../../src/monolith/diagnostics.mjs';

test('formats actionable diagnostics', () => {
  const output = formatMonolithViolations([{ file: 'src/large.mjs', lines: 301, threshold: 300 }]);
  expect(output).toContain('src/large.mjs');
  expect(output).toContain('required action');
});
