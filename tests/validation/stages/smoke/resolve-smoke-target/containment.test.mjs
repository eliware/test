import { expect, test } from "@jest/globals";
import { containsOrMatches } from "../../../../../src/validation/stages/smoke/resolve-smoke-target/containment.mjs";

test.each([
  ["/source", "/source", true],
  ["/source", "/source/nested", true],
  ["/source/nested", "/source", false],
  ["/source", "/source-copy", false],
  ["C:/source", "D:/consumer", false],
])("checks whether %s contains or matches %s", (parent, path, expected) => {
  expect(containsOrMatches(parent, path)).toBe(expected);
});
