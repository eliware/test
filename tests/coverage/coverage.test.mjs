import { normalizeCoverageCount, parseCoverageJson } from '../../src/coverage/coverage.mjs';

test('returns no gaps for complete coverage including default arguments', () => {
  expect(parseCoverageJson({
    'src/complete.mjs': {
      statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 },
      branchMap: { 0: { type: 'default-arg', locations: [{ start: { line: 1 } }] } }, b: { 0: [1] },
      fnMap: { 0: { name: 'complete', loc: { start: { line: 1 } } } }, f: { 0: 1 },
    },
  })).toEqual([]);
});

test('composes statement, branch, function, and line gaps', () => {
  const gaps = parseCoverageJson({
    'src/incomplete.mjs': {
      statementMap: { 0: { start: { line: 2 } } }, s: { 0: 0 },
      branchMap: { 0: { type: 'if', locations: [{ start: { line: 3 } }] } }, b: { 0: [0] },
      fnMap: { 0: { name: 'choose', loc: { start: { line: 4 } } } }, f: { 0: 0 },
    },
  });
  expect(gaps[0].metrics).toEqual({ statements: 0, branches: 0, functions: 0, lines: 0 });
  expect(gaps[0].lines).toEqual([2]);
});

test('counts uncovered default-argument branches', () => {
  const gaps = parseCoverageJson({
    'src/default.mjs': {
      statementMap: { 0: { start: { line: 2 } } }, s: { 0: 0 },
      branchMap: { 0: { type: 'default-arg', locations: [{ start: { line: 1 } }] }, 1: { type: 'if', locations: [{ start: { line: 3 } }] } },
      b: { 0: [0], 1: [1] }, fnMap: { 0: {} }, f: { 0: 1 },
    },
  });
  expect(gaps[0].metrics.branches).toBe(50);
});

test('supports explicit line maps and numeric counters', () => {
  const gaps = parseCoverageJson({
    'src/mapped.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: '1' }, l: { 1: '0' }, branchMap: {}, b: {}, fnMap: {}, f: {} },
  });
  expect(gaps[0].lines).toEqual([1]);
});

test('handles sparse top-level reports safely', () => {
  expect(parseCoverageJson(null)).toEqual([]);
  expect(parseCoverageJson([])).toEqual([]);
  expect(parseCoverageJson('invalid')).toEqual([]);
  expect(parseCoverageJson({ 'src/empty.mjs': { statementMap: {}, s: {}, b: {}, fnMap: {}, f: {} } })).toEqual([]);
});

test('rejects malformed coverage entries', () => {
  expect(() => parseCoverageJson({ 'src/bad.mjs': { statementMap: {} } })).toThrow('Malformed coverage entry');
  expect(() => parseCoverageJson({ 'src/bad.mjs': { statementMap: { 0: {} }, s: { 0: 1 }, b: { 0: 'bad' }, fnMap: {}, f: {} } })).toThrow('Malformed coverage entry');
});

test('revalidates normalized coverage counters', () => {
  expect(normalizeCoverageCount('src/safe.mjs', String(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
  expect(() => normalizeCoverageCount('src/negative.mjs', -1)).toThrow('Malformed coverage entry');
  expect(() => parseCoverageJson({ 'src/unsafe.mjs': { statementMap: { 0: {} }, s: { 0: '9007199254740992' }, b: {}, fnMap: {}, f: {} } })).toThrow('Malformed coverage entry');
});
