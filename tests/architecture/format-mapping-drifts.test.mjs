import { formatMappingDrifts } from '../../src/architecture/format-mapping-drifts.mjs';

test('itemizes missing and orphan module pairs', () => {
  expect(formatMappingDrifts({ missingTests: ['a'], orphanTests: ['b'] })).toBe('Source/test mapping drift detected:\n  Missing test pair: src/a.mjs (expected tests/a.test.mjs)\n  Test without source pair: tests/b.test.mjs\n');
});

test('deduplicates and bounds repeated drift entries', () => {
  const missingTests = Array.from({ length: 21 }, (_, index) => `module-${index}`);
  const output = formatMappingDrifts({ missingTests: [...missingTests, 'module-0'] });
  expect(output.match(/Missing test pair/g)).toHaveLength(20);
  expect(output).toContain('... 1 more omitted');
});
