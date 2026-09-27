import { beforeEach, expect, jest, test } from "@jest/globals";

const readDiagnosticOptions = jest.fn();
const createStageTimer = jest.fn();
const runConventionStage = jest.fn();
const runValidation = jest.fn();
const dispatchInformationalCommand = jest.fn();
const createValidationRunOptions = jest.fn();
const writeValidationResults = jest.fn();
const normalizeCliError = jest.fn();
const formatExitCode = jest.fn();

jest.unstable_mockModule("../../src/cli/read-diagnostic-options.mjs", () => ({
  readDiagnosticOptions,
}));
jest.unstable_mockModule("../../src/cli/timing/create-stage-timer.mjs", () => ({
  createStageTimer,
}));
jest.unstable_mockModule("../../src/orchestrators/run-convention-stage.mjs", () => ({
  runConventionStage,
}));
jest.unstable_mockModule("../../src/orchestrators/run-validation.mjs", () => ({ runValidation }));
jest.unstable_mockModule("../../src/cli/dispatch-informational-command.mjs", () => ({
  dispatchInformationalCommand,
}));
jest.unstable_mockModule("../../src/cli/create-validation-run-options.mjs", () => ({
  createValidationRunOptions,
}));
jest.unstable_mockModule("../../src/cli/write-validation-results.mjs", () => ({
  writeValidationResults,
}));
jest.unstable_mockModule("../../src/cli/normalize-cli-error.mjs", () => ({ normalizeCliError }));
jest.unstable_mockModule("../../src/cli/format-exit-code.mjs", () => ({ formatExitCode }));

const { runCli } = await import("../../src/cli/run-cli.mjs");
const diagnosticOptions = { ignoredRuleIds: ["E-0.1.4"], jestArgs: ["tests/sample.test.mjs"] };
const timing = { getLines: jest.fn(() => []), getJestOutput: jest.fn(() => "") };
const validationResult = { code: 0, category: "validation", diagnostics: [] };

function resetCli() {
  jest.resetAllMocks();
  validationResult.code = 0;
  readDiagnosticOptions.mockReturnValue(diagnosticOptions);
  createStageTimer.mockReturnValue(timing);
  runConventionStage.mockImplementation(async (runChecks) => {
    await runChecks();
    return validationResult;
  });
  runValidation.mockResolvedValue([]);
  dispatchInformationalCommand.mockReturnValue(null);
  createValidationRunOptions.mockReturnValue({ runOption: true });
  writeValidationResults.mockImplementation(() => {});
  normalizeCliError.mockReturnValue(18);
  formatExitCode.mockReturnValue("formatted exit code");
}

beforeEach(resetCli);

test("returns informational command results before starting validation", async () => {
  dispatchInformationalCommand.mockReturnValueOnce(0);
  const write = jest.fn();

  await expect(runCli(["--version"], write, "/repo")).resolves.toBe(0);

  expect(dispatchInformationalCommand).toHaveBeenCalledWith(["--version"], write);
  expect(readDiagnosticOptions).toHaveBeenCalledWith(["--version"]);
  expect(createStageTimer).not.toHaveBeenCalled();
  expect(runConventionStage).not.toHaveBeenCalled();
});

test("uses the default output writer for informational commands", async () => {
  dispatchInformationalCommand.mockReturnValueOnce(0);

  await expect(runCli(["--version"])).resolves.toBe(0);
});

test("coordinates diagnostic parsing, convention and validation stages, and result writing", async () => {
  const write = jest.fn();
  const options = { runOption: true };

  await expect(runCli([], write, "/repo")).resolves.toBe(0);

  expect(readDiagnosticOptions).toHaveBeenCalledWith([]);
  expect(createStageTimer).toHaveBeenCalledWith(false, expect.any(Function), undefined);
  expect(createStageTimer.mock.calls[0][1]()).toEqual(expect.any(Number));
  expect(runConventionStage).toHaveBeenCalledWith(expect.any(Function));
  expect(runValidation).toHaveBeenCalledWith("/repo", diagnosticOptions.ignoredRuleIds, options);
  expect(createValidationRunOptions).toHaveBeenCalledWith([], diagnosticOptions, {}, timing, write);
  expect(writeValidationResults).toHaveBeenCalledWith(
    validationResult,
    write,
    false,
    timing,
    expect.any(Number),
  );
  expect(formatExitCode).not.toHaveBeenCalled();
});

test("enables timing output and formats nonzero or debug exit codes", async () => {
  const write = jest.fn();

  await expect(runCli(["--debug-timing"], write, "/repo")).resolves.toBe(0);

  expect(createStageTimer).toHaveBeenCalledWith(true, expect.any(Function), write);
  expect(writeValidationResults).toHaveBeenCalledWith(
    validationResult,
    write,
    true,
    timing,
    expect.any(Number),
  );
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

  await expect(runCli([], write)).resolves.toBe(18);

  expect(normalizeCliError).toHaveBeenCalledWith(error, write);
  expect(formatExitCode).toHaveBeenCalledWith(18);
  expect(write).toHaveBeenCalledWith("formatted exit code");
});
