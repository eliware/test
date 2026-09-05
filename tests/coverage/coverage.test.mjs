import { parseCoverageJson } from '../../src/coverage/coverage.mjs';

describe('coverage facade', () => {
  test('returns no gaps for complete coverage, including default arguments', () => {
    expect(parseCoverageJson({
      'src/complete.mjs': {
        statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
        branchMap: { 0: { type: 'default-arg', locations: [{ start: { line: 1 } }] } },
        b: { 0: [1] }, fnMap: { 0: { name: 'complete', loc: { start: { line: 1 } } } }, f: { 0: 1 }
      }
    })).toEqual([]);
  });

  test('composes statement, branch, function, and line gaps', () => {
    const gaps = parseCoverageJson({
      'src/incomplete.mjs': {
        statementMap: { 0: { start: { line: 2 } } }, s: { 0: 0 },
        branchMap: { 0: { type: 'if', locations: [{ start: { line: 3 } }] } }, b: { 0: [0] },
        fnMap: { 0: { name: 'choose', loc: { start: { line: 4 } } } }, f: { 0: 0 }
      }
    });
    expect(gaps[0].metrics).toEqual({ statements: 0, branches: 0, functions: 0, lines: 0 });
    expect(gaps[0].lines).toEqual([2]);
  });

  test('counts default-argument counters in branch metrics', () => {
    const gaps = parseCoverageJson({
      'src/incomplete-with-default.mjs': {
        statementMap: { 0: { start: { line: 2 } } }, s: { 0: 0 },
        branchMap: {
          0: { type: 'default-arg', locations: [{ start: { line: 1 } }] },
          1: { type: 'if', locations: [{ start: { line: 3 } }] }
        }, b: { 0: [0], 1: [1] },
        fnMap: { 0: { name: 'choose', loc: { start: { line: 4 } } } }, f: { 0: 1 }
      }
    });
    expect(gaps[0].metrics).toEqual({ statements: 0, branches: 50, functions: 100, lines: 0 });
    expect(gaps[0].branches).toEqual([{ start: { line: 1 }, type: 'default-arg' }]);
  });

  test('handles sparse and malformed top-level reports safely', () => {
    expect(parseCoverageJson(null)).toEqual([]);
    expect(parseCoverageJson([])).toEqual([]);
    expect(parseCoverageJson('invalid')).toEqual([]);
    expect(() => parseCoverageJson({ nullEntry: null, scalarEntry: 'invalid' })).toThrow('Malformed coverage entry');
    expect(() => parseCoverageJson({ 'src/unknown.mjs': { unexpected: true } })).toThrow('Malformed coverage entry');
  });

  test('enforces lines for an explicit nonempty line map with an uncovered unmappable statement', () => {
    const gaps = parseCoverageJson({
      'src/line-map.mjs': { statementMap: { 0: {} }, s: { 0: 0 }, l: { 1: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {} },
    });
    expect(gaps[0].metrics.lines).toBe(0);
  });

  test('reports uncovered lines from an authoritative line map', () => {
    const gaps = parseCoverageJson({
      'src/mapped-line.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, l: { 1: 0 }, branchMap: {}, b: {}, fnMap: {}, f: {} },
    });
    expect(gaps[0].metrics.lines).toBe(0);
    expect(gaps[0].lines).toEqual([1]);
  });

  test('normalizes numeric string explicit line counters', () => {
    expect(parseCoverageJson({
      'src/malformed-lines.mjs': {
        statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, l: { 1: '1' },
        branchMap: {}, b: {}, fnMap: {}, f: {}
      }
    })).toEqual([]);
  });

  test('normalizes numeric string statement, branch, and function counters', () => {
    expect(parseCoverageJson({
      'src/numeric-counters.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: '1' }, branchMap: { 0: { locations: [{}] } }, b: { 0: ['1'] }, fnMap: { 0: {} }, f: { 0: '1' } },
    })).toEqual([]);
  });

  test('rejects entries with inconsistent metric maps and counters', () => {
    expect(() => parseCoverageJson({
      'src/malformed.mjs': {
        statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
        branchMap: {}, b: { 0: 'invalid' }, fnMap: {}, f: 'invalid'
      }
    })).toThrow('Malformed coverage entry');
  });

  test('rejects entries with missing maps or malformed counters', () => {
    expect(() => parseCoverageJson({
      'src/missing.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 0 }, b: undefined, fnMap: {}, f: undefined }
    })).toThrow('Malformed coverage entry');
    expect(() => parseCoverageJson({
      'src/bad-branches.mjs': { statementMap: {}, s: {}, b: 'invalid', fnMap: {}, f: {} }
    })).toThrow('Malformed coverage entry');
    expect(parseCoverageJson({
      'src/empty.mjs': { statementMap: {}, s: {}, b: {}, fnMap: {}, f: {} }
    })).toEqual([]);
    expect(() => parseCoverageJson({ 'src/unknown.mjs': {} })).toThrow('Malformed coverage entry');
    expect(() => parseCoverageJson({
      'src/no-statement-counters.mjs': { statementMap: { 0: { start: { line: 1 } } }, b: {}, fnMap: {}, f: {} }
    })).toThrow('Malformed coverage entry');
  });

});

test('accepts a report containing both valid and zero-total entries', () => {
  expect(parseCoverageJson({
    'src/valid.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {} },
    'src/empty.mjs': { statementMap: {}, s: {}, branchMap: {}, b: {}, fnMap: {}, f: {} },
  })).toEqual([]);
});

test('rejects a report containing both valid and unrecognized entries', () => {
  expect(() => parseCoverageJson({
    'src/valid.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, branchMap: {}, b: {}, fnMap: {}, f: {} },
    'src/unknown.mjs': { generated: true },
  })).toThrow('Malformed coverage entry');
});
