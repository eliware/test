import { beforeEach, expect, jest, test } from "@jest/globals";

const validateRequiredStagePlan = jest.fn();
const executeConventionChecks = jest.fn();
jest.unstable_mockModule("../../src/orchestrators/validate-required-stage-plan.mjs", () => ({ validateRequiredStagePlan }));
jest.unstable_mockModule("../../src/orchestrators/execute-convention-checks.mjs", () => ({ executeConventionChecks }));

const { executeValidationPlan } = await import("../../src/orchestrators/execute-validation-plan.mjs");

beforeEach(() => {
  jest.resetAllMocks();
});

test("validates the plan before delegating checks and returns their results", async () => {
  const checks = [{ ruleId: "E-0.1.0" }];
  const context = { executeJest: true };
  const exemptions = new Set();
  const results = [{ ruleId: "E-0.1.0", status: "pass" }];
  executeConventionChecks.mockResolvedValueOnce(results);

  await expect(executeValidationPlan(checks, context, exemptions)).resolves.toBe(results);

  expect(validateRequiredStagePlan).toHaveBeenCalledWith(checks, context, exemptions);
  expect(executeConventionChecks).toHaveBeenCalledWith(checks, context, exemptions);
  expect(validateRequiredStagePlan.mock.invocationCallOrder[0]).toBeLessThan(
    executeConventionChecks.mock.invocationCallOrder[0],
  );
});

test("stops before check execution if plan validation rejects the checks", async () => {
  validateRequiredStagePlan.mockImplementationOnce(() => {
    throw new Error("missing stage owner");
  });

  await expect(executeValidationPlan([], {}, new Set())).rejects.toThrow("missing stage owner");
  expect(executeConventionChecks).not.toHaveBeenCalled();
});
