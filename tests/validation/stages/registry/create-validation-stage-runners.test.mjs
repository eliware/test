import { expect, jest, test } from "@jest/globals";
import { createValidationStageRunners } from "../../../../src/validation/stages/registry/create-validation-stage-runners.mjs";

test("caches Jest output and maps its failures", async () => {
  const context = { jestResult: { code: 0 } };
  const pass = createValidationStageRunners({
    runJest: async () => ({ ruleId: "stage:jest", status: "pass", message: "" }),
  });
  await expect(pass.jest(context)).resolves.toMatchObject({
    stage: "jest",
    code: 0,
    output: context.jestResult,
  });
  const fail = createValidationStageRunners({
    runJest: async () => ({ ruleId: "stage:jest", status: "fail", message: "Jest failed" }),
  });
  await expect(fail.jest(context)).resolves.toMatchObject({ code: 2, status: "fail" });
  const startup = createValidationStageRunners({
    runJest: async () => ({
      ruleId: "stage:jest",
      status: "fail",
      message: "Jest could not be started",
    }),
  });
  await expect(startup.jest(context)).resolves.toMatchObject({ code: 1, status: "fail" });
});

test("runs lint and keeps its process output", async () => {
  const runLint = jest.fn(async () => ({ code: 0, stdout: "ok", stderr: "" }));
  const runners = createValidationStageRunners({ runLint });
  await expect(
    runners.lint({ root: ".", toolArgs: [], focusedScope: null }),
  ).resolves.toMatchObject({
    code: 0,
    output: { stdout: "ok" },
  });
  expect(runLint).toHaveBeenCalledWith(".", undefined, undefined, [], []);
  const failed = createValidationStageRunners({
    runLint: async () => ({ code: 1, stderr: "bad" }),
  });
  await expect(
    failed.lint({ root: ".", toolArgs: [], focusedScope: { paths: ["src/a.mjs"] } }),
  ).resolves.toMatchObject({
    code: 5,
    message: "bad",
  });
  const startup = createValidationStageRunners({
    runLint: async () => {
      throw new Error("spawn");
    },
  });
  await expect(startup.lint({ root: ".", toolArgs: [] })).resolves.toMatchObject({
    code: 5,
    message: "spawn",
  });
});

test("runs formatting and stores formatter output", async () => {
  const runFormatter = jest.fn(async () => ({ code: 0, stdout: "formatted" }));
  const valid = createValidationStageRunners({ runFormatter });
  await expect(
    valid.format({ root: ".", executeFormat: true, mode: null, toolArgs: [], env: {} }),
  ).resolves.toMatchObject({
    code: 0,
    output: { output: { stdout: "formatted" } },
  });
  const invalid = createValidationStageRunners({ validateFormatter: async () => "format failed" });
  await expect(
    invalid.format({ root: ".", executeFormat: true, mode: null, toolArgs: [] }),
  ).resolves.toMatchObject({
    code: 6,
    message: "format failed",
  });
  const noChanges = createValidationStageRunners({ validateFormatter: async () => undefined });
  await expect(
    noChanges.format({ root: ".", executeFormat: false, mode: null, toolArgs: [] }),
  ).resolves.toMatchObject({ code: 0, message: "" });
});

test("runs audit and stores its process report", async () => {
  const runAudit = jest.fn(async () => ({ code: 0, stdout: "report" }));
  const valid = createValidationStageRunners({ runAudit });
  await expect(valid.audit({ root: ".", toolArgs: [], env: {} })).resolves.toMatchObject({
    code: 0,
    output: { stdout: "report" },
  });
  const invalid = createValidationStageRunners({ runAudit: async () => ({ code: 1 }) });
  await expect(invalid.audit({ root: ".", toolArgs: [] })).resolves.toMatchObject({
    code: 7,
    message: "npm audit failed.",
  });
  const startup = createValidationStageRunners({
    runAudit: async () => {
      throw new Error("audit spawn");
    },
  });
  await expect(startup.audit({ root: ".", toolArgs: [] })).resolves.toMatchObject({ code: 7 });
});

test("runs pack only for its profile and stores the pack result", async () => {
  const skip = createValidationStageRunners();
  await expect(skip.pack({ packageJson: { eliware: { apply: [] } } })).resolves.toMatchObject({
    code: 0,
    message: "Package validation does not apply.",
  });
  const validatePack = jest.fn(async ({ runPack }) => {
    await runPack(".");
    return null;
  });
  const runPack = jest.fn(async () => ({ code: 0, stdout: "manifest" }));
  const runners = createValidationStageRunners({ validatePack, runPack });
  await expect(
    runners.pack({
      root: ".",
      packageJson: { eliware: { apply: ["npm-published"] } },
      toolArgs: [],
    }),
  ).resolves.toMatchObject({ code: 0, output: { output: { stdout: "manifest" } } });
  expect(runPack).toHaveBeenCalled();
  const invalid = createValidationStageRunners({ validatePack: async () => "pack failed" });
  await expect(
    invalid.pack({ packageJson: { eliware: { apply: ["npm-published"] } } }),
  ).resolves.toMatchObject({ code: 9, message: "pack failed" });
});

test("caches outdated package data for convention checks and uses its exit code", async () => {
  const dependencies = { alpha: { current: "1" } };
  const runners = createValidationStageRunners({
    runOutdated: async () => ({ dependencies, outdated: ["alpha@latest"] }),
  });
  const context = { root: ".", env: {} };
  await expect(runners.outdated(context)).resolves.toMatchObject({
    code: 8,
    stage: "outdated",
    status: "fail",
  });
  expect(context.outdatedDependencies).toBe(dependencies);
});

test("runs typecheck and build only for their selected profiles", async () => {
  const runScript = jest.fn(async () => ({ code: 1, stderr: "script failed" }));
  const runners = createValidationStageRunners({ runScript });
  const typecheck = {
    root: ".",
    packageJson: {
      eliware: { apply: ["library"] },
      scripts: { typecheck: "tsc --noEmit" },
    },
    env: {},
  };
  const build = {
    ...typecheck,
    packageJson: {
      eliware: { apply: ["web"] },
      scripts: { build: "vite build" },
    },
  };
  await expect(runners.typecheck(typecheck)).resolves.toMatchObject({ code: 10, status: "fail" });
  await expect(runners.build(build)).resolves.toMatchObject({ code: 11, status: "fail" });
  expect(runScript.mock.calls.map(([, name]) => name)).toEqual(["typecheck", "build"]);
});
