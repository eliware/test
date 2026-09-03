import { normalizeValidationResult, validationSucceeded } from '../../../src/validation/common/validation-result.mjs';

test('normalizes valid and missing validation results', () => {
  expect(normalizeValidationResult({ code: 0, output: 'ok' })).toEqual({ code: 0, output: 'ok' });
  expect(normalizeValidationResult(undefined)).toMatchObject({ code: 1, output: '' });
});

test('detects validation success', () => {
  expect(validationSucceeded({ code: 0 })).toBe(true);
  expect(validationSucceeded({ code: 1 })).toBe(false);
});
