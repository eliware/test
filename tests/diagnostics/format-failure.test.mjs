import { formatFailure } from '../../src/diagnostics/format-failure.mjs';

test('includes the stage and exit code', () => {
  expect(formatFailure('Lint', { code: 13, output: 'warning' })).toContain('Lint failed (exit 13)');
});

test('validates stage and result inputs', () => {
  expect(() => formatFailure('', {})).toThrow(TypeError);
  expect(() => formatFailure(null, {})).toThrow(TypeError);
  expect(() => formatFailure('Tests', null)).toThrow(TypeError);
  expect(() => formatFailure('Tests', 'invalid')).toThrow(TypeError);
});

test('normalizes malformed results', () => {
  const output = formatFailure('Tests', {
    code: 'bad',
    output: '\u001b[32mCoverage report\u001b[0m\nFile | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #\n----- | ----- | ----- | ----- | -----\nAll files | 100 | 100 | 100 | 100 |\nfile.mjs | 90% (9/10) | 100% | 100% | 100% |\nuseful diagnostic'
  });

  expect(output).toBe('Tests failed (exit 1)\nuseful diagnostic');
});

test('normalizes non-string output after filtering coverage-only lines', () => {
  expect(formatFailure('Lint', { output: 42 })).toBe('Lint failed (exit 1)\n');
});

test('normalizes ANSI and workspace paths in failures', () => {
  expect(formatFailure('Tests', { code: 1, output: '\u001b[31mC:/repo/src/a.mjs failed\u001b[0m' }, 'C:/repo'))
    .toBe('Tests failed (exit 1)\n<workspace>/src/a.mjs failed');
});
