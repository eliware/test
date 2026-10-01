import { expect, test } from "@jest/globals";
import { findUnexpectedJestOutput } from "../../../../../src/checks/general/E-0.1/E-0.1.20/inspect-jest-output.mjs";

test("allows Jest summaries and harness timing lines", () => {
  expect(
    findUnexpectedJestOutput({
      stdout: "PASS tests/example.test.mjs\nTest Suites: 1 passed\nTests: 1 passed\n",
      stderr:
        "[eliware-test-progress] start tests/example.test.mjs\n[eliware-test] Running tests/example.test.mjs...\n",
    }),
  ).toEqual([]);
});

test("does not classify coverage rows containing token in their paths as test output", () => {
  expect(
    findUnexpectedJestOutput(
      {
        stdout: [
          "File                     | % Stmts | % Branch | % Funcs | % Lines |",
          "src/app/routes/token     |   95.34 |       90 |    90.9 |   95.12 |",
          "src/domain/token         |     100 |    93.22 |     100 |     100 |",
          "",
        ].join("\n"),
      },
      ["coverage-test-secret"],
    ),
  ).toEqual([]);
});

test("continues to detect and redact actual output containing credential labels", () => {
  expect(findUnexpectedJestOutput({ stdout: "application log: token leaked-value\n" })).toEqual([
    "Unexpected output from unknown test suite: application log: token [REDACTED]",
  ]);
});

test("allows harness diagnostics echoed by the Jest stage", () => {
  expect(findUnexpectedJestOutput({ stderr: "E-0.1.20: Jest failed: diagnostic\n" })).toEqual([]);
});

test("allows truncated harness progress output", () => {
  expect(findUnexpectedJestOutput({ stderr: "[eliware-test-progr…\n" })).toEqual([]);
});

test("preserves slow-test diagnostics while redacting their output", () => {
  expect(
    findUnexpectedJestOutput({
      stderr: "[eliware-test-progress] slow tests/slow.test.mjs :: slow case :: 6.1s\n",
    }),
  ).toEqual(["Slow test in tests/slow.test.mjs: slow case took 6.1s (limit: 5s)."]);
});

test("detects unexpected lines and logged console output", () => {
  expect(
    findUnexpectedJestOutput({
      stdout:
        'application log\n{"numFailedTestSuites":0,"testResults":[{"name":"tests/example.test.mjs","console":[{"type":"log","message":"logged value","origin":"example test"}]}]}',
      stderr: "debug trace\n",
    }),
  ).toEqual([
    "Unexpected output from unknown test suite: application log",
    "console.log in tests/example.test.mjs: logged value",
    "Unexpected output from unknown test suite: debug trace",
  ]);
});

test("attributes output within each stream to its active suite", () => {
  expect(
    findUnexpectedJestOutput({
      stdout:
        "[eliware-test-progress] start tests/first.test.mjs\nunexpected from first\n[eliware-test-progress] complete tests/first.test.mjs 0.010s\n[eliware-test-progress] start tests/second.test.mjs\nunexpected from second\n",
      stderr:
        "[eliware-test-progress] start tests/first.test.mjs\ntrace from first\n[eliware-test-progress] complete tests/first.test.mjs 0.010s\n",
    }),
  ).toEqual([
    "Unexpected output from tests/first.test.mjs: unexpected from first",
    "Unexpected output from tests/second.test.mjs: unexpected from second",
    "Unexpected output from tests/first.test.mjs: trace from first",
  ]);
});

test("reports structured console output against its exact test file", () => {
  expect(
    findUnexpectedJestOutput(
      {
        stdout: "PASS tests/quiet.test.mjs\n",
        report: {
          testResults: [
            {
              name: `${process.cwd()}\\tests\\noisy.test.mjs`,
              console: [{ type: "log", message: "actual output", origin: "sample.test.mjs:4" }],
            },
          ],
        },
      },
      [],
      process.cwd(),
    ),
  ).toEqual(["console.log in tests/noisy.test.mjs: actual output"]);
});

test("reports missing structured results instead of silently skipping output inspection", () => {
  expect(
    findUnexpectedJestOutput({ reportError: "Could not read Jest's structured result report." }),
  ).toEqual(["Could not read Jest's structured result report."]);
});

test("deduplicates findings and handles malformed or empty output", () => {
  expect(findUnexpectedJestOutput()).toEqual([]);
  expect(findUnexpectedJestOutput({ stdout: "noise\nnoise\n{not-json}" })).toEqual([
    "Unexpected output from unknown test suite: noise",
    "Unexpected output from unknown test suite: {not-json}",
  ]);
  expect(findUnexpectedJestOutput({ stdout: '{"numFailedTestSuites":' })).toEqual([
    'Unexpected output from unknown test suite: {"numFailedTestSuites":',
  ]);
  expect(
    findUnexpectedJestOutput({
      stdout: '{"numFailedTestSuites":0,"testResults":[{"console":[{}]}]}',
    }),
  ).toEqual(["console.log in unknown test suite: "]);
  expect(
    findUnexpectedJestOutput({ stdout: '{"numFailedTestSuites":0,"testResults":[{}]}' }),
  ).toEqual([]);
});

test("redacts configured secrets from stdout, stderr, and parsed console output", () => {
  const secret = "jest-output-secret-value";
  const findings = findUnexpectedJestOutput(
    {
      stdout: `unexpected ${secret}\n`,
      stderr: `trace ${secret}\n`,
      report: {
        testResults: [
          {
            name: "tests/example.test.mjs",
            console: [{ type: "log", message: secret, origin: secret }],
          },
        ],
      },
    },
    [secret],
    process.cwd(),
  );

  expect(findings).toEqual([
    "Unexpected output from unknown test suite: unexpected [REDACTED]",
    "console.log in tests/example.test.mjs: [REDACTED]",
    "Unexpected output from unknown test suite: trace [REDACTED]",
  ]);
  expect(findings.join(" ")).not.toContain(secret);
});
