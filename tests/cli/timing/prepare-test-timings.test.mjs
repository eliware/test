import { expect, test } from "@jest/globals";
import { prepareTestTimings } from "../../../src/cli/timing/prepare-test-timings.mjs";

test("filters zero durations, normalizes paths, sorts, and limits", () => {
  expect(prepareTestTimings({ testResults: [
    { testFilePath: "a\\test.mjs", perfStats: { start: 0, end: 0 } },
    { testFilePath: "b.test.mjs", perfStats: { start: 0, end: 2 } },
  ] }, 1)).toEqual([{ duration: 2, file: "b.test.mjs", tests: [] }]);
});

test("handles malformed reports and fallback names", () => {
  expect(prepareTestTimings(undefined)).toEqual([]);
  expect(prepareTestTimings({ testResults: [
    { name: "fallback", perfStats: { start: "bad", end: 2 } },
    { perfStats: { start: 0, end: 1 }, assertionResults: undefined },
  ] })).toEqual([{ duration: 1, file: "unknown", tests: [] }]);
});

test("supports Jest JSON reporter start and end times", () => {
  expect(prepareTestTimings({ testResults: [
    { name: "current-shape.test.mjs", startTime: 10, endTime: 1010 },
  ] })).toEqual([{ duration: 1000, file: "current-shape.test.mjs", tests: [] }]);
});
