import { expect, test } from "@jest/globals";
import { classifyJestResult } from "../../../../../src/validation/stages/jest/execution/classify-jest-result.mjs";

test("classifies timeout, failure, and success results", () => {
  expect(classifyJestResult("E-0.1.130.13", { timedOut: true }, "timed out").status).toBe("fail");
  expect(
    classifyJestResult(
      "E-0.1.130.13",
      { code: 1, stdout: "", stderr: "" },
      "Test suite tests/slow.test.mjs exceeded its 5 second maximum runtime.",
    ).message,
  ).toBe("Test suite tests/slow.test.mjs exceeded its 5 second maximum runtime.");
  expect(classifyJestResult("E-0.1.130.13", { timedOut: true }).message).toBe(
    "Jest timed out after 15 seconds without progress.",
  );
  expect(
    classifyJestResult("E-0.1.130.13", { code: 1, stdout: "out", stderr: "err" }).message,
  ).toBe("Jest failed: out\nerr");
  expect(classifyJestResult("E-0.1.130.13", { code: 1, stdout: "", stderr: "" }).message).toBe(
    "Jest exited with no captured output (code 1).",
  );
  expect(classifyJestResult("E-0.1.130.13", { code: 1 }).message).toBe(
    "Jest exited with no captured output (code 1).",
  );
  expect(classifyJestResult("E-0.1.130.13", { code: null, signal: "SIGKILL" }).message).toBe(
    "Jest exited with no captured output (signal SIGKILL).",
  );
  expect(classifyJestResult("E-0.1.130.13", {}).message).toBe("Jest failed without diagnostics.");
  expect(classifyJestResult("E-0.1.130.13", { code: 0 }).status).toBe("pass");
});

test("removes routine passing and coverage output from failure diagnostics", () => {
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      stdout: "PASS tests/quiet.test.mjs\nFAIL tests/bad.test.mjs\nTests: 1 failed\n",
      stderr: "File | % Stmts | % Branch\nsource.mjs | 100 | 100\nExpected: 1\nReceived: 2\n",
    }).message,
  ).toBe("Jest failed: FAIL tests/bad.test.mjs\nExpected: 1\nReceived: 2");
});

test("omits repeated Jest failure details when inline suite output is enabled", () => {
  expect(
    classifyJestResult(
      "E-0.1.130.13",
      { code: 1, stdout: "FAIL tests/bad.test.mjs\\nExpected: 1\\nReceived: 2", stderr: "" },
      undefined,
      { failuresReported: true },
    ).message,
  ).toBe("Jest failed; see the inline suite failures above.");
});

test("keeps one copy of Jest failures in final non-debug diagnostics", () => {
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      stdout:
        "FAIL tests/bad.test.mjs\nFailure details\nSummary of all failing tests\nFAIL tests/bad.test.mjs\nFailure details",
      stderr: "",
    }).message,
  ).toBe("Jest failed: FAIL tests/bad.test.mjs\nFailure details");
});

test("shows failed suite details from reporter progress when Jest has no other output", () => {
  const progress =
    '[eliware-test-progress] {"event":"result","path":"tests/bad.test.mjs","failed":true,"failures":["expected 1 to equal 2"]}';
  expect(
    classifyJestResult("E-0.1.130.13", { code: 1, stdout: "", stderr: progress }).message,
  ).toBe("Jest failed: tests/bad.test.mjs\nexpected 1 to equal 2");
});

test("ignores passing and malformed reporter progress records", () => {
  const stdout = [
    '[eliware-test-progress] {"event":"start","path":"tests/active.test.mjs"}',
    '[eliware-test-progress] {"event":"result","path":"tests/pass.test.mjs","failed":false}',
    '[eliware-test-progress] {"event":"result","path":"tests/fail.test.mjs","failed":true}',
    "[eliware-test-progress] {malformed}",
  ].join("\n");
  expect(classifyJestResult("E-0.1.130.13", { code: 1, stdout }).message).toBe(
    "Jest failed: tests/fail.test.mjs",
  );
});
