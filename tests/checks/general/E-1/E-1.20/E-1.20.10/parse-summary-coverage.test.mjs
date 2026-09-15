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

test("rejects a zero-total metric reported as complete", () => {
  const total = Object.fromEntries(["statements", "branches", "functions", "lines"].map((metric) => [metric, { pct: 100, covered: 0, total: 0 }]));
  expect(parseSummary({ total })).toBeNull();
});

test("accepts consistent counted metrics", () => {
  const total = Object.fromEntries(["statements", "branches", "functions", "lines"].map((metric) => [metric, { pct: 50, covered: 1, total: 2 }]));
  expect(parseSummary({ total }).totals).toEqual({ statements: 50, branches: 50, functions: 50, lines: 50 });
});

test("rejects malformed counted metrics", () => {
  const total = Object.fromEntries(["statements", "branches", "functions", "lines"].map((metric) => [metric, { pct: 50, covered: 3, total: 2 }]));
  expect(parseSummary({ total })).toBeNull();
});
