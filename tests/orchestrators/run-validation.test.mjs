import { expect, jest, test } from "@jest/globals";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  resolveValidationDependencies,
  runValidation,
  validationDependencies,
} from "../../src/orchestrators/run-validation.mjs";

function createDependencies(overrides = {}) {
  const checks = [{ ruleId: "E-0.1", run: jest.fn() }];
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
      findRepositoryEntries: jest.fn(async () => []),
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

test("propagates plan execution failures when no coverage cleanup is needed", async () => {
  const { dependencies } = createDependencies({
    executeValidationPlan: jest.fn(async () => { throw new Error("plan failed"); }),
  });
  await expect(runValidation("/repo", [], { dependencies })).rejects.toThrow("plan failed");
});

test("cleans retained Jest coverage when the validation plan ends before coverage validation", async () => {
  const coverageDirectory = await mkdtemp(join(tmpdir(), "eliware-run-coverage-"));
  const { dependencies } = createDependencies({
    executeValidationPlan: jest.fn(async (_checks, context) => {
      context.jestCoverageDirectory = coverageDirectory;
      return [];
    }),
  });
  await runValidation("/repo", [], { dependencies });
  await expect(stat(coverageDirectory)).rejects.toMatchObject({ code: "ENOENT" });
  await rm(coverageDirectory, { recursive: true, force: true });
});

test("preserves validation diagnostics when final coverage cleanup fails", async () => {
  const coverageFailure = {
    ruleId: "E-0.1.130.14",
    status: "fail",
    message: "Coverage evidence is missing.",
  };
  const otherFailure = { ruleId: "E-0.1.4", status: "fail", message: "lint failed" };
  const { dependencies } = createDependencies({
    executeValidationPlan: jest.fn(async (_checks, context) => {
      context.jestCoverageDirectory = "/run/coverage";
      return [otherFailure, coverageFailure];
    }),
  });
  const removeCoverage = jest.fn(async () => { throw new Error("cleanup denied"); });

  const result = await runValidation("/repo", [], { dependencies, removeCoverage });
  expect(result).toHaveLength(2);
  expect(result[0]).toBe(otherFailure);
  expect(result[1]).toMatchObject({ ruleId: coverageFailure.ruleId, status: coverageFailure.status });
  expect(result[1].message).toContain(coverageFailure.message);
  expect(result[1].message).toContain("Could not remove run-scoped coverage artifacts: cleanup denied");
  expect(removeCoverage).toHaveBeenCalledWith("/run/coverage", { recursive: true, force: true });
});

test("reports cleanup failures when no coverage diagnostic already exists", async () => {
  const { dependencies } = createDependencies({
    executeValidationPlan: jest.fn(async (_checks, context) => {
      context.jestCoverageDirectory = "/run/coverage";
      return [];
    }),
  });
  const result = await runValidation("/repo", [], {
    dependencies,
    removeCoverage: async () => { throw new Error("cleanup denied"); },
  });
  expect(result).toEqual([expect.objectContaining({
    ruleId: "E-0.1.130.14",
    status: "fail",
    message: expect.stringContaining("cleanup denied"),
  })]);
});

test("preserves plan failures when cleanup also fails", async () => {
  const { dependencies } = createDependencies({
    executeValidationPlan: jest.fn(async (_checks, context) => {
      context.jestCoverageDirectory = "/run/coverage";
      throw new Error("plan failed");
    }),
  });
  await expect(runValidation("/repo", [], {
    dependencies,
    removeCoverage: async () => { throw new Error("cleanup denied"); },
  })).rejects.toThrow("plan failed\nCould not remove run-scoped coverage artifacts: cleanup denied");
});

test("preserves non-Error plan failures when cleanup also fails", async () => {
  const { dependencies } = createDependencies({
    executeValidationPlan: jest.fn(async (_checks, context) => {
      context.jestCoverageDirectory = "/run/coverage";
      throw "plan failed";
    }),
  });
  await expect(runValidation("/repo", [], {
    dependencies,
    removeCoverage: async () => { throw new Error("cleanup denied"); },
  })).rejects.toThrow("plan failed\nCould not remove run-scoped coverage artifacts: cleanup denied");
});

test("rejects non-array plan results when cleanup fails", async () => {
  const { dependencies } = createDependencies({
    executeValidationPlan: jest.fn(async (_checks, context) => {
      context.jestCoverageDirectory = "/run/coverage";
      return { result: true };
    }),
  });
  await expect(runValidation("/repo", [], {
    dependencies,
    removeCoverage: async () => { throw new Error("cleanup denied"); },
  })).rejects.toThrow("cleanup denied");
});

test("uses default invocation options when omitted", async () => {
  await expect(runValidation("/missing-repository", [], undefined)).rejects.toBeTruthy();
});
