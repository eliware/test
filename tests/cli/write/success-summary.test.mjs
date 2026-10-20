import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import {
  formatAggregateSuccess,
  formatFocusedSuccess,
  formatValidationSuccess,
} from "../../../src/cli/write/success-summary.mjs";

beforeEach(() => jest.useFakeTimers({ now: 5000 }));
afterEach(() => jest.useRealTimers());

test.each([
  ["lint", "Lint mode passed | Exit-code: 0"],
  ["format", "Formatting completed | Exit-code: 0"],
  ["format-check", "Format check passed | Exit-code: 0"],
  ["audit", "Audit passed | Exit-code: 0"],
  ["pack", "Pack validation passed | Exit-code: 0"],
])("formats the successful %s mode", (mode, expected) => {
  expect(formatValidationSuccess(mode)).toBe(expected);
});

test.each([
  [formatAggregateSuccess, "Aggregate validation passed."],
  [formatFocusedSuccess, "Focused validation passed."],
])("formats a summary with counts and timings", (format, title) => {
  jest.setSystemTime(9000);
  expect(
    format(
      {
        validationSummary: {
          checkCount: 42,
          jestCounts: { testSuites: 8, tests: 120 },
          jestTimeMs: 1200,
        },
      },
      5000,
    ),
  ).toBe(
    `${title}\n` +
      "Checks: 42 | Test suites: 8 | Tests: 120\n" +
      "Lint warnings: 0 | Format issues: 0 | Audit issues: 0 | Pack issues: 0\n" +
      "Checks time: 2.800s | Jest time: 1.200s | Total time: 4.000s\n" +
      "Exit-code: 0",
  );
});

test("uses zero counts when the validation summary is absent", () => {
  expect(formatAggregateSuccess({}, 5000)).toContain("Checks: 0 | Test suites: 0 | Tests: 0");
});
