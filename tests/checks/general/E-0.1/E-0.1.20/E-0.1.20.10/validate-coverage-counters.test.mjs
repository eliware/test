import { expect, test } from "@jest/globals";
import { validateCoverageCounters } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/validate-coverage-counters.mjs";

test("accepts integer execution counts across all metrics", () => {
  expect(validateCoverageCounters({ statements: [0, 1], branches: [2], functions: [0], lines: [3] }))
    .toBeNull();
});

test("rejects fractional, negative, and non-finite counters", () => {
  for (const values of [
    { statements: [0.5] },
    { branches: [-1] },
    { functions: [Number.POSITIVE_INFINITY] },
    { lines: [Number.NaN] },
  ]) {
    expect(validateCoverageCounters(values)).toContain("non-negative safe integers");
  }
});
