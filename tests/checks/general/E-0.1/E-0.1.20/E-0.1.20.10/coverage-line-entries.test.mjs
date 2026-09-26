import { expect, test } from "@jest/globals";
import { coverageLineEntries } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-line-entries.mjs";

test("derives lines from independently supplied source instrumentation when counters are absent", () => {
  expect(coverageLineEntries(
    { statementMap: { 0: { start: { line: 4 } } }, s: { 0: 1 } },
    { 0: { start: { line: 4 } }, 1: { start: { line: 6 } } },
  )).toEqual([["4", 1], ["6", 0]]);
  expect(coverageLineEntries(
    { s: { 0: 1, 1: 0 } },
    { 0: { start: { line: 4 } }, 1: { start: { line: 4 } }, 2: {} },
  )).toEqual([["4", 0]]);
});

test("preserves explicit coverage line counters", () => {
  expect(coverageLineEntries({ l: { 4: 1 } })).toEqual([["4", 1]]);
  expect(coverageLineEntries({ l: {} })).toEqual([]);
});
