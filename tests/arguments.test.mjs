import { parseArguments } from '../src/arguments.mjs';
import { formatCoverageGaps, parseCoverage, parseCoverageJson } from '../src/coverage.mjs';

describe('parseArguments', () => {
  test('detects standalone lint mode', () => {
    expect(parseArguments(['--lint'])).toEqual({ lint: true, runnerArguments: [] });
  });

  test('forwards focused runner arguments unchanged', () => {
    const argumentsList = ['tests/client.test.mjs', '-t', 'rejects invalid options'];
    expect(parseArguments(argumentsList)).toEqual({ lint: false, runnerArguments: argumentsList });
  });

  test('parses ANSI and CRLF coverage, retaining only incomplete files', () => {
    const coverage = '\u001b[32m foo.mjs | 100 | 100 | 100 | 100 |\u001b[0m\r\n bar.mjs | 90 | 100 | 100 | 100 |';
    expect(parseCoverage(coverage)).toEqual([{ file: 'bar.mjs', metrics: ['90', '100', '100', '100'] }]);
  });

  test('formats coverage gaps', () => {
    expect(formatCoverageGaps([{ file: 'bar.mjs', metrics: ['90', '100', '100', '100'] }])).toContain('bar.mjs');
    expect(formatCoverageGaps([])).toBe('');
  });

  test('uses raw counters even when displayed percentage is 100', () => {
    expect(parseCoverage(' odd.mjs | 100% (1/2) | 100% (0/0) | 100% | 100% |')).toHaveLength(1);
    expect(parseCoverage(' percent.mjs | 99% | 100% | 100% | 100% |')).toHaveLength(1);
  });

  test('ignores headings, separators, complete rows, and empty input', () => {
    expect(parseCoverage('File | % Stmts | % Branch | % Funcs | % Lines | Uncovered\n-----\nAll files | 100 | 100 | 100 | 100 |\n')).toEqual([]);
  });

  test('reports exact uncovered JSON locations', () => {
    const json = { 'src/branch.mjs': { statementMap: { 0: { start: { line: 2 } } }, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: { 0: { name: 'branch', locations: [{ start: { line: 1 } }] } }, f: { 0: 0 } } };
    const gaps = parseCoverageJson(json);
    expect(gaps[0].lines).toEqual([2]);
    expect(formatCoverageGaps(gaps)).toContain('functions: branch');
  });

  test('accepts complete JSON coverage and skips default-argument branches', () => {
    const json = { 'src/complete.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: { 0: { type: 'default-arg', locations: [{ start: { line: 1 } }] } }, b: { 0: [0] }, fnMap: { 0: { name: 'complete', loc: { start: { line: 1 } } } }, f: { 0: 1 } } };
    expect(parseCoverageJson(json)).toEqual([]);
  });

  test('handles sparse JSON coverage maps', () => {
    expect(parseCoverageJson({ 'src/sparse.mjs': { s: undefined, b: undefined, f: undefined } })).toEqual([]);
    expect(parseCoverageJson({ 'src/branch.mjs': { statementMap: {}, s: {}, branchMap: { 0: { type: 'cond-expr', locations: [] } }, b: { 0: [0] }, fnMap: {}, f: {} } })).toEqual([]);
    const gaps = parseCoverageJson({ 'src/missing.mjs': { statementMap: {}, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: { 0: {} }, f: { 0: 0 } } });
    expect(formatCoverageGaps(gaps)).toContain('functions: anonymous');
  });
});
