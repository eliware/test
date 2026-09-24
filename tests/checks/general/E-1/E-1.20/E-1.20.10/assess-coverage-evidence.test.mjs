import { expect, test } from "@jest/globals";
import { assessCoverageEvidence } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/assess-coverage-evidence.mjs";

const complete = {
  statements: 100,
  branches: 100,
  functions: 100,
  lines: 100,
};

test("treats a zero-counter dimension as not applicable only for focused coverage", () => {
  expect(
    assessCoverageEvidence(
      { totals: { ...complete, branches: null }, gaps: [] },
      { focusedPath: true },
    ),
  ).toEqual({ aggregateGaps: [], hasFileGaps: false });
  expect(() =>
    assessCoverageEvidence({ totals: { ...complete, branches: null }, gaps: [] }),
  ).toThrow("Coverage evidence has an invalid shape");
});

test("rejects malformed coverage evidence", () => {
  expect(() => assessCoverageEvidence({ totals: {}, gaps: [] })).toThrow(
    "Coverage evidence has an invalid shape",
  );
  expect(() => assessCoverageEvidence({ totals: complete, gaps: null })).toThrow(
    "Coverage evidence has an invalid shape",
  );
});

test("reports every aggregate metric below 100%", () => {
  expect(
    assessCoverageEvidence({
      totals: { statements: 99, branches: 98, functions: 97, lines: 96 },
      gaps: [],
    }),
  ).toEqual({
    aggregateGaps: ["statements", "branches", "functions", "lines"],
    hasFileGaps: false,
  });
});

test("keeps file-level gaps visible when aggregate metrics are complete", () => {
  expect(
    assessCoverageEvidence({
      totals: complete,
      gaps: [{ file: "src/example.mjs" }],
    }),
  ).toEqual({ aggregateGaps: [], hasFileGaps: true });
});
