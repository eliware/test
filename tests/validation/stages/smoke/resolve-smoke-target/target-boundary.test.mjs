import { expect, test } from "@jest/globals";
import { validateSmokeTargetBoundary } from "../../../../../src/validation/stages/smoke/resolve-smoke-target/target-boundary.mjs";

test.each([
  ["/repo", "/repo/nested", "Smoke target must resolve outside the source checkout."],
  ["/repo/nested", "/repo", "Smoke target must resolve outside the source checkout."],
  ["/repo", "/consumer", null],
])("validates the source and target boundary", (source, target, expected) => {
  expect(validateSmokeTargetBoundary(source, target)).toBe(expected);
});
