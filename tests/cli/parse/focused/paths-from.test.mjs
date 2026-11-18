import { expect, test } from "@jest/globals";
import focusedPathsFrom from "../../../../src/cli/parse/focused/paths-from.mjs";

test("returns all focused test paths and handles options", () => {
  expect(focusedPathsFrom(["tests/a.test.mjs", "src/main.mjs", "tests/b.spec.mjs"])).toEqual([
    "tests/a.test.mjs",
    "tests/b.spec.mjs",
  ]);
  expect(focusedPathsFrom(["--config", "tests/jest.config.mjs", "tests"])).toEqual(["tests"]);
  expect(focusedPathsFrom()).toEqual([]);
});
