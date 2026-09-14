import { expect, test } from "@jest/globals";
import { durationSeconds, formatTestResult, formatTestStart } from "../../../../../src/checks/general/E-1/E-1.20/format-jest-timing.mjs";

test("formats suite and assertion timing without writing output", () => {
  expect(formatTestStart("tests/example.test.mjs")).toBe("Running tests/example.test.mjs...");
  expect(durationSeconds({ startTime: 100, endTime: 1_100 })).toBe(1);
  expect(formatTestResult({ path: "tests/example.test.mjs" }, {
    startTime: 100,
    endTime: 1_100,
    assertionResults: [{ status: "passed", fullName: "works", duration: 250 }],
  })).toEqual([
    "Completed tests/example.test.mjs — 1.000s",
    "  PASS works — 0.250s",
  ]);
});

test("formats missing and failed assertion details", () => {
  expect(durationSeconds({})).toBe(0);
  expect(formatTestResult({ path: "tests/failing.test.mjs" }, {
    assertionResults: [{ status: "failed", title: "broken", duration: 10 }],
  })).toEqual([
    "Completed tests/failing.test.mjs — 0.000s",
    "  FAILED broken — 0.010s",
  ]);
  expect(formatTestResult({ path: "tests/empty.test.mjs" }, {})).toEqual([
    "Completed tests/empty.test.mjs — 0.000s",
  ]);
});
