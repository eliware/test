import { normalizeDiagnostics } from '../../src/diagnostics/normalize-diagnostics.mjs';

test('deduplicates diagnostics and filters test coverage noise', () => {
  expect(normalizeDiagnostics('Coverage report\nproblem\nproblem\n', 'Tests')).toBe('problem\n');
});

test('keeps lint coverage-looking output', () => {
  expect(normalizeDiagnostics('Coverage report\nwarning\n', 'Lint')).toBe('Coverage report\nwarning\n');
});
