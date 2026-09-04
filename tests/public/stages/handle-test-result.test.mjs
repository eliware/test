import { jest } from '@jest/globals';
import { handleTestResult } from '../../../src/public/stages/handle-test-result.mjs';

test('passes through setup and cleanup failures', () => {
  expect(handleTestResult({ code: 8 }, () => {})).toBe(8);
  expect(handleTestResult({ code: 7 }, () => {})).toBe(7);
});

test('formats test failure and returns public code', () => {
  const write = jest.fn();
  expect(handleTestResult({ code: 1, output: 'boom' }, write)).toBe(9);
  expect(write.mock.calls[0][0]).toContain('Tests failed');
});

test('preserves an already normalized test failure code', () => {
  expect(handleTestResult({ code: 9, output: 'boom' }, () => {})).toBe(9);
});

test('returns null for successful tests', () => {
  expect(handleTestResult({ code: 0, output: '' }, () => {})).toBeNull();
});
