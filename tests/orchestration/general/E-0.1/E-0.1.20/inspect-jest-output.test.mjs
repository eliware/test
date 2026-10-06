import { expect, test } from "@jest/globals";
import { findUnexpectedJestOutput } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/inspect-jest-output.mjs";

test("allows Jest summaries and harness progress lines", () => {
  expect(
    findUnexpectedJestOutput({
      stdout: "PASS tests/example.test.mjs\nTest Suites: 1 passed\nTests: 1 passed\n",
      stderr:
        "[eliware-test-progress] start tests/example.test.mjs\n[eliware-test] Running tests/example.test.mjs...\n",
    }),
  ).toEqual([]);
});

test("ignores coverage rows that contain credential labels in file paths", () => {
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

test("detects and redacts unexpected output", () => {
  expect(findUnexpectedJestOutput({ stdout: "application log: token leaked-value\n" })).toEqual([
    "Unexpected output from unknown test suite: application log: token [REDACTED]",
  ]);
});

test("allows harness diagnostics and truncated progress output", () => {
  expect(findUnexpectedJestOutput({ stderr: "E-0.1.20: Jest failed: diagnostic\n" })).toEqual([]);
  expect(findUnexpectedJestOutput({ stderr: "[eliware-test-progr…\n" })).toEqual([]);
});

test("attributes unexpected output to the active suite", () => {
  expect(
    findUnexpectedJestOutput({
      stdout:
        "[eliware-test-progress] start tests/first.test.mjs\nunexpected output\n[eliware-test-progress] result end\n",
    }),
  ).toContain("Unexpected output from tests/first.test.mjs: unexpected output");
});

test("reports console output from reporter records against its test file", () => {
  expect(
    findUnexpectedJestOutput({
      stdout: "PASS tests/quiet.test.mjs\n",
      consoleOutput: [
        { testFilePath: "tests/noisy.test.mjs", type: "log", message: "actual output" },
      ],
    }),
  ).toEqual(["console.log in tests/noisy.test.mjs: actual output"]);
});

test("reports missing console output reports", () => {
  expect(
    findUnexpectedJestOutput({
      consoleReportError: "Could not read Jest's console output report.",
    }),
  ).toEqual(["Could not read Jest's console output report."]);
});

test("deduplicates findings and detects unexpected JSON output as ordinary output", () => {
  expect(findUnexpectedJestOutput()).toEqual([]);
  expect(findUnexpectedJestOutput({ stdout: "noise\nnoise\n" })).toEqual([
    "Unexpected output from unknown test suite: noise",
  ]);
  expect(findUnexpectedJestOutput({ stdout: '{"consumer data":true}' })).toEqual([
    'Unexpected output from unknown test suite: {"consumer data":true}',
  ]);
});

test("redacts configured secrets from output and parsed console records", () => {
  const secret = "jest-output-secret-value";
  const findings = findUnexpectedJestOutput(
    {
      stdout: `unexpected ${secret}\n`,
      stderr: `trace ${secret}\n`,
      consoleOutput: [{ testFilePath: "tests/example.test.mjs", type: "log", message: secret }],
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
