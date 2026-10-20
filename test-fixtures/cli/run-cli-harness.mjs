import { jest } from "@jest/globals";
const readDiagnosticOptions = jest.fn();
const createStageTimer = jest.fn();
const createTimingLog = jest.fn();
const runConventionStage = jest.fn();
const runValidation = jest.fn();
const dispatchInformationalCommand = jest.fn();
const createValidationRunOptions = jest.fn();
const writeValidationResults = jest.fn();
const normalizeCliError = jest.fn();
const formatExitCode = jest.fn();
const acquireValidationLock = jest.fn();
const runNpmPrerequisite = jest.fn(async () => true);
jest.unstable_mockModule("../../src/cli/read/diagnostic-options.mjs", () => ({
  readDiagnosticOptions,
}));
jest.unstable_mockModule("../../src/cli/timing/create/stage-timer.mjs", () => ({
  createStageTimer,
}));
jest.unstable_mockModule("../../src/cli/timing/create/timing-log.mjs", () => ({
  createTimingLog,
}));
jest.unstable_mockModule("../../src/validation/check-execution/run-convention-stage.mjs", () => ({
  runConventionStage,
}));
jest.unstable_mockModule("../../src/validation/run-validation.mjs", () => ({ runValidation }));
jest.unstable_mockModule("../../src/cli/dispatch-informational-command.mjs", () => ({
  dispatchInformationalCommand,
}));
jest.unstable_mockModule("../../src/cli/create-validation-run-options.mjs", () => ({
  createValidationRunOptions,
}));
jest.unstable_mockModule("../../src/cli/write/validation-results.mjs", () => ({
  writeValidationResults,
}));
jest.unstable_mockModule("../../src/cli/normalize-cli-error.mjs", () => ({ normalizeCliError }));
jest.unstable_mockModule("../../src/cli/format-exit-code.mjs", () => ({ formatExitCode }));
jest.unstable_mockModule("../../src/cli/acquire-validation-lock.mjs", () => ({
  acquireValidationLock,
}));
jest.unstable_mockModule("../../src/cli/run/npm-prerequisite.mjs", () => ({
  runNpmPrerequisite,
}));
const diagnosticOptions = { jestArgs: ["tests/sample.test.mjs"] };
const timing = {
  getLines: jest.fn(() => []),
  stage: jest.fn(),
};
const validationResult = { code: 0, category: "validation", diagnostics: [] };
function resetCli() {
  jest.resetAllMocks();
  validationResult.code = 0;
  readDiagnosticOptions.mockReturnValue(diagnosticOptions);
  createStageTimer.mockReturnValue(timing);
  createTimingLog.mockReturnValue(jest.fn());
  runConventionStage.mockImplementation(async (runChecks) => {
    await runChecks();
    return validationResult;
  });
  runValidation.mockResolvedValue([]);
  dispatchInformationalCommand.mockReturnValue(null);
  createValidationRunOptions.mockReturnValue({ runOption: true });
  writeValidationResults.mockImplementation(() => {});
  normalizeCliError.mockReturnValue(1);
  formatExitCode.mockReturnValue("formatted exit code");
  acquireValidationLock.mockResolvedValue(jest.fn());
  runNpmPrerequisite.mockClear().mockResolvedValue(true);
}
export {
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
};
