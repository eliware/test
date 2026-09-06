import { formatLegacyGap, formatStructuredGap } from '../../src/coverage/format-gap-entry.mjs';

test('formats legacy and structured gap entries', () => {
  expect(formatLegacyGap({ file: 'src/a.mjs', metrics: ['90%', '100%', '100%', '90%'] })).toContain('90%');
  expect(formatStructuredGap({ file: 'src/a.mjs', metrics: { statements: 90, branches: 100, functions: 100, lines: 90 }, lines: [2] })).toContain('uncovered lines: 2');
});
