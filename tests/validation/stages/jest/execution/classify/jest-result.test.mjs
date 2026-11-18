import { expect, test } from "@jest/globals";
import classifyJestResult from "../../../../../../src/validation/stages/jest/execution/classify/jest-result.mjs";
test("classifies timeout, failure, and success results", () => {
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      outputRedacted: true,
      outputRedactionKinds: ["environment secret"],
    }).message,
  ).toBe(
    "Jest output contained secret material. Redaction occurred in coverage/jest.log (environment secret).",
  );
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      outputRedacted: true,
    }).message,
  ).toContain("(secret rule).");
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      outputLogError: true,
    }).message,
  ).toBe("Jest output could not be saved to coverage/jest.log.");
  expect(
    classifyJestResult(
      "E-0.1.130.13",
      {
        timedOut: true,
      },
      "timed out",
    ).message,
  ).toBe("timed out\nProcess: timed out.\nFull output: coverage/jest.log.");
  expect(
    classifyJestResult(
      "E-0.1.130.13",
      {
        code: 1,
        stdout: "",
        stderr: "",
      },
      "Test suite tests/slow.test.mjs exceeded its 10 second maximum runtime.",
    ).message,
  ).toBe(
    "Test suite tests/slow.test.mjs exceeded its 10 second maximum runtime.\n" +
      "Process: exit code 1.\nFull output: coverage/jest.log.",
  );
  expect(
    classifyJestResult("E-0.1.130.13", {
      timedOut: true,
    }).message,
  ).toBe(
    "Jest timed out after 15 seconds without progress.\nProcess: timed out.\nFull output: coverage/jest.log.",
  );
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      stdout: "out",
      stderr: "err",
    }).message,
  ).toBe("Jest failed: out\nerr\nProcess: exit code 1.\nFull output: coverage/jest.log.");
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      stdout: "",
      stderr: "",
    }).message,
  ).toBe(
    "Jest exited without reported test failures or actionable output.\n" +
      "Process: exit code 1.\nFull output: coverage/jest.log.",
  );
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
    }).message,
  ).toBe(
    "Jest exited without reported test failures or actionable output.\n" +
      "Process: exit code 1.\nFull output: coverage/jest.log.",
  );
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: null,
      signal: "SIGKILL",
    }).message,
  ).toBe(
    "Jest exited without reported test failures or actionable output.\n" +
      "Process: signal SIGKILL.\nFull output: coverage/jest.log.",
  );
  expect(classifyJestResult("E-0.1.130.13", {}).message).toBe(
    "Jest exited without reported test failures or actionable output.\nFull output: coverage/jest.log.",
  );
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 0,
    }).status,
  ).toBe("pass");
});
test("removes routine passing and coverage output from failure diagnostics", () => {
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      stdout: "PASS tests/quiet.test.mjs\nFAIL tests/bad.test.mjs\nTests: 1 failed\n",
      stderr: "File | % Stmts | % Branch\nsource.mjs | 100 | 100\nExpected: 1\nReceived: 2\n",
    }).message,
  ).toBe(
    "Jest failed: FAIL tests/bad.test.mjs\nExpected: 1\nReceived: 2\n" +
      "Process: exit code 1.\nFull output: coverage/jest.log.",
  );
});
test("reports Jest failure details even when suite progress also reports them", () => {
  expect(
    classifyJestResult(
      "E-0.1.130.13",
      {
        code: 1,
        stdout: "FAIL tests/bad.test.mjs\nExpected: 1\nReceived: 2",
        stderr: "",
      },
      undefined,
    ).message,
  ).toBe(
    "Jest failed: FAIL tests/bad.test.mjs\nExpected: 1\nReceived: 2\n" +
      "Process: exit code 1.\nFull output: coverage/jest.log.",
  );
});
test("keeps one copy of Jest failures in final non-debug diagnostics", () => {
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      stdout:
        "FAIL tests/bad.test.mjs\nFailure details\nSummary of all failing tests\nFAIL tests/bad.test.mjs\nFailure details",
      stderr: "",
    }).message,
  ).toBe(
    "Jest failed: FAIL tests/bad.test.mjs\nFailure details\n" +
      "Process: exit code 1.\nFull output: coverage/jest.log.",
  );
});
test("shows failed suite details from reporter progress when Jest has no other output", () => {
  const progress =
    '[eliware-test-progress] {"event":"result","path":"tests/bad.test.mjs","failed":true,"failures":["expected 1 to equal 2"]}';
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      stdout: "",
      stderr: progress,
    }).message,
  ).toBe(
    "Jest failed: tests/bad.test.mjs\nexpected 1 to equal 2\n" +
      "Process: exit code 1.\nFull output: coverage/jest.log.",
  );
});
test("ignores passing and malformed reporter progress records", () => {
  const stdout = [
    '[eliware-test-progress] {"event":"start","path":"tests/active.test.mjs"}',
    '[eliware-test-progress] {"event":"result","path":"tests/pass.test.mjs","failed":false}',
    '[eliware-test-progress] {"event":"result","path":"tests/fail.test.mjs","failed":true}',
    "[eliware-test-progress] {malformed}",
  ].join("\n");
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      stdout,
    }).message,
  ).toBe(
    "Jest failed: tests/fail.test.mjs\nProcess: exit code 1.\nFull output: coverage/jest.log.",
  );
});
test("explains passing test summaries with unsuccessful process exits", () => {
  const summary = [
    "PASS tests/consumer.test.mjs",
    "Test Suites: 1 passed, 1 total",
    "Tests: 2 passed, 2 total",
    "Snapshots: 0 total",
    "Time: 0.5 s",
  ].join("\n");
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      stdout: `${summary}\nRan all test suites.`,
    }).message,
  ).toBe(
    `Jest reported passing tests but exited unsuccessfully.\n${summary}\nRan all test suites.\n` +
      "Process: exit code 1.\nFull output: coverage/jest.log.",
  );
});
test("reports failure summaries and termination outcomes", () => {
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      stdout: "Test Suites: 1 failed, 1 passed, 2 total",
      terminationConfirmed: true,
    }).message,
  ).toBe(
    "Jest exited with a failure summary:\nTest Suites: 1 failed, 1 passed, 2 total\n" +
      "Process: exit code 1, termination confirmed.\nFull output: coverage/jest.log.",
  );
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: null,
      signal: "SIGTERM",
      timedOut: true,
      terminationConfirmed: false,
      stdout: "",
    }).message,
  ).toBe(
    "Jest timed out after 15 seconds without progress.\n" +
      "Process: signal SIGTERM, timed out, termination not confirmed.\nFull output: coverage/jest.log.",
  );
});
test("shows captured summary lines without pass or failure counts", () => {
  expect(
    classifyJestResult("E-0.1.130.13", {
      code: 1,
      stdout: "Time: 0.5 s",
    }).message,
  ).toBe(
    "Jest exited with no reported test failures. Captured summary:\nTime: 0.5 s\n" +
      "Process: exit code 1.\nFull output: coverage/jest.log.",
  );
});
