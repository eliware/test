import { buildCoverageGap } from '../../src/coverage/build-gap.mjs';
test('builds a coverage gap', () => expect(buildCoverageGap('a', [{ type: 'statement' }], [], [], { a: 0 }, {}, {}, new Map([[1, 0]]), 0, false)).toMatchObject({ file: 'a', lines: [1] }));
test('returns null when every metric is complete', () => expect(buildCoverageGap('a', [], [], [], { a: 1 }, {}, {}, new Map([[1, 1]]), 0, false)).toBeNull());
test('uses line gaps and unknown line fallback', () => {
  expect(buildCoverageGap('a', [], [], [], {}, {}, {}, new Map(), 0, true).metrics.lines).toBe(0);
  expect(buildCoverageGap('a', [{ type: 'statement' }], [], [], {}, {}, {}, new Map([[3, 0], [1, 0]]), 1, false).lines).toEqual([1, 3]);
});
