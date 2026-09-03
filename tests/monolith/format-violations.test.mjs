import { formatViolations } from '../../src/monolith/format-violations.mjs';

test('formats actionable diagnostics', () => {
  const output = formatViolations([{ file: 'src/large.mjs', lines: 301, threshold: 300 }]);
  expect(output).toContain('src/large.mjs');
  expect(output).toContain('required action');
});

test('rejects malformed violation collections', () => {
  expect(() => formatViolations(null)).toThrow(TypeError);
});
