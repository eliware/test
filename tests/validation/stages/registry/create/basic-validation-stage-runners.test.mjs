import { expect, test } from "@jest/globals";
import { createBasicValidationStageRunners } from "../../../../../src/validation/stages/registry/create/basic-validation-stage-runners.mjs";

test("uses default stage tools when no overrides are given", () => {
  const runners = createBasicValidationStageRunners();
  expect(Object.keys(runners)).toEqual(["jest", "lint", "format", "audit"]);
});
