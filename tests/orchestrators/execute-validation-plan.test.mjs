import { expect, jest, test } from "@jest/globals";
import { executeValidationPlan } from "../../src/orchestrators/execute-validation-plan.mjs";

test("executes the selected validation plan", async () => {
  const timing = { step: jest.fn() };
  const checks = [{ ruleId: "E-1.0", run: async () => ({ status: "pass" }) }];
  await expect(executeValidationPlan(checks, { timing }, new Set())).resolves.toEqual([
    { ruleId: "E-1.0", status: "pass" },
  ]);
  expect(timing.step).toHaveBeenCalledWith("E-1.0 started", "E-1.0 completed");
});

test("does not execute an exempted plan item", async () => {
  const run = jest.fn();
  await expect(executeValidationPlan(
    [{ ruleId: "E-1.0", run }],
    {},
    new Set(["E-1.0"]),
  )).resolves.toEqual([]);
  expect(run).not.toHaveBeenCalled();
});
