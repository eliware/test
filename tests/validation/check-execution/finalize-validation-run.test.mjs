import { expect, test } from "@jest/globals";
import { finalizeValidationRun } from "../../../src/validation/check-execution/finalize-validation-run.mjs";

test("returns validation results without changing coverage artifacts", () => {
  const result = [{ ruleId: "E-0.1.4", status: "pass", message: "" }];
  expect(finalizeValidationRun({ result })).toBe(result);
});

test.each([
  [new Error("plan failed"), "plan failed"],
  ["plan failed", "plan failed"],
])("returns a plan failure as a validation result", (error, message) => {
  expect(finalizeValidationRun({ planFailure: { error } })).toEqual([
    { ruleId: "E-0.1.20", status: "fail", message },
  ]);
});
