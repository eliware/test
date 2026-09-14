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
  expect(result.gaps).toEqual([]);
  expect(result.totals).toEqual({ statements: 100, branches: 100, functions: 100, lines: 100 });
  expect(parseDetailed(null).totals).toEqual({ statements: 100, branches: 100, functions: 100, lines: 100 });
});
