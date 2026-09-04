import { formatCoverageGaps, formatGaps } from '../../src/coverage/format-gaps.mjs';

test('requires an array of coverage gaps', () => {
  expect(() => formatGaps(null)).toThrow(TypeError);
  expect(formatCoverageGaps(null)).toBe('');
});

test('formats empty and detailed coverage gaps', () => {
  expect(formatGaps([])).toBe('');
  expect(formatGaps([{ file: 'C:/repo/src/gap.mjs', metrics: { statements: 90, branches: 80, functions: 100, lines: 90 }, lines: [4] }], 'C:/repo'))
    .toContain('src/gap.mjs | 90% | 80% | 100% | 90%');
});

test('formats raw metrics, locations, missing values, and bounded details', () => {
  const entries = Array.from({ length: 25 }, (_, index) => ({ start: { line: index + 1 } }));
  const output = formatGaps([
    { file: 'bar.mjs', metrics: ['90', '100', '100', '100'] },
    { file: 'detail.mjs', metrics: { statements: 0, branches: 0, functions: 0, lines: 0 }, lines: [2], statements: [], branches: [{ start: { line: 2 }, type: 'if' }], functions: [{}] },
    { file: 'large.mjs', metrics: { statements: 0, branches: 0, functions: 0, lines: 0 }, statements: entries, branches: entries, functions: entries, lines: [] },
    { file: 42, metrics: ['0', '0', '0', '0'] }
  ]);
  expect(output).toContain('bar.mjs | 90 | 100 | 100 | 100');
  expect(output).toContain('Uncovered branches: 2 (if, uncovered)');
  expect(output).toContain('anonymous at unknown');
  expect(output).toContain('(+5 more omitted)');
  expect(output).toContain('unknown | 0 | 0 | 0 | 0');
});

test('formats incomplete diagnostic objects safely', () => {
  const output = formatGaps([
    { file: 'partial.mjs', metrics: { statements: 0, branches: 0, functions: 0, lines: 0 }, lines: 'invalid', statements: null, branches: null, functions: null },
    { file: 'missing.mjs' },
    { file: 'columns.mjs', metrics: { statements: 0, branches: 0, functions: 0, lines: 0 }, statements: [{ start: { line: 2, column: 3 } }], branches: [{ start: { line: 4 }, type: null }], functions: [{ name: 'run', start: { line: 5 } }] }
  ]);
  expect(output).toContain('uncovered lines: -');
  expect(output).toContain('Uncovered statements: -');
  expect(output).toContain('2:3');
  expect(output).toContain('4 (branch, uncovered)');
});
