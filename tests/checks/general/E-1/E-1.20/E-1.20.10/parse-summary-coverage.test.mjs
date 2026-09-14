import { expect, test } from "@jest/globals";
import { parseSummary } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/parse-summary-coverage.mjs";

test("parses summary coverage evidence", () => {
  expect(parseSummary({
    total: {
      statements: { pct: 100 }, branches: { pct: 99 }, functions: { pct: 100 }, lines: { pct: 100 },
    },
  }).totals.branches).toBe(99);
});

test.each([-1, 101, Number.NaN, Number.POSITIVE_INFINITY])(
  "rejects unusable coverage percentage %s",
  (pct) => {
    const total = Object.fromEntries(
      ["statements", "branches", "functions", "lines"].map((metric) => [metric, { pct }]),
    );
    expect(parseSummary({ total })).toBeNull();
  },
);

test("returns null for incomplete summaries", () => {
  expect(parseSummary(null)).toBeNull();
  expect(parseSummary({ total: { statements: { pct: 100 } } })).toBeNull();
});
