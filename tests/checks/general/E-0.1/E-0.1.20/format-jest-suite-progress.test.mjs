import { expect, test } from "@jest/globals";
import { formatJestSuiteProgress } from "../../../../../src/checks/general/E-0.1/E-0.1.20/format-jest-suite-progress.mjs";

test("writes one start line for a suite", () => {
  expect(formatJestSuiteProgress({ event: "start", path: "tests/example.test.mjs" })).toEqual([
    "Running tests/example.test.mjs...",
  ]);
});

test("writes PASS and duration for a successful suite", () => {
  expect(formatJestSuiteProgress({ event: "result", duration: "0.212", failed: false })).toEqual([
    " PASS - 0.212s\n",
  ]);
});

test("writes failures and unexpected output before FAIL and duration", () => {
  expect(
    formatJestSuiteProgress({
      event: "result",
      duration: "1.250",
      failed: true,
      failures: ["Assertion failed"],
      unexpectedOutput: ["console.warn: warning"],
    }),
  ).toEqual([
    "\nAssertion failed\n",
    "\nUnexpected output:\nconsole.warn: warning\n",
    " FAIL - 1.250s\n",
  ]);
});

test("ignores unknown or incomplete progress events", () => {
  expect(formatJestSuiteProgress({ event: "start" })).toEqual([]);
  expect(formatJestSuiteProgress({ event: "other" })).toEqual([]);
});

test("writes FAIL even when no failure details are available", () => {
  expect(formatJestSuiteProgress({ event: "result", failed: true, duration: "0.000" })).toEqual([
    " FAIL - 0.000s\n",
  ]);
});
