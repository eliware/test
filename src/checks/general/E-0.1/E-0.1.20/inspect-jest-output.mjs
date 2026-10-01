import { parseJsonOutput } from "./parse-jest-output.mjs";
import { findUnexpectedJestLineRecords } from "./find-unexpected-jest-lines.mjs";
import { findSlowTestFindings } from "./find-slow-test-findings.mjs";
import { findJestConsoleOutput, isDefaultJestConsoleLine } from "./find-jest-console-output.mjs";
import { redactProcessOutput } from "../../../redact-process-output.mjs";

export function findUnexpectedJestOutput(
  { stdout = "", stderr = "", report, consoleOutput, reportError } = {},
  secrets = [],
  root,
) {
  const parsed = report ? { text: stdout, report } : parseJsonOutput(stdout);
  const outputRecords = [...(consoleOutput ?? []), ...reportConsoleOutput(parsed.report)];
  const findings = findUnexpectedJestLineRecords(parsed.text)
    .filter(
      (record) =>
        record.line !== "…" &&
        !/^\[?eliware(?:-test)?(?:-progress)?\b/u.test(record.line) &&
        !isDefaultJestConsoleLine(record, outputRecords, root),
    )
    .map(({ line, suite }) => redactProcessOutput(formatUnexpected(line, suite), secrets));
  if (reportError) findings.push(redactProcessOutput(reportError, secrets));
  findings.push(
    ...findSlowTestFindings(stderr).map((finding) => redactProcessOutput(finding, secrets)),
  );
  findings.push(...findJestConsoleOutput(parsed.report, root, secrets, consoleOutput));
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

function reportConsoleOutput(report) {
  return (report?.testResults ?? []).flatMap((entry) =>
    (entry.console ?? []).map((output) => ({
      ...output,
      testFilePath: entry.testFilePath ?? entry.name,
    })),
  );
}
