import { expect, jest, test } from "@jest/globals";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { finalizeValidationRun } from "../../../src/validation/check-execution/finalize-validation-run.mjs";

test("removes the run-scoped coverage directory and clears its context path", async () => {
  const coverageDirectory = await mkdtemp(join(tmpdir(), "eliware-finalize-coverage-"));
  const context = { jestCoverageDirectory: coverageDirectory };
  try {
    const result = [{ ruleId: "E-0.1.4", status: "pass", message: "" }];
    await expect(finalizeValidationRun({ result, context })).resolves.toBe(result);
    expect(context.jestCoverageDirectory).toBeUndefined();
    await expect(stat(coverageDirectory)).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    await rm(coverageDirectory, { recursive: true, force: true });
  }
});

test("appends cleanup failures to an existing coverage diagnostic", async () => {
  const coverageFailure = {
    ruleId: "E-0.1.130.14",
    status: "fail",
    message: "Coverage is missing.",
  };
  const otherFailure = { ruleId: "E-0.1.4", status: "fail", message: "lint failed" };
  const result = [otherFailure, coverageFailure];
  const removeCoverage = jest.fn(async () => {
    throw new Error("cleanup denied");
  });

  const finalized = await finalizeValidationRun({
    result,
    context: { jestCoverageDirectory: "/run/coverage" },
    removeCoverage,
  });
  expect(finalized).toHaveLength(2);
  expect(finalized[0]).toBe(otherFailure);
  expect(finalized[1].message).toContain("Coverage is missing.");
  expect(finalized[1].message).toContain("cleanup denied");
  expect(finalized[1].message).toContain("/run/coverage");
  expect(removeCoverage).toHaveBeenCalledWith("/run/coverage", { recursive: true, force: true });
});

test("adds a coverage failure when cleanup fails without an existing coverage diagnostic", async () => {
  await expect(
    finalizeValidationRun({
      result: [],
      context: { jestCoverageDirectory: "/run/coverage" },
      removeCoverage: async () => {
        throw "cleanup denied";
      },
    }),
  ).resolves.toEqual([
    expect.objectContaining({
      ruleId: "E-0.1.130.14",
      status: "fail",
      message: expect.stringContaining(
        "Could not remove run-scoped coverage artifacts at /run/coverage: cleanup denied",
      ),
    }),
  ]);
});

test("attributes cleanup failure to library coverage for library-only validation", async () => {
  await expect(
    finalizeValidationRun({
      result: [],
      context: {
        jestCoverageDirectory: "/run/coverage",
        packageJson: { eliware: { apply: ["library"] } },
      },
      removeCoverage: async () => {
        throw new Error("cleanup denied");
      },
    }),
  ).resolves.toEqual([
    expect.objectContaining({
      ruleId: "E-0.1.40.16",
      status: "fail",
      message: expect.stringContaining("cleanup denied"),
    }),
  ]);
});

test("throws when cleanup fails and the validation result is not an array", async () => {
  await expect(
    finalizeValidationRun({
      result: { result: true },
      context: { jestCoverageDirectory: "/run/coverage" },
      removeCoverage: async () => {
        throw new Error("cleanup denied");
      },
    }),
  ).rejects.toThrow("cleanup denied");
});

test("returns structured plan diagnostics when coverage cleanup succeeds", async () => {
  const planError = new Error("plan failed");
  await expect(
    finalizeValidationRun({
      planFailure: { error: planError },
      context: { jestCoverageDirectory: "/run/coverage" },
      removeCoverage: jest.fn(),
    }),
  ).resolves.toEqual([{ ruleId: "E-0.1.20", status: "fail", message: "plan failed" }]);
});

test("returns structured plan and cleanup failures", async () => {
  const planError = "plan failed";
  await expect(
    finalizeValidationRun({
      planFailure: { error: planError },
      context: { jestCoverageDirectory: "/run/coverage" },
      removeCoverage: async () => {
        throw null;
      },
    }),
  ).resolves.toEqual([
    {
      ruleId: "E-0.1.20",
      status: "fail",
      message: "plan failed\nCould not remove run-scoped coverage artifacts at /run/coverage: null",
    },
  ]);
});

test("returns results unchanged when no run-scoped coverage or plan error exists", async () => {
  const result = [];
  await expect(finalizeValidationRun({ result, context: {} })).resolves.toBe(result);
});
