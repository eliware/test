import { expect, jest, test } from "@jest/globals";
import { prepareValidationPlan } from "../../src/orchestrators/prepare-validation-plan.mjs";

test("prepares a focused validation plan with context and exemptions", async () => {
  const checks = ["E-1.4", "E-1.130.13", "E-1.130.14", "E-1.130.15", "E-1.130.10"].map(
    (ruleId) => ({ ruleId, focusedSafe: ruleId !== "E-1.130.10" }),
  );
  const dependencies = {
    loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general", "application"] } })),
    discoverAllChecks: jest.fn(async () => checks),
    selectConventionChecks: jest.fn(async () => checks),
    validateBundledDirectiveCompleteness: jest.fn(async () => true),
    prepareValidationExemptions: jest.fn(() => new Set(["E-9"])),
    findRepositoryFiles: jest.fn(async () => []),
  };
  const plan = await prepareValidationPlan(
    "/repo",
    ["E-9"],
    { jestArgs: ["tests/a.test.mjs"], executeJest: true },
    dependencies,
  );
  expect(plan.checks.map(({ ruleId }) => ruleId)).toEqual([
    "E-1.4",
    "E-1.130.13",
    "E-1.130.14",
    "E-1.130.15",
  ]);
  expect(plan.exemptions).toEqual(new Set(["E-9"]));
  expect(plan.context).toEqual(
    expect.objectContaining({
      root: "/repo",
      executeJest: true,
      focusedScope: expect.objectContaining({ sourcePath: "src/a.mjs" }),
    }),
  );
});

test("keeps the complete selected plan when no focused path is supplied", async () => {
  const checks = [{ ruleId: "E-1.130.10", run() {} }];
  const dependencies = {
    loadValidationTarget: jest.fn(async () => ({
      eliware: { apply: ["general", "documentation"] },
    })),
    discoverAllChecks: jest.fn(async () => checks),
    selectConventionChecks: jest.fn(async () => checks),
    validateBundledDirectiveCompleteness: jest.fn(async () => true),
    prepareValidationExemptions: jest.fn(() => new Set()),
    findRepositoryFiles: jest.fn(async () => []),
  };
  const plan = await prepareValidationPlan("/repo", [], { executeJest: true }, dependencies);
  expect(plan.checks).toBe(checks);
  expect(plan.context.executeJest).toBe(false);
});

test.each(["documentation", "workspace", "infrastructure"])(
  "retains general lint and format stages for %s-only repositories",
  async (profile) => {
    const checks = [{ ruleId: "E-1.4" }, { ruleId: "E-1.20.17" }];
    const dependencies = {
      loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general", profile] } })),
      discoverAllChecks: jest.fn(async () => checks),
      selectConventionChecks: jest.fn(async () => checks),
      validateBundledDirectiveCompleteness: jest.fn(async () => true),
      prepareValidationExemptions: jest.fn(() => new Set()),
      findRepositoryFiles: jest.fn(async () => []),
    };

    const plan = await prepareValidationPlan(
      "/repo",
      [],
      { executeJest: true, executeLint: true, executeFormat: true },
      dependencies,
    );

    expect(plan.checks).toEqual(checks);
    expect(plan.context).toEqual(
      expect.objectContaining({ executeJest: false, executeLint: true, executeFormat: true }),
    );
  },
);
