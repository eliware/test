import { expect, test } from "@jest/globals";
import focusedPathFrom from "../../../../src/cli/parse/focused/path-from.mjs";

test("returns the first focused test path and handles empty arguments", () => {
  expect(focusedPathFrom(["tests/a.test.mjs", "tests/b.test.mjs"])).toBe("tests/a.test.mjs");
  expect(focusedPathFrom(["src/main.mjs", "--runInBand"])).toBeUndefined();
  expect(focusedPathFrom()).toBeUndefined();
});
