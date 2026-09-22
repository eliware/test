import { expect, jest, test } from "@jest/globals";
import { prepareValidationPlan } from "../../src/orchestrators/prepare-validation-plan.mjs";

test("prepares a focused validation plan with context and exemptions", async () => {
  const checks = ["E-1.4", "E-1.17", "E-1.20", "E-1.20.10", "E-1.20.20", "E-1.20.16"].map((ruleId) => ({ ruleId, focusedSafe: ruleId !== "E-1.20.16" }));
  const dependencies = {
    loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general"] } })),
    discoverAllChecks: jest.fn(async () => checks),
    selectConventionChecks: jest.fn(async () => checks),
    validateBundledDirectiveCompleteness: jest.fn(async () => true),
    prepareValidationExemptions: jest.fn(() => new Set(["E-9"])),
    findRepositoryFiles: jest.fn(async () => []),
  };
  const plan = await prepareValidationPlan("/repo", ["E-9"], { jestArgs: ["tests/a.test.mjs"] }, dependencies);
  expect(plan.checks.map(({ ruleId }) => ruleId)).toEqual(["E-1.4", "E-1.17", "E-1.20", "E-1.20.10", "E-1.20.20"]);
  expect(plan.exemptions).toEqual(new Set(["E-9"]));
  expect(plan.context).toEqual(expect.objectContaining({ root: "/repo", focusedScope: expect.objectContaining({ sourcePath: "src/a.mjs" }) }));
});

test("keeps the complete selected plan when no focused path is supplied", async () => {
  const checks = [{ ruleId: "E-1.20", run() {} }, { ruleId: "E-1.20.16", run() {} }];
  const dependencies = {
    loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general"] } })),
    discoverAllChecks: jest.fn(async () => checks),
    selectConventionChecks: jest.fn(async () => checks),
    validateBundledDirectiveCompleteness: jest.fn(async () => true),
    prepareValidationExemptions: jest.fn(() => new Set()),
    findRepositoryFiles: jest.fn(async () => []),
  };
  const plan = await prepareValidationPlan("/repo", [], {}, dependencies);
  expect(plan.checks).toBe(checks);
});
