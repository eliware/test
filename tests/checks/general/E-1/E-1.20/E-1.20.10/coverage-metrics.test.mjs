import { expect, test } from "@jest/globals";
import { coverageMetricValues } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-metrics.mjs";

test("centralizes coverage counters and completeness detection", () => {
  expect(coverageMetricValues({ s: { 0: 1 }, b: { 0: [0] }, f: {}, l: { 1: 1 }, statementMap: { 0: {} } }, [["1", 1]])).toEqual({
    values: { statements: [1], branches: [0], functions: [], lines: [1] },
    hasCounters: true,
    hasMaps: true,
  });
  expect(coverageMetricValues({}, [])).toEqual({
    values: { statements: [], branches: [], functions: [], lines: [] },
    hasCounters: false,
    hasMaps: false,
  });
});
