import { detectWarnings } from '../../../src/validation/lint/detect-warnings.mjs';

test('detects warnings after ANSI removal', () => {
  expect(detectWarnings('\u001b[33mwarning:\u001b[0m unused')).toBe(true);
  expect(detectWarnings('all clear')).toBe(false);
});

test('recognizes common Oxlint warning diagnostics', () => {
  expect(detectWarnings('oxlint found 1 warning')).toBe(true);
  expect(detectWarnings('lint warning: unused variable')).toBe(true);
  expect(detectWarnings('error: unused variable')).toBe(false);
});

test('rejects malformed output values', () => {
  expect(() => detectWarnings(null)).toThrow(TypeError);
});
