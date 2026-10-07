import { expect, test } from "@jest/globals";
import { executeValidationPlan } from "../../../src/validation/check-execution/execute-validation-plan.mjs";

test("returns an empty result for an empty convention set", async () => {
  await expect(
    executeValidationPlan([], { executeLint: true, executeAudit: true }, new Set()),
  ).resolves.toEqual([]);
});

test("executes a defined convention check", async () => {
  const check = {
    ruleId: "E-1",
    run: async () => ({ ruleId: "E-1", status: "pass", message: "" }),
  };
  await expect(executeValidationPlan([check], {}, new Set())).resolves.toEqual([
    { ruleId: "E-1", status: "pass", message: "" },
  ]);
});
