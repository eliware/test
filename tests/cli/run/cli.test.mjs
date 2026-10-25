import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  acquireValidationLock,
  createStageTimer,
  createTimingLog,
  createValidationRunOptions,
  diagnosticOptions,
  dispatchInformationalCommand,
  formatExitCode,
  normalizeCliError,
  readDiagnosticOptions,
  resetCli,
  runConventionStage,
  runNpmPrerequisite,
  runValidation,
  timing,
  validationResult,
  writeValidationResults,
} from "../../../test-fixtures/cli/run-cli-harness.mjs";
const { runCli } = await import("../../../src/cli/run/cli.mjs");

beforeEach(resetCli);

test("returns informational command results before starting validation", async () => {
  dispatchInformationalCommand.mockReturnValueOnce(0);
  const write = jest.fn();
  await expect(runCli(["--version"], write, "/repo")).resolves.toBe(0);
  expect(dispatchInformationalCommand).toHaveBeenCalledWith(["--version"], write);
  expect(runNpmPrerequisite).not.toHaveBeenCalled();
  expect(acquireValidationLock).not.toHaveBeenCalled();
  expect(readDiagnosticOptions).not.toHaveBeenCalled();
  expect(createStageTimer).not.toHaveBeenCalled();
  expect(createTimingLog).not.toHaveBeenCalled();
  expect(runConventionStage).not.toHaveBeenCalled();
});

test("refuses to run when another validation process holds the repository lock", async () => {
  acquireValidationLock.mockResolvedValueOnce(null);
  const write = jest.fn();
  await expect(runCli([], write, "/repo")).resolves.toBe(1);
  expect(write).toHaveBeenCalledWith(
    expect.stringMatching(
      /^Cannot run eliware-test because the lock file exists: .*eliware-test\.lock\. If no validation run is active, remove the stale lock file and retry\.$/,
    ),
  );
  expect(readDiagnosticOptions).not.toHaveBeenCalled();
  expect(createTimingLog).not.toHaveBeenCalled();
  expect(runConventionStage).not.toHaveBeenCalled();
});

test("stops before validation when npm is unsupported", async () => {
  const checkPrerequisite = jest.fn(async () => false);
  await expect(
    runCli([], jest.fn(), "/repo", { runNpmPrerequisite: checkPrerequisite }),
  ).resolves.toBe(1);
  expect(acquireValidationLock).not.toHaveBeenCalled();
  expect(createTimingLog).not.toHaveBeenCalled();
});

test("releases the repository lock when validation completes", async () => {
  const release = jest.fn();
  acquireValidationLock.mockResolvedValueOnce(release);
  await expect(runCli([], jest.fn(), "/repo")).resolves.toBe(0);
  expect(release).toHaveBeenCalledTimes(1);
});

test("uses default logger and options when callers omit them", async () => {
  const output = jest.spyOn(console, "log").mockImplementation(() => {});
  try {
    await expect(runCli([], undefined, "/repo")).resolves.toBe(0);
    expect(output).toHaveBeenCalledWith("Logging to ./coverage/eliware-test.log...");
  } finally {
    output.mockRestore();
  }

  expect(createValidationRunOptions).toHaveBeenCalledWith(
    [],
    diagnosticOptions,
    expect.objectContaining({ validationSummary: expect.any(Object) }),
    timing,
    expect.any(Function),
  );
});

test("coordinates diagnostic parsing, convention and validation stages, and result writing", async () => {
  const write = jest.fn();
  const options = { runOption: true };
  await expect(runCli([], write, "/repo")).resolves.toBe(0);
  expect(write).toHaveBeenNthCalledWith(1, "Logging to ./coverage/eliware-test.log...");
  expect(readDiagnosticOptions).toHaveBeenCalledWith([]);
  expect(createTimingLog).toHaveBeenCalledWith("/repo", expect.any(Number));
  expect(createStageTimer).toHaveBeenCalledWith(
    true,
    expect.any(Function),
    expect.any(Function),
    expect.any(Number),
  );
  expect(createStageTimer.mock.calls[0][1]()).toEqual(expect.any(Number));
  expect(runConventionStage).toHaveBeenCalledWith(expect.any(Function));
  expect(runValidation).toHaveBeenCalledWith("/repo", [], options);
  expect(createValidationRunOptions).toHaveBeenCalledWith(
    [],
    diagnosticOptions,
    expect.objectContaining({ validationSummary: expect.any(Object) }),
    timing,
    expect.any(Function),
  );
  expect(writeValidationResults).toHaveBeenCalled();
  expect(formatExitCode).not.toHaveBeenCalled();
});

