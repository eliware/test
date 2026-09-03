import { HELP_TEXT, parseArguments } from '../src/arguments.mjs';
import { formatCoverageGaps, metricHasGap, parseCoverage, parseCoverageJson, percentageWithUnknowns } from '../src/coverage.mjs';

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

  test('parses the explicit environment sanitization opt-out', () => {
    expect(parseArguments(['--sanitize-env'])).toEqual({ lint: false, sanitizeEnv: true, runnerArguments: [] });
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
    expect(parseArguments(['--runInBand'])).toMatchObject({ runnerArguments: [] });
    expect(parseArguments(['--no-runInBand'])).toMatchObject({ runInBand: false, runnerArguments: [] });
    expect(() => parseArguments(['--coverage=false'])).toThrow('managed by eliware-test');
  });

  test('rejects separated values for wrapper-managed Jest flags', () => {
    expect(() => parseArguments(['--coverage', 'false'])).toThrow('managed by eliware-test');
  });

  test('rejects managed flags even when help or version is also requested', () => {
    expect(() => parseArguments(['--help', '--coverage'])).toThrow('managed by eliware-test');
    expect(() => parseArguments(['--version', '--silent'])).toThrow('managed by eliware-test');
  });

  test('calculates partial JSON metric percentages', () => {
    expect(parseCoverageJson({ 'src/partial.mjs': {
      statementMap: { 0: { start: { line: 1 } }, 1: { start: { line: 2 } } }, s: { 0: 1, 1: 2 },
      branchMap: { 0: { type: 'if', locations: [{ start: { line: 3 } }, { start: { line: 3 } }] } }, b: { 0: [1, 0] }, fnMap: {}, f: {}
    } })[0].metrics).toEqual({ statements: 100, branches: 50, functions: 100, lines: 100 });
  });

  test('counts mixed and empty branch counter arrays consistently', () => {
    const gaps = parseCoverageJson({ 'src/branch-arrays.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {},
      b: { 0: [1, 0], 1: [] }, fnMap: {}, f: {}
    } });
    expect(gaps[0].metrics.branches).toBe(50);
  });

  test('treats negative JSON counters as uncovered', () => {
    const gap = parseCoverageJson({ 'src/negative.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: -1 }, branchMap: {}, b: {}, fnMap: {}, f: {}
    } })[0];
    expect(gap.metrics.statements).toBe(0);
  });

  test('treats nonnumeric JSON counters as uncovered', () => {
    const gap = parseCoverageJson({ 'src/invalid-counter.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 'invalid' }, branchMap: {}, b: {}, fnMap: {}, f: {}
    } })[0];
    expect(gap.metrics.statements).toBe(0);
  });

  test('handles missing metric maps on an otherwise incomplete file', () => {
    const gap = parseCoverageJson({ 'src/missing-map.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 0 }, b: undefined, fnMap: {}, f: undefined
    } })[0];
    expect(gap.metrics.branches).toBe(0);
    expect(gap.metrics.functions).toBe(0);
  });


  test('parses ANSI and CRLF coverage, retaining only incomplete files', () => {
    const coverage = '\u001b[32m foo.mjs | 100 | 100 | 100 | 100 |\u001b[0m\r\n bar.mjs | 90 | 100 | 100 | 100 |';
    expect(parseCoverage(coverage)).toEqual([{ file: 'bar.mjs', metrics: ['90', '100', '100', '100'] }]);
  });

  test('treats malformed text metrics as gaps', () => {
    expect(parseCoverage('bad.mjs | not-a-number | 100 | 100 | 100 |')).toHaveLength(1);
    expect(metricHasGap('2 / 1')).toBe(true);
    expect(metricHasGap('1 / 0')).toBe(true);
    expect(metricHasGap('-1 / 2')).toBe(true);
    expect(metricHasGap('101%')).toBe(true);
    expect(metricHasGap('101')).toBe(true);
    expect(metricHasGap('-1')).toBe(true);
  });

  test('classifies coverage metric shapes', () => {
    expect(metricHasGap(0)).toBe(true);
    expect(metricHasGap('100')).toBe(false);
    expect(metricHasGap('99%')).toBe(true);
    expect(metricHasGap('1 / 2')).toBe(true);
  expect(metricHasGap(null)).toBe(true);
  expect(metricHasGap('1 / 2 100%')).toBe(true);
    expect(metricHasGap('1.5 / 1.5')).toBe(true);
    expect(metricHasGap('0 / 0')).toBe(true);
  });

  test.each([
    ['0 / 2', true],
    ['2 / 1', true],
    ['1.5 / 2', true],
  ])('fails closed for ratio edge case %s', (value, expected) => {
    expect(metricHasGap(value)).toBe(expected);
  });

  test('formats coverage gaps', () => {
    expect(formatCoverageGaps([{ file: 'bar.mjs', metrics: ['90', '100', '100', '100'] }])).toContain('bar.mjs');
    expect(formatCoverageGaps([{ file: 'detail.mjs', statements: [], branches: [{ start: { line: 2 } }], functions: [{}], lines: [2] }])).toContain('anonymous');
    expect(formatCoverageGaps([])).toBe('');
    expect(formatCoverageGaps(null)).toBe('');
    expect(formatCoverageGaps([{ file: 42, metrics: ['0', '0', '0', '0'] }])).toContain('unknown');
    expect(formatCoverageGaps([{ file: 'x.mjs', metrics: ['0'] }], 42)).toContain('x.mjs');
  });

  test('formats partial diagnostic gap objects safely', () => {
    const output = formatCoverageGaps([{ file: 'partial.mjs', metrics: { statements: 0, branches: 0, functions: 0, lines: 0 }, lines: 'invalid', statements: null, branches: null, functions: null }]);
    expect(output).toContain('uncovered lines: -');
    expect(output).toContain('Uncovered statements: -');
  });

  test('uses raw counters even when displayed percentage is 100', () => {
    expect(parseCoverage(' odd.mjs | 100% (1/2) | 100% (0/0) | 100% | 100% |')).toHaveLength(1);
    expect(parseCoverage(' percent.mjs | 99% | 100% | 100% | 100% |')).toHaveLength(1);
  });

  test('treats zero numeric coverage as a gap', () => {
    expect(parseCoverage(' empty.mjs | 0 | 0 | 0 | 0 |')).toHaveLength(1);
  });

  test('accepts complete Jest percentage annotations and rejects incomplete ones', () => {
    expect(metricHasGap('100% (1/1)')).toBe(false);
    expect(metricHasGap('80% (4/5)')).toBe(true);
    expect(metricHasGap('100% (1/2)')).toBe(true);
    expect(metricHasGap('50% (2/2)')).toBe(true);
    expect(metricHasGap('100% (0/0)')).toBe(true);
    expect(metricHasGap('80.000% (4/5)')).toBe(true);
    expect(metricHasGap('100.000% (1/1)')).toBe(false);
    expect(metricHasGap('100.0000% (1/1)')).toBe(false);
    expect(metricHasGap('99.995% (1/1)')).toBe(true);
    expect(metricHasGap('66.667% (2/3)')).toBe(true);
    expect(metricHasGap('33.333% (1/3)')).toBe(true);
    expect(metricHasGap('99.99% (1/1)')).toBe(true);
    expect(metricHasGap('99.995%')).toBe(true);
    expect(metricHasGap('99.999%')).toBe(true);
    expect(metricHasGap('99.999% (1/1)')).toBe(true);
    expect(metricHasGap('99.996% (1/1)')).toBe(true);
    expect(metricHasGap('99.997% (1/1)')).toBe(true);
    expect(metricHasGap('99.994%')).toBe(true);
    expect(metricHasGap('80.005% (4/5)')).toBe(true);
    expect(metricHasGap(`66.${'6'.repeat(2000)}% (2/3)`)).toBe(true);
    expect(metricHasGap(`${'9'.repeat(10000)}% (1/1)`)).toBe(true);
    expect(metricHasGap('101% (1/1)')).toBe(true);
    expect(metricHasGap('1000% (1/1)')).toBe(true);
    expect(metricHasGap('100.001% (1/1)')).toBe(true);
    expect(metricHasGap('100.01%')).toBe(true);
    expect(metricHasGap('100.01% (1/1)')).toBe(true);
    expect(metricHasGap('-1% (0/0)')).toBe(true);
    expect(metricHasGap('100.00x%')).toBe(true);
    expect(metricHasGap('100.%')).toBe(true);
    expect(metricHasGap('100.00abc%')).toBe(true);
    expect(metricHasGap('80.001% (4/5)')).toBe(true);
    expect(metricHasGap('100 % (1/1)')).toBe(false);
    expect(metricHasGap('100% (9007199254740992/9007199254740993)')).toBe(true);
  });

  test('ignores malformed branch counter shapes', () => {
    expect(() => parseCoverageJson({ 'src/malformed.mjs': { statementMap: {}, s: {}, branchMap: {}, b: { 0: 'invalid' }, fnMap: {}, f: {} } })).not.toThrow();
  });

  test('ignores missing branch metadata without throwing', () => {
    expect(() => parseCoverageJson({ 'src/missing-branch.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: { 0: [0] }, fnMap: {}, f: {}
    } })).not.toThrow();
  });

  test('accepts usable coverage without a branch map', () => {
    expect(() => parseCoverageJson({ 'src/no-branches.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, fnMap: {}, f: {}
    } })).not.toThrow();
  });

  test('handles malformed top-level coverage values', () => {
    expect(parseCoverageJson(null)).toEqual([]);
    expect(parseCoverageJson([])).toEqual([]);
    expect(parseCoverageJson('invalid')).toEqual([]);
  });

  test('marks unmapped uncovered statements as line gaps', () => {
    const gaps = parseCoverageJson({ 'src/unmapped.mjs': {
      statementMap: { 0: {} }, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {}
    } });
    expect(gaps[0].metrics.lines).toBe(0);
  });

