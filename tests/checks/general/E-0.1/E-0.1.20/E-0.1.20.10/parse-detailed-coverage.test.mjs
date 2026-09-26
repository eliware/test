import { expect, test } from "@jest/globals";
import { parseDetailed } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/parse-detailed-coverage.mjs";

test("aggregates coverage gaps and metric totals across detailed source files", () => {
  const result = parseDetailed({
    "src/gap.mjs": {
      statementMap: { 0: { start: { line: 4 } } },
      s: { 0: 0 },
      branchMap: { 0: {} },
      b: { 0: [0] },
      fnMap: { 0: {} },
      f: { 0: 0 },
      l: { 4: 0 },
    },
    "src/complete.mjs": {
      s: { 0: 1 },
      b: { 0: [1, 1] },
      f: { 0: 1 },
      l: { 1: 1 },
      statementMap: { 0: { start: { line: 1 } } },
      branchMap: { 0: {} },
      fnMap: { 0: {} },
    },
  });
  expect(result.gaps).toHaveLength(1);
  expect(result.totals).toMatchObject({ statements: 50, functions: 50, lines: 50 });
  expect(result.totals.branches).toBeCloseTo(200 / 3);
});

test("returns null when a detailed report has no in-scope source files", () => {
  expect(parseDetailed(null)).toBeNull();
  expect(parseDetailed({ "README.md": {}, "tests/example.test.mjs": {} })).toBeNull();
});

test("aggregates against source shapes after Windows path normalization", () => {
  const shape = {
    statementMap: { 0: { start: { line: 1 } } },
    branchMap: {},
    fnMap: {},
    lineMap: { 1: {} },
  };
  const evidence = {
    s: { 0: 1 },
    b: {},
    f: {},
    l: { 1: 1 },
    statementMap: shape.statementMap,
    branchMap: {},
    fnMap: {},
  };
  expect(parseDetailed(
    { "C:\\repo\\src\\listed.mjs": evidence },
    ["src/listed.mjs"],
    { "src/listed.mjs": shape },
  ).totals.lines).toBe(100);
});
