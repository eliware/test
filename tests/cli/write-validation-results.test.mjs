import { expect, jest, test } from "@jest/globals";
import { writeValidationResults } from "../../src/cli/write-validation-results.mjs";

test("writes diagnostics without timing when timing is disabled", () => {
  const write = jest.fn();
  writeValidationResults({ diagnostics: ["diagnostic"] }, write, false, {}, 0);
  expect(write).toHaveBeenCalledWith("diagnostic");
});

test("writes timing output when timing is enabled", () => {
  const write = jest.fn();
  const timing = { getLines: () => [], getJestOutput: () => "" };
  writeValidationResults({ diagnostics: [] }, write, true, timing, Date.now());
  expect(write).toHaveBeenCalledWith(expect.stringMatching(/^Validation time:/));
});
