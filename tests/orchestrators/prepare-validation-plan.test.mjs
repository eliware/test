import { expect, jest, test } from "@jest/globals";
import { prepareValidationPlan } from "../../src/orchestrators/prepare-validation-plan.mjs";

test("prepares a focused validation plan with context and exemptions", async () => {
  const checks = ["E-0.1.4", "E-0.1.130.13", "E-0.1.130.14", "E-0.1.130.15", "E-0.1.130.10"].map(
    (ruleId) => ({ ruleId, focusedSafe: ruleId !== "E-0.1.130.10" }),
  );
  const dependencies = {
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
    loadValidationTarget: jest.fn(async () => ({
      eliware: { apply: ["general", "documentation"] },
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

test.each(["documentation", "workspace", "infrastructure"])(
  "retains general lint and format stages for %s-only repositories",
  async (profile) => {
    const checks = [{ ruleId: "E-0.1.4" }, { ruleId: "E-0.1.20.17" }];
    const dependencies = {
      loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general", profile] } })),
      discoverAllChecks: jest.fn(async () => checks),
      selectConventionChecks: jest.fn(async () => checks),
      validateBundledDirectiveCompleteness: jest.fn(async () => true),
      prepareValidationExemptions: jest.fn(() => new Set()),
      findRepositoryEntries: jest.fn(async () => []),
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

test("limits inventory expansion requirements to the selected validation mode", async () => {
  const checks = [
    {
      ruleId: "E-0.1.100.1",
      repositoryInventoryOptions: { expandedDirectories: ["docs"] },
    },
    { ruleId: "E-0.1.20.19" },
  ];
  const findRepositoryEntries = jest.fn(async () => []);
  const dependencies = {
    loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general", "documentation"] } })),
    discoverAllChecks: jest.fn(async () => checks),
    selectConventionChecks: jest.fn(async () => checks),
    validateBundledDirectiveCompleteness: jest.fn(async () => true),
    prepareValidationExemptions: jest.fn(() => new Set()),
    findRepositoryEntries,
  };
  const plan = await prepareValidationPlan(
    "/repo",
    [],
    { mode: "audit", modeRuleId: "E-0.1.20.19" },
    dependencies,
  );

  await plan.context.repositoryInventory.entries();
  expect(findRepositoryEntries).toHaveBeenCalledWith(
    "/repo",
    expect.any(Function),
    { includeTestResults: false, includeTestResultsUnder: [], expandedDirectories: [] },
  );
});

test("enables documentation-only inventory expansions when those checks will run", async () => {
  const checks = [
    {
      ruleId: "A-0.1.100.3",
      repositoryInventoryOptions: { includeTestResults: true },
    },
    { ruleId: "E-0.1.20.19" },
  ];
  const findRepositoryEntries = jest.fn(async () => []);
  const dependencies = {
    loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general", "documentation"] } })),
    discoverAllChecks: jest.fn(async () => checks),
    selectConventionChecks: jest.fn(async () => checks),
    validateBundledDirectiveCompleteness: jest.fn(async () => true),
    prepareValidationExemptions: jest.fn(() => new Set()),
    findRepositoryEntries,
  };
  const plan = await prepareValidationPlan("/repo", [], { executeJest: false }, dependencies);

  await plan.context.repositoryInventory.entries();
  expect(findRepositoryEntries).toHaveBeenCalledWith(
    "/repo",
    expect.any(Function),
    { includeTestResults: true, includeTestResultsUnder: [], expandedDirectories: [] },
  );
});

test("limits scoped test-results traversal to selected checks in focused scope", async () => {
  const checks = [
    {
      ruleId: "A-0.1.130.2.0",
      focusedSafe: true,
      repositoryInventoryOptions: {
        expandedDirectories: ["docs"],
        includeTestResultsUnder: ["docs"],
      },
    },
    {
      ruleId: "A-0.1.100.3",
      focusedSafe: false,
      repositoryInventoryOptions: { includeTestResults: true },
    },
  ];
  const findRepositoryEntries = jest.fn(async () => []);
  const dependencies = {
    loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general", "application", "documentation"] } })),
    discoverAllChecks: jest.fn(async () => checks),
    selectConventionChecks: jest.fn(async () => checks),
    validateBundledDirectiveCompleteness: jest.fn(async () => true),
    prepareValidationExemptions: jest.fn(() => new Set()),
    findRepositoryEntries,
  };
  const plan = await prepareValidationPlan(
    "/repo",
    [],
    { jestArgs: ["tests/example.test.mjs"] },
    dependencies,
  );

  await plan.context.repositoryInventory.entries();
  expect(plan.checks.map(({ ruleId }) => ruleId)).toEqual(["A-0.1.130.2.0"]);
  expect(findRepositoryEntries).toHaveBeenCalledWith(
    "/repo",
    expect.any(Function),
    {
      includeTestResults: false,
      includeTestResultsUnder: ["docs"],
      expandedDirectories: ["docs"],
    },
  );
});
