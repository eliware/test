import { formatFailure } from '../../../src/runner/diagnostics/output.mjs';
test('deduplicates diagnostics and removes coverage noise', () => { const output = formatFailure('Tests', { code: 1, output: 'Coverage report\nCoverage report\nFAIL example\nFAIL example' }); expect(output.match(/FAIL example/g)).toHaveLength(1); expect(output).not.toContain('Coverage report'); });
