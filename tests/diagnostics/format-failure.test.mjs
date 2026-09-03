import { formatFailure } from '../../src/diagnostics/format-failure.mjs';

test('deduplicates diagnostics and removes coverage noise', () => {
  const output = formatFailure('Tests', { code: 1, output: 'Coverage report\nCoverage report\nFAIL example\nFAIL example' });
  expect(output.match(/FAIL example/g)).toHaveLength(1);
  expect(output).not.toContain('Coverage report');
});

test('includes the stage and exit code', () => {
  expect(formatFailure('Lint', { code: 13, output: 'warning' })).toContain('Lint failed (exit 13)');
});

test('validates stage and result inputs', () => {
  expect(() => formatFailure('', {})).toThrow(TypeError);
  expect(() => formatFailure(null, {})).toThrow(TypeError);
  expect(() => formatFailure('Tests', null)).toThrow(TypeError);
  expect(() => formatFailure('Tests', 'invalid')).toThrow(TypeError);
});

test('normalizes malformed results and filters all coverage-only lines', () => {
  const output = formatFailure('Tests', {
    code: 'bad',
    output: '\u001b[32mCoverage report\u001b[0m\nFile | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\n----- | ----- | ----- | ----- | -----\nAll files | 100 | 100 | 100 | 100 |\nfile.mjs | 90% (9/10) | 100% | 100% | 100% |\nuseful diagnostic'
  });

  expect(output).toBe('Tests failed (exit 1)\nuseful diagnostic');
  expect(formatFailure('Lint', { output: 42 })).toBe('Lint failed (exit 1)\n');
});
