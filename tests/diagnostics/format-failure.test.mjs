import { formatFailure } from '../../src/diagnostics/format-failure.mjs';

test('deduplicates diagnostics and removes coverage noise', () => {
  const output = formatFailure('Tests', { code: 1, output: 'Coverage report\nCoverage report\nFAIL example\nFAIL example' });
  expect(output.match(/FAIL example/g)).toHaveLength(1);
  expect(output).not.toContain('Coverage report');
});

test('includes the stage and exit code', () => {
  expect(formatFailure('Lint', { code: 13, output: 'warning' })).toContain('Lint failed (exit 13)');
});
