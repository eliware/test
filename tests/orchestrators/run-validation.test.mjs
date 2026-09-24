import { expect, jest, test } from "@jest/globals";
import {
  resolveValidationDependencies,
  runValidation,
  validationDependencies,
} from "../../src/orchestrators/run-validation.mjs";

function createDependencies(overrides = {}) {
  const checks = [{ ruleId: "E-1", run: jest.fn() }];
  const executeValidationPlan = jest.fn(async (selected, context, exemptions) => ({
    selected,
    context,
    exemptions,
  }));
  return {
    checks,
    executeValidationPlan,
    dependencies: {
      loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general"] } })),
      selectConventionChecks: jest.fn(async () => checks),
      discoverAllChecks: jest.fn(async () => checks),
      findRepositoryFiles: jest.fn(async () => []),
      validateBundledDirectiveCompleteness: jest.fn(async () => true),
      prepareValidationExemptions: jest.fn(() => new Set(["E-9"])),
      executeValidationPlan,
      ...overrides,
    },
  };
}

test("resolves the default and injected dependency registries", () => {
  const injected = {};
  expect(resolveValidationDependencies()).toBe(validationDependencies);
  expect(resolveValidationDependencies(injected)).toBe(injected);
});

test("prepares and executes a plan with the requested target and exemptions", async () => {
  const { checks, executeValidationPlan, dependencies } = createDependencies();
  const planResult = await runValidation("/repo", ["E-9"], { dependencies });
  expect(dependencies.loadValidationTarget).toHaveBeenCalledWith("/repo");
  expect(dependencies.executeValidationPlan).toHaveBeenCalledWith(
    checks,
    expect.objectContaining({ root: "/repo", packageJson: { eliware: { apply: ["general"] } } }),
    new Set(["E-9"]),
  );
  expect(planResult).toEqual({
    selected: checks,
    context: expect.objectContaining({ root: "/repo" }),
    exemptions: new Set(["E-9"]),
  });
  expect(executeValidationPlan).toHaveBeenCalledTimes(1);
});

test("propagates plan-preparation failures without executing the plan", async () => {
  const executeValidationPlan = jest.fn();
  const { dependencies } = createDependencies({
    loadValidationTarget: jest.fn(async () => { throw new Error("target unavailable"); }),
    executeValidationPlan,
  });
  await expect(runValidation("/repo", [], { dependencies })).rejects.toThrow("target unavailable");
  expect(executeValidationPlan).not.toHaveBeenCalled();
});

test("uses default invocation options when omitted", async () => {
  await expect(runValidation("/missing-repository", [], undefined)).rejects.toBeTruthy();
});
