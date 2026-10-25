import { expect, test } from "@jest/globals";
import { validateRequiredWorkflowStepConditions } from "../../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/step/required-conditions.mjs";

test("accepts required steps without conditional fields", () => {
  expect(validateRequiredWorkflowStepConditions([{ run: "npm ci" }, { run: "npm test" }])).toEqual(
    [],
  );
});

test.each([{ if: "always()" }, { "continue-on-error": true }])(
  "rejects conditional required-step fields",
  (field) => {
    expect(validateRequiredWorkflowStepConditions([{ run: "npm test", ...field }])).toEqual([
      "ci.yaml required validation steps must run unconditionally without continue-on-error.",
    ]);
  },
);
