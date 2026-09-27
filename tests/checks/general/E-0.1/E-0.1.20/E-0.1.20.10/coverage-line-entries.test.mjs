import { expect, test } from "@jest/globals";
import { coverageLineEntries } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-line-entries.mjs";

test("derives lines from independently supplied source instrumentation", () => {
  expect(coverageLineEntries(
    { statementMap: { 0: { start: { line: 4 } } }, s: { 0: 1, 1: 0 } },
    { 0: { start: { line: 4 } }, 1: { start: { line: 6 } } },
  )).toEqual([["4", 1], ["6", 0]]);
  expect(() => coverageLineEntries(
    { s: { 0: 1, 1: 0 } },
    { 0: { start: { line: 4 } }, 1: { start: { line: 4 } }, 2: {} },
  )).toThrow("Coverage evidence is incomplete");
});

test("preserves explicit coverage line counters", () => {
  expect(coverageLineEntries({ l: { 4: 1 } })).toEqual([["4", 1]]);
  expect(coverageLineEntries({ l: {} })).toEqual([]);
});

test("validates explicit counters against complete source-derived statement counters", () => {
  const statementMap = { 0: { start: { line: 4 } }, 1: { start: { line: 4 } } };
  const counters = { 0: 1, 1: 0 };
  expect(coverageLineEntries({ s: counters, l: { 4: 1 } }, statementMap)).toEqual([[
    "4",
    1,
  ]]);
  expect(() => coverageLineEntries({ s: counters, l: { 4: 0 } }, statementMap)).toThrow(
    "Coverage line counters do not match",
  );
  expect(() => coverageLineEntries({ s: counters, l: {} }, statementMap)).toThrow(
    "Coverage line counters do not match",
  );
});

test("handles source entries without line locations and missing maps", () => {
  expect(coverageLineEntries({ statementMap: { 0: {} }, s: { 0: 1 } })).toEqual([]);
  expect(() => coverageLineEntries({}, { 0: { start: { line: 1 } } })).toThrow(
    "statement counter 0 is missing",
  );
  expect(coverageLineEntries({})).toEqual([]);
});

test("uses Istanbul line semantics when statements share a source line", () => {
  expect(coverageLineEntries(
    { s: { first: 2, second: 5 } },
    {
      first: { start: { line: 9 } },
      second: { start: { line: 9 } },
    },
  )).toEqual([["9", 5]]);
  expect(coverageLineEntries(
    { s: { first: 2, second: 0 } },
    {
      first: { start: { line: 9 } },
      second: { start: { line: 9 } },
    },
  )).toEqual([["9", 2]]);
});
