import { locationsForCounts } from '../../src/coverage/locations.mjs';
test('maps uncovered locations', () => expect(locationsForCounts({ a: { line: 1 } }, { a: 0 })).toEqual([{ line: 1 }]));
test('uses an empty location when metadata is absent', () => expect(locationsForCounts({}, { a: 0, b: 1 })).toEqual([{}]));
