import { expect, test } from "@jest/globals";
import { normalizeFocusedFormatterPaths } from "../../../../src/validation/stages/format/normalize-focused-formatter-paths.mjs";

test("normalizes Windows separators while preserving invalid non-string entries", () => {
  expect(normalizeFocusedFormatterPaths(["src\\sample.mjs", 4])).toEqual(["src/sample.mjs", 4]);
  expect(normalizeFocusedFormatterPaths(null)).toBeNull();
});
