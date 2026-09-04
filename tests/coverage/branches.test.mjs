import { uncoveredBranches } from '../../src/coverage/branches.mjs';
test('maps uncovered branches', () => expect(uncoveredBranches({ a: { type: 'if', locations: [{ start: { line: 1 } }] } }, 'a', [0])).toHaveLength(1));
test('handles missing branch metadata and malformed counts', () => { expect(uncoveredBranches({}, 'a', [0])).toEqual([{ type: 'branch' }]); expect(uncoveredBranches({}, 'a', 'bad')).toEqual([{ type: 'branch' }]); });
test('handles missing branch locations', () => expect(uncoveredBranches({ a: { type: 'if', locations: [] } }, 'a', [0])).toEqual([{ unknown: true, type: 'if' }]));
test('handles absent location arrays', () => expect(uncoveredBranches({ a: { type: 'if' } }, 'a', [0])).toEqual([{ unknown: true, type: 'if' }]));
test('handles null location arrays', () => expect(uncoveredBranches({ a: { type: 'if', locations: null } }, 'a', [0])).toEqual([{ unknown: true, type: 'if' }]));
test('uses a generic type when branch type is absent', () => expect(uncoveredBranches({ a: { locations: [] } }, 'a', [0])).toEqual([{ unknown: true, type: 'branch' }]));
test('skips default-argument branches', () => expect(uncoveredBranches({ a: { type: 'default-arg' } }, 'a', [0])).toEqual([]));
test('preserves covered branch entries and missing locations', () => {
  expect(uncoveredBranches({ a: { type: 'if', locations: [{ start: { line: 2 } }] } }, 'a', [1, 0]))
    .toEqual([{ unknown: true, type: 'if' }]);
});
