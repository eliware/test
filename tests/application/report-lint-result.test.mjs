import { jest } from '@jest/globals';
import { reportLintResult } from '../../src/application/report-lint-result.mjs';

test('reports successful lint', () => {
  const write = jest.fn();
  expect(reportLintResult({ code: 0, output: '' }, write)).toBe(0);
  expect(write).toHaveBeenCalledWith('Lint passed: 0 warnings\n');
});

test('reports lint failures', () => {
  const write = jest.fn();
  expect(reportLintResult({ code: 1, output: 'failure' }, write)).toBe(13);
  expect(write.mock.calls[0][0]).toContain('failure');
});

test('reports failures when success output is disabled', () => {
  const write = jest.fn();
  expect(reportLintResult({ code: 1, output: 'warning' }, write, '.', { reportSuccess: false })).toBe(13);
  expect(write).toHaveBeenCalledWith(expect.stringContaining('Lint failed'));
});

test('suppresses only successful output when requested', () => {
  const write = jest.fn();
  expect(reportLintResult({ code: 0, output: '' }, write, '.', { reportSuccess: false })).toBe(0);
  expect(write).not.toHaveBeenCalled();
});
