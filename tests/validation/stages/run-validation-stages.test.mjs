import { expect, jest, test } from "@jest/globals";
import { runValidationStages } from "../../../src/validation/stages/run-validation-stages.mjs";

test("runs selected stages in order and stores each result for checks", async () => {
  const context = { executeLint: true, executeFormat: true };
  const order = [];
  const runners = {
    lint: jest.fn(async () => {
      order.push("lint");
      return { stage: "lint", status: "pass", output: "lint output" };
    }),
    format: jest.fn(async () => {
      order.push("format");
      return { stage: "format", status: "pass", output: "format output" };
    }),
  };

  await expect(runValidationStages(context, ["lint", "format"], runners)).resolves.toEqual([]);
  expect(order).toEqual(["lint", "format"]);
  expect(context.stageResults).toEqual({
    lint: { stage: "lint", status: "pass", output: "lint output" },
    format: { stage: "format", status: "pass", output: "format output" },
  });
});

test("reuses cached results and returns stage failures", async () => {
  const context = { executeLint: true };
  const runner = jest.fn(async () => ({
    stage: "lint",
    status: "fail",
    code: 5,
    message: "failed",
  }));

  const first = await runValidationStages(context, ["lint"], { lint: runner });
  const second = await runValidationStages(context, ["lint"], { lint: runner });
  expect(first).toEqual([context.stageResults.lint]);
  expect(second).toEqual([context.stageResults.lint]);
  expect(runner).toHaveBeenCalledTimes(1);
});

test("records runner errors as internal stage failures", async () => {
  const context = { executeAudit: true };
  await expect(
    runValidationStages(context, ["audit"], {
      audit: async () => {
        throw new Error("child failed");
      },
    }),
  ).resolves.toMatchObject([{ stage: "audit", code: 1, status: "fail", message: "child failed" }]);
});

test("does not run stages that are disabled", async () => {
  await expect(runValidationStages({}, ["jest", "lint"])).resolves.toEqual([]);
});

test("records non-Error runner failures", async () => {
  const context = { executeAudit: true };
  await expect(
    runValidationStages(context, ["audit"], {
      audit: async () => {
        throw "audit failed";
      },
    }),
  ).resolves.toMatchObject([{ code: 1, message: "audit failed", status: "fail" }]);
});
