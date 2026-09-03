import { resolve } from 'node:path';
import { runToolkit } from '../src/runner.mjs';
import { runJest } from '../src/process.mjs';
import { formatCoverageGaps, metricHasGap, parseCoverageJson } from '../src/coverage.mjs';

test('accepts very large annotated integer counters', () => {
  expect(metricHasGap('100% (900719925474099300000 / 900719925474099300000)')).toBe(false);
  expect(metricHasGap('50% (900719925474099300000 / 1801439850948198600000)')).toBe(true);
});

test('reports a line gap when one same-line statement is uncovered', () => {
  const gaps = parseCoverageJson({
    'src/mixed.mjs': {
      statementMap: { 0: { start: { line: 4 } }, 1: { start: { line: 4 } } },
      s: { 0: 1, 1: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {}
    }
  });
  expect(gaps[0].metrics.lines).toBe(0);
  expect(gaps[0].lines).toEqual([4]);
  expect(gaps[0].metrics.statements).toBe(50);
});

test('retains a numeric zero line location in line-gap diagnostics', () => {
  const gaps = parseCoverageJson({
    'src/zero-line.mjs': {
      statementMap: { 0: { start: { line: 0 } } }, s: { 0: 0 },
      branchMap: {}, b: {}, fnMap: {}, f: {}
    }
  });
  expect(gaps[0].lines).toEqual([0]);
});

test('fails closed when an uncovered statement has malformed line metadata', () => {
  const gaps = parseCoverageJson({
    'src/malformed-line.mjs': {
      statementMap: { 0: { start: { line: 'unknown' } } }, s: { 0: 0 },
      branchMap: {}, b: {}, fnMap: {}, f: {}
    }
  });
  expect(gaps[0].metrics.lines).toBe(0);
});

test('keeps authoritative line metrics independent from malformed statement counters', () => {
  const gaps = parseCoverageJson({
    'src/authoritative-lines.mjs': {
      statementMap: { 0: { start: { line: 4 } } },
      s: { 0: 'invalid' },
      l: { 4: 1 },
      branchMap: {}, b: {}, fnMap: {}, f: {}
    }
  });
  expect(gaps[0].statements).toHaveLength(1);
  expect(gaps[0].metrics.statements).toBe(0);
  expect(gaps[0].lines).toEqual([]);
  expect(gaps[0].metrics.lines).toBe(100);
});

test('reports uncovered branches when branch metadata is missing', () => {
  const gaps = parseCoverageJson({
    'src/missing-branch-map.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
      b: { 0: [0, 1], 1: [0] }, fnMap: {}, f: {}
    }
  });
  expect(gaps[0].branches).toHaveLength(2);
});

test('formats uncovered functions from each supported Istanbul location shape', () => {
  const gaps = parseCoverageJson({
    'src/functions.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 0 }, branchMap: {}, b: {},
      fnMap: { 0: { loc: { start: { line: 2 } }, name: 'locFn' }, 1: { locations: [{ start: { line: 3 } }], name: 'locationsFn' }, 2: { name: 'unknownFn' } },
      f: { 0: 0, 1: 0, 2: 0, 3: 0 }
    }
  });
  expect(gaps[0].functions).toHaveLength(4);
});

test('normalizes absolute coverage paths only at a workspace boundary', () => {
  const output = formatCoverageGaps([{ file: 'C:\\workspace-other\\src\\gap.mjs', metrics: ['0%', '0%', '0%', '0%'] }], 'C:\\workspace');
  expect(output).toContain('C:/workspace-other/src/gap.mjs');
});

test('reports a function-only coverage gap', () => {
  const gaps = parseCoverageJson({
    'src/function-only.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {},
      fnMap: { 0: { loc: { start: { line: 2 } }, name: 'missed' } }, f: { 0: 0 }
    }
  });
    expect(gaps[0].metrics.functions).toBe(0);
  expect(gaps[0].functions[0].name).toBe('missed');
});

test('treats empty branch and function maps as valid zero-denominator metrics', () => {
  const gaps = parseCoverageJson({
    'src/no-branches.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
      branchMap: {}, b: {}, fnMap: {}, f: {}
    }
  });
  expect(gaps).toEqual([]);
});

test('treats malformed scalar metric maps as uncovered', () => {
  const gaps = parseCoverageJson({
    'src/malformed-map.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
      branchMap: {}, b: 'invalid', fnMap: {}, f: 7
    }
  });
  expect(gaps[0].metrics.branches).toBe(0);
  expect(gaps[0].metrics.functions).toBe(0);
  expect(gaps[0].branches).toEqual([{ type: 'branch' }]);
});

test('uses a generic type for uncovered branches without type metadata', () => {
  const gaps = parseCoverageJson({
    'src/branch-type.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
      branchMap: { 0: { locations: [{ start: { line: 2 } }] } }, b: { 0: [0] }, fnMap: {}, f: {}
    }
  });
  expect(gaps[0].branches[0].type).toBe('branch');
});

