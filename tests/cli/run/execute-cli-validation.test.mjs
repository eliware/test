import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  createValidationRunOptions,
  diagnosticOptions,
  formatExitCode,
  resetCli,
  runConventionStage,
  runValidation,
  timing,
  writeValidationResults,
} from "../../../test-fixtures/cli/run-cli-harness.mjs";
const { executeCliValidation } = await import("../../../src/cli/run/execute-cli-validation.mjs");

beforeEach(resetCli);

test("executes validation stages and reports the validation result", async () => {
  const write = jest.fn();

  await expect(executeCliValidation({ args: [], write, root: "/repo", options: {} })).resolves.toBe(
    0,
  );

  expect(runConventionStage).toHaveBeenCalledWith(expect.any(Function));
  expect(runValidation).toHaveBeenCalledWith("/repo", [], { runOption: true });
  expect(createValidationRunOptions).toHaveBeenCalledWith(
    [],
    diagnosticOptions,
    expect.objectContaining({ validationSummary: expect.any(Object) }),
    timing,
    undefined,
  );
  expect(writeValidationResults).toHaveBeenCalledWith(
    expect.objectContaining({ validationSummary: expect.any(Object), mode: "focused" }),
    write,
    false,
    expect.any(Number),
  );
  expect(formatExitCode).not.toHaveBeenCalled();
});
