import { expect, jest, test } from "@jest/globals";
import { createBasicValidationStageRunners } from "../../../../src/validation/stages/registry/create-basic-validation-stage-runners.mjs";

test("runs Jest and lint and maps tool output", async () => {
  const runners = createBasicValidationStageRunners({
    runJest: async () => ({ ruleId: "stage:jest", status: "pass", message: "" }),
    runLint: async () => ({ code: 1, stdout: "lint failure", stderr: "" }),
  });
  await expect(runners.jest({ jestResult: { code: 0 } })).resolves.toMatchObject({ code: 0 });
  await expect(
    runners.lint({ root: ".", toolArgs: [], focusedScope: null }),
  ).resolves.toMatchObject({ code: 5, message: "lint failure" });
  const failed = createBasicValidationStageRunners({
    runLint: async () => {
      throw new Error("lint spawn failed");
    },
  });
  await expect(failed.lint({ root: "." })).resolves.toMatchObject({ code: 5 });
});

test("runs formatting and maps formatter results and errors", async () => {
  const runners = createBasicValidationStageRunners({
    validateFormatter: async ({ runFormatter }) => {
      await runFormatter();
      return "format failure";
    },
    runFormatter: async () => ({ code: 0 }),
  });
  await expect(runners.format({ root: ".", toolArgs: [] })).resolves.toMatchObject({ code: 6 });
  const failed = createBasicValidationStageRunners({
    validateFormatter: async () => {
      throw new Error("formatter spawn failed");
    },
  });
  await expect(failed.format({ root: "." })).resolves.toMatchObject({ code: 6 });
});

test("runs audit and maps process results and errors", async () => {
  const runners = createBasicValidationStageRunners({
    runAudit: async () => ({ code: 1 }),
  });
  await expect(runners.audit({ root: ".", toolArgs: [], env: {} })).resolves.toMatchObject({
    code: 7,
  });
  const failed = createBasicValidationStageRunners({
    runAudit: jest.fn(async () => {
      throw new Error("audit spawn failed");
    }),
  });
  await expect(failed.audit({ root: ".", toolArgs: [] })).resolves.toMatchObject({ code: 7 });
});

test("uses default stage tools when no overrides are given", () => {
  const runners = createBasicValidationStageRunners();
  expect(Object.keys(runners)).toEqual(["jest", "lint", "format", "audit"]);
});
