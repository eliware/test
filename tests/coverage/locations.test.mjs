import { locationsForCounts } from '../../src/coverage/locations.mjs';
test('maps uncovered locations', () => expect(locationsForCounts({ a: { line: 1 } }, { a: 0 })).toEqual([{ line: 1 }]));
test('marks missing metadata explicitly', () => expect(locationsForCounts({}, { a: 0, b: 1 })).toEqual([{ unknown: true }]));
test('handles malformed counter shapes explicitly', () => {
  expect(locationsForCounts({}, null)).toEqual([{ unknown: true }]);
  expect(locationsForCounts({}, [])).toEqual([{ unknown: true }]);
  expect(locationsForCounts(null, { a: 0 })).toEqual([{ unknown: true }]);
});
