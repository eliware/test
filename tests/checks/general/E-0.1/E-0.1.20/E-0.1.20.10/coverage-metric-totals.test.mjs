import { expect, test } from "@jest/globals";
import { coverageMetricTotals } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-metric-totals.mjs";

test("aggregates covered and total counters across files", () => {
  expect(
    coverageMetricTotals([
      { statements: [1, 0], branches: [1, 1], functions: [1], lines: [1, 0] },
      { statements: [1], branches: [0], functions: [0], lines: [1] },
    ]),
  ).toEqual({
    statements: 66.66666666666666,
    branches: 66.66666666666666,
    functions: 50,
    lines: 66.66666666666666,
  });
});

test("returns null for metric groups without counters", () => {
  expect(coverageMetricTotals([{ statements: [1] }])).toEqual({
    statements: 100,
    branches: null,
    functions: null,
    lines: null,
  });
});
