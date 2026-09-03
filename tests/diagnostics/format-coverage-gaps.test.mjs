import { formatCoverageGaps } from '../../src/diagnostics/format-coverage-gaps.mjs';
import { metricHasGap, parseCoverage, parseCoverageJson, percentageWithUnknowns } from '../../src/coverage/coverage.mjs';

test('formats actionable coverage gaps', () => {
  const output = formatCoverageGaps([{ file: 'C:/repo/src/gap.mjs', metrics: { statements: 90, branches: 80, functions: 100, lines: 90 }, lines: [4] }], 'C:/repo');
  expect(output).toContain('src/gap.mjs');
  expect(output).toContain('90% | 80% | 100% | 90%');
  expect(output).toContain('Fix: add or extend tests');
});

test('returns no output for complete coverage', () => {
  expect(formatCoverageGaps([], 'C:/repo')).toBe('');
});

test('classifies coverage metric edge cases conservatively', () => {
  expect(metricHasGap('100')).toBe(false);
  expect(metricHasGap('99%')).toBe(true);
  expect(metricHasGap('1 / 2')).toBe(true);
  expect(metricHasGap('2 / 1')).toBe(true);
  expect(metricHasGap('0 / 0')).toBe(true);
  expect(metricHasGap(null)).toBe(true);
  expect(metricHasGap('100% (1/1)')).toBe(false);
  expect(metricHasGap('100% (1/2)')).toBe(true);
  expect(metricHasGap('80% (4/5)')).toBe(true);
  expect(metricHasGap('100.000% (1/1)')).toBe(false);
});

test('parses ANSI text coverage and retains only incomplete files', () => {
  const coverage = '\u001b[32m foo.mjs | 100 | 100 | 100 | 100 |\u001b[0m\r\n bar.mjs | 90 | 100 | 100 | 100 |';
  expect(parseCoverage(coverage)).toEqual([{ file: 'bar.mjs', metrics: ['90', '100', '100', '100'] }]);
  expect(parseCoverage('File | % Stmts | % Branch | % Funcs | % Lines |\n-----\nAll files | 100 | 100 | 100 | 100 |\n')).toEqual([]);
});

test('calculates JSON coverage percentages and uncovered locations', () => {
  const gaps = parseCoverageJson({ 'src/partial.mjs': {
    statementMap: { 0: { start: { line: 1 } }, 1: { start: { line: 2 } } }, s: { 0: 1, 1: 0 },
    branchMap: { 0: { type: 'if', locations: [{ start: { line: 3 } }, { start: { line: 3 } }] } }, b: { 0: [1, 0] }, fnMap: {}, f: {}
  } });
  expect(gaps[0].metrics).toMatchObject({ statements: 50, branches: 50, functions: 100 });
  expect(gaps[0].lines).toEqual([2]);
  expect(percentageWithUnknowns(new Map(), 0)).toBe(100);
});

test('handles malformed maps and authoritative line counters safely', () => {
  const malformed = parseCoverageJson({ 'src/malformed.mjs': {
    statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: 'invalid', fnMap: {}, f: 7
  } });
  expect(malformed[0].metrics.branches).toBe(0);
  expect(malformed[0].metrics.functions).toBe(0);
  expect(malformed[0].branches).toEqual([{ type: 'branch' }]);

  const lines = parseCoverageJson({ 'src/lines.mjs': {
    statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {}, l: { 1: 1, 2: 0 }
  } });
  expect(lines[0].lines).toEqual([2]);
  expect(lines[0].metrics.lines).toBe(50);
});

test('skips default-argument branch gaps when coverage is otherwise complete', () => {
  expect(parseCoverageJson({ 'src/complete.mjs': {
    statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
    branchMap: { 0: { type: 'default-arg', locations: [{ start: { line: 1 } }] } }, b: { 0: [0] },
    fnMap: { 0: { name: 'complete', loc: { start: { line: 1 } } } }, f: { 0: 1 }
  } })).toEqual([]);
});

