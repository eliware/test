import { expect, jest, test } from "@jest/globals";
import { prepareValidationPlan } from "../../../../src/validation/planning/prepare-validation/plan.mjs";
import { readProfileCombinationPolicy } from "../../../../src/validation/planning/read/profile-combination-policy.mjs";

test("prepares a focused validation plan with context and exemptions", async () => {
  const checks = ["E-0.1.4", "E-0.1.130.13", "E-0.1.130.14", "E-0.1.130.15", "E-0.1.130.10"].map(
    (ruleId) => ({ ruleId, focusedSafe: ruleId !== "E-0.1.130.10" }),
  );
  const dependencies = {
    readProfileCombinationPolicy: jest.fn(() => readProfileCombinationPolicy()),
    loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general", "application"] } })),
    discoverAllChecks: jest.fn(async () => checks),
    selectConventionChecks: jest.fn(async () => checks),
    validateBundledDirectiveCompleteness: jest.fn(async () => true),
    prepareValidationExemptions: jest.fn(() => new Set(["E-9"])),
    findRepositoryEntries: jest.fn(async () => []),
  };
  const plan = await prepareValidationPlan(
    "/repo",
    ["E-9"],
    { jestArgs: ["tests/a.test.mjs"], executeJest: true },
    dependencies,
  );
  expect(plan.checks.map(({ ruleId }) => ruleId)).toEqual([
    "E-0.1.4",
    "E-0.1.130.13",
    "E-0.1.130.14",
    "E-0.1.130.15",
  ]);
  expect(plan.exemptions).toEqual(new Set(["E-9"]));
  expect(dependencies.findRepositoryEntries).not.toHaveBeenCalled();
  expect(plan.context).toEqual(
    expect.objectContaining({
      root: "/repo",
      executeJest: true,
      focusedScope: expect.objectContaining({ sourcePath: "src/a.mjs" }),
      repositoryInventory: expect.objectContaining({ focusedScope: expect.any(Object) }),
    }),
  );
});

test("keeps the complete selected plan when no focused path is supplied", async () => {
  const checks = [{ ruleId: "E-0.1.130.10", run() {} }];
  const dependencies = {
    readProfileCombinationPolicy: jest.fn(() => readProfileCombinationPolicy()),
    loadValidationTarget: jest.fn(async () => ({
      eliware: { apply: ["general", "documentation", "private"] },
    })),
    discoverAllChecks: jest.fn(async () => checks),
    selectConventionChecks: jest.fn(async () => checks),
    validateBundledDirectiveCompleteness: jest.fn(async () => true),
    prepareValidationExemptions: jest.fn(() => new Set()),
    findRepositoryEntries: jest.fn(async () => []),
  };
  const plan = await prepareValidationPlan("/repo", [], { executeJest: true }, dependencies);
  expect(plan.checks).toBe(checks);
  expect(plan.context.executeJest).toBe(false);
});

test("rejects invalid profile combinations before check discovery", async () => {
  const dependencies = {
    readProfileCombinationPolicy: jest.fn(() => readProfileCombinationPolicy()),
    loadValidationTarget: jest.fn(async () => ({
      eliware: { apply: ["general", "library", "application", "npm-published"] },
    })),
    discoverAllChecks: jest.fn(),
    selectConventionChecks: jest.fn(),
    validateBundledDirectiveCompleteness: jest.fn(),
    prepareValidationExemptions: jest.fn(),
    findRepositoryEntries: jest.fn(),
  };
  await expect(prepareValidationPlan("/repo", [], {}, dependencies)).rejects.toThrow("conflict");
  expect(dependencies.discoverAllChecks).not.toHaveBeenCalled();
  expect(dependencies.selectConventionChecks).not.toHaveBeenCalled();
});

test("rejects unsatisfied requiresAny before check discovery", async () => {
  const dependencies = {
    readProfileCombinationPolicy: jest.fn(() => readProfileCombinationPolicy()),
    loadValidationTarget: jest.fn(async () => ({
      eliware: { apply: ["general", "npm-published"] },
    })),
    discoverAllChecks: jest.fn(),
    selectConventionChecks: jest.fn(),
    validateBundledDirectiveCompleteness: jest.fn(),
    prepareValidationExemptions: jest.fn(),
    findRepositoryEntries: jest.fn(),
  };
  await expect(prepareValidationPlan("/repo", [], {}, dependencies)).rejects.toThrow(
    "at least one of: application, library",
  );
  expect(dependencies.discoverAllChecks).not.toHaveBeenCalled();
});
