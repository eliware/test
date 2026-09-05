import { EXIT_CODES } from '../../src/exit-codes/codes.mjs';

test('defines stable unique wrapper exit codes', () => {
  expect(EXIT_CODES).toEqual({
    WORKSPACE_SETUP: 2,
    ISTANBUL_POLICY: 3,
    INVALID_ARGUMENT: 4,
    FOCUSED_PATH_VALIDATION: 5,
    FOCUSED_PATH_MISSING: 6,
    COVERAGE_CLEANUP: 7,
    TEST_START: 8,
    TEST_FAILURE: 9,
    COVERAGE_FAILURE: 10,
    COVERAGE_GAP: 11,
    LINT_START: 12,
    LINT_FAILURE: 13,
    INTERNAL: 14,
    MONOLITH_LIMIT: 15,
    ARCHITECTURE_MAPPING: 16,
    PACKAGE_SCRIPT_FAILURE: 17,
    CONVENTION_VALIDATION: 18,
  });
  expect(new Set(Object.values(EXIT_CODES)).size).toBe(Object.keys(EXIT_CODES).length);
});
