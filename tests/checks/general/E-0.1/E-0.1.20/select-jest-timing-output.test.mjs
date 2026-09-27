import { expect, test } from "@jest/globals";
import { selectJestTimingOutput } from "../../../../../src/checks/general/E-0.1/E-0.1.20/select-jest-timing-output.mjs";

test("selects whichever stream contains the Jest timing report", () => {
  const timingReport = '{"numFailedTestSuites":0}';
  expect(selectJestTimingOutput({ stdout: "ordinary output", stderr: timingReport })).toBe(timingReport);
  expect(selectJestTimingOutput({ stdout: timingReport, stderr: "ordinary diagnostics" })).toBe(timingReport);
});

test("preserves both streams when no timing report has been emitted", () => {
  expect(selectJestTimingOutput({ stdout: "ordinary output", stderr: "diagnostics" }))
    .toBe("ordinary output\ndiagnostics");
  expect(selectJestTimingOutput()).toBe("");
});
