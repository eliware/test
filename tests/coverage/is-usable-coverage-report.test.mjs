import { isUsableCoverageReport } from '../../src/coverage/is-usable-coverage-report.mjs';

test('recognizes an instrumented report', () => {
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: { 0: 1 }, b: {}, f: {} } })).toBe(true);
});

test('rejects empty or malformed reports', () => {
  expect(isUsableCoverageReport({})).toBe(false);
  expect(isUsableCoverageReport({ file: { statementMap: {}, s: {}, b: {}, f: {} } })).toBe(false);
});

test('rejects reports missing statement counters', () => {
  expect(isUsableCoverageReport({ file: { statementMap: { 0: {} }, s: {}, b: {}, f: {} } })).toBe(false);
});
