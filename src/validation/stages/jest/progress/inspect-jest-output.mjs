import { findUnexpectedJestStdout } from "./find/unexpected/stdout.mjs";
import { findUnexpectedJestStderr } from "./find/unexpected/stderr.mjs";
import { findJestConsoleFindings } from "./find/jest-console/findings.mjs";

export function findUnexpectedJestOutput(
  { stdout = "", stderr = "", consoleOutput, consoleReportError } = {},
  secrets = [],
  root,
) {
  const outputRecords = consoleOutput ?? [];
  const findings = [
    ...findUnexpectedJestStdout(stdout, outputRecords, secrets, root),
    ...findJestConsoleFindings(consoleReportError, outputRecords, root, secrets),
    ...findUnexpectedJestStderr(stderr, outputRecords, secrets, root),
  ];
  return [...new Set(findings)];
}
