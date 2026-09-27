import { expect, test } from "@jest/globals";
import { coverageMetricValues } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-metrics.mjs";
import { parseDetailed } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/parse-detailed-coverage.mjs";
import { expectedCoverageShape } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-source-shapes.mjs";

test("centralizes coverage counters and completeness detection", () => {
  expect(coverageMetricValues({ s: { 0: 1 }, b: { 0: [0] }, f: {}, l: { 1: 1 }, statementMap: { 0: {} }, branchMap: { 0: {} }, fnMap: {} }, [["1", 1]])).toEqual({
    values: { statements: [1], branches: [0], functions: [], lines: [1] },
    hasCounters: true,
    hasMaps: true,
  });
  expect(coverageMetricValues({}, [])).toEqual({
    values: { statements: [], branches: [], functions: [], lines: [] },
    hasCounters: false,
    hasMaps: false,
  });
  expect(coverageMetricValues({ s: {}, b: {}, f: {}, statementMap: {}, branchMap: {}, fnMap: {} }, []).hasMaps).toBe(false);
});

test("rejects missing evidence for an expected source with no instrumentable statements", () => {
  const file = "src/empty.mjs";
  const shape = expectedCoverageShape("// no instrumentable statements", file);
  expect(Object.keys(shape.statementMap)).toHaveLength(0);
  expect(() => parseDetailed({}, [file], { [file]: shape })).toThrow(
    "Detailed coverage omits in-scope source file(s): src/empty.mjs.",
  );
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

test("rejects fractional execution counters before calculating coverage totals", () => {
  for (const data of [
    { s: { 0: 0.5 } },
    { b: { 0: [0.5] } },
    { f: { 0: 0.5 } },
  ]) {
    expect(() => coverageMetricValues(data, [])).toThrow("non-negative safe integers");
  }
  expect(() => coverageMetricValues({}, [["1", 0.5]])).toThrow("non-negative safe integers");
});
