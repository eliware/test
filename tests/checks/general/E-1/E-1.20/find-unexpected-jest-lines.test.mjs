import { expect, test } from "@jest/globals";
import { findUnexpectedJestLines } from "../../../../../src/checks/general/E-1/E-1.20/find-unexpected-jest-lines.mjs";

test("allows Jest summaries and harness timing lines", () => {
  expect(findUnexpectedJestLines("PASS tests/example.test.mjs\nTest Suites: 1 passed\nTests: 1 passed\n[eliware-test-progress] start suite\n")).toEqual([]);
});

test("returns unexpected output lines", () => {
  expect(findUnexpectedJestLines("application log\napplication log\n")).toEqual(["application log", "application log"]);
});
