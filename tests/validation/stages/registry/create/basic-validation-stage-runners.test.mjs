import { expect, jest, test } from "@jest/globals";
import { createBasicValidationStageRunners } from "../../../../../src/validation/stages/registry/create/basic-validation-stage-runners.mjs";

test("uses default stage tools when no overrides are given", () => {
  const runners = createBasicValidationStageRunners();
  expect(Object.keys(runners)).toEqual(["jest", "lint", "format", "audit"]);
});

test("skips lint when every focused path is ignored", async () => {
  const runLint = jest.fn();
  const runners = createBasicValidationStageRunners({
    runLint,
    resolveFocusedPaths: async () => [],
  });

  await expect(
    runners.lint({ root: ".", focusedScope: { paths: ["tests/artifacts/file.test.mjs"] } }),
  ).resolves.toMatchObject({
    stage: "lint",
    code: 0,
  });
  expect(runLint).not.toHaveBeenCalled();
});
