import { expect, test } from "@jest/globals";
import { parseTimingReport } from "../../../src/cli/timing/parse-timing-report.mjs";

test("parses a report that begins at the JSON object", () => {
  expect(parseTimingReport('{"numFailedTestSuites":0,"testResults":[]}')).toEqual({
    numFailedTestSuites: 0,
    testResults: [],
  });
});

test("parses embedded Jest JSON and rejects missing reports", () => {
  expect(parseTimingReport('prefix {"numFailedTestSuites":0,"testResults":[]}')).toEqual({
    numFailedTestSuites: 0,
    testResults: [],
  });
  expect(() => parseTimingReport("not json")).toThrow("Jest timing JSON was not found");
});
