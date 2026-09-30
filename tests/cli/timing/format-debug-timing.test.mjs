import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import { formatDebugTiming } from "../../../src/cli/timing/format-debug-timing.mjs";

test("combines stage and Jest timing output", () => {
  expect(
    formatDebugTiming(
      ["stage"],
      '{"numFailedTestSuites":0,"testResults":[{"testFilePath":"a.test.mjs","perfStats":{"start":0,"end":1},"assertionResults":[]}]}',
    ),
  ).toEqual(["stage", "Test file timings:\n0.001s a.test.mjs"]);
});

test("reports unavailable timing JSON without failing validation", () => {
  expect(formatDebugTiming([], "invalid")[0]).toContain("Timing report unavailable");
});

test("returns stage lines when no Jest output is available", () => {
  expect(formatDebugTiming(["stage"], "")).toEqual(["stage"]);
});

test("does not append an empty Jest timing section", () => {
  expect(formatDebugTiming(["stage"], '{"numFailedTestSuites":0,"testResults":[]}')).toEqual([
    "stage",
  ]);
});

test("redacts timing names and keeps paths repository-relative", () => {
  const report = JSON.stringify({
    numFailedTestSuites: 0,
    testResults: [
      {
        testFilePath: resolve("tests/example.test.mjs"),
        perfStats: { start: 0, end: 1 },
        assertionResults: [{ fullName: "private-token", duration: 1 }],
      },
    ],
  });
  const output = formatDebugTiming([], report, { env: { API_TOKEN: "private-token" } }).join("\n");
  expect(output).toContain("tests/example.test.mjs");
  expect(output).not.toContain(resolve("tests"));
  expect(output).not.toContain("private-token");
});

test("caps the final timing summary", () => {
  const assertions = Array.from({ length: 500 }, (_, index) => ({
    fullName: `test ${index} ${"x".repeat(100)}`,
    duration: 1,
  }));
  const report = JSON.stringify({
    numFailedTestSuites: 0,
    testResults: [
      {
        testFilePath: "tests/large.test.mjs",
        perfStats: { start: 0, end: 1 },
        assertionResults: assertions,
      },
    ],
  });
  expect(formatDebugTiming([], report).join("\n").length).toBeLessThanOrEqual(20_000);
});

test("handles missing, external, and malformed timing paths without leaking them", () => {
  const report = JSON.stringify({
    numFailedTestSuites: 0,
    testResults: [
      { testFilePath: resolve(".."), perfStats: { start: 0, end: 1 }, assertionResults: [] },
      { testFilePath: resolve("../outside/test.mjs"), perfStats: { start: 0, end: 1 } },
      { testFilePath: 42, name: "D:\\private\\outside.test.mjs", perfStats: { start: 0, end: 1 } },
      { testFilePath: "D:\\private\\outside.test.mjs", perfStats: { start: 0, end: 1 } },
      { testFilePath: null, name: "tests/name-fallback.test.mjs", perfStats: { start: 0, end: 1 } },
    ],
  });
  const output = formatDebugTiming([], report, { root: "C:\\repo" }).join("\n");
  expect(output.match(/\[outside repository\]/gu)).toHaveLength(3);
  expect(output).toContain("tests/name-fallback.test.mjs");
  expect(formatDebugTiming(["x".repeat(20_000), "ignored"], "")).toHaveLength(1);
});

test("handles reports without a test result list", () => {
  expect(formatDebugTiming(["stage"], '{"numFailedTestSuites":0,"testResults":null}')).toEqual([
    "stage",
  ]);
});
