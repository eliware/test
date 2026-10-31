import { expect, test } from "@jest/globals";
import { hasSmokeTargetBoundaryOverlap } from "../../../../../src/validation/stages/smoke/validate/target-boundary.mjs";

test.each([
  ["/source", "/source/child", true],
  ["/source/child", "/source", true],
  ["/source", "/consumer", false],
])("checks overlap between source %s and target %s", (source, target, expected) => {
  expect(hasSmokeTargetBoundaryOverlap(source, target)).toBe(expected);
});
