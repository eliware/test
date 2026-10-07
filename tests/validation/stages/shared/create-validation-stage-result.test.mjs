import { expect, test } from "@jest/globals";
import { createValidationStageResult } from "../../../../src/validation/stages/shared/create-validation-stage-result.mjs";

test("creates passing and failing cached stage records", () => {
  expect(createValidationStageResult("lint", 0, "", "report")).toEqual({
    ruleId: "stage:lint",
    stage: "lint",
    code: 0,
    status: "pass",
    message: "",
    output: "report",
  });
  expect(createValidationStageResult("jest", 2, "failed")).toMatchObject({
    ruleId: "stage:jest",
    status: "fail",
    code: 2,
  });
});
