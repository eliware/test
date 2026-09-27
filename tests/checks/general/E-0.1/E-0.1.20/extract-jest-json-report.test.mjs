import { expect, test } from "@jest/globals";
import { extractJestJsonReport } from "../../../../../src/checks/general/E-0.1/E-0.1.20/extract-jest-json-report.mjs";

test("extracts a complete nested Jest report and ignores trailing output", () => {
  const output =
    'prefix {"numFailedTestSuites":0,"testResults":[{"assertionResults":[{"title":"brace } in text"}]}]} trailing';
  expect(extractJestJsonReport(output)).toEqual({
    start: 7,
    end: output.indexOf(" trailing"),
    report: {
      numFailedTestSuites: 0,
      testResults: [{ assertionResults: [{ title: "brace } in text" }] }],
    },
  });
});

test("does not treat a nested reporter key as a top-level Jest report", () => {
  const output = 'prefix {"payload":{"numFailedTestSuites":0}} suffix';
  expect(extractJestJsonReport(output)).toBeNull();
});

test("returns no report for missing or unbalanced JSON", () => {
  expect(extractJestJsonReport("plain output")).toBeNull();
  expect(extractJestJsonReport('{"numFailedTestSuites":0')).toBeNull();
  expect(extractJestJsonReport('{"numFailedTestSuites":}')).toBeNull();
});

test("ignores escaped quote and brace characters while finding the JSON boundary", () => {
  const output = String.raw`{"numFailedTestSuites":0,"message":"escaped quote: \" and brace }"}`;
  expect(extractJestJsonReport(output)?.report).toEqual({
    numFailedTestSuites: 0,
    message: 'escaped quote: " and brace }',
  });
});
