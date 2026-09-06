import { normalizeCoverageCount, normalizeCoverageEntry } from '../../src/coverage/normalize-coverage-entry.mjs';

test('normalizes valid counters and rejects invalid counters', () => {
  const entry = { statementMap: { 0: { start: { line: 1 } } }, s: { 0: '1' }, b: {}, f: {}, branchMap: {}, fnMap: {} };
  expect(normalizeCoverageEntry('file.mjs', entry).s[0]).toBe(1);
  expect(normalizeCoverageCount('file.mjs', 0)).toBe(0);
  expect(() => normalizeCoverageCount('file.mjs', -1)).toThrow('Malformed coverage entry');
});
