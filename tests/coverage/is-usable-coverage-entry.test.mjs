import { isUsableCoverageEntry } from '../../src/coverage/is-usable-coverage-entry.mjs';

const entry = {
  statementMap: { 0: {} },
  s: { 0: 1 },
  branchMap: { 0: { locations: [{}, {}] } },
  b: { 0: [1, 0] },
  fnMap: { 0: {} },
  f: { 0: 1 },
};

test('accepts a complete aligned coverage entry', () => {
  expect(isUsableCoverageEntry(entry)).toBe(true);
});

test('accepts an empty zero-total entry', () => {
  expect(isUsableCoverageEntry({ statementMap: {}, s: {}, b: {}, f: {} })).toBe(true);
});

test('rejects missing or misaligned metric data', () => {
  expect(isUsableCoverageEntry(null)).toBe(false);
  expect(isUsableCoverageEntry({ ...entry, s: {} })).toBe(false);
  expect(isUsableCoverageEntry({ ...entry, b: { 0: [1] } })).toBe(false);
  expect(isUsableCoverageEntry({ ...entry, l: { 0: 1 } })).toBe(false);
});

test('accepts numeric string line-map counters', () => {
  expect(isUsableCoverageEntry({ statementMap: {}, s: {}, b: {}, f: {}, l: { 1: '0' } })).toBe(true);
});

test('accepts numeric string counters consistently across metrics', () => {
  expect(isUsableCoverageEntry({ statementMap: { 0: {} }, s: { 0: '1' }, branchMap: { 0: { locations: [{}] } }, b: { 0: ['0'] }, fnMap: { 0: {} }, f: { 0: '1' } })).toBe(true);
});
