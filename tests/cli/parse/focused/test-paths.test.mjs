import { expect, test } from "@jest/globals";
import getFocusedTestPaths from "../../../../src/cli/parse/focused/test-paths.mjs";

test("classifies forwarded and positional test paths", () => {
  expect(getFocusedTestPaths(["tests/a.test.mjs", "src/a.mjs", "/repo/tests/b.spec.ts"])).toEqual([
    "tests/a.test.mjs",
    "/repo/tests/b.spec.ts",
  ]);
  expect(getFocusedTestPaths(["tests/a.test.mjs", "src/a.mjs", "tests"], "positional")).toEqual([
    "tests/a.test.mjs",
    "tests",
  ]);
});

test("uses empty paths by default", () => {
  expect(getFocusedTestPaths()).toEqual([]);
});
