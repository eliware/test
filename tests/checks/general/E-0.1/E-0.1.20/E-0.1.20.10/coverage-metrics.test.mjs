import { expect, test } from "@jest/globals";
import { coverageMetricValues } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-metrics.mjs";
import { fileGap } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-file-gap.mjs";

test("centralizes coverage counters and completeness detection", () => {
  expect(
    coverageMetricValues(
      {
        s: { 0: 1 },
        b: { 0: [0] },
        f: {},
        l: { 1: 1 },
        statementMap: { 0: {} },
        branchMap: { 0: {} },
        fnMap: {},
      },
      [["1", 1]],
    ),
  ).toEqual({
    values: { statements: [1], branches: [0], functions: [], lines: [1] },
    hasCounters: true,
    hasMaps: true,
  });
  expect(coverageMetricValues({}, [])).toEqual({
    values: { statements: [], branches: [], functions: [], lines: [] },
    hasCounters: false,
    hasMaps: false,
  });
  expect(
    coverageMetricValues({ s: {}, b: {}, f: {}, statementMap: {}, branchMap: {}, fnMap: {} }, []),
  ).toMatchObject({ hasCounters: false, hasMaps: true });
});

test("rejects missing or mismatched per-metric map and counter pairs", () => {
  for (const incomplete of [
    { s: { 0: 1 }, statementMap: { 0: {} } },
    { s: { 0: 1 }, statementMap: { 1: {} }, b: {}, branchMap: {}, f: {}, fnMap: {} },
    { s: { 0: 1 }, statementMap: { 0: {} }, b: {}, branchMap: {}, f: {} },
  ]) {
    expect(coverageMetricValues(incomplete, []).hasMaps).toBe(false);
  }
});

test("rejects empty report maps when source-derived coverage contains entries", () => {
  const emptyReport = {
    statementMap: {},
    s: {},
    branchMap: {},
    b: {},
    fnMap: {},
    f: {},
    l: {},
  };
  const expectedShape = {
    statementMap: { 0: { start: { line: 1, column: 0 } } },
    branchMap: {},
    fnMap: {},
    lineMap: { 1: {} },
  };
  expect(() => fileGap("src/required.mjs", emptyReport, expectedShape)).toThrow(
    "does not account for every source statement entry",
  );
});

test("rejects fractional execution counters before calculating coverage totals", () => {
  for (const data of [{ s: { 0: 0.5 } }, { b: { 0: [0.5] } }, { f: { 0: 0.5 } }]) {
    expect(() => coverageMetricValues(data, [])).toThrow("non-negative safe integers");
  }
  expect(() => coverageMetricValues({}, [["1", 0.5]])).toThrow("non-negative safe integers");
});
