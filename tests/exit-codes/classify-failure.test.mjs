import { EXIT_CODES } from '../../src/exit-codes/codes.mjs';
import { classifyFailure } from '../../src/exit-codes/classify-failure.mjs';

test('maps known stages to stable exit codes', () => {
  expect(classifyFailure('lint')).toBe(EXIT_CODES.LINT_FAILURE);
  expect(classifyFailure('TYPECHECK')).toBe(EXIT_CODES.TYPECHECK_FAILURE);
  expect(classifyFailure('unknown')).toBe(EXIT_CODES.INTERNAL);
});
