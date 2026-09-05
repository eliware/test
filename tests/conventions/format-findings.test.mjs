import { formatConventionFindings } from '../../src/conventions/format-findings.mjs';

test('groups, sorts, and deduplicates convention findings', () => {
  expect(formatConventionFindings([{ group: 'z', message: 'b' }, { group: 'a', message: 'c' }, { group: 'z', message: 'b' }])).toBe('Repository convention validation failed:\na:\n  - c\nz:\n  - b\n');
});
