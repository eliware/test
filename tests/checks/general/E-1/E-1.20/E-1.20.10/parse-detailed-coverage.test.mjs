import { expect, test } from "@jest/globals";
import { parseDetailed } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/parse-detailed-coverage.mjs";

test("parses detailed coverage gaps", () => {
  expect(
    parseDetailed({
      "src/example.mjs": { statementMap: { 0: { start: { line: 4 } } }, s: { 0: 0 }, branchMap: { 0: {} }, b: { 0: [0] }, fnMap: { 0: {} }, f: { 0: 0 }, l: { 4: 0 } },
    }).gaps,
  ).toHaveLength(1);
});

test("parses complete detailed files and all detailed metric shapes", () => {
  const result = parseDetailed({
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
  expect(result.gaps).toEqual([]);
  expect(result.totals).toEqual({ statements: 100, branches: 100, functions: 100, lines: 100 });
  expect(parseDetailed(null)).toBeNull();
});

test("rejects incomplete in-scope coverage entries instead of treating missing metrics as perfect", () => {
  for (const data of [
    { s: { 0: 1 }, b: { 0: [1] }, f: { 0: 1 } },
    { s: { 0: 1 }, b: { 0: [1] }, l: { 1: 1 } },
    { s: { 0: 1 }, f: { 0: 1 }, l: { 1: 1 } },
    { b: { 0: [1] }, f: { 0: 1 }, l: { 1: 1 } },
  ]) {
    expect(() => parseDetailed({ "src/incomplete.mjs": data })).toThrow("Coverage evidence is incomplete");
  }
});

test("does not mask an uncovered same-line statement", () => {
  expect(parseDetailed({
    "src/same-line.mjs": {
      s: { 0: 1, 1: 0 },
      b: { 0: [1] }, branchMap: { 0: {} }, f: { 0: 1 }, fnMap: { 0: {} }, l: { 1: 0 },
      statementMap: { 0: { start: { line: 1 } }, 1: { start: { line: 1 } } },
    },
  }).gaps[0].lines).toEqual(["1"]);
});

test("does not treat missing branch or statement maps as complete coverage", () => {
  expect(() => parseDetailed({ "src/no-branches.mjs": {
    s: { 0: 1 }, f: { 0: 1 }, l: { 1: 1 },
  } })).toThrow("Coverage evidence is incomplete");
  expect(() => parseDetailed({ "src/no-statements.mjs": {
    b: { 0: [1] }, f: { 0: 1 }, l: { 1: 1 },
  } })).toThrow("Coverage evidence is incomplete");
});

test("rejects a required map that is absent after file validation", () => {
  expect(() => parseDetailed({ "src/no-branch-map.mjs": {
    s: { 0: 1 }, b: {}, f: { 0: 1 },
    statementMap: { 0: { start: { line: 1 } } }, fnMap: { 0: {} },
  } })).toThrow("Coverage evidence is incomplete");
});

test("rejects nonempty metric maps with empty counters", () => {
  expect(() => parseDetailed({ "src/empty-counters.mjs": {
    s: {}, b: { 0: {} }, f: { 0: {} },
    statementMap: { 0: { start: { line: 1 } } },
    branchMap: { 0: {} }, fnMap: { 0: {} },
  } })).toThrow("Coverage evidence is incomplete");
});

test("normalizes absolute Windows source paths and ignores unsupported files", () => {
  expect(
    parseDetailed({
      "C:\\repo\\src\\absolute.mjs": { s: { 0: 1 }, b: { 0: [1] }, branchMap: { 0: {} }, f: { 0: 1 }, fnMap: { 0: {} }, l: { 1: 1 }, statementMap: { 0: { start: { line: 1 } } } },
      "src/README.txt": {},
      "src/tests/example.mjs": {},
    }).gaps,
  ).toEqual([]);
  expect(parseDetailed({ "README.md": {} })).toBeNull();
});

test("reports zero-total metrics without treating incomplete evidence as missing", () => {
  expect(parseDetailed({ "src/no-branches.mjs": {
    s: { 0: 1 }, b: {}, f: { 0: 1 },
    statementMap: { 0: { start: { line: 1 } } }, branchMap: {}, fnMap: { 0: {} },
  } }).totals.branches).toBe(100);
});
