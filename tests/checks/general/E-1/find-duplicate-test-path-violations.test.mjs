import { expect, test } from "@jest/globals";
import { findDuplicatePathViolations } from "../../../../src/checks/general/E-1/find-duplicate-test-path-violations.mjs";

test("detects duplicate source and test paths differing only by case", () => {
  expect(findDuplicatePathViolations(["A.mjs", "a.mjs"], ["A.test.mjs", "a.test.mjs"])).toEqual([
    "duplicate source paths differing only by case: A.mjs, a.mjs",
    "duplicate test paths differing only by case: A.test.mjs, a.test.mjs",
  ]);
});

test("accepts unique paths and empty collections", () => {
  expect(findDuplicatePathViolations(["a.mjs"], ["a.test.mjs"])).toEqual([]);
  expect(findDuplicatePathViolations([], [])).toEqual([]);
});
