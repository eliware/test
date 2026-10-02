import { expect, test } from "@jest/globals";
import { resolveFocusedTestPaths } from "../../src/cli/resolve-focused-test-paths.mjs";

test("returns a single supported test file before the Jest separator", () => {
  expect(resolveFocusedTestPaths(["tests/example.test.mjs"], false)).toEqual([
    "tests/example.test.mjs",
  ]);
});

test("rejects forwarded, multiple, and unsupported focused paths", () => {
  expect(() => resolveFocusedTestPaths(["--", "tests/example.test.mjs"], false)).toThrow(
    "before the -- separator",
  );
  expect(() => resolveFocusedTestPaths(["--", "tests/example.test.mjs"], true)).toThrow(
    "cannot be combined with tool modes",
  );
  expect(() => resolveFocusedTestPaths(["tests/a.test.mjs", "tests/b.test.mjs"], false)).toThrow(
    "Only one focused test path",
  );
  expect(() => resolveFocusedTestPaths(["src/example.mjs"], false)).toThrow("must be under tests/");
});

test("rejects focused tests with tool modes and allows non-path mode arguments", () => {
  expect(() => resolveFocusedTestPaths(["tests/example.test.mjs"], true)).toThrow(
    "cannot be combined with tool modes",
  );
  expect(resolveFocusedTestPaths([], true)).toEqual([]);
});
