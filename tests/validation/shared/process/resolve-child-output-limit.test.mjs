import { expect, test } from "@jest/globals";
import { resolveChildOutputLimit } from "../../../../src/validation/shared/process/resolve-child-output-limit.mjs";

test.each([
  [25, 25],
  [1.8, 1],
  [2_000_000, 1_000_000],
  [Number.NaN, 100_000],
  [Infinity, 100_000],
])("resolves the output limit %s to %s", (requested, expected) => {
  expect(resolveChildOutputLimit(requested)).toBe(expected);
});
