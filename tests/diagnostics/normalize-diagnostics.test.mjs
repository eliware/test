import { normalizeDiagnostics } from '../../src/diagnostics/normalize-diagnostics.mjs';

test('deduplicates diagnostics and filters test coverage noise', () => {
  expect(normalizeDiagnostics('Coverage report\nproblem\nproblem\n', 'Tests')).toBe('problem\n');
});

test('deduplicates ANSI and whitespace variants', () => {
  expect(normalizeDiagnostics('\u001b[31mproblem\u001b[0m\nproblem   \n', 'Lint')).toBe('problem\n');
});

test('keeps lint coverage-looking output', () => {
  expect(normalizeDiagnostics('Coverage report\nwarning\n', 'Lint')).toBe('Coverage report\nwarning\n');
});