test('reports uncovered branches with missing or short location metadata', () => {
  const gaps = parseCoverageJson({
    'src/sparse-branches.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
      branchMap: { 0: { type: 'cond-expr', locations: [] }, 1: { type: 'cond-expr', locations: [{ start: { line: 3 } }] } },
      b: { 0: [0], 1: [0, 0] }, fnMap: {}, f: {}
    }
  });
  expect(gaps[0].branches).toHaveLength(3);
  expect(gaps[0].branches.filter((branch) => !branch.start)).toHaveLength(2);
});

test('reports an uncovered statement with incomplete line mapping', () => {
  const gaps = parseCoverageJson({
    'src/line-only.mjs': { statementMap: { 0: {} }, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {} }
  });
  expect(gaps[0].statements).toHaveLength(1);
});

test('does not trust inherited statement locations', () => {
  const prototype = { start: { line: 99 } };
  const statement = Object.create(prototype);
  const gaps = parseCoverageJson({
    'src/inherited-location.mjs': {
      statementMap: { 0: statement }, s: { 0: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {}
    }
  });
  expect(gaps[0].metrics.lines).toBe(0);
  expect(gaps[0].lines).toEqual([]);
});

test.each([NaN, Infinity, null])('treats malformed statement counter %p consistently', (count) => {
  const gaps = parseCoverageJson({
    'src/malformed-counter.mjs': {
      statementMap: { 0: { start: { line: 4 } } }, s: { 0: count }, branchMap: {}, b: {}, fnMap: {}, f: {}
    }
  });
  expect(gaps[0].statements).toHaveLength(1);
  expect(gaps[0].lines).toEqual([4]);
  expect(gaps[0].metrics.lines).toBe(0);
});

test('handles missing statement counters and unmapped counter entries', () => {
  const missingCounters = parseCoverageJson({ 'src/missing-counters.mjs': { statementMap: { 0: {} }, s: null, b: {}, f: {} } });
  expect(missingCounters).toHaveLength(1);
  expect(missingCounters[0].statements).toEqual([{ type: 'statement' }]);
  expect(parseCoverageJson({ 'src/unmapped-counter.mjs': { statementMap: {}, s: { 0: 0 }, b: {}, f: {} } })[0].lines).toEqual([]);
  const functionCounters = Object.assign(() => {}, { 0: 0 });
  expect(parseCoverageJson({ 'src/function-counter-function.mjs': { statementMap: {}, s: {}, b: {}, f: functionCounters } })).toHaveLength(1);
});

test('falls back safely for malformed function locations', () => {
  const gaps = parseCoverageJson({
    'src/malformed-function-location.mjs': {
      statementMap: {}, s: {}, branchMap: {}, b: {},
      fnMap: { 0: { loc: {}, locations: [{ start: { line: 7 } }] }, 1: { loc: {}, locations: 'invalid' } },
      f: { 0: 0, 1: 0 }
    }
  });
  expect(gaps[0].functions).toEqual([
    { start: { line: 7 }, name: 'anonymous' },
    { name: 'anonymous' }
  ]);
});

test.each([NaN, 'invalid'])('treats malformed unmapped statement counter %p as a line gap', (count) => {
  const gaps = parseCoverageJson({
    'src/malformed-unmapped-counter.mjs': {
      statementMap: { 0: {} }, s: { 0: count }, branchMap: {}, b: {}, fnMap: {}, f: {}
    }
  });
  expect(gaps[0].metrics.lines).toBe(0);
});

test('counts an uncovered statement without a location as a line gap', () => {
  const gaps = parseCoverageJson({
    'src/partially-mapped.mjs': {
      statementMap: { 0: { start: { line: 4 } }, 1: {} }, s: { 0: 1, 1: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {}
    }
  });
  expect(gaps[0].metrics.lines).toBe(0);
  expect(gaps[0].lines).toEqual([]);
});

test('reports a passing fixture with a coverage gap', async () => {
  const messages = [];
  const cwd = resolve(process.cwd(), 'test-fixtures/coverage-gap');
  const code = await runToolkit({
    cwd,
    runnerArguments: [],
    write: (message) => messages.push(message),
    runTest: runJest,
    runLintCommand: async () => ({ code: 0, output: '' })
  });
  expect(code).toBeGreaterThan(1);
  expect(messages.join('')).toContain('branch.mjs');
  expect(messages.join('')).toContain('Coverage gaps');
  expect(messages.join('')).toContain('Uncovered branches:');
  expect(messages.join('')).toContain('Fix: add or extend tests');
});

test('executes both outcomes of the coverage-gap fixture branch', async () => {
  const { branch } = await import('../test-fixtures/coverage-gap/src/branch.mjs');
  expect(branch(true)).toBe('taken');
  expect(branch(false)).toBe('not taken');
});
