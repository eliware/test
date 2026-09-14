import { expect, test } from "@jest/globals";
import { findUnexpectedJestOutput } from "../../../../../src/checks/general/E-1/E-1.20/inspect-jest-output.mjs";

test("allows Jest summaries and harness timing lines", () => {
  expect(findUnexpectedJestOutput({
    stdout: "PASS tests/example.test.mjs\nTest Suites: 1 passed\nTests: 1 passed\n",
    stderr: "[eliware-test-progress] start tests/example.test.mjs\n[eliware-test] Running tests/example.test.mjs...\n",
  })).toEqual([]);
});

test("detects unexpected lines and logged console output", () => {
  expect(findUnexpectedJestOutput({
    stdout: "application log\n{\"numFailedTestSuites\":0,\"testResults\":[{\"name\":\"tests/example.test.mjs\",\"console\":[{\"type\":\"log\",\"message\":\"logged value\",\"origin\":\"example test\"}]}]}",
    stderr: "debug trace\n",
  })).toEqual(["application log", "console.log in tests/example.test.mjs (example test): logged value", "debug trace"]);
});

test("deduplicates findings and handles malformed or empty output", () => {
  expect(findUnexpectedJestOutput()).toEqual([]);
  expect(findUnexpectedJestOutput({ stdout: "noise\nnoise\n{not-json}" })).toEqual(["noise", "{not-json}"]);
  expect(findUnexpectedJestOutput({ stdout: "{\"numFailedTestSuites\":" })).toEqual(["{\"numFailedTestSuites\":"]);
  expect(findUnexpectedJestOutput({ stdout: "{\"numFailedTestSuites\":0,\"testResults\":[{\"console\":[{}]}]}" })).toEqual(["console.log in unknown test suite: "]);
  expect(findUnexpectedJestOutput({ stdout: "{\"numFailedTestSuites\":0,\"testResults\":[{}]}" })).toEqual([]);
});
