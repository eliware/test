import { toProcessExitCode } from '../../src/application/to-process-exit-code.mjs';

test('converts structured and legacy numeric results', () => {
  expect(toProcessExitCode({ code: 13, category: 'lint-failure' })).toBe(13);
  expect(toProcessExitCode(0)).toBe(0);
  expect(() => toProcessExitCode({ category: 'success' })).toThrow(TypeError);
});