test('ignores unmapped covered statements for line gaps', () => {
    expect(parseCoverageJson({ 'src/mapped.mjs': {
      statementMap: { 0: {} }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {}
    } })).toEqual([]);
  });

  test('reports a line gap when any same-line statement is uncovered', () => {
    const gaps = parseCoverageJson({ 'src/same-line.mjs': {
      statementMap: { 0: { start: { line: 4 } }, 1: { start: { line: 4 } } },
      s: { 0: 1, 1: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {}
    } });
    expect(gaps[0].metrics.lines).toBe(0);
    expect(gaps[0].lines).toEqual([4]);
  });

  test('sorts multiple uncovered lines numerically', () => {
    const gaps = parseCoverageJson({ 'src/multiple-lines.mjs': {
      statementMap: { 0: { start: { line: 12 } }, 1: { start: { line: 3 } } },
      s: { 0: 0, 1: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {}
    } });
    expect(gaps[0].lines).toEqual([3, 12]);
  });

  test('ignores headings, separators, complete rows, and empty input', () => {
    expect(parseCoverage('File | % Stmts | % Branch | % Funcs | % Lines | Uncovered\n-----\nAll files | 100 | 100 | 100 | 100 |\n')).toEqual([]);
  });

  test('reports exact uncovered JSON locations', () => {
    const json = { 'src/branch.mjs': { statementMap: { 0: { start: { line: 2 } } }, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: { 0: { name: 'branch', locations: [{ start: { line: 1 } }] } }, f: { 0: 0 } } };
    const gaps = parseCoverageJson(json);
    expect(gaps[0].lines).toEqual([2]);
    expect(formatCoverageGaps(gaps)).toContain('Uncovered functions: branch at 1');
  });

  test('falls back to valid function locations when primary metadata is malformed', () => {
    const gaps = parseCoverageJson({ 'src/fallback-function.mjs': {
      statementMap: {}, s: {}, branchMap: {}, b: {},
      fnMap: { 0: { loc: 'invalid', locations: [{ start: { line: 9 } }] } }, f: { 0: 0 }
    } });
    expect(gaps[0].functions[0]).toMatchObject({ start: { line: 9 } });
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
    expect(output).toContain('0% | 0% | 0% | 0% | uncovered lines: 8');
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
    expect(parseCoverageJson({ 'src/no-line.mjs': { statementMap: { 0: {} }, s: { 0: 0 }, b: undefined, fnMap: {}, f: undefined } })).toHaveLength(1);
    expect(parseCoverageJson({ 'src/sparse.mjs': { s: undefined, b: undefined, f: undefined } })).toEqual([]);
    const sparseBranchGaps = parseCoverageJson({ 'src/branch.mjs': { statementMap: {}, s: {}, branchMap: { 0: { type: 'cond-expr', locations: [] } }, b: { 0: [0] }, fnMap: {}, f: {} } });
    expect(sparseBranchGaps[0].branches[0]).toMatchObject({ type: 'cond-expr' });
    const gaps = parseCoverageJson({ 'src/missing.mjs': { statementMap: {}, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: { 0: {} }, f: { 0: 0 } } });
    expect(formatCoverageGaps(gaps)).toContain('functions: anonymous');
  });

  test('enforces divergent Istanbul line counters', () => {
    const gaps = parseCoverageJson({ 'src/lines.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
      branchMap: {}, b: {}, fnMap: {}, f: {}, l: { 1: 1, 2: 0 }
    } });
    expect(gaps[0].lines).toEqual([2]);
    expect(gaps[0].metrics.lines).toBe(33.33);
    expect(parseCoverageJson({ 'src/invalid-lines.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {}, l: []
    } })).toEqual([]);
    expect(parseCoverageJson({ 'src/invalid-line-count.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {}, l: { 2: 'bad' }
    } })).toEqual([]);
  });

  test('treats Istanbul line counters as authoritative', () => {
    const gaps = parseCoverageJson({ 'src/authoritative-lines.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {}, l: { 1: 1 }
    } });
    expect(gaps[0].lines).toEqual([]);
    expect(gaps[0].metrics.lines).toBe(50);
  });

  test.each([
    [{ 0: { start: { line: 4 } }, 1: { start: { line: 4 } } }, { 0: 0, 1: 1 }],
    [{ 0: { start: { line: 4 } }, 1: { start: { line: 4 } } }, { 0: 1, 1: 0 }]
  ])('uses any-uncovered semantics for same-line statements', (statementMap, s) => {
    const gaps = parseCoverageJson({ 'src/same-line.mjs': { statementMap, s, branchMap: {}, b: {}, fnMap: {}, f: {} } });
    expect(gaps[0].lines).toEqual([4]);
    expect(gaps[0].metrics.lines).toBe(0);
  });

  test('keeps empty line diagnostics finite', () => {
    const gaps = parseCoverageJson({ 'src/empty-lines.mjs': {
      statementMap: {}, s: {}, branchMap: {}, b: {}, fnMap: {}, f: {}, l: {}
    } });
    expect(gaps).toEqual([]);
    expect(percentageWithUnknowns(new Map(), 0)).toBe(0);
  });
});

