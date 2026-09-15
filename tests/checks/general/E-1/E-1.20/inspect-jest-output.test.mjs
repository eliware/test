import { expect, test } from "@jest/globals";
import { findUnexpectedJestOutput } from "../../../../../src/checks/general/E-1/E-1.20/inspect-jest-output.mjs";

test("allows Jest summaries and harness timing lines", () => {
  expect(findUnexpectedJestOutput({
    stdout: "PASS tests/example.test.mjs\nTest Suites: 1 passed\nTests: 1 passed\n",
    stderr: "[eliware-test-progress] start tests/example.test.mjs\n[eliware-test] Running tests/example.test.mjs...\n",
  })).toEqual([]);
});

test("allows harness diagnostics echoed by the Jest stage", () => {
  expect(findUnexpectedJestOutput({ stderr: "E-1.20: Jest failed: diagnostic\n" })).toEqual([]);
});

test("allows truncated harness progress output", () => {
  expect(findUnexpectedJestOutput({ stderr: "[eliware-test-progr…\n" })).toEqual([]);
});

test("detects unexpected lines and logged console output", () => {
  expect(findUnexpectedJestOutput({
    stdout: "application log\n{\"numFailedTestSuites\":0,\"testResults\":[{\"name\":\"tests/example.test.mjs\",\"console\":[{\"type\":\"log\",\"message\":\"logged value\",\"origin\":\"example test\"}]}]}",
    stderr: "debug trace\n",
  })).toEqual([
    "Unexpected output from unknown test suite: application log",
    "console.log in tests/example.test.mjs (example test): logged value",
    "Unexpected output from unknown test suite: debug trace",
  ]);
});

test("identifies the active suite for unexpected process output", () => {
  expect(findUnexpectedJestOutput({
    stdout: "unexpected application output\n",
    stderr: "[eliware-test-progress] start tests/example.test.mjs\n",
  })).toEqual(["Unexpected output from tests/example.test.mjs: unexpected application output"]);
});

test("deduplicates findings and handles malformed or empty output", () => {
  expect(findUnexpectedJestOutput()).toEqual([]);
  expect(findUnexpectedJestOutput({ stdout: "noise\nnoise\n{not-json}" })).toEqual([
    "Unexpected output from unknown test suite: noise",
    "Unexpected output from unknown test suite: {not-json}",
  ]);
  expect(findUnexpectedJestOutput({ stdout: "{\"numFailedTestSuites\":" })).toEqual([
    "Unexpected output from unknown test suite: {\"numFailedTestSuites\":",
  ]);
  expect(findUnexpectedJestOutput({ stdout: "{\"numFailedTestSuites\":0,\"testResults\":[{\"console\":[{}]}]}" })).toEqual(["console.log in unknown test suite: "]);
  expect(findUnexpectedJestOutput({ stdout: "{\"numFailedTestSuites\":0,\"testResults\":[{}]}" })).toEqual([]);
});