test('handles malformed top-level coverage and function metadata safely', () => {
  expect(parseCoverageJson(null)).toEqual([]);
  expect(parseCoverageJson([])).toEqual([]);
  expect(parseCoverageJson('invalid')).toEqual([]);
  const gaps = parseCoverageJson({ 'src/fallback.mjs': {
    statementMap: {}, s: {}, branchMap: {}, b: {},
    fnMap: { 0: { loc: 'invalid', locations: [{ start: { line: 9 } }] } }, f: { 0: 0 }
  } });
  expect(gaps[0].functions[0]).toMatchObject({ start: { line: 9 } });
});

test('bounds detailed coverage diagnostics', () => {
  const entries = Array.from({ length: 25 }, (_, index) => ({ start: { line: index + 1 } }));
  const output = formatCoverageGaps([{ file: 'large.mjs', metrics: { statements: 0, branches: 0, functions: 0, lines: 0 }, statements: entries, branches: entries, functions: entries, lines: entries.map((entry) => entry.start.line) }]);
  expect(output).toContain('(+5 more omitted)');
});

test('reports same-line uncovered statements and sorts line locations', () => {
  const gaps = parseCoverageJson({ 'src/multiple-lines.mjs': {
    statementMap: { 0: { start: { line: 12 } }, 1: { start: { line: 3 } }, 2: { start: { line: 3 } } },
    s: { 0: 0, 1: 1, 2: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {}
  } });
  expect(gaps[0].lines).toEqual([3, 12]);
});

test('fails closed for missing statement counters and locations', () => {
  const gaps = parseCoverageJson({ 'src/missing-counter.mjs': {
    statementMap: { 0: { start: { line: 7 } }, 1: { start: { line: 11 } } },
    s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {}
  } });
  expect(gaps[0].lines).toEqual([11]);
  expect(gaps[0].metrics.lines).toBe(0);
});

test('validates unknown line counts and reports sparse branch locations', () => {
  expect(() => percentageWithUnknowns(new Map(), -1)).toThrow('finite non-negative integer');
  expect(() => percentageWithUnknowns(new Map(), 1.5)).toThrow('finite non-negative integer');
  const gaps = parseCoverageJson({ 'src/sparse.mjs': {
    statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
    branchMap: { 0: { type: 'cond-expr', locations: [] } }, b: { 0: [0] }, fnMap: {}, f: {}
  } });
  expect(gaps[0].branches[0]).toMatchObject({ type: 'cond-expr' });
});

test('treats malformed counters as uncovered without throwing', () => {
  for (const count of [NaN, Infinity, null, 'invalid']) {
    const gaps = parseCoverageJson({ 'src/malformed-counter.mjs': {
      statementMap: { 0: { start: { line: 4 } } }, s: { 0: count }, branchMap: {}, b: {}, fnMap: {}, f: {}
    } });
    expect(gaps[0].metrics.statements).toBe(0);
    expect(gaps[0].lines).toEqual([4]);
  }
});

test('uses any-uncovered semantics for same-line statements', () => {
  const gaps = parseCoverageJson({ 'src/same-line.mjs': {
    statementMap: { 0: { start: { line: 4 } }, 1: { start: { line: 4 } } },
    s: { 0: 1, 1: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {}
  } });
  expect(gaps[0].lines).toEqual([4]);
  expect(gaps[0].metrics.lines).toBe(0);
});

test('accepts complete coverage and normalizes workspace-bound paths', () => {
  expect(parseCoverageJson({ 'src/complete.mjs': {
    statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {}
  } })).toEqual([]);
  const output = formatCoverageGaps([{ file: 'C:\\project\\src\\gap.mjs', metrics: ['90', '100', '100', '90'] }], 'C:\\project');
  expect(output).toContain('src/gap.mjs | 90 | 100 | 100 | 90');
});
