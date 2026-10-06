import { expect, test } from "@jest/globals";
import { findUnexpectedJestLines } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/find-unexpected-jest-lines.mjs";

test("allows Jest summaries, assertion markers, and harness timing lines", () => {
  expect(
    findUnexpectedJestLines(
      "\u001b[32mPASS\u001b[39m tests/example.test.mjs\n\u001b[32m  ✓ works (1 ms)\u001b[39m\nTest Suites: 1 passed\nTests: 1 passed\n\u001b[36m[eliware-test-progress] start suite\u001b[39m\n",
    ),
  ).toEqual([]);
});

test("allows timed Jest reporter lines whose assertion marker was redacted", () => {
  expect(findUnexpectedJestLines("[REDACTED] handles the test (1 ms)\n")).toEqual([]);
  expect(findUnexpectedJestLines("[REDACTED] application output")).toEqual([
    "[REDACTED] application output",
  ]);
});

test("allows progress lines with framing whitespace", () => {
  expect(findUnexpectedJestLines("  [eliware-test-progress] complete suite 0.100s  \n")).toEqual(
    [],
  );
});

test("allows harness output after transport framing removes brackets", () => {
  expect(
    findUnexpectedJestLines("eliware-test-progress start suite\n[eliware-test] Running suite...\n"),
  ).toEqual([]);
});

test("returns unexpected output lines", () => {
  expect(findUnexpectedJestLines("application log\napplication log\n")).toEqual([
    "application log",
    "application log",
  ]);
});

test("ignores only the partial final line marked as truncated", () => {
  expect(findUnexpectedJestLines("application log\nE-0.1.70.mjs | 100% …")).toEqual([
    "application log",
  ]);
  expect(findUnexpectedJestLines("application log…\ncomplete log")).toEqual([
    "application log…",
    "complete log",
  ]);
});
