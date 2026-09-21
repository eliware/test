import { expect, jest, test } from "@jest/globals";
import { resolveValidationDependencies, runValidation, validationDependencies } from "../../src/orchestrators/run-validation.mjs";

function dependencies(overrides = {}) {
  const calls = [];
  const checks = [{ ruleId: "E-1", run: jest.fn() }];
  const dependencies = {
    loadValidationTarget: jest.fn(async () => ({ eliware: { apply: ["general"] } })),
    selectConventionChecks: jest.fn(async () => checks),
    discoverAllChecks: jest.fn(async () => checks),
    validateBundledDirectiveCompleteness: jest.fn(async () => true),
    prepareValidationExemptions: jest.fn(() => new Set()),
    executeValidationPlan: jest.fn(async (...args) => { calls.push(args); return [{ ruleId: "E-1", status: "pass" }]; }),
    ...overrides,
  };
  return { options: { dependencies }, checks, calls, dependencies };
}

test("resolves the default and injected dependency registries", () => {
  const injected = {};
  expect(resolveValidationDependencies()).toBe(validationDependencies);
  expect(resolveValidationDependencies(injected)).toBe(injected);
});

test("keeps runtime options optional at the orchestration boundary", () => {
  expect(runValidation.length).toBe(2);
});

test("uses default runtime options when omitted", async () => {
  await expect(runValidation("/missing-repository", [], undefined)).rejects.toBeTruthy();
});


test("loads configuration, discovers checks, validates completeness, and executes the plan", async () => {
  const { options, checks, calls } = dependencies();
  await expect(runValidation("/repo", ["E-9"], options)).resolves.toEqual([{ ruleId: "E-1", status: "pass" }]);
  expect(options.dependencies.loadValidationTarget).toHaveBeenCalledWith("/repo");
  expect(options.dependencies.selectConventionChecks).toHaveBeenCalledWith({ apply: ["general"] }, checks);
  expect(options.dependencies.discoverAllChecks).toHaveBeenCalledWith();
  expect(options.dependencies.validateBundledDirectiveCompleteness).toHaveBeenCalledWith(checks, ["general"]);
  expect(options.dependencies.prepareValidationExemptions).toHaveBeenCalledWith({ eliware: { apply: ["general"] } }, checks, ["E-9"]);
  expect(calls[0][0]).toBe(checks);
  expect(calls[0][2]).toEqual(new Set());
});

test("passes runtime options into the validation context", async () => {
  const { options, calls } = dependencies();
  await runValidation("/repo", [], { ...options, executeJest: true, mode: "test" });
  expect(calls[0][1]).toEqual(expect.objectContaining({ root: "/repo", executeJest: true, mode: "test" }));
});

test("passes every aggregate stage to the selected checks", async () => {
  const { options, calls } = dependencies();
  await runValidation("/repo", [], {
    ...options,
    executeJest: true,
    executeLint: true,
    executeAudit: true,
    executePack: true,
    executeFormat: true,
    executePackageChecks: true,
  });
  expect(calls[0][1]).toEqual(expect.objectContaining({
    executeJest: true,
    executeLint: true,
    executeAudit: true,
    executePack: true,
    executeFormat: true,
    executePackageChecks: true,
  }));
});

test("executes only Jest for a focused test path", async () => {
  const checks = [{ ruleId: "E-1.20" }, { ruleId: "E-1.20.16" }];
  const { options, calls } = dependencies({
    selectConventionChecks: jest.fn(async () => checks),
    discoverAllChecks: jest.fn(async () => checks),
  });
  await runValidation("/repo", [], { ...options, jestArgs: ["tests/example.test.mjs"] });
  expect(calls[0][0]).toEqual([{ ruleId: "E-1.20" }]);
});

test("does not execute the plan when completeness validation fails", async () => {
  const executeValidationPlan = jest.fn();
  const { options } = dependencies({
    executeValidationPlan,
    validateBundledDirectiveCompleteness: jest.fn(async () => { throw new Error("missing check"); }),
  });
  await expect(runValidation("/repo", [], options)).rejects.toThrow("missing check");
  expect(executeValidationPlan).not.toHaveBeenCalled();
});
