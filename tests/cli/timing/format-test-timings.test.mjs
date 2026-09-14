import { expect, test } from "@jest/globals";
import { formatTestTimings } from "../../../src/cli/timing/format-test-timings.mjs";
import { parseTimingReport } from "../../../src/cli/timing/parse-timing-report.mjs";

test("formats slowest files and test cases", () => {
  const output = formatTestTimings({
    testResults: [
      { testFilePath: "tests\\slow.test.mjs", perfStats: { start: 0, end: 3000 }, assertionResults: [{ duration: 2500, fullName: "slow case" }, { duration: 100, title: "small case" }, { duration: "bad" }] },
      { testFilePath: "tests/fast.test.mjs", perfStats: { start: 0, end: 1000 }, assertionResults: [{ duration: 500, fullName: "fast case" }] },
    ],
  });
  expect(output).toContain("3.000s tests/slow.test.mjs");
  expect(output).toContain("  2.500s slow case");
});

test("omits empty timing reports", () => {
  expect(formatTestTimings({ testResults: [] })).toBe("");
});

test("uses a fallback test name", () => {
  expect(formatTestTimings({ testResults: [
    { testFilePath: "a.test.mjs", perfStats: { start: 0, end: 1 }, assertionResults: [{ duration: 1 }] },
  ] })).toContain("unknown test");
});

test("parses embedded Jest JSON and rejects missing reports", () => {
  expect(parseTimingReport('prefix {"numFailedTestSuites":0,"testResults":[]}')).toEqual({
    numFailedTestSuites: 0,
    testResults: [],
  });
  expect(() => parseTimingReport("not json")).toThrow("Jest timing JSON was not found");
});
