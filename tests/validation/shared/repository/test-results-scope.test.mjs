import { expect, test } from "@jest/globals";
import {
  includesScopedTestResults,
  includesTestResultsAt,
} from "../../../../src/validation/shared/repository/test-results-scope.mjs";

test("includes test-results at repository or selected scope level", () => {
  expect(includesTestResultsAt("test-results", false, [])).toBe(false);
  expect(includesTestResultsAt("src/test-results", false, ["src"])).toBe(true);
  expect(includesTestResultsAt("test-results", true, [])).toBe(true);
});

test("checks each test-results directory in a requested subtree", () => {
  expect(includesScopedTestResults("src/test-results/nested", false, ["src"])).toBe(true);
  expect(includesScopedTestResults("test-results/nested", false, ["src"])).toBe(false);
  expect(includesScopedTestResults("src/tests", false, [])).toBe(true);
});
