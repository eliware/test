import { findJestConsoleOutput } from "./output.mjs";
import { redactProcessOutput } from "../../../../../shared/output/redaction/redact/process-output.mjs";

export function findJestConsoleFindings(consoleReportError, consoleOutput, root, secrets) {
  const findings = [];
  if (consoleReportError) findings.push(redactProcessOutput(consoleReportError, secrets));
  findings.push(...findJestConsoleOutput(consoleOutput, root, secrets));
  return findings;
}
