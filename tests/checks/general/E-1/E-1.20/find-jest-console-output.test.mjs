import { expect, test } from "@jest/globals";
import { findJestConsoleOutput } from "../../../../../src/checks/general/E-1/E-1.20/find-jest-console-output.mjs";

test("formats console output with source and origin", () => {
  expect(findJestConsoleOutput({ testResults: [{ name: "tests/example.test.mjs", console: [
    { type: "log", message: "logged value", origin: "example test" },
  ] }] })).toEqual([
    "console.log in tests/example.test.mjs (example test): logged value",
  ]);
});

test("handles missing test and console metadata", () => {
  expect(findJestConsoleOutput({ testResults: [{ console: [{}] }, {}] })).toEqual([
    "console.log in unknown test suite: ",
  ]);
});
