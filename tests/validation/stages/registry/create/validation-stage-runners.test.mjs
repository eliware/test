import { expect, jest, test } from "@jest/globals";
import createValidationStageRunners from "../../../../../src/validation/stages/registry/create/validation-stage-runners.mjs";
test("caches Jest output and maps its failures", async () => {
  const context = {
    jestResult: {
      code: 0,
      stdout: '[eliware-test-progress] {"event":"run-complete","testSuites":1,"tests":1}',
    },
  };
  const pass = createValidationStageRunners({
    runJest: async () => ({
      ruleId: "stage:jest",
      status: "pass",
      message: "",
    }),
  });
  await expect(pass.jest(context)).resolves.toMatchObject({
    stage: "jest",
    code: 0,
    output: context.jestResult,
  });
  const fail = createValidationStageRunners({
    runJest: async () => ({
      ruleId: "stage:jest",
      status: "fail",
      message: "Jest failed",
    }),
  });
  await expect(fail.jest(context)).resolves.toMatchObject({
    code: 2,
    status: "fail",
  });
  const startup = createValidationStageRunners({
    runJest: async () => ({
      ruleId: "stage:jest",
      status: "fail",
      message: "Jest could not be started",
    }),
  });
  await expect(startup.jest(context)).resolves.toMatchObject({
    code: 1,
    status: "fail",
  });
});
test("runs lint and keeps its process output", async () => {
  const runLint = jest.fn(async () => ({
    code: 0,
    stdout: "ok",
    stderr: "",
  }));
  const resolveFocusedPaths = jest.fn(async (_root, scope) => scope.paths);
  const runners = createValidationStageRunners({
    runLint,
    resolveFocusedPaths,
  });
  await expect(
    runners.lint({
      root: ".",
      toolArgs: [],
      focusedScope: null,
    }),
  ).resolves.toMatchObject({
    code: 0,
    output: {
      stdout: "ok",
    },
  });
  expect(runLint).toHaveBeenCalledWith(".", undefined, undefined, [], []);
  expect(resolveFocusedPaths).not.toHaveBeenCalled();
  const failed = createValidationStageRunners({
    runLint: async () => ({
      code: 1,
      stderr: "bad",
    }),
    resolveFocusedPaths,
  });
  await expect(
    failed.lint({
      root: ".",
      toolArgs: [],
      focusedScope: {
        paths: ["src/a.mjs"],
      },
    }),
  ).resolves.toMatchObject({
    code: 5,
    message: "bad",
  });
  expect(resolveFocusedPaths).toHaveBeenCalledWith(".", {
    paths: ["src/a.mjs"],
  });
  const rejectPaths = jest.fn(async () => null);
  const rejectLint = jest.fn();
  const rejected = createValidationStageRunners({
    runLint: rejectLint,
    resolveFocusedPaths: rejectPaths,
  });
  await expect(
    rejected.lint({
      root: ".",
      toolArgs: [],
      focusedScope: {
        paths: ["src/escape.mjs"],
      },
    }),
  ).resolves.toMatchObject({
    code: 5,
    message: "Focused linting requires at least one resolved path.",
  });
  expect(rejectLint).not.toHaveBeenCalled();
  const startup = createValidationStageRunners({
    runLint: async () => {
      throw new Error("spawn");
    },
  });
  await expect(
    startup.lint({
      root: ".",
      toolArgs: [],
    }),
  ).resolves.toMatchObject({
    code: 5,
    message: "spawn",
  });
});
test("runs formatting and stores formatter output", async () => {
  const runFormatter = jest.fn(async () => ({
    code: 0,
    stdout: "formatted",
  }));
  const valid = createValidationStageRunners({
    runFormatter,
  });
  await expect(
    valid.format({
      root: ".",
      executeFormat: true,
      mode: null,
      toolArgs: [],
      env: {},
    }),
  ).resolves.toMatchObject({
    code: 0,
    output: {
      output: {
        stdout: "formatted",
      },
    },
  });
  const invalid = createValidationStageRunners({
    validateFormatter: async () => "format failed",
  });
  await expect(
    invalid.format({
      root: ".",
      executeFormat: true,
      mode: null,
      toolArgs: [],
    }),
  ).resolves.toMatchObject({
    code: 6,
    message: "format failed",
  });
  const noChanges = createValidationStageRunners({
    validateFormatter: async () => undefined,
  });
  await expect(
    noChanges.format({
      root: ".",
      executeFormat: false,
      mode: null,
      toolArgs: [],
    }),
  ).resolves.toMatchObject({
    code: 0,
    message: "",
  });
  const startup = createValidationStageRunners({
    validateFormatter: async () => {
      throw new Error("formatter spawn");
    },
  });
  await expect(
    startup.format({
      root: ".",
      executeFormat: true,
      mode: null,
      toolArgs: [],
    }),
  ).resolves.toMatchObject({
    code: 6,
    message: "formatter spawn",
  });
});
test("reports an audit timeout as a warning without failing the stage", async () => {
  const runners = createValidationStageRunners({
    runAudit: async () => ({
      code: null,
      timedOut: true,
    }),
  });
  await expect(
    runners.audit({
      root: ".",
      toolArgs: [],
      env: {},
    }),
  ).resolves.toMatchObject({
    stage: "audit",
    code: 0,
    status: "warning",
    message: "WARNING: Audit stage timed out after 30 seconds. Validation will continue.",
  });
});