test("buffers timing output until the log exists, then writes each timing event", async () => {
  const logWrite = jest.fn();
  const write = jest.fn();
  createTimingLog.mockReturnValueOnce(logWrite);
  createStageTimer.mockImplementationOnce((_enabled, _now, output) => ({
    stage: (label) => output(`Stage: ${label}\n`),
  }));

  await expect(runCli(["--debug-timing"], write, "/repo")).resolves.toBe(0);

  expect(logWrite).toHaveBeenNthCalledWith(1, "Stage: npm prerequisite\n");
  expect(logWrite).toHaveBeenNthCalledWith(2, "Stage: validation lock\n");
  expect(logWrite).toHaveBeenNthCalledWith(3, "Stage: validation\n");
  expect(write).toHaveBeenCalledWith(expect.stringMatching(/^Started: /u));
  expect(write).toHaveBeenCalledWith("Stage: validation\n");
});

test("uses null mode when diagnostics contain no focused test arguments", async () => {
  readDiagnosticOptions.mockReturnValueOnce({ mode: null, jestArgs: undefined });
  await expect(runCli([], jest.fn(), "/repo")).resolves.toBe(0);
  expect(writeValidationResults.mock.calls[0][0].mode).toBeNull();
});

test("passes an explicitly supplied environment into validation", async () => {
  const env = { API_TOKEN: "secret" };
  await expect(runCli([], jest.fn(), "/repo", { env })).resolves.toBe(0);
  expect(createValidationRunOptions).toHaveBeenCalledWith(
    [],
    diagnosticOptions,
    expect.objectContaining({ env, validationSummary: expect.any(Object) }),
    timing,
    expect.any(Function),
  );
});

test("shows timing output and formats the debug exit code", async () => {
  const write = jest.fn();
  await expect(runCli(["--debug-timing"], write, "/repo")).resolves.toBe(0);
  expect(createStageTimer).toHaveBeenCalledWith(
    true,
    expect.any(Function),
    expect.any(Function),
    expect.any(Number),
  );
  expect(writeValidationResults).toHaveBeenCalled();
  expect(formatExitCode).toHaveBeenCalledWith(0);
  expect(write).toHaveBeenCalledWith("formatted exit code");
});

test("formats a nonzero result even when timing output is disabled", async () => {
  runConventionStage.mockImplementationOnce(async (runChecks) => {
    await runChecks();
    return { ...validationResult, code: 12 };
  });

  await expect(runCli([], jest.fn(), "/repo")).resolves.toBe(12);
  expect(formatExitCode).toHaveBeenCalledWith(12);
});

test("normalizes and formats failures raised by the CLI pipeline", async () => {
  const error = new Error("validation failed");
  runConventionStage.mockRejectedValueOnce(error);
  const write = jest.fn();

  await expect(runCli([], write)).resolves.toBe(1);
  expect(normalizeCliError).toHaveBeenCalledWith(error, write);
  expect(formatExitCode).toHaveBeenCalledWith(1);
  expect(write).toHaveBeenCalledWith("formatted exit code");
});

test("normalizes failures while acquiring the validation lock", async () => {
  const error = new Error("lock acquisition failed");
  const write = jest.fn();
  acquireValidationLock.mockRejectedValueOnce(error);

  await expect(runCli([], write, "/repo")).resolves.toBe(1);
  expect(normalizeCliError).toHaveBeenCalledWith(error, write);
});
