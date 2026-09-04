import { parseCoverageJson } from '../../src/coverage/coverage.mjs';

describe('coverage facade', () => {
  test('returns no gaps for complete coverage, including default arguments', () => {
    expect(parseCoverageJson({
      'src/complete.mjs': {
        statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
        branchMap: { 0: { type: 'default-arg', locations: [{ start: { line: 1 } }] } },
        b: { 0: [0] }, fnMap: { 0: { name: 'complete', loc: { start: { line: 1 } } } }, f: { 0: 1 }
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

  test('handles sparse and malformed top-level reports safely', () => {
    expect(parseCoverageJson(null)).toEqual([]);
    expect(parseCoverageJson([])).toEqual([]);
    expect(parseCoverageJson('invalid')).toEqual([]);
    expect(parseCoverageJson({ nullEntry: null, scalarEntry: 'invalid', empty: {} })).toEqual([]);
  });

  test('retains a gap when a usable report has malformed metric data', () => {
    const gaps = parseCoverageJson({
      'src/malformed.mjs': {
        statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
        branchMap: {}, b: { 0: 'invalid' }, fnMap: {}, f: 'invalid'
      }
    });
    expect(gaps[0].branches).toEqual([{ type: 'branch' }]);
    expect(gaps[0].functions).toEqual([{ type: 'function', name: 'unknown' }]);
  });

  test('handles missing maps and malformed counters conservatively', () => {
    expect(parseCoverageJson({
      'src/missing.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 0 }, b: undefined, fnMap: {}, f: undefined }
    })[0].metrics).toMatchObject({ branches: 0, functions: 0 });
    expect(parseCoverageJson({
      'src/bad-branches.mjs': { statementMap: {}, s: {}, b: 'invalid', fnMap: {}, f: {} }
    })[0].branches).toEqual([{ type: 'branch' }]);
    expect(parseCoverageJson({
      'src/empty.mjs': { statementMap: {}, s: {}, b: {}, fnMap: {}, f: {} }
    })).toEqual([]);
    expect(parseCoverageJson({
      'src/no-statement-counters.mjs': { statementMap: { 0: { start: { line: 1 } } }, b: {}, fnMap: {}, f: {} }
    })[0].statements).toEqual([{ type: 'statement' }]);
  });
});
