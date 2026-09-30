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
  expect(write).toHaveBeenCalledWith("Aggregate validation passed | Exit-code: 0");
});

test.each([
  ["lint", "Lint mode passed | Exit-code: 0"],
  ["format", "Formatting completed | Exit-code: 0"],
  ["format-check", "Format check passed | Exit-code: 0"],
  ["audit", "Audit passed | Exit-code: 0"],
  ["pack", "Pack validation passed | Exit-code: 0"],
])("reports only the successful %s mode", (mode, expected) => {
  const write = jest.fn();
  writeValidationResults({ code: 0, diagnostics: [], mode }, write, false, {}, 0);
  expect(write).toHaveBeenCalledWith(expected);
  expect(write.mock.calls.join(" ")).not.toMatch(/tests passed|coverage|lint warnings/iu);
});

test("does not claim a clean run when output or diagnostics exist", () => {
  const write = jest.fn();
  writeValidationResults(
    { code: 0, diagnostics: [], output: "unexpected output" },
    write,
    false,
    {},
    0,
  );
  expect(write).not.toHaveBeenCalledWith("Aggregate validation passed | Exit-code: 0");
});

test("writes timing output when timing is enabled", () => {
  const write = jest.fn();
  const timing = { getLines: () => ["timing line"], getJestOutput: () => "" };
  writeValidationResults({ diagnostics: [] }, write, true, timing, Date.now());
  expect(write).toHaveBeenCalledWith("timing line");
  expect(write).toHaveBeenCalledWith(expect.stringMatching(/^Validation time:/));
});
