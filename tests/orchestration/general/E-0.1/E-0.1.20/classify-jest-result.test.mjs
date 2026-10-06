import { expect, test } from "@jest/globals";
import { classifyJestResult } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/classify-jest-result.mjs";

test("classifies timeout, failure, and success results", () => {
  expect(classifyJestResult("E-0.1.130.13", { timedOut: true }, "timed out").status).toBe("fail");
  expect(classifyJestResult("E-0.1.130.13", { timedOut: true }).message).toBe(
    "Jest timed out after 15 seconds without progress.",
  );
  expect(
    classifyJestResult("E-0.1.130.13", { code: 1, stdout: "out", stderr: "err" }).message,
  ).toBe("Jest failed: out\nerr");
  expect(classifyJestResult("E-0.1.130.13", { code: 1, stdout: "", stderr: "" }).message).toBe(
    "Jest failed without output (code 1).",
  );
  expect(classifyJestResult("E-0.1.130.13", { code: 1 }).message).toBe(
    "Jest failed without output (code 1).",
  );
  expect(classifyJestResult("E-0.1.130.13", { code: null, signal: "SIGKILL" }).message).toBe(
    "Jest failed without output (signal SIGKILL).",
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
