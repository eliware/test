import { expect, jest, test } from "@jest/globals";
import { executePackageStages } from "../../../../../src/validation/check-execution/execute/convention/package-stages.mjs";

test("runs package stages and counts completed non-Jest stages", async () => {
  const context = {
    validationStageRunners: { lint: "runner" },
    stageResults: {
      lint: { status: "pass", stage: "lint" },
      audit: { status: "warning", stage: "audit" },
      format: { status: "fail", stage: "format" },
      jest: { status: "pass", stage: "jest" },
    },
  };
  const failures = [{ status: "fail", stage: "format" }];
  const runStages = jest.fn(async () => failures);

  await expect(executePackageStages(context, runStages)).resolves.toEqual({
    failures,
    completedStages: 2,
  });
  expect(runStages).toHaveBeenCalledWith(
    context,
    ["lint", "format", "audit", "outdated", "pack", "typecheck", "build"],
    context.validationStageRunners,
  );
});

test("reports no completed stages when none pass or warn", async () => {
  await expect(
    executePackageStages(
      { stageResults: { lint: { status: "fail", stage: "lint" } } },
      async () => [],
    ),
  ).resolves.toEqual({ failures: [], completedStages: 0 });
});

test("uses the default stage runner when none is supplied", async () => {
  await expect(
    executePackageStages({ stageResults: {}, validationStageRunners: {} }),
  ).resolves.toEqual({ failures: [], completedStages: 0 });
});
