import { expect, jest, test } from "@jest/globals";
import { writeValidationResults } from "../../src/cli/write-validation-results.mjs";

test("writes diagnostics without timing when timing is disabled", () => {
  const write = jest.fn();
  writeValidationResults({ diagnostics: ["diagnostic"] }, write, false, {}, 0);
  expect(write).toHaveBeenCalledWith("diagnostic");
});

test("writes one concise line for a clean validation run", () => {
  const write = jest.fn();
  writeValidationResults({ code: 0, diagnostics: [] }, write, false, {}, 0);
  expect(write).toHaveBeenCalledTimes(1);
  expect(write).toHaveBeenCalledWith("All tests passed | 100x4 coverage | 0 lint warnings");
});

test("does not claim a clean run when output or diagnostics exist", () => {
  const write = jest.fn();
  writeValidationResults({ code: 0, diagnostics: [], output: "unexpected output" }, write, false, {}, 0);
  expect(write).not.toHaveBeenCalledWith("All tests passed | 100x4 coverage | 0 lint warnings");
});

test("writes timing output when timing is enabled", () => {
  const write = jest.fn();
  const timing = { getLines: () => ["timing line"], getJestOutput: () => "" };
  writeValidationResults({ diagnostics: [] }, write, true, timing, Date.now());
  expect(write).toHaveBeenCalledWith("timing line");
  expect(write).toHaveBeenCalledWith(expect.stringMatching(/^Validation time:/));
});
