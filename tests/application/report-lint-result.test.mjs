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
