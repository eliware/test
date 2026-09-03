import { commandSucceeded, normalizeCommandResult } from '../../src/processes/command-result.mjs';

test('normalizes valid and malformed command results', () => {
  expect(normalizeCommandResult({ code: 0, output: 'ok' })).toEqual({ code: 0, output: 'ok' });
  expect(normalizeCommandResult({ code: -1, output: 7 })).toMatchObject({ code: 1, output: '' });
});

test('detects command success', () => {
  expect(commandSucceeded({ code: 0 })).toBe(true);
  expect(commandSucceeded({ code: 2 })).toBe(false);
});
