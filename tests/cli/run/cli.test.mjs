import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  acquireValidationLock,
  createStageTimer,
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
  expect(runConventionStage).not.toHaveBeenCalled();
});

test("stops before validation when npm is unsupported", async () => {
  const checkPrerequisite = jest.fn(async () => false);
  await expect(
    runCli([], jest.fn(), "/repo", { runNpmPrerequisite: checkPrerequisite }),
  ).resolves.toBe(1);
  expect(acquireValidationLock).not.toHaveBeenCalled();
});

test("releases the repository lock when validation completes", async () => {
  const release = jest.fn();
  acquireValidationLock.mockResolvedValueOnce(release);
  await expect(runCli([], jest.fn(), "/repo")).resolves.toBe(0);
  expect(release).toHaveBeenCalledTimes(1);
});

test("coordinates diagnostic parsing, convention and validation stages, and result writing", async () => {
  const write = jest.fn();
  const options = { runOption: true };
  await expect(runCli([], write, "/repo")).resolves.toBe(0);
  expect(readDiagnosticOptions).toHaveBeenCalledWith([]);
  expect(createStageTimer).toHaveBeenCalledWith(false, expect.any(Function), undefined);
  expect(createStageTimer.mock.calls[0][1]()).toEqual(expect.any(Number));
  expect(runConventionStage).toHaveBeenCalledWith(expect.any(Function));
  expect(runValidation).toHaveBeenCalledWith("/repo", [], options);
  expect(createValidationRunOptions).toHaveBeenCalledWith(
    [],
    diagnosticOptions,
    expect.objectContaining({ validationSummary: expect.any(Object) }),
    timing,
    undefined,
  );
  expect(writeValidationResults).toHaveBeenCalled();
  expect(formatExitCode).not.toHaveBeenCalled();
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
    undefined,
  );
});

test("enables timing output and formats nonzero or debug exit codes", async () => {
  const write = jest.fn();
  await expect(runCli(["--debug-timing"], write, "/repo")).resolves.toBe(0);
  expect(createStageTimer).toHaveBeenCalledWith(true, expect.any(Function), expect.any(Function));
  expect(writeValidationResults).toHaveBeenCalled();
  expect(formatExitCode).toHaveBeenCalledWith(0);
  expect(write).toHaveBeenCalledWith("formatted exit code");
  const defaultWrite = jest.spyOn(console, "log").mockImplementation(() => {});
  await expect(runCli(["--debug-timing"])).resolves.toBe(0);
  expect(createStageTimer).toHaveBeenLastCalledWith(
    true,
    expect.any(Function),
    expect.any(Function),
  );
  defaultWrite.mockRestore();
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
