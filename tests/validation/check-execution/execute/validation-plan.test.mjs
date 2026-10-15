import { expect, jest, test } from "@jest/globals";
import { executeValidationPlan } from "../../../../src/validation/check-execution/execute/validation-plan.mjs";

function createStageRunners() {
  return Object.fromEntries(
    ["lint", "format", "audit", "outdated", "pack", "typecheck", "build", "jest"].map((stage) => [
      stage,
      jest.fn(async () => ({ stage, ruleId: `stage:${stage}`, status: "pass" })),
    ]),
  );
}

test("returns an empty result for an empty convention set", async () => {
  const validationStageRunners = createStageRunners();
  await expect(
    executeValidationPlan(
      [],
      { executeLint: true, executeAudit: true, validationStageRunners },
      new Set(),
    ),
  ).resolves.toEqual([]);
  expect(validationStageRunners.lint).toHaveBeenCalledTimes(1);
  expect(validationStageRunners.audit).toHaveBeenCalledTimes(1);
});

test("executes a defined convention check", async () => {
  const check = {
    ruleId: "E-1",
    run: async () => ({ ruleId: "E-1", status: "pass", message: "" }),
  };
  await expect(
    executeValidationPlan([check], { validationStageRunners: createStageRunners() }, new Set()),
  ).resolves.toEqual([{ ruleId: "E-1", status: "pass", message: "" }]);
});
