import { expect, test } from "@jest/globals";
import { findProtectedNegationMatches } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/ignore-patterns/protected-negations/matched-names.mjs";

test.each([
  ["!nested/coverage/", ["coverage"]],
  ["!nested/dist/", ["dist"]],
  ["!**/.DS_Store", [".DS_Store"]],
  ["!nested/deep/Thumbs.db", ["Thumbs.db"]],
  ["!local.txt", []],
  ["!", []],
])("matches protected names from %s", (rule, expected) => {
  expect(findProtectedNegationMatches(rule)).toEqual(expected);
});
