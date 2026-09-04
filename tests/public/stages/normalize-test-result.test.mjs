import { normalizeTestResult } from '../../../src/public/stages/normalize-test-result.mjs';

test('normalizes missing result fields', () => {
  expect(normalizeTestResult({ extra: true })).toEqual({ extra: true, code: 1, output: '' });
});

test('preserves valid result fields', () => {
  expect(normalizeTestResult({ code: 0, output: 'ok' })).toEqual({ code: 0, output: 'ok' });
});

test('normalizes negative child codes', () => {
  expect(normalizeTestResult({ code: -1 })).toMatchObject({ code: 1 });
});
