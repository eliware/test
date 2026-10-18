import { expect, test } from "@jest/globals";
import { parseActionableJestOutput } from "../../../../../../src/validation/stages/jest/execution/parse/actionable-output.mjs";

test("removes routine Jest and coverage lines from failure output", () => {
  expect(
    parseActionableJestOutput(
      [
        "PASS tests/good.test.mjs",
        "Test Suites: 1 failed",
        "Tests: 1 failed",
        "Snapshots: 0 total",
        "Time: 2s",
        "Ran all test suites.",
        "Coverage summary",
        "File | % Stmts | % Branch",
        "--- | --- | ---",
        "All files | 90 | 80",
        '[eliware-test-progress] {"event":"start"}',
        "Expected: 1",
        "Summary of all failing tests",
        "Failure details",
      ].join("\n"),
    ),
  ).toBe("Expected: 1");
});

test("handles absent output and keeps ordinary failure text", () => {
  expect(parseActionableJestOutput(undefined)).toBe("");
  expect(parseActionableJestOutput("FAIL tests/bad.test.mjs\nExpected 2")).toBe(
    "FAIL tests/bad.test.mjs\nExpected 2",
  );
});
