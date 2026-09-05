import { isUsableCoverageReport } from '../../src/coverage/is-usable-coverage-report.mjs';

test('recognizes an instrumented report', () => {
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: { 0: 1 }, b: {}, f: {} } })).toBe(true);
  expect(isUsableCoverageReport({ file: {
    statementMap: { 0: {} }, s: { 0: 1 },
    branchMap: { 0: { locations: [{}, {}] } }, b: { 0: [1, 0] },
    fnMap: { 0: {} }, f: { 0: 1 },
  } })).toBe(true);
});

test('rejects empty reports but accepts valid zero-total entries', () => {
  expect(isUsableCoverageReport({})).toBe(false);
  expect(isUsableCoverageReport({ file: { statementMap: {}, s: {}, b: {}, f: {} } })).toBe(true);
});

test('rejects reports missing statement counters', () => {
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: {}, b: {}, f: {} } })).toBe(false);
});

test('rejects invalid counters and mismatched metric maps', () => {
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: { 0: -1 }, b: {}, f: {} } })).toBe(false);
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: { 0: 1 }, branchMap: {}, b: { 0: [1] }, f: {} } })).toBe(false);
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: { 0: 1 }, b: {}, fnMap: {}, f: { 0: Number.NaN } } })).toBe(false);
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: { 0: 1 }, branchMap: { 0: {} }, b: { 0: 'invalid' }, f: {} } })).toBe(false);
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: { 0: 1 }, b: {}, fnMap: { 0: {} }, f: { 0: -1 } } })).toBe(false);
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: { 0: 1 }, b: { 0: [1] }, f: {} } })).toBe(false);
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: { 0: 1 }, b: {}, f: { 0: 1 } } })).toBe(false);
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: { 0: 1 }, branchMap: { 0: { locations: [{}] } }, b: { 0: [1, 0] }, f: {} } })).toBe(false);
});

test('rejects non-object statement maps', () => {
  expect(isUsableCoverageReport({ file: { statementMap: [], s: {}, b: {}, f: {} } })).toBe(false);
  expect(isUsableCoverageReport({ file: { statementMap: null, s: {}, b: {}, f: {} } })).toBe(false);
  expect(isUsableCoverageReport({ file: { statementMap: 'invalid', s: {}, b: {}, f: {} } })).toBe(false);
});
