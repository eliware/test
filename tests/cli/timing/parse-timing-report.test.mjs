import { expect, test } from "@jest/globals";
import { parseTimingReport } from "../../../src/cli/timing/parse-timing-report.mjs";

test("parses a report that begins at the JSON object", () => {
  expect(parseTimingReport('{"numFailedTestSuites":0,"testResults":[]}')).toEqual({
    numFailedTestSuites: 0,
    testResults: [],
  });
});
