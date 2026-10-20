import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { writeValidationResults } from "../../../src/cli/write/validation-results.mjs";

beforeEach(() => jest.useFakeTimers({ now: 5000 }));
afterEach(() => jest.useRealTimers());

test("writes diagnostics without timing when timing is disabled", () => {
  const write = jest.fn();
  writeValidationResults({ diagnostics: ["diagnostic"] }, write, false, 0);
  expect(write).toHaveBeenCalledWith("diagnostic");
});

test("writes timing to the log sink when console timing is disabled", () => {
  const write = jest.fn();
  const timingWrite = jest.fn();
  writeValidationResults({ diagnostics: [] }, write, false, 0, timingWrite);
  expect(write).not.toHaveBeenCalledWith(expect.stringMatching(/^Validation time:/u));
  expect(timingWrite).toHaveBeenCalledWith(expect.stringMatching(/^Validation time:/u));
});

test("prints an aggregate summary with check, Jest, issue, and time counts", () => {
  const write = jest.fn();
  writeValidationResults(
    {
      code: 0,
      diagnostics: [],
      validationSummary: {
        checkCount: 42,
        jestCounts: { testSuites: 8, tests: 120 },
        jestTimeMs: 1200,
      },
    },
    write,
    false,
    1000,
  );
  expect(write).toHaveBeenCalledTimes(1);
  expect(write).toHaveBeenCalledWith(
    "Aggregate validation passed.\n" +
      "Checks: 42 | Test suites: 8 | Tests: 120\n" +
      "Lint warnings: 0 | Format issues: 0 | Audit issues: 0 | Pack issues: 0\n" +
      "Checks time: 2.800s | Jest time: 1.200s | Total time: 4.000s\n" +
      "Exit-code: 0",
  );
});

test("prints the same summary for focused validation", () => {
  const write = jest.fn();
  jest.setSystemTime(3000);
  writeValidationResults(
    {
      code: 0,
      diagnostics: [],
      mode: "focused",
      validationSummary: {
        checkCount: 4,
        jestCounts: { testSuites: 2, tests: 6 },
        jestTimeMs: 1000,
      },
    },
    write,
    false,
    1000,
  );
  jest.setSystemTime(5000);

  expect(write).toHaveBeenCalledWith(
    "Focused validation passed.\n" +
      "Checks: 4 | Test suites: 2 | Tests: 6\n" +
      "Lint warnings: 0 | Format issues: 0 | Audit issues: 0 | Pack issues: 0\n" +
      "Checks time: 1.000s | Jest time: 1.000s | Total time: 2.000s\n" +
      "Exit-code: 0",
  );
});

test.each([
  ["lint", "Lint mode passed | Exit-code: 0"],
  ["format", "Formatting completed | Exit-code: 0"],
  ["format-check", "Format check passed | Exit-code: 0"],
  ["audit", "Audit passed | Exit-code: 0"],
  ["pack", "Pack validation passed | Exit-code: 0"],
])("reports only the successful %s mode", (mode, expected) => {
  const write = jest.fn();
  writeValidationResults({ code: 0, diagnostics: [], mode }, write, false, 0);
  expect(write).toHaveBeenCalledWith(expected);
  expect(write.mock.calls.join(" ")).not.toMatch(/tests passed|coverage/iu);
});

test("does not claim a clean run when output or diagnostics exist", () => {
  const write = jest.fn();
  writeValidationResults(
    { code: 0, diagnostics: [], output: "unexpected output" },
    write,
    false,
    0,
  );
  expect(write).not.toHaveBeenCalledWith("Aggregate validation passed.");
});

test("writes aggregate details during a clean debug run", () => {
  const write = jest.fn();
  writeValidationResults({ code: 0, diagnostics: [], validationSummary: {} }, write, true, 5000);
  expect(write.mock.calls[0][0]).toMatch(/^Aggregate validation passed\./u);
  expect(write.mock.calls[1][0]).toMatch(/^Validation time:/u);
});

test("does not write success for failures or mode runs with debug timing", () => {
  const write = jest.fn();
  writeValidationResults({ code: 1, diagnostics: ["failed"] }, write, false, 0);
  writeValidationResults({ code: 0, diagnostics: [], mode: "focused" }, write, true, 5000);
  expect(
    write.mock.calls.some(([line]) => String(line).startsWith("Aggregate validation passed.")),
  ).toBe(false);
});

test("writes timing without a mode message for tool runs with debug timing", () => {
  const write = jest.fn();
  writeValidationResults({ code: 0, diagnostics: [], mode: "lint" }, write, true, 5000);
  expect(write).toHaveBeenCalledTimes(1);
  expect(write).toHaveBeenCalledWith(expect.stringMatching(/^Validation time:/u));
});

test("writes timing output when timing is enabled", () => {
  const write = jest.fn();
  writeValidationResults({ diagnostics: [] }, write, true, 5000);
  expect(write).not.toHaveBeenCalledWith("timing line");
  expect(write).toHaveBeenCalledWith(expect.stringMatching(/^Validation time:/));
  expect(write.mock.calls.join(" ")).not.toContain("Timing report");
});
