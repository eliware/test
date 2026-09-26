import { expect, test } from "@jest/globals";
import { coverageLineEntries } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-line-entries.mjs";

test("derives line counters from statement locations when explicit counters are absent", () => {
  expect(coverageLineEntries({ statementMap: { 0: { start: { line: 4 } } }, s: { 0: 1 } })).toEqual([["4", 1]]);
  expect(coverageLineEntries({ statementMap: { 0: { start: { line: 4 } }, 1: { start: { line: 4 } } }, s: { 0: 0, 1: 1 } })).toEqual([["4", 0]]);
  expect(coverageLineEntries({ statementMap: { 0: { start: { line: 5 } } }, s: {} })).toEqual([["5", 0]]);
  expect(coverageLineEntries({ statementMap: { 0: {} }, s: { 0: 1 } })).toEqual([]);
});

test("preserves explicit coverage line counters", () => {
  expect(coverageLineEntries({ l: { 4: 1 } })).toEqual([["4", 1]]);
  expect(coverageLineEntries({})).toEqual([]);
});
