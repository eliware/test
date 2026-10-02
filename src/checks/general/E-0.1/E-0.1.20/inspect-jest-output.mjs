import { findUnexpectedJestLineRecords } from "./find-unexpected-jest-lines.mjs";
import { findJestConsoleOutput, isDefaultJestConsoleLine } from "./find-jest-console-output.mjs";
import { redactProcessOutput } from "../../../redact-process-output.mjs";

export function findUnexpectedJestOutput(
  { stdout = "", stderr = "", consoleOutput, consoleReportError } = {},
  secrets = [],
  root,
) {
  const outputRecords = consoleOutput ?? [];
  const findings = findUnexpectedJestLineRecords(stdout)
    .filter(
      (record) =>
        record.line !== "…" &&
        !/^\[?eliware(?:-test)?(?:-progress)?\b/u.test(record.line) &&
        !isDefaultJestConsoleLine(record, outputRecords, root),
    )
    .map(({ line, suite }) => redactProcessOutput(formatUnexpected(line, suite), secrets));
  if (consoleReportError) findings.push(redactProcessOutput(consoleReportError, secrets));
  findings.push(...findJestConsoleOutput(consoleOutput, root, secrets));
  findings.push(
    ...findUnexpectedJestLineRecords(stderr)
      .filter(
        ({ line, suite }) =>
          line !== "…" &&
          !/^\[?eliware-test(?:-progress)?\b/u.test(line) &&
          !/^E-0.1\.20(?::|\.)/.test(line) &&
          !isDefaultJestConsoleLine({ line, suite }, outputRecords, root),
      )
      .map(({ line, suite }) => redactProcessOutput(formatUnexpected(line, suite), secrets)),
  );
  return [...new Set(findings)];
}

function formatUnexpected(line, suite) {
  return `Unexpected output from ${suite}: ${line}`;
}
