import { expect, test } from "@jest/globals";
import { parseDetailed } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/parse-detailed-coverage.mjs";

test("parses detailed coverage gaps", () => {
  expect(parseDetailed({
    "src/example.mjs": { statementMap: { 0: { start: { line: 4 } } }, s: { 0: 0 } },
  }).gaps).toHaveLength(1);
});

test("parses complete detailed files and all detailed metric shapes", () => {
  const result = parseDetailed({
    "src/complete.mjs": {
      s: { 0: 1 }, b: { 0: [1, 1] }, f: { 0: 1 }, l: { 1: 1 },
      statementMap: { 0: { start: { line: 1 } } },
    },
    "src/empty.mjs": {},
  });
  expect(result.gaps).toEqual([expect.objectContaining({ file: "src/empty.mjs" })]);
  expect(result.totals).toEqual({ statements: 50, branches: 66.66666666666666, functions: 50, lines: 50 });
  expect(parseDetailed(null)).toBeNull();
});

test("rejects incomplete in-scope coverage entries instead of treating missing metrics as perfect", () => {
  const result = parseDetailed({
    "tests/example.test.mjs": { s: { 0: 0 } },
    "src/empty.mjs": {},
    "src/covered.mjs": { s: { 0: 1 } },
    "src/branch-only.mjs": { b: { 0: [1] } },
  });
  expect(result).toEqual({
    gaps: expect.arrayContaining([
      expect.objectContaining({ file: "src/covered.mjs" }),
      expect.objectContaining({ file: "src/branch-only.mjs" }),
      expect.objectContaining({ file: "src/empty.mjs" }),
    ]),
    totals: { statements: 0, branches: 0, functions: 0, lines: 0 },
  });
});

test("handles a complete file with no branch counter map", () => {
  expect(parseDetailed({
    "src/no-branches.mjs": {
      s: { 0: 1 }, f: { 0: 1 }, l: { 1: 1 },
      statementMap: { 0: { start: { line: 1 } } }, fnMap: { 0: { name: "run" } },
    },
  }).totals).toEqual({ statements: 100, branches: 100, functions: 100, lines: 100 });
});
