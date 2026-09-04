import { parseJsonReport } from '../../src/coverage/parse-json-report.mjs';

const entry = (count) => ({
  statementMap: { 0: { start: { line: 1 } } },
  s: { 0: count },
  branchMap: {},
  b: {},
  fnMap: {},
  f: {}
});

test('requires a coverage object', () => {
  expect(() => parseJsonReport(null)).toThrow(TypeError);
  expect(() => parseJsonReport([])).toThrow(TypeError);
  expect(() => parseJsonReport('invalid')).toThrow(TypeError);
});

test('returns no gaps for complete coverage and reports incomplete coverage', () => {
  expect(parseJsonReport({ 'src/complete.mjs': entry(1) })).toEqual([]);
  expect(parseJsonReport({ 'src/gap.mjs': entry(0) })).toHaveLength(1);
});
