import { expect, test } from "@jest/globals";
import { findSlowTestFindings } from "../../../../../src/checks/general/E-1/E-1.20/find-slow-test-findings.mjs";

test("reports slow test progress markers", () => {
  expect(findSlowTestFindings("[eliware-test-progress] slow tests/example.test.mjs :: hangs slowly :: 5.001s\n")).toEqual([
    "Slow test in tests/example.test.mjs: hangs slowly took 5.001s (limit: 5s).",
  ]);
});