test('counts mixed mapped and unmapped uncovered statements as a line gap', () => {
  const gaps = parseCoverageJson({ 'src/mixed-map.mjs': {
    statementMap: { 0: { start: { line: 4 } }, 1: {} },
    s: { 0: 1, 1: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {}
  } });
  expect(gaps[0].metrics.lines).toBe(50);
});

test('treats statement-map entries missing counters as uncovered lines', () => {
  const gaps = parseCoverageJson({ 'src/missing-counter.mjs': {
    statementMap: { 0: { start: { line: 7 } }, 1: { start: { line: 11 } } },
    s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {}
  } });
  expect(gaps[0].lines).toEqual([11]);
  expect(gaps[0].metrics.lines).toBe(50);
});

test('handles a statement map with no counter map conservatively', () => {
  const gaps = parseCoverageJson({ 'src/no-counter-map.mjs': {
    statementMap: { 0: { start: { line: 2 } }, 1: { start: { line: 2 } } },
    branchMap: {}, b: {}, fnMap: {}, f: {}
  } });
  expect(gaps[0].lines).toEqual([2]);
  expect(gaps[0].metrics.lines).toBe(0);
});

test.each([null, 'invalid', 42, []])('handles malformed statement counters without throwing: %p', (statementCounters) => {
  expect(() => parseCoverageJson({ 'src/malformed-s.mjs': {
    statementMap: { 0: { start: { line: 3 } } }, s: statementCounters,
    branchMap: {}, b: {}, fnMap: {}, f: {}
  } })).not.toThrow();
});

test('reports malformed function counters as a safe coverage gap', () => {
  const json = {
    'src/malformed-functions.mjs': {
      statementMap: { 0: { start: { line: 4 } } }, s: { 0: 1 },
      branchMap: {}, b: {}, fnMap: {}, f: 'invalid'
    }
  };
  expect(() => parseCoverageJson(json)).not.toThrow();
  expect(parseCoverageJson(json)[0].functions).toEqual([{ type: 'function', name: 'unknown' }]);
});
