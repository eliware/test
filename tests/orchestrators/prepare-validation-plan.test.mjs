import { expect, jest, test } from "@jest/globals";
import { prepareValidationPlan } from "../../src/orchestrators/prepare-validation-plan.mjs";

test("prepares a focused validation plan with context and exemptions", async () => {
  const checks = [{ ruleId: "E-1.20" }, { ruleId: "E-1.20.16" }];
  const dependencies = {
    loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general"] } })),
    discoverAllChecks: jest.fn(async () => checks),
    selectConventionChecks: jest.fn(async () => checks),
    validateBundledDirectiveCompleteness: jest.fn(async () => true),
    prepareValidationExemptions: jest.fn(() => new Set(["E-9"])),
  };
  const plan = await prepareValidationPlan("/repo", ["E-9"], { jestArgs: ["tests/a.test.mjs"] }, dependencies);
  expect(plan.checks).toEqual([{ ruleId: "E-1.20" }]);
  expect(plan.exemptions).toEqual(new Set(["E-9"]));
  expect(plan.context).toEqual(expect.objectContaining({ root: "/repo" }));
});
