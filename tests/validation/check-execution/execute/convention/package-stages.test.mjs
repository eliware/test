import { expect, jest, test } from "@jest/globals";
import {
  countCompletedPackageStages,
  executeInitialPackageStages,
  executeRemainingPackageStages,
} from "../../../../../src/validation/check-execution/execute/convention/package-stages.mjs";

test("runs initial package stages", async () => {
  const context = {
    validationStageRunners: { lint: "runner" },
    stageResults: {},
  };
  const failures = [{ status: "fail", stage: "format" }];
  const runStages = jest.fn(async () => failures);

  await expect(executeInitialPackageStages(context, runStages)).resolves.toEqual(failures);
  expect(runStages).toHaveBeenCalledWith(
    context,
    ["lint", "format", "audit", "outdated"],
    context.validationStageRunners,
  );
});

test("runs remaining package stages", async () => {
  const context = { validationStageRunners: {} };
  const runStages = jest.fn(async () => []);
  await expect(executeRemainingPackageStages(context, runStages)).resolves.toEqual([]);
  expect(runStages).toHaveBeenCalledWith(context, ["pack", "typecheck", "build"], {});
});

test("counts completed non-Jest stages", () => {
  expect(
    countCompletedPackageStages({
      stageResults: {
        lint: { status: "pass", stage: "lint" },
        audit: { status: "warning", stage: "audit" },
        format: { status: "fail", stage: "format" },
        jest: { status: "pass", stage: "jest" },
      },
    }),
  ).toBe(2);
  expect(countCompletedPackageStages({})).toBe(0);
});
