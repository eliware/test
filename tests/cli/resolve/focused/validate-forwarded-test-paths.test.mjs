import { expect, test } from "@jest/globals";
import { validateForwardedTestPaths } from "../../../../src/cli/resolve/focused/validate-forwarded-test-paths.mjs";

test("accepts an empty forwarded path list", () => {
  expect(validateForwardedTestPaths([], false)).toBeNull();
});

test("requires forwarded focused paths before the separator", () => {
  expect(validateForwardedTestPaths(["tests/example.test.mjs"], false)).toBe(
    "Focused test paths must be supplied before the -- separator.",
  );
});

test("rejects forwarded focused paths when a tool mode is active", () => {
  expect(validateForwardedTestPaths(["C:\\repo\\tests\\example.test.mjs"], true)).toBe(
    "Focused test paths cannot be combined with tool modes.",
  );
});
