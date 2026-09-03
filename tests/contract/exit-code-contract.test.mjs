import { EXIT_CODES } from '../../src/exit-codes/codes.mjs';
import { classifyFailure } from '../../src/exit-codes/classify-failure.mjs';

test('exposes the complete stable exit-code contract', () => {
  expect(EXIT_CODES).toMatchObject({
    WORKSPACE_SETUP: 2, ISTANBUL_POLICY: 3, INVALID_ARGUMENT: 4,
    FOCUSED_PATH_VALIDATION: 5, FOCUSED_PATH_MISSING: 6, COVERAGE_CLEANUP: 7,
    TEST_START: 8, TEST_FAILURE: 9, COVERAGE_FAILURE: 10, COVERAGE_GAP: 11,
    LINT_START: 12, LINT_FAILURE: 13, INTERNAL: 14, AUDIT_FAILURE: 15,
    PACK_FAILURE: 16, BUILD_FAILURE: 17, MONOLITH_LIMIT: 18, TYPECHECK_FAILURE: 19
  });
  expect(new Set(Object.values(EXIT_CODES)).size).toBe(Object.keys(EXIT_CODES).length);
  expect(Object.isFrozen(EXIT_CODES)).toBe(true);
});

test('classifies known stages and uses the internal fallback', () => {
  expect(classifyFailure('lint')).toBe(EXIT_CODES.LINT_FAILURE);
  expect(classifyFailure('TYPECHECK')).toBe(EXIT_CODES.TYPECHECK_FAILURE);
  expect(classifyFailure('unknown')).toBe(EXIT_CODES.INTERNAL);
  expect(classifyFailure(null, 99)).toBe(99);
  expect(classifyFailure('unknown', 99)).toBe(99);
});
