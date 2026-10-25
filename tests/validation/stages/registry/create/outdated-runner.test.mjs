import { expect, jest, test } from "@jest/globals";
import { createOutdatedRunner } from "../../../../../src/validation/stages/registry/create/outdated-runner.mjs";

test("caches dependency data and maps clean or outdated results", async () => {
  const value = { dependencies: { alpha: { current: "1" } }, outdated: ["alpha@2"] };
  const runOutdated = jest.fn(async () => value);
  const run = createOutdatedRunner(runOutdated);
  const context = { root: ".", env: {} };

  await expect(run(context)).resolves.toMatchObject({
    stage: "outdated",
    code: 8,
    message: "Outdated packages: alpha@2.",
    output: value,
  });
  expect(context.outdatedDependencies).toBe(value.dependencies);
  expect(runOutdated).toHaveBeenCalledWith(".", { env: {} });

  const clean = createOutdatedRunner(async () => ({ dependencies: {}, outdated: [] }));
  await expect(clean({ root: "." })).resolves.toMatchObject({ code: 0, message: "" });
});

test("maps outdated command failures to a failed stage", async () => {
  const run = createOutdatedRunner(async () => {
    throw new Error("registry failed");
  });

  await expect(run({ root: "." })).resolves.toMatchObject({
    stage: "outdated",
    code: 8,
    message: "registry failed",
  });
});
