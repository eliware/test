import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  createStageTimer,
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
    expect.any(Function),
  );
  expect(writeValidationResults).toHaveBeenCalledWith(
    expect.objectContaining({ validationSummary: expect.any(Object), mode: "focused" }),
    write,
    false,
    expect.any(Number),
    expect.any(Function),
  );
  expect(formatExitCode).not.toHaveBeenCalled();
  const [, now, output] = createStageTimer.mock.calls[0];
  expect(now()).toEqual(expect.any(Number));
  expect(() => output("timing output")).not.toThrow();
});
