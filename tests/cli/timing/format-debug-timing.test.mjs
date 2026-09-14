import { expect, test } from "@jest/globals";
import { formatDebugTiming } from "../../../src/cli/timing/format-debug-timing.mjs";

test("combines stage and Jest timing output", () => {
  expect(formatDebugTiming(["stage"], '{"numFailedTestSuites":0,"testResults":[{"testFilePath":"a.test.mjs","perfStats":{"start":0,"end":1},"assertionResults":[]}]}')).toEqual([
    "stage",
    "Test file timings:\n0.001s a.test.mjs",
  ]);
});

test("reports unavailable timing JSON without failing validation", () => {
  expect(formatDebugTiming([], "invalid")[0]).toContain("Timing report unavailable");
});

test("returns stage lines when no Jest output is available", () => {
  expect(formatDebugTiming(["stage"], "")).toEqual(["stage"]);
});

test("does not append an empty Jest timing section", () => {
  expect(formatDebugTiming(["stage"], '{"numFailedTestSuites":0,"testResults":[]}')).toEqual(["stage"]);
});
