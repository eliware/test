import { expect, test } from "@jest/globals";
import { resolveFocusedTestPaths } from "../../src/cli/resolve-focused-test-paths.mjs";

test("returns a single supported test file before the Jest separator", () => {
  expect(resolveFocusedTestPaths(["tests/example.test.mjs"], false)).toEqual([
    "tests/example.test.mjs",
  ]);
});

test("returns multiple supported test files in the supplied order", () => {
  expect(resolveFocusedTestPaths(["tests/first.test.mjs", "tests/second.spec.ts"], false)).toEqual([
    "tests/first.test.mjs",
    "tests/second.spec.ts",
  ]);
});

test("rejects forwarded and unsupported focused paths", () => {
  expect(() => resolveFocusedTestPaths(["--", "tests/example.test.mjs"], false)).toThrow(
    "before the -- separator",
  );
  expect(() => resolveFocusedTestPaths(["--", "tests/example.test.mjs"], true)).toThrow(
    "cannot be combined with tool modes",
  );
  expect(() => resolveFocusedTestPaths(["src/example.mjs"], false)).toThrow("must be under tests/");
});

test("rejects focused tests with tool modes and allows non-path mode arguments", () => {
  expect(() => resolveFocusedTestPaths(["tests/example.test.mjs"], true)).toThrow(
    "cannot be combined with tool modes",
  );
  expect(resolveFocusedTestPaths([], true)).toEqual([]);
});
