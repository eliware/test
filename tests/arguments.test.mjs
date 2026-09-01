import { HELP_TEXT, parseArguments } from '../src/arguments.mjs';
import { formatCoverageGaps, parseCoverage, parseCoverageJson } from '../src/coverage.mjs';

describe('parseArguments', () => {
  test('detects standalone lint mode', () => {
    expect(parseArguments(['--lint'])).toEqual({ lint: true, runnerArguments: [] });
  });

  test('recognizes long and short help options', () => {
    expect(parseArguments(['--help'])).toEqual({ help: true, lint: false, runnerArguments: [] });
    expect(parseArguments(['-h'])).toEqual({ help: true, lint: false, runnerArguments: [] });
    expect(HELP_TEXT).toContain('npm test -- <Jest arguments>');
  });

  test('recognizes long and short version options', () => {
    expect(parseArguments(['--version'])).toEqual({ version: true, lint: false, runnerArguments: [] });
    expect(parseArguments(['-v'])).toEqual({ version: true, lint: false, runnerArguments: [] });
  });

  test('parses the explicit coverage opt-out', () => {
    expect(parseArguments(['--ignore-100x4'])).toEqual({ lint: false, ignoreCoverage: true, runnerArguments: [] });
  });

  test('forwards focused runner arguments unchanged', () => {
    const argumentsList = ['tests/client.test.mjs', '-t', 'rejects invalid options'];
    expect(parseArguments(argumentsList)).toEqual({ lint: false, runnerArguments: argumentsList });
  });

  test('accepts a direct-invocation separator before Jest arguments', () => {
    expect(parseArguments(['--', '-t', 'focused'])).toEqual({ lint: false, runnerArguments: ['-t', 'focused'] });
  });

  test('rejects lint combined with runner arguments', () => {
    expect(() => parseArguments(['--lint', 'tests/client.test.mjs'])).toThrow('cannot be combined');
  });

  test('rejects wrapper-managed Jest flags with an actionable message', () => {
    expect(() => parseArguments(['--runInBand'])).toThrow('managed by eliware-test');
    expect(() => parseArguments(['--coverage=false'])).toThrow('managed by eliware-test');
  });

  test('parses ANSI and CRLF coverage, retaining only incomplete files', () => {
    const coverage = '\u001b[32m foo.mjs | 100 | 100 | 100 | 100 |\u001b[0m\r\n bar.mjs | 90 | 100 | 100 | 100 |';
    expect(parseCoverage(coverage)).toEqual([{ file: 'bar.mjs', metrics: ['90', '100', '100', '100'] }]);
  });

  test('formats coverage gaps', () => {
    expect(formatCoverageGaps([{ file: 'bar.mjs', metrics: ['90', '100', '100', '100'] }])).toContain('bar.mjs');
    expect(formatCoverageGaps([{ file: 'detail.mjs', statements: [], branches: [{ start: { line: 2 } }], functions: [{}], lines: [2] }])).toContain('anonymous');
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
    expect(formatCoverageGaps(gaps)).toContain('Uncovered functions: branch at unknown');
  });

  test('formats JSON gaps with percentages and actionable locations', () => {
    const gaps = parseCoverageJson({
      'src/detail.mjs': {
        statementMap: { 0: { start: { line: 8, column: 2 } } },
        s: { 0: 0 },
        branchMap: { 0: { type: 'if', locations: [{ start: { line: 12, column: 4 } }] } },
        b: { 0: [0] },
        fnMap: { 0: { name: 'choose', loc: { start: { line: 4, column: 0 } } } },
        f: { 0: 0 }
      }
    });
    const output = formatCoverageGaps(gaps);
    expect(output).toContain('0% | 0% | 0% | 0% | uncovered lines: 8, 12');
    expect(output).toContain('Uncovered statements: 8:2');
    expect(output).toContain('Uncovered branches: 12:4 (if, uncovered)');
    expect(output).toContain('Uncovered functions: choose at 4');
    expect(output).toContain('Fix: add or extend tests');
  });

  test('bounds oversized JSON coverage details', () => {
    const entries = Array.from({ length: 25 }, (_, index) => ({ start: { line: index + 1 } }));
    const output = formatCoverageGaps([{ file: 'large.mjs', metrics: { statements: 0, branches: 0, functions: 0, lines: 0 }, statements: entries, branches: entries, functions: entries, lines: entries.map((entry) => entry.start.line) }]);
    expect(output).toContain('(+5 more omitted)');
  });

  test('normalizes absolute Windows coverage paths', () => {
    const output = formatCoverageGaps([{ file: 'C:\\project\\src\\gap.mjs', metrics: ['90', '100', '100', '90'], statements: [], branches: [], functions: [], lines: [] }], 'C:\\project');
    expect(output).toContain('src/gap.mjs | 90 | 100 | 100 | 90');
  });

  test('accepts complete JSON coverage and skips default-argument branches', () => {
    const json = { 'src/complete.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: { 0: { type: 'default-arg', locations: [{ start: { line: 1 } }] } }, b: { 0: [0] }, fnMap: { 0: { name: 'complete', loc: { start: { line: 1 } } } }, f: { 0: 1 } } };
    expect(parseCoverageJson(json)).toEqual([]);
  });

  test('handles sparse JSON coverage maps', () => {
    expect(parseCoverageJson({ 'null-entry': null, 'scalar-entry': 'invalid', 'missing-map': {} })).toEqual([]);
    expect(parseCoverageJson({ 'src/valid.mjs': { statementMap: { 0: { start: { line: 1 } }, 1: { start: { line: 1 } } }, s: { 0: 1, 1: 1 }, b: undefined, fnMap: {}, f: undefined } })).toEqual([]);
    expect(parseCoverageJson({ 'src/no-statements.mjs': { statementMap: {}, s: undefined, b: undefined, fnMap: {}, f: undefined } })).toEqual([]);
    expect(parseCoverageJson({ 'src/sparse.mjs': { s: undefined, b: undefined, f: undefined } })).toEqual([]);
    expect(parseCoverageJson({ 'src/branch.mjs': { statementMap: {}, s: {}, branchMap: { 0: { type: 'cond-expr', locations: [] } }, b: { 0: [0] }, fnMap: {}, f: {} } })).toEqual([]);
    const gaps = parseCoverageJson({ 'src/missing.mjs': { statementMap: {}, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: { 0: {} }, f: { 0: 0 } } });
    expect(formatCoverageGaps(gaps)).toContain('functions: anonymous');
  });
});
