import { expect, test } from "@jest/globals";
import { validateValidationJobConditions } from "../../../../../src/checks/general/E-1/E-1.24/validate-validation-job-conditions.mjs";

test("accepts unconditional required validation steps", () => {
  expect(validateValidationJobConditions({ step: {} }, { step: {} }, {})).toBeNull();
});

test("rejects skippable jobs and required steps", () => {
  expect(validateValidationJobConditions({}, {}, { if: "false" })).toContain("validation job");
  expect(validateValidationJobConditions({ step: { if: "false" } }, { step: {} }, {})).toContain("npm ci or npm test");
});
