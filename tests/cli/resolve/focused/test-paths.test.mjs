import { expect, test } from "@jest/globals";
import { resolveFocusedTestPaths } from "../../../../src/cli/resolve/focused/test-paths.mjs";

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
  expect(() =>
    resolveFocusedTestPaths(
      [
        "--",
        "not-a-test",
        "/repo/tests/example.test.mjs",
        "C:\\repo\\tests\\example.test.mjs",
        "\\\\server\\share\\tests\\example.test.mjs",
        "C:\\repo\\file.txt",
      ],
      false,
    ),
  ).toThrow("before the -- separator");
  expect(() => resolveFocusedTestPaths(["--", "tests/example.test.mjs"], true)).toThrow(
    "cannot be combined with tool modes",
  );
  expect(() => resolveFocusedTestPaths(["src/example.mjs"], false)).toThrow("must be under tests/");
});

test.each([
  "test/example.test.mjs",
  "specs/example.test.mjs",
  "unexpected-selector",
  "C:\\repo\\tests\\example.test.mjs",
])("rejects unsupported focused path %s", (path) => {
  expect(() => resolveFocusedTestPaths([path], false)).toThrow("must be under tests/");
});

test("rejects a focused path without a source module name", () => {
  expect(() => resolveFocusedTestPaths(["tests/.test.mjs"], false)).toThrow(
    "must have a source module name",
  );
});

test("rejects focused tests with tool modes and allows non-path mode arguments", () => {
  expect(() => resolveFocusedTestPaths(["tests/example.test.mjs"], true)).toThrow(
    "cannot be combined with tool modes",
  );
  expect(resolveFocusedTestPaths([], true)).toEqual([]);
});
