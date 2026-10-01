import { normalizeRepositoryRelativePath } from "../../../normalize-repository-relative-path.mjs";
import { redactProcessOutput } from "../../../redact-process-output.mjs";

export function findJestConsoleOutput(
  report,
  root = process.cwd(),
  secrets = [],
  consoleOutput = [],
) {
  const findings = [];
  const reportOutput = (report?.testResults ?? []).flatMap((entry) =>
    (entry.console ?? []).map((output) => ({
      ...output,
      testFilePath: entry.testFilePath ?? entry.name,
    })),
  );
  for (const output of [...reportOutput, ...consoleOutput]) {
    const source = redactProcessOutput(reportPath(output.testFilePath, root), secrets);
    const message = redactProcessOutput(String(output.message ?? "").trim(), secrets);
    findings.push(`console.${output.type ?? "log"} in ${source}: ${message}`);
  }
  return findings;
}

export function isDefaultJestConsoleLine(record, outputs, root = process.cwd()) {
  return outputs.some((output) => {
    if (reportPath(output.testFilePath, root) !== record.suite) return false;
    if (record.line === `console.${output.type ?? "log"}`) return true;
    return String(output.message ?? "")
      .split(/\r?\n/u)
      .some((line) => line.trim() === record.line);
  });
}

function reportPath(path, root) {
  if (typeof path !== "string" || !path) return "unknown test suite";
  return normalizeRepositoryRelativePath(path, root);
}
